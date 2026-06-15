import { Prisma, PrismaClient } from "@prisma/client";
import {
  addQuarters,
  eachMonthOfInterval,
  endOfMonth,
  format,
  getQuarter,
  getYear,
  startOfMonth,
  startOfQuarter,
  subMonths,
} from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

type MonthPoint = { month: string; value: number };

function monthKey(date: Date): string {
  return format(startOfMonth(date), "yyyy-MM");
}

function monthLabel(key: string): string {
  return format(new Date(`${key}-01T00:00:00.000Z`), "MMM yyyy");
}

function monthSeries(range: DateRange): Map<string, number> {
  const months = eachMonthOfInterval({
    start: startOfMonth(range.from),
    end: startOfMonth(range.to),
  });
  return new Map(months.map((date) => [monthKey(date), 0]));
}

function toMonthPoints(points: Map<string, number>): MonthPoint[] {
  return Array.from(points.entries()).map(([month, value]) => ({
    month: monthLabel(month),
    value,
  }));
}

export function defaultAnalyticsRange(months = 6): DateRange {
  const now = new Date();
  return {
    from: startOfMonth(subMonths(now, months - 1)),
    to: endOfMonth(now),
  };
}

export async function getInventoryAnalytics(
  prisma: PrismaClient,
  range: DateRange
) {
  type MovementRow = { month_start: Date; type: string; total: bigint };
  type InventoryValueRow = { month_start: Date; total_value: Prisma.Decimal | number | string };
  type WarehouseRow = {
    warehouse_id: string;
    warehouse_name: string;
    total_quantity: bigint;
    total_value: Prisma.Decimal | number | string;
  };
  type ProductRow = {
    product_id: string;
    product_name: string;
    sku: string;
    total_quantity: bigint;
    total_value: Prisma.Decimal | number | string;
  };

  const [
    movementRows,
    valueRows,
    lowStockCount,
    warehouseRows,
    topStockedRows,
    fastRows,
    slowRows,
  ] = await Promise.all([
    prisma.$queryRaw<MovementRow[]>`
      SELECT date_trunc('month', created_at) AS month_start, type, SUM(quantity)::bigint AS total
      FROM inventory_movements
      WHERE created_at >= ${range.from} AND created_at <= ${range.to}
      GROUP BY date_trunc('month', created_at), type
      ORDER BY month_start ASC
    `,
    prisma.$queryRaw<InventoryValueRow[]>`
      SELECT date_trunc('month', updated_at) AS month_start,
             SUM(i.quantity * p.unit_price)::numeric AS total_value
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      WHERE i.updated_at >= ${range.from} AND i.updated_at <= ${range.to}
      GROUP BY date_trunc('month', updated_at)
      ORDER BY month_start ASC
    `,
    prisma.inventory.count({
      where: { quantity: { lte: 10 }, updatedAt: { gte: range.from, lte: range.to } },
    }),
    prisma.$queryRaw<WarehouseRow[]>`
      SELECT w.id AS warehouse_id, w.name AS warehouse_name,
             COALESCE(SUM(i.quantity), 0)::bigint AS total_quantity,
             COALESCE(SUM(i.quantity * p.unit_price), 0)::numeric AS total_value
      FROM warehouses w
      LEFT JOIN inventory i ON i.warehouse_id = w.id
      LEFT JOIN products p ON p.id = i.product_id
      GROUP BY w.id, w.name
      ORDER BY total_value DESC
    `,
    prisma.$queryRaw<ProductRow[]>`
      SELECT p.id AS product_id, p.name AS product_name, p.sku,
             COALESCE(SUM(i.quantity), 0)::bigint AS total_quantity,
             COALESCE(SUM(i.quantity * p.unit_price), 0)::numeric AS total_value
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_quantity DESC
      LIMIT 10
    `,
    prisma.$queryRaw<ProductRow[]>`
      SELECT p.id AS product_id, p.name AS product_name, p.sku,
             SUM(im.quantity)::bigint AS total_quantity,
             0::numeric AS total_value
      FROM inventory_movements im
      JOIN products p ON p.id = im.product_id
      WHERE im.created_at >= ${range.from}
        AND im.created_at <= ${range.to}
        AND im.type = 'OUTBOUND'
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_quantity DESC
      LIMIT 10
    `,
    prisma.$queryRaw<ProductRow[]>`
      SELECT p.id AS product_id, p.name AS product_name, p.sku,
             COALESCE(SUM(im.quantity), 0)::bigint AS total_quantity,
             0::numeric AS total_value
      FROM products p
      LEFT JOIN inventory_movements im
        ON im.product_id = p.id
       AND im.created_at >= ${range.from}
       AND im.created_at <= ${range.to}
       AND im.type = 'OUTBOUND'
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_quantity ASC, p.name ASC
      LIMIT 10
    `,
  ]);

  const movementTrend = monthSeries(range);
  const inboundTrend = monthSeries(range);
  const outboundTrend = monthSeries(range);
  for (const row of movementRows) {
    const key = monthKey(new Date(row.month_start));
    const total = Number(row.total);
    if (row.type === "INBOUND") inboundTrend.set(key, (inboundTrend.get(key) ?? 0) + total);
    if (row.type === "OUTBOUND") outboundTrend.set(key, (outboundTrend.get(key) ?? 0) + total);
    movementTrend.set(
      key,
      (movementTrend.get(key) ?? 0) + (row.type === "INBOUND" ? total : -total)
    );
  }

  const valueTrend = monthSeries(range);
  for (const row of valueRows) {
    valueTrend.set(monthKey(new Date(row.month_start)), Number(row.total_value ?? 0));
  }

  return {
    inventoryValueTrend: toMonthPoints(valueTrend),
    inventoryMovementTrend: toMonthPoints(movementTrend),
    inboundTrend: toMonthPoints(inboundTrend),
    outboundTrend: toMonthPoints(outboundTrend),
    lowStockTrend: [{ month: format(range.to, "MMM yyyy"), value: lowStockCount }],
    inventoryByWarehouse: warehouseRows.map((row) => ({
      warehouseId: row.warehouse_id,
      warehouseName: row.warehouse_name,
      totalQuantity: Number(row.total_quantity),
      totalValue: Number(row.total_value ?? 0),
    })),
    topStockedProducts: topStockedRows.map(mapProductRow),
    fastMovingProducts: fastRows.map(mapProductRow),
    slowMovingProducts: slowRows.map(mapProductRow),
  };
}

