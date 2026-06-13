import { Router, Response } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthRequest, authenticate, authorize } from "../middleware/auth";
import {
  computeInventoryTrend,
  computePurchaseOrdersPerMonth,
  computeShipmentStatusDistribution,
  computeCertificateExpiryTrend,
} from "../lib/analyticsService";

const router = Router();

router.get(
  "/stats",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (_req: AuthRequest, res: Response) => {
    const now = new Date();
    const ninetyDaysFromNow = new Date(now);
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    // ── KPIs (real queries) ────────────────────────────────────────────────────
    const [
      totalSuppliers,
      activeCertificates,
      expiringSoonCertificates,
      inventoryRows,
      pendingShipments,
    ] = await Promise.all([
      prisma.supplier.count({ where: { status: "ACTIVE" } }),
      prisma.halalCertificate.count({ where: { expiryDate: { gt: now } } }),
      prisma.halalCertificate.count({
        where: { expiryDate: { gt: now, lte: ninetyDaysFromNow } },
      }),
      prisma.inventory.findMany({
        include: { product: { select: { unitPrice: true } } },
      }),
      prisma.shipment.count({
        where: { status: { in: ["PENDING", "IN_TRANSIT", "DELAYED"] } },
      }),
    ]);

    const inventoryValue = inventoryRows.reduce(
      (sum, row) => sum + row.quantity * Number(row.product.unitPrice),
      0
    );

    // ── Charts (real analytics) ────────────────────────────────────────────────
    let inventoryTrend: { month: string; quantity: number }[];
    let purchaseOrdersPerMonth: { month: string; orders: number }[];
    let shipmentStatusDistribution: { status: string; count: number }[];
    let certificateExpiryTimeline: { quarter: string; count: number }[];

    try {
      [
        inventoryTrend,
        purchaseOrdersPerMonth,
        shipmentStatusDistribution,
        certificateExpiryTimeline,
      ] = await Promise.all([
        computeInventoryTrend(prisma),
        computePurchaseOrdersPerMonth(prisma),
        computeShipmentStatusDistribution(prisma),
        computeCertificateExpiryTrend(prisma),
      ]);
    } catch (err) {
      console.error("Dashboard analytics query failed:", err);
      res.status(500).json({ error: "Failed to compute dashboard analytics" });
      return;
    }

    res.json({
      kpis: {
        totalSuppliers,
        activeCertificates,
        expiringSoonCertificates,
        inventoryValue,
        pendingShipments,
      },
      charts: {
        inventoryTrend,
        purchaseOrdersPerMonth,
        shipmentStatusDistribution,
        certificateExpiryTimeline,
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
