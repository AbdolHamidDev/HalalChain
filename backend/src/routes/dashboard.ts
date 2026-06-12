import { Router, Response } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthRequest, authenticate, authorize } from "../middleware/auth";

const router = Router();

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short" });
}

router.get(
  "/stats",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (_req: AuthRequest, res: Response) => {
    const now = new Date();
    const ninetyDaysFromNow = new Date(now);
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const sixMonthsAgo = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 5, 1));

    const [
      totalSuppliers,
      activeCertificates,
      expiringSoonCertificates,
      inventoryRows,
      pendingShipments,
      movements,
      purchaseOrders,
      suppliersByCountry,
      certificates,
    ] = await Promise.all([
      prisma.supplier.count({ where: { status: "ACTIVE" } }),
      prisma.halalCertificate.count({ where: { expiryDate: { gt: now } } }),
      prisma.halalCertificate.count({
        where: {
          expiryDate: { gt: now, lte: ninetyDaysFromNow },
        },
      }),
      prisma.inventory.findMany({
        include: { product: { select: { unitPrice: true } } },
      }),
      prisma.shipment.count({
        where: { status: { in: ["PENDING", "IN_TRANSIT", "DELAYED"] } },
      }),
      prisma.inventoryMovement.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { type: true, quantity: true, createdAt: true },
      }),
      prisma.purchaseOrder.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.supplier.groupBy({
        by: ["country"],
        _count: { id: true },
        where: { status: "ACTIVE" },
      }),
      prisma.halalCertificate.findMany({
        where: { expiryDate: { gte: now } },
        select: { expiryDate: true },
      }),
    ]);

    const inventoryValue = inventoryRows.reduce(
      (sum, row) => sum + row.quantity * Number(row.product.unitPrice),
      0
    );

    const inventoryTrend = Array.from({ length: 6 }, (_, i) => {
      const monthStart = startOfMonth(
        new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      );
      const monthEnd = startOfMonth(
        new Date(now.getFullYear(), now.getMonth() - (4 - i), 1)
      );

      const netQty = movements
        .filter((m) => m.createdAt >= monthStart && m.createdAt < monthEnd)
        .reduce(
          (acc, m) =>
            acc + (m.type === "INBOUND" ? m.quantity : -m.quantity),
          0
        );

      const baseQty = inventoryRows.reduce((s, r) => s + r.quantity, 0);
      return {
        month: monthLabel(monthStart),
        quantity: Math.max(0, baseQty + netQty - (5 - i) * 80),
      };
    });

    const purchaseOrdersPerMonth = Array.from({ length: 6 }, (_, i) => {
      const monthStart = startOfMonth(
        new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      );
      const monthEnd = startOfMonth(
        new Date(now.getFullYear(), now.getMonth() - (4 - i), 1)
      );

      const orders = purchaseOrders.filter(
        (po) => po.createdAt >= monthStart && po.createdAt < monthEnd
      ).length;

      return { month: monthLabel(monthStart), orders };
    });

    const palette = ["#0d6e4f", "#16a34a", "#4ade80", "#86efac", "#bbf7d0"];
    const supplierDistribution = suppliersByCountry
      .sort((a, b) => b._count.id - a._count.id)
      .map((row, index) => ({
        name: row.country,
        value: row._count.id,
        color: palette[index % palette.length],
      }));

    const quarterBuckets = new Map<string, number>();
    for (const cert of certificates) {
      const d = cert.expiryDate;
      const q = Math.floor(d.getMonth() / 3) + 1;
      const key = `Q${q} ${d.getFullYear()}`;
      quarterBuckets.set(key, (quarterBuckets.get(key) ?? 0) + 1);
    }

    const certificateExpiryTimeline = [...quarterBuckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 6)
      .map(([month, expiring]) => ({ month, expiring }));

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
        supplierDistribution,
        certificateExpiryTimeline,
      },
    });
  }
);

export default router;