export async function getPurchaseOrderAnalytics(
  prisma: PrismaClient,
  range: DateRange
) {
  type MonthlyRow = { month_start: Date; total: bigint };
  const [monthlyRows, statusGroups] = await Promise.all([
    prisma.$queryRaw<MonthlyRow[]>`
      SELECT date_trunc('month', created_at) AS month_start, COUNT(*)::bigint AS total
      FROM purchase_orders
      WHERE created_at >= ${range.from} AND created_at <= ${range.to}
      GROUP BY date_trunc('month', created_at)
      ORDER BY month_start ASC
    `,
    prisma.purchaseOrder.groupBy({
      by: ["status"],
      where: { createdAt: { gte: range.from, lte: range.to } },
      _count: { id: true },
    }),
  ]);

  const ordersByMonth = monthSeries(range);
  for (const row of monthlyRows) {
    ordersByMonth.set(monthKey(new Date(row.month_start)), Number(row.total));
  }

  const total = statusGroups.reduce((sum, row) => sum + row._count.id, 0);
  const approved = statusGroups
    .filter((row) => ["APPROVED", "SHIPPING", "RECEIVED", "PARTIAL"].includes(row.status))
    .reduce((sum, row) => sum + row._count.id, 0);
  const fulfilled = statusGroups
    .filter((row) => ["RECEIVED", "PARTIAL"].includes(row.status))
    .reduce((sum, row) => sum + row._count.id, 0);

  return {
    ordersPerMonth: toMonthPoints(ordersByMonth).map((p) => ({ month: p.month, orders: p.value })),
    approvalRate: total === 0 ? 0 : Math.round((approved / total) * 1000) / 10,
    fulfillmentRate: total === 0 ? 0 : Math.round((fulfilled / total) * 1000) / 10,
    averageProcessingTimeDays: null as number | null,
    statusBreakdown: statusGroups.map((row) => ({ status: row.status, count: row._count.id })),
  };
}

export async function getShipmentAnalytics(prisma: PrismaClient, range: DateRange) {
  type MonthlyRow = { month_start: Date; total: bigint };
  const [monthlyRows, statusGroups] = await Promise.all([
    prisma.$queryRaw<MonthlyRow[]>`
      SELECT date_trunc('month', COALESCE(shipped_at, estimated_arrival)) AS month_start,
             COUNT(*)::bigint AS total
      FROM shipments
      WHERE COALESCE(shipped_at, estimated_arrival) >= ${range.from}
        AND COALESCE(shipped_at, estimated_arrival) <= ${range.to}
      GROUP BY date_trunc('month', COALESCE(shipped_at, estimated_arrival))
      ORDER BY month_start ASC
    `,
    prisma.shipment.groupBy({
      by: ["status"],
      where: {
        OR: [
          { shippedAt: { gte: range.from, lte: range.to } },
          { shippedAt: null, estimatedArrival: { gte: range.from, lte: range.to } },
        ],
      },
      _count: { id: true },
    }),
  ]);

  const volume = monthSeries(range);
  for (const row of monthlyRows) {
    if (row.month_start) volume.set(monthKey(new Date(row.month_start)), Number(row.total));
  }

  const total = statusGroups.reduce((sum, row) => sum + row._count.id, 0);
  const delivered = statusGroups.find((row) => row.status === "DELIVERED")?._count.id ?? 0;
  const delayed = statusGroups.find((row) => row.status === "DELAYED")?._count.id ?? 0;

  return {
    onTimeDeliveryRate: total === 0 ? 0 : Math.round((delivered / total) * 1000) / 10,
    delayedShipmentRate: total === 0 ? 0 : Math.round((delayed / total) * 1000) / 10,
    shipmentVolumeTrend: toMonthPoints(volume).map((p) => ({ month: p.month, shipments: p.value })),
    statusBreakdown: statusGroups.map((row) => ({ status: row.status, count: row._count.id })),
  };
}

