import { Router, Response } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthRequest, authenticate, authorize } from "../middleware/auth";
import {
  computeShipmentStatusDistribution,
  computeCertificateExpiryTrend,
  defaultAnalyticsRange,
  getInventoryAnalytics,
  getPurchaseOrderAnalytics,
  getShipmentAnalytics,
} from "../lib/analyticsService";

const router = Router();

router.get(
  "/stats",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req: AuthRequest, res: Response) => {
    const now = new Date();
    const ninetyDaysFromNow = new Date(now);
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    const range = defaultAnalyticsRange(6);
    if (typeof req.query.from === "string") {
      const from = new Date(req.query.from);
      if (!Number.isNaN(from.getTime())) range.from = from;
    }
    if (typeof req.query.to === "string") {
      const to = new Date(req.query.to);
      if (!Number.isNaN(to.getTime())) range.to = to;
    }

    // ── KPIs (real queries) ────────────────────────────────────────────────────
    const [
      totalProducts,
      totalSuppliers,
      activeCertificates,
      expiringSoonCertificates,
      inventoryRows,
      openPurchaseOrders,
      delayedShipments,
      pendingShipments,
      lowStockAlerts,
      expiringCertificates,
      shipmentDelays,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.supplier.count({ where: { status: "ACTIVE" } }),
      prisma.halalCertificate.count({ where: { expiryDate: { gt: now } } }),
      prisma.halalCertificate.count({
        where: { expiryDate: { gt: now, lte: ninetyDaysFromNow } },
      }),
      prisma.inventory.findMany({
          include: { product: { select: { unitPrice: true } } },
      }),
      prisma.purchaseOrder.count({
        where: { status: { in: ["DRAFT", "APPROVED", "SHIPPING", "PARTIAL"] } },
      }),
      prisma.shipment.count({
        where: { status: "DELAYED" },
      }),
      prisma.shipment.count({
        where: { status: { in: ["PENDING", "IN_TRANSIT", "DELAYED"] } },
      }),
      prisma.$queryRaw<{
        id: string;
        quantity: number;
        reorderLevel: number;
        product: { name: string; sku: string };
        warehouse: { name: string };
      }[]>`
        SELECT i.id, i.quantity, i.reorder_level AS "reorderLevel",
               json_build_object('name', p.name, 'sku', p.sku) AS product,
               json_build_object('name', w.name) AS warehouse
        FROM inventory i
        JOIN products p ON p.id = i.product_id
        JOIN warehouses w ON w.id = i.warehouse_id
        WHERE i.quantity <= i.reorder_level
        ORDER BY i.updated_at DESC
        LIMIT 6
      `,
      prisma.halalCertificate.findMany({
        where: { expiryDate: { gt: now, lte: ninetyDaysFromNow } },
        take: 6,
        orderBy: { expiryDate: "asc" },
        include: { supplier: { select: { name: true } } },
      }),
      prisma.shipment.findMany({
        where: { status: "DELAYED" },
        take: 6,
        orderBy: { estimatedArrival: "asc" },
        include: {
          purchaseOrder: {
            select: { poNumber: true, supplier: { select: { name: true } } },
          },
        },
      }),
    ]);

    const inventoryValue = inventoryRows.reduce(
      (sum, row) => sum + row.quantity * Number(row.product.unitPrice),
      0
    );

    // ── Charts (real analytics) ────────────────────────────────────────────────
    let inventoryTrend: { month: string; quantity: number }[];
    let purchaseOrdersPerMonth: { month: string; orders: number }[];
    let shipmentVolumeTrend: { month: string; shipments: number }[];
    let shipmentStatusDistribution: { status: string; count: number }[];
    let certificateExpiryTimeline: { quarter: string; count: number }[];

    try {
      [
        inventoryTrend,
        purchaseOrdersPerMonth,
        shipmentStatusDistribution,
        certificateExpiryTimeline,
        shipmentVolumeTrend,
      ] = await Promise.all([
        getInventoryAnalytics(prisma, range).then((analytics) =>
          analytics.inventoryMovementTrend.map((point) => ({
            month: point.month,
            quantity: point.value,
          }))
        ),
        getPurchaseOrderAnalytics(prisma, range).then((analytics) => analytics.ordersPerMonth),
        computeShipmentStatusDistribution(prisma),
        computeCertificateExpiryTrend(prisma),
        getShipmentAnalytics(prisma, range).then((analytics) => analytics.shipmentVolumeTrend),
      ]);
    } catch (err) {
      console.error("Dashboard analytics query failed:", err);
      res.status(500).json({ error: "Failed to compute dashboard analytics" });
      return;
    }

    res.json({
      kpis: {
        totalProducts,
        activeSuppliers: totalSuppliers,
        totalSuppliers,
        activeCertificates,
        expiringSoonCertificates,
        inventoryValue,
        openPurchaseOrders,
        delayedShipments,
        pendingShipments,
      },
      charts: {
        inventoryTrend,
        purchaseOrdersPerMonth,
        shipmentStatusDistribution,
        shipmentVolumeTrend,
        certificateExpiryTimeline,
      },
      widgets: {
        lowStockAlerts: lowStockAlerts.map((item) => ({
          id: item.id,
          productName: item.product.name,
          sku: item.product.sku,
          warehouseName: item.warehouse.name,
          quantity: item.quantity,
          reorderLevel: item.reorderLevel,
        })),
        expiringCertificates: expiringCertificates.map((certificate) => ({
          id: certificate.id,
          certificateNumber: certificate.certificateNumber,
          supplierName: certificate.supplier.name,
          expiryDate: certificate.expiryDate,
        })),
        shipmentDelays: shipmentDelays.map((shipment) => ({
          id: shipment.id,
          trackingNumber: shipment.trackingNumber,
          poNumber: shipment.purchaseOrder.poNumber,
          supplierName: shipment.purchaseOrder.supplier.name,
          estimatedArrival: shipment.estimatedArrival,
        })),
      },
    });
  }
);

router.get(
  "/activity",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (_req: AuthRequest, res: Response) => {
    const logs = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });

    const activities = logs.map((log) => ({
      id: log.id,
      userName: log.user?.name ?? "System",
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      createdAt: log.createdAt,
    }));

    res.json({ activities });
  }
);

export default router;
