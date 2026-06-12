import { Router, Response } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get(
  "/summary",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (_req, res: Response) => {
    const now = new Date();
    const ninetyDays = new Date(now);
    ninetyDays.setDate(ninetyDays.getDate() + 90);

    const [
      suppliers,
      certificates,
      inventoryRows,
      purchaseOrders,
      shipments,
    ] = await Promise.all([
      prisma.supplier.findMany({
        where: { status: "ACTIVE" },
        select: { country: true, name: true },
      }),
      prisma.halalCertificate.findMany({
        include: { supplier: { select: { name: true } } },
        orderBy: { expiryDate: "asc" },
      }),
      prisma.inventory.findMany({
        include: {
          product: { select: { name: true, sku: true, unitPrice: true } },
          warehouse: { select: { name: true } },
        },
      }),
      prisma.purchaseOrder.groupBy({
        by: ["status"],
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      prisma.shipment.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    const inventoryValue = inventoryRows.reduce(
      (sum, row) => sum + row.quantity * Number(row.product.unitPrice),
      0
    );

    const lowStock = inventoryRows.filter((r) => r.quantity <= r.reorderLevel);

    const expiringCertificates = certificates.filter(
      (c) => c.expiryDate > now && c.expiryDate <= ninetyDays
    );

    res.json({
      summary: {
        activeSuppliers: suppliers.length,
        suppliersByCountry: suppliers.reduce(
          (acc, s) => {
            acc[s.country] = (acc[s.country] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        totalInventoryValue: inventoryValue,
        totalStockUnits: inventoryRows.reduce((s, r) => s + r.quantity, 0),
        lowStockCount: lowStock.length,
        lowStockItems: lowStock.map((r) => ({
          product: r.product.name,
          sku: r.product.sku,
          warehouse: r.warehouse.name,
          quantity: r.quantity,
          reorderLevel: r.reorderLevel,
        })),
        certificates: {
          total: certificates.length,
          active: certificates.filter((c) => c.expiryDate > now).length,
          expiringSoon: expiringCertificates.length,
          items: expiringCertificates.map((c) => ({
            number: c.certificateNumber,
            issuedBy: c.issuedBy,
            supplier: c.supplier.name,
            expiryDate: c.expiryDate,
          })),
        },
        purchaseOrders: purchaseOrders.map((po) => ({
          status: po.status,
          count: po._count.id,
          totalAmount: Number(po._sum.totalAmount ?? 0),
        })),
        shipments: shipments.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
      },
    });
  }
);

router.get(
  "/export/inventory",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (_req, res: Response) => {
    const rows = await prisma.inventory.findMany({
      include: {
        product: {
          select: { name: true, sku: true, unit: true, unitPrice: true },
        },
        warehouse: { select: { name: true, location: true } },
      },
    });

    const header =
      "Product,SKU,Warehouse,Location,Quantity,Reorder Level,Unit Price,Value\n";
    const csv = rows
      .map((r) => {
        const value = r.quantity * Number(r.product.unitPrice);
        return [
          r.product.name,
          r.product.sku,
          r.warehouse.name,
          r.warehouse.location,
          r.quantity,
          r.reorderLevel,
          r.product.unitPrice,
          value.toFixed(2),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",");
      })
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="halalchain-inventory.csv"'
    );
    res.send(header + csv);
  }
);

export default router;