export async function getCertificateAnalytics(
  prisma: PrismaClient,
  range: DateRange
) {
  const now = new Date();
  const ninetyDays = new Date(now);
  ninetyDays.setDate(ninetyDays.getDate() + 90);

  type SupplierScoreRow = {
    supplier_id: string;
    supplier_name: string;
    active_count: bigint;
    total_count: bigint;
  };

  const [active, expiring, expired, supplierRows] = await Promise.all([
    prisma.halalCertificate.count({ where: { expiryDate: { gt: now } } }),
    prisma.halalCertificate.count({
      where: { expiryDate: { gt: now, lte: ninetyDays } },
    }),
    prisma.halalCertificate.count({ where: { expiryDate: { lte: now } } }),
    prisma.$queryRaw<SupplierScoreRow[]>`
      SELECT s.id AS supplier_id, s.name AS supplier_name,
             COUNT(hc.id) FILTER (WHERE hc.expiry_date > ${now})::bigint AS active_count,
             COUNT(hc.id)::bigint AS total_count
      FROM suppliers s
      LEFT JOIN halal_certificates hc ON hc.supplier_id = s.id
      WHERE s.created_at <= ${range.to}
      GROUP BY s.id, s.name
      ORDER BY supplier_name ASC
    `,
  ]);

  return {
    activeCertificates: active,
    expiringCertificates: expiring,
    expiredCertificates: expired,
    supplierComplianceScore: supplierRows.map((row) => ({
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      score:
        Number(row.total_count) === 0
          ? 0
          : Math.round((Number(row.active_count) / Number(row.total_count)) * 1000) / 10,
      activeCertificates: Number(row.active_count),
      totalCertificates: Number(row.total_count),
    })),
  };
}

function mapProductRow(row: {
  product_id: string;
  product_name: string;
  sku: string;
  total_quantity: bigint;
  total_value: Prisma.Decimal | number | string;
}) {
  return {
    productId: row.product_id,
    productName: row.product_name,
    sku: row.sku,
    totalQuantity: Number(row.total_quantity),
    totalValue: Number(row.total_value ?? 0),
  };
}

export async function computeInventoryTrend(
  prisma: PrismaClient,
  months = 6
): Promise<{ month: string; quantity: number }[]> {
  const range = defaultAnalyticsRange(months);
  const analytics = await getInventoryAnalytics(prisma, range);
  return analytics.inventoryMovementTrend.map((point) => ({
    month: point.month.split(" ")[0],
    quantity: point.value,
  }));
}

export async function computePurchaseOrdersPerMonth(
  prisma: PrismaClient
): Promise<{ month: string; orders: number }[]> {
  const analytics = await getPurchaseOrderAnalytics(prisma, defaultAnalyticsRange(6));
  return analytics.ordersPerMonth.map((point) => ({
    month: point.month.split(" ")[0],
    orders: point.orders,
  }));
}

export async function computeShipmentStatusDistribution(
  prisma: PrismaClient
): Promise<{ status: string; count: number }[]> {
  const groups = await prisma.shipment.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  return groups.map((g) => ({ status: g.status, count: g._count.id }));
}

export async function computeCertificateExpiryTrend(
  prisma: PrismaClient
): Promise<{ quarter: string; count: number }[]> {
  const now = new Date();
  const currentQuarterStart = startOfQuarter(now);
  const rangeEnd = addQuarters(currentQuarterStart, 6);

  type RawRow = { quarter_start: Date; total: bigint };
  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT date_trunc('quarter', expiry_date) AS quarter_start,
           COUNT(*)::bigint AS total
    FROM halal_certificates
    WHERE expiry_date >= ${currentQuarterStart}
      AND expiry_date < ${rangeEnd}
    GROUP BY date_trunc('quarter', expiry_date)
    ORDER BY quarter_start ASC
  `;

  const countByQuarter = new Map<string, number>();
  for (const row of rows) {
    const d = new Date(row.quarter_start);
    countByQuarter.set(`Q${getQuarter(d)} ${getYear(d)}`, Number(row.total));
  }

  return Array.from({ length: 6 }, (_, i) => {
    const quarterStart = addQuarters(currentQuarterStart, i);
    const label = `Q${getQuarter(quarterStart)} ${getYear(quarterStart)}`;
    return { quarter: label, count: countByQuarter.get(label) ?? 0 };
  });
}
