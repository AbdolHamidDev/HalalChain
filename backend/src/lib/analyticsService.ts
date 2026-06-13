import { PrismaClient } from "@prisma/client";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  startOfQuarter,
  addQuarters,
  getQuarter,
  getYear,
} from "date-fns";

// ─── Inventory Trend ──────────────────────────────────────────────────────────

/**
 * Computes the net inventory movement per month for the past `months` months.
 * net = Σ INBOUND - Σ OUTBOUND - Σ ADJUSTMENT
 *
 * Returns an array ordered from oldest to most recent month.
 */
export async function computeInventoryTrend(
  prisma: PrismaClient,
  months: number = 6
): Promise<{ month: string; quantity: number }[]> {
  const now = new Date();
  const result: { month: string; quantity: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const referenceDate = subMonths(now, i);
    const monthStart = startOfMonth(referenceDate);
    const monthEnd = endOfMonth(referenceDate);

    const movements = await prisma.inventoryMovement.findMany({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: { type: true, quantity: true },
    });

    const net = movements.reduce((acc, m) => {
      if (m.type === "INBOUND") return acc + m.quantity;
      if (m.type === "OUTBOUND") return acc - m.quantity;
      if (m.type === "ADJUSTMENT") return acc - m.quantity;
      return acc;
    }, 0);

    result.push({ month: format(monthStart, "MMM"), quantity: net });
  }

  return result;
}

// ─── Purchase Orders Per Month ────────────────────────────────────────────────

/**
 * Counts PurchaseOrders created per month for the past 6 months.
 * Months with zero orders still appear with count = 0.
 *
 * Returns an array ordered from oldest to most recent month.
 */
export async function computePurchaseOrdersPerMonth(
  prisma: PrismaClient
): Promise<{ month: string; orders: number }[]> {
  const now = new Date();
  const result: { month: string; orders: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const referenceDate = subMonths(now, i);
    const monthStart = startOfMonth(referenceDate);
    const monthEnd = endOfMonth(referenceDate);

    const count = await prisma.purchaseOrder.count({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    });

    result.push({ month: format(monthStart, "MMM"), orders: count });
  }

  return result;
}

// ─── Shipment Status Distribution ─────────────────────────────────────────────

/**
 * Returns the count of shipments grouped by status.
 * Statuses with zero count are omitted.
 */
export async function computeShipmentStatusDistribution(
  prisma: PrismaClient
): Promise<{ status: string; count: number }[]> {
  const groups = await prisma.shipment.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  return groups
    .filter((g) => g._count.id > 0)
    .map((g) => ({ status: g.status, count: g._count.id }));
}

// ─── Certificate Expiry Trend ─────────────────────────────────────────────────

/**
 * Counts HalalCertificates by the quarter their expiryDate falls in,
 * for 6 quarters starting from the current quarter.
 * All 6 quarters appear even if count = 0.
 *
 * Returns an array ordered from the current quarter to 5 quarters ahead.
 */
export async function computeCertificateExpiryTrend(
  prisma: PrismaClient
): Promise<{ quarter: string; count: number }[]> {
  const now = new Date();
  const currentQuarterStart = startOfQuarter(now);
  const result: { quarter: string; count: number }[] = [];

  for (let i = 0; i < 6; i++) {
    const quarterStart = addQuarters(currentQuarterStart, i);
    const quarterEnd = addQuarters(currentQuarterStart, i + 1);

    const count = await prisma.halalCertificate.count({
      where: {
        expiryDate: { gte: quarterStart, lt: quarterEnd },
      },
    });

    const label = `Q${getQuarter(quarterStart)} ${getYear(quarterStart)}`;
    result.push({ quarter: label, count });
  }

  return result;
}
