"use client";

import { useId, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { api } from "@/lib/api";
import { useTranslation } from "@/i18n/hooks";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared/state-blocks";
import { Shimmer } from "@/components/shared/shimmer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ── Helpers ──────────────────────────────────────────────────────── */

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/* ── Theme-aware color palette ────────────────────────────────────── */
const C = {
  primary: "var(--chart-1)",
  emerald: "var(--chart-2)",
  amber: "var(--chart-3)",
  red: "var(--chart-4)",
  muted: "var(--chart-5)",
  violet: "#7c3aed",
  cyan: "#0891b2",
} as const;

const DONUT_COLORS = [C.primary, C.emerald, C.amber, C.red, C.violet, C.cyan];

const AXIS = { fontSize: 12, fill: "var(--muted-foreground)", fontWeight: 400 as const };
const GRID = { strokeDasharray: "3 3", stroke: "var(--border)", strokeOpacity: 0.45 };

/* ── Shared tooltip ───────────────────────────────────────────────── */
function Tip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number | string; color: string }>;
  label?: string;
  formatter?: (value: number | string, name: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}
    >
      {label && (
        <p className="mb-1.5 text-xs font-medium text-[var(--muted-foreground)]">{label}</p>
      )}
      {payload.map((e) => (
        <div key={e.name} className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.color }} />
          <span className="text-[var(--muted-foreground)]">{e.name}</span>
          <span className="ml-auto font-semibold text-[var(--foreground)]">
            {formatter ? formatter(e.value, e.name) : e.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Donut tooltip ────────────────────────────────────────────────── */
function DonutTip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const e = payload[0];
  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.payload.fill }} />
        <span className="text-[var(--muted-foreground)]">{e.name}</span>
        <span className="ml-auto font-semibold text-[var(--foreground)]">{e.value}</span>
      </div>
    </div>
  );
}

/* ── Pie → Donut label ────────────────────────────────────────────── */
type PieSliceLabelProps = { name?: string | number; percent?: number };
function renderDonutLabel(props: unknown) {
  const { name, percent } = props as PieSliceLabelProps;
  if (!percent || percent <= 0.06) return null;
  return `${name ?? ""} ${(percent * 100).toFixed(0)}%`;
}

/* ── Rate badge ───────────────────────────────────────────────────── */
function RateBadge({ value, invert = false }: { value: number; invert?: boolean }) {
  const good = invert ? value <= 10 : value >= 75;
  const warn = invert ? value <= 25 : value >= 50;
  return <Badge variant={good ? "success" : warn ? "warning" : "danger"}>{value.toFixed(1)}%</Badge>;
}

/* ── Section / Kpi helpers ────────────────────────────────────────── */
function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-lg font-semibold tracking-tight">{title}</h2>;
}

function KpiCard({
  title,
  value,
  note,
  icon,
}: {
  title: string;
  value: React.ReactNode;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent className="space-y-1">
        <div>{value}</div>
        <p className="text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

/* ── ChartCard wrapper ────────────────────────────────────────────── */
function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactElement;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <CardTitle className="text-[15px]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64 pt-4">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────────── */
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-3xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <Shimmer className="h-4 w-24" />
              <Shimmer className="h-8 w-8 rounded-xl" />
            </div>
            <div className="mt-4 space-y-2">
              <Shimmer className="h-7 w-20" />
              <Shimmer className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-72 rounded-3xl border bg-card p-5">
            <Shimmer className="mb-4 h-4 w-28" />
            <Shimmer className="h-56 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
/* Individual chart compositions                                       */
/* ════════════════════════════════════════════════════════════════════ */

/** Area Chart – Inventory Value Trend */
function InventoryValueArea({ data }: { data: { month: string; value: number }[] }) {
  const id = useId();
  return (
    <AreaChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.primary} stopOpacity={0.28} />
          <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid {...GRID} vertical={false} />
      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS} tickMargin={10} />
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={AXIS}
        tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`}
      />
      <Tooltip
        content={<Tip formatter={(v) => money.format(Number(v))} />}
      />
      <Area
        type="monotone"
        dataKey="value"
        name="Value"
        stroke={C.primary}
        strokeWidth={2.2}
        fill={`url(#${id}-g)`}
        dot={false}
        activeDot={{ r: 5, strokeWidth: 2, fill: "var(--card)", stroke: C.primary }}
      />
    </AreaChart>
  );
}

/** Stacked Bar Chart – Inbound / Outbound */
function InboundOutboundStacked({
  data,
}: {
  data: { month: string; inbound: number; outbound: number }[];
}) {
  const id = useId();
  return (
    <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
      <defs>
        <linearGradient id={`${id}-in`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.emerald} stopOpacity={1} />
          <stop offset="100%" stopColor={C.emerald} stopOpacity={0.65} />
        </linearGradient>
        <linearGradient id={`${id}-out`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.red} stopOpacity={1} />
          <stop offset="100%" stopColor={C.red} stopOpacity={0.65} />
        </linearGradient>
      </defs>
      <CartesianGrid {...GRID} vertical={false} />
      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS} tickMargin={10} />
      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={AXIS} />
      <Tooltip
        cursor={{ fill: "var(--muted)", opacity: 0.35 }}
        content={<Tip />}
      />
      <Legend
        iconType="circle"
        iconSize={8}
        wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
      />
      <Bar dataKey="inbound" name="Inbound" stackId="a" fill={`url(#${id}-in)`} radius={[0, 0, 0, 0]} />
      <Bar dataKey="outbound" name="Outbound" stackId="a" fill={`url(#${id}-out)`} radius={[6, 6, 0, 0]} />
    </BarChart>
  );
}

