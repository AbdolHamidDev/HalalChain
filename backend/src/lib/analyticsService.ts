import { PrismaClient } from "@prisma/client";
import {
  startOfMonth,
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
 * Uses a single GROUP BY query instead of N sequential queries.
 * Returns an array ordered from oldest to most recent month.
 */
export async function computeInventoryTrend(
  prisma: PrismaClient,
  months: number = 6
): Promise<{ month: string; quantity: number }[]> {
  const now = new Date();
  const rangeStart = startOfMonth(subMonths(now, months - 1));

  type RawRow = { month_start: Date; type: string; total: bigint };

  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT
      date_trunc('month', "created_at") AS month_start,
      type,
      SUM(quantity)::bigint             AS total
    FROM inventory_movements
    WHERE "created_at" >= ${rangeStart}
    GROUP BY date_trunc('month', "created_at"), type
    ORDER BY month_start ASC
  `;

  // Build a map: monthLabel -> net quantity
  const netByMonth = new Map<string, number>();

  // Pre-populate all months with 0 so months with no movements still appear
  for (let i = months - 1; i >= 0; i--) {
    const label = format(startOfMonth(subMonths(now, i)), "MMM");
    netByMonth.set(label, 0);
  }

  for (const row of rows) {
    const label = format(new Date(row.month_start), "MMM");
    const qty = Number(row.total);
    const prev = netByMonth.get(label) ?? 0;
    if (row.type === "INBOUND") {
      netByMonth.set(label, prev + qty);
    } else {
      // OUTBOUND and ADJUSTMENT both reduce net stock
      netByMonth.set(label, prev - qty);
    }
  }

  return Array.from(netByMonth.entries()).map(([month, quantity]) => ({
    month,
    quantity,
  }));
}

// ─── Purchase Orders Per Month ────────────────────────────────────────────────

/**
 * Counts PurchaseOrders created per month for the past 6 months.
 * Uses a single GROUP BY query. Months with zero orders still appear.
 *
 * Returns an array ordered from oldest to most recent month.
 */
export async function computePurchaseOrdersPerMonth(
  prisma: PrismaClient
): Promise<{ month: string; orders: number }[]> {
  const now = new Date();
  const rangeStart = startOfMonth(subMonths(now, 5));

  type RawRow = { month_start: Date; total: bigint };

  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT
      date_trunc('month', "created_at") AS month_start,
      COUNT(*)::bigint                  AS total
    FROM purchase_orders
    WHERE "created_at" >= ${rangeStart}
    GROUP BY date_trunc('month', "created_at")
    ORDER BY month_start ASC
  `;

  // Pre-populate all 6 months with 0
  const ordersByMonth = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const label = format(startOfMonth(subMonths(now, i)), "MMM");
    ordersByMonth.set(label, 0);
  }

  for (const row of rows) {
    const label = format(new Date(row.month_start), "MMM");
    ordersByMonth.set(label, Number(row.total));
  }

  return Array.from(ordersByMonth.entries()).map(([month, orders]) => ({
    month,
    orders,
  }));
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
 * Uses a single GROUP BY query. All 6 quarters appear even if count = 0.
 *
 * Returns an array ordered from the current quarter to 5 quarters ahead.
 */
export async function computeCertificateExpiryTrend(
  prisma: PrismaClient
): Promise<{ quarter: string; count: number }[]> {
  const now = new Date();
  const currentQuarterStart = startOfQuarter(now);
  const rangeEnd = addQuarters(currentQuarterStart, 6);

  type RawRow = { quarter_start: Date; total: bigint };

  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT
      date_trunc('quarter', "expiry_date") AS quarter_start,
      COUNT(*)::bigint                     AS total
    FROM halal_certificates
    WHERE "expiry_date" >= ${currentQuarterStart}
      AND "expiry_date" <  ${rangeEnd}
    GROUP BY date_trunc('quarter', "expiry_date")
    ORDER BY quarter_start ASC
  `;

  // Build lookup map: quarter label -> count
  const countByQuarter = new Map<string, number>();
  for (const row of rows) {
    const d = new Date(row.quarter_start);
    const label = `Q${getQuarter(d)} ${getYear(d)}`;
    countByQuarter.set(label, Number(row.total));
  }

  // Return all 6 quarters, defaulting to 0 when no data
  return Array.from({ length: 6 }, (_, i) => {
    const quarterStart = addQuarters(currentQuarterStart, i);
    const label = `Q${getQuarter(quarterStart)} ${getYear(quarterStart)}`;
    return { quarter: label, count: countByQuarter.get(label) ?? 0 };
  });
}
