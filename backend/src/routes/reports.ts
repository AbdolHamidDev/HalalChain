import { Router, Response } from "express";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { exportReport } from "../lib/reportExportService";

const router = Router();

const exportParamsSchema = z.object({
  module: z.enum(["products", "inventory", "suppliers", "certificates", "purchase-orders", "shipments"]),
  format: z.enum(["csv", "xlsx", "pdf"]).default("csv"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).refine((data) => !data.from || !data.to || data.from <= data.to, {
  message: "from must be before to",
});

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
  "/export/:module",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req: AuthRequest, res: Response) => {
    const parsed = exportParamsSchema.safeParse({
      module: req.params.module,
      format: req.query.format ?? "csv",
      from: req.query.from,
      to: req.query.to,
    });

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid export request" });
      return;
    }

    try {
      await exportReport(
        prisma,
        parsed.data.module,
        parsed.data.format,
        { from: parsed.data.from, to: parsed.data.to },
        res
      );
    } catch (err) {
      console.error("Report export failed:", err);
      res.status(500).json({ error: "Failed to export report" });
    }
  }
);

export default router;