/** Horizontal Bar Chart – Inventory by Warehouse */
function WarehouseBar({ data }: { data: { warehouseName: string; totalValue: number }[] }) {
  const id = useId();
  return (
    <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.emerald} stopOpacity={0.65} />
          <stop offset="100%" stopColor={C.emerald} stopOpacity={1} />
        </linearGradient>
      </defs>
      <CartesianGrid {...GRID} horizontal={false} />
      <XAxis
        type="number"
        axisLine={false}
        tickLine={false}
        tick={AXIS}
        tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`}
      />
      <YAxis
        type="category"
        dataKey="warehouseName"
        width={110}
        axisLine={false}
        tickLine={false}
        tick={AXIS}
      />
      <Tooltip
        content={<Tip formatter={(v) => money.format(Number(v))} />}
      />
      <Bar dataKey="totalValue" name="Value" fill={`url(#${id}-g)`} radius={[0, 6, 6, 0]} maxBarSize={28} />
    </BarChart>
  );
}

/** Bar Chart – Orders per month */
function OrdersBar({ data }: { data: { month: string; orders: number }[] }) {
  const id = useId();
  return (
    <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.emerald} stopOpacity={1} />
          <stop offset="100%" stopColor={C.emerald} stopOpacity={0.65} />
        </linearGradient>
      </defs>
      <CartesianGrid {...GRID} vertical={false} />
      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS} tickMargin={10} />
      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={AXIS} />
      <Tooltip
        cursor={{ fill: "var(--muted)", opacity: 0.35 }}
        content={<Tip />}
      />
      <Bar dataKey="orders" name="Orders" fill={`url(#${id}-g)`} radius={[6, 6, 0, 0]} maxBarSize={48} />
    </BarChart>
  );
}

/** Donut Chart – Status distribution */
function StatusDonut({
  data,
  colors = DONUT_COLORS,
}: {
  data: { status: string; count: number }[];
  colors?: string[];
}) {
  return (
    <PieChart>
      <Pie
        data={data}
        dataKey="count"
        nameKey="status"
        cx="50%"
        cy="50%"
        innerRadius={52}
        outerRadius={86}
        paddingAngle={3}
        label={renderDonutLabel}
        labelLine={false}
        strokeWidth={0}
      >
        {data.map((_, i) => (
          <Cell key={i} fill={colors[i % colors.length]} />
        ))}
      </Pie>
      <Tooltip content={<DonutTip />} />
      <Legend
        iconType="circle"
        iconSize={8}
        wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
      />
    </PieChart>
  );
}

/** Area Chart – Shipment Volume Trend */
function ShipmentVolumeArea({ data }: { data: { month: string; shipments: number }[] }) {
  const id = useId();
  return (
    <AreaChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.amber} stopOpacity={0.28} />
          <stop offset="95%" stopColor={C.amber} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid {...GRID} vertical={false} />
      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS} tickMargin={10} />
      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={AXIS} />
      <Tooltip content={<Tip />} />
      <Area
        type="monotone"
        dataKey="shipments"
        name="Shipments"
        stroke={C.amber}
        strokeWidth={2.2}
        fill={`url(#${id}-g)`}
        dot={false}
        activeDot={{ r: 5, strokeWidth: 2, fill: "var(--card)", stroke: C.amber }}
      />
    </AreaChart>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
/* Main Module                                                         */
/* ════════════════════════════════════════════════════════════════════ */

export function AnalyticsModule() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const params = useMemo(() => ({ from, to }), [from, to]);

  const inventory = useQuery({
    queryKey: ["analytics", "inventory", params],
    queryFn: () => api.getAnalyticsInventory(params),
    staleTime: 60_000,
  });

  const purchaseOrders = useQuery({
    queryKey: ["analytics", "purchase-orders", params],
    queryFn: () => api.getAnalyticsPurchaseOrders(params),
    staleTime: 60_000,
  });

  const shipments = useQuery({
    queryKey: ["analytics", "shipments", params],
    queryFn: () => api.getAnalyticsShipments(params),
    staleTime: 60_000,
  });

  const certificates = useQuery({
    queryKey: ["analytics", "certificates", params],
    queryFn: () => api.getAnalyticsCertificates(params),
    staleTime: 60_000,
  });

  const isLoading =
    inventory.isLoading || purchaseOrders.isLoading || shipments.isLoading || certificates.isLoading;
  const isError =
    inventory.isError || purchaseOrders.isError || shipments.isError || certificates.isError;

  const inv = inventory.data;
  const po = purchaseOrders.data;
  const ship = shipments.data;
  const cert = certificates.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("analytics.pageTitle")}
        description={t("analytics.pageDescription")}
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-full sm:w-36" />
            </div>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-full sm:w-36" />
          </div>
        }
      />

      {isLoading && <AnalyticsSkeleton />}
      {isError && (
        <ErrorState
          message={t("analytics.loadFailed")}
          onRetry={() => {
            void inventory.refetch();
            void purchaseOrders.refetch();
            void shipments.refetch();
            void certificates.refetch();
          }}
        />
      )}

      {!isLoading && !isError && inv && po && ship && cert && (
        <div className="space-y-10">

          {/* ── Purchase Orders ─────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeading title={t("analytics.purchaseOrders.title")} />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                title={t("analytics.purchaseOrders.approvalRate")}
                value={<RateBadge value={po.approvalRate} />}
                note={t("analytics.purchaseOrders.approvalRateNote")}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <KpiCard
                title={t("analytics.purchaseOrders.fulfillmentRate")}
                value={<RateBadge value={po.fulfillmentRate} />}
                note={t("analytics.purchaseOrders.fulfillmentRateNote")}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <KpiCard
                title={t("analytics.purchaseOrders.avgProcessingTime")}
                value={
                  po.averageProcessingTimeDays != null
                    ? <span className="text-2xl font-semibold">{po.averageProcessingTimeDays}d</span>
                    : <span className="text-sm text-muted-foreground">{t("analytics.purchaseOrders.notEnoughData")}</span>
                }
                note={t("analytics.purchaseOrders.avgProcessingTimeNote")}
                icon={<Minus className="h-4 w-4" />}
              />
              <KpiCard
                title={t("analytics.purchaseOrders.statusBreakdown")}
                value={
                  <div className="flex flex-wrap gap-1">
                    {po.statusBreakdown.slice(0, 3).map((s) => (
                      <Badge key={s.status} variant="outline" className="text-xs">
                        {s.status} {s.count}
                      </Badge>
                    ))}
                  </div>
                }
                note={t("analytics.purchaseOrders.statusBreakdownNote")}
                icon={<Minus className="h-4 w-4" />}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title={t("analytics.purchaseOrders.ordersPerMonth")}>
                <OrdersBar data={po.ordersPerMonth} />
              </ChartCard>

              <ChartCard title={t("analytics.purchaseOrders.statusDistribution")}>
                <StatusDonut data={po.statusBreakdown} />
              </ChartCard>
            </div>
          </section>

          {/* ── Shipments ───────────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeading title={t("analytics.shipments.title")} />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <KpiCard
                title={t("analytics.shipments.onTimeDelivery")}
                value={<RateBadge value={ship.onTimeDeliveryRate} />}
                note={t("analytics.shipments.onTimeDeliveryNote")}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <KpiCard
                title={t("analytics.shipments.delayedRate")}
                value={<RateBadge value={ship.delayedShipmentRate} invert />}
                note={t("analytics.shipments.delayedRateNote")}
                icon={<TrendingDown className="h-4 w-4" />}
              />
              <KpiCard
                title={t("analytics.shipments.statusDistribution")}
                value={
                  <div className="flex flex-wrap gap-1">
                    {ship.statusBreakdown.map((s) => (
                      <Badge key={s.status} variant="outline" className="text-xs">
                        {s.status} {s.count}
                      </Badge>
                    ))}
                  </div>
                }
                note={t("analytics.shipments.statusDistributionNote")}
                icon={<Minus className="h-4 w-4" />}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title={t("analytics.shipments.volumeTrend")}>
                <ShipmentVolumeArea data={ship.shipmentVolumeTrend} />
              </ChartCard>

              <ChartCard title={t("analytics.shipments.shipmentStatusDistribution")}>
                <StatusDonut data={ship.statusBreakdown} />
              </ChartCard>
            </div>
          </section>

          {/* ── Inventory ───────────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeading title={t("analytics.inventory.title")} />

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title={t("analytics.inventory.valueTrend")}>
                <InventoryValueArea data={inv.inventoryValueTrend} />
              </ChartCard>

              <ChartCard title={t("analytics.inventory.inboundOutbound")}>
                <InboundOutboundStacked
                  data={inv.inboundTrend.map((row, i) => ({
                    month: row.month,
                    inbound: row.value,
                    outbound: inv.outboundTrend[i]?.value ?? 0,
                  }))}
                />
              </ChartCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title={t("analytics.inventory.byWarehouse")}>
                <WarehouseBar data={inv.inventoryByWarehouse} />
              </ChartCard>

              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-[15px]">{t("analytics.inventory.topStocked")}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("analytics.inventory.product")}</TableHead>
                        <TableHead className="text-right">{t("analytics.inventory.qty")}</TableHead>
                        <TableHead className="text-right">{t("analytics.inventory.value")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inv.topStockedProducts.slice(0, 8).map((p) => (
                        <TableRow key={p.productId}>
                          <TableCell>
                            <p className="truncate text-sm font-medium">{p.productName}</p>
                            <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{p.totalQuantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right tabular-nums">{money.format(p.totalValue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-[15px]">{t("analytics.inventory.fastMoving")}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("analytics.inventory.product")}</TableHead>
                        <TableHead className="text-right">{t("analytics.inventory.unitsOut")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inv.fastMovingProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-sm text-muted-foreground py-6">
                            {t("analytics.inventory.noOutbound")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        inv.fastMovingProducts.slice(0, 8).map((p) => (
                          <TableRow key={p.productId}>
                            <TableCell>
                              <p className="truncate text-sm font-medium">{p.productName}</p>
                              <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{p.totalQuantity.toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-[15px]">{t("analytics.inventory.slowMoving")}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("analytics.inventory.product")}</TableHead>
                        <TableHead className="text-right">{t("analytics.inventory.unitsOut")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inv.slowMovingProducts.slice(0, 8).map((p) => (
                        <TableRow key={p.productId}>
                          <TableCell>
                            <p className="truncate text-sm font-medium">{p.productName}</p>
                            <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{p.totalQuantity.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ── Certificates ────────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeading title={t("analytics.certificates.title")} />
            <div className="grid gap-4 sm:grid-cols-3">
              <KpiCard
                title={t("analytics.certificates.active")}
                value={<span className="text-2xl font-semibold text-success">{cert.activeCertificates}</span>}
                note={t("analytics.certificates.activeNote")}
                icon={<TrendingUp className="h-4 w-4 text-success" />}
              />
              <KpiCard
                title={t("analytics.certificates.expiring")}
                value={<span className="text-2xl font-semibold text-warning">{cert.expiringCertificates}</span>}
                note={t("analytics.certificates.expiringNote")}
                icon={<TrendingDown className="h-4 w-4 text-warning" />}
              />
              <KpiCard
                title={t("analytics.certificates.expired")}
                value={<span className="text-2xl font-semibold text-destructive">{cert.expiredCertificates}</span>}
                note={t("analytics.certificates.expiredNote")}
                icon={<TrendingDown className="h-4 w-4 text-destructive" />}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Certificate Status">
                <StatusDonut
                  data={[
                    { status: "Active", count: cert.activeCertificates },
                    { status: "Expiring", count: cert.expiringCertificates },
                    { status: "Expired", count: cert.expiredCertificates },
                  ]}
                  colors={[C.primary, C.amber, C.red]}
                />
              </ChartCard>

              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-[15px]">{t("analytics.certificates.supplierScore")}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("suppliers.pageTitle")}</TableHead>
                        <TableHead className="text-right">{t("analytics.certificates.score")}</TableHead>
                        <TableHead className="text-right">{t("analytics.certificates.activeCerts")}</TableHead>
                        <TableHead className="text-right">{t("analytics.certificates.totalCerts")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cert.supplierComplianceScore.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                            {t("analytics.certificates.noSupplierData")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        cert.supplierComplianceScore.map((row) => (
                          <TableRow key={row.supplierId}>
                            <TableCell className="font-medium">{row.supplierName}</TableCell>
                            <TableCell className="text-right"><RateBadge value={row.score} /></TableCell>
                            <TableCell className="text-right tabular-nums">{row.activeCertificates}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.totalCertificates}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}