"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { CalendarDays, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared/state-blocks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const PIE_COLORS = ["#0d6e4f", "#0284c7", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

type PieSliceLabelProps = {
  name?: string | number;
  percent?: number;
};

function renderPieLabel(props: unknown) {
  const { name, percent } = props as PieSliceLabelProps;
  if (!percent || percent <= 0.05) {
    return "";
  }

  return `${name ?? ""} ${(percent * 100).toFixed(0)}%`;
}

// ─── Rate badge ───────────────────────────────────────────────────────────────

function RateBadge({ value, invert = false }: { value: number; invert?: boolean }) {
  const good = invert ? value <= 10 : value >= 75;
  const warn = invert ? value <= 25 : value >= 50;
  return (
    <Badge variant={good ? "success" : warn ? "warning" : "danger"}>
      {value.toFixed(1)}%
    </Badge>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────

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
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg border bg-muted/30" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-lg border bg-muted/30" />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AnalyticsModule() {
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
        title="Advanced Analytics"
        description="Deep-dive into inventory, procurement, shipments, and halal certificate compliance"
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 w-full sm:w-36"
              />
            </div>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 w-full sm:w-36"
            />
          </div>
        }
      />

      {isLoading && <AnalyticsSkeleton />}
      {isError && (
        <ErrorState
          message="Failed to load analytics data. Please try again."
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

          {/* ── Purchase Order KPI row ───────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeading title="Purchase Orders" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                title="Approval Rate"
                value={<RateBadge value={po.approvalRate} />}
                note="Approved / total POs"
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <KpiCard
                title="Fulfillment Rate"
                value={<RateBadge value={po.fulfillmentRate} />}
                note="Received or partial POs"
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <KpiCard
                title="Avg. Processing Time"
                value={
                  po.averageProcessingTimeDays != null
                    ? <span className="text-2xl font-semibold">{po.averageProcessingTimeDays}d</span>
                    : <span className="text-sm text-muted-foreground">Not enough data</span>
                }
                note="Draft → Received"
                icon={<Minus className="h-4 w-4" />}
              />
              <KpiCard
                title="Status Breakdown"
                value={
                  <div className="flex flex-wrap gap-1">
                    {po.statusBreakdown.slice(0, 3).map((s) => (
                      <Badge key={s.status} variant="outline" className="text-xs">
                        {s.status} {s.count}
                      </Badge>
                    ))}
                  </div>
                }
                note="Active statuses"
                icon={<Minus className="h-4 w-4" />}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Orders per Month">
                <BarChart data={po.ordersPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tickMargin={8} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#0d6e4f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartCard>

              <ChartCard title="PO Status Distribution">
                <PieChart>
                  <Pie
                    data={po.statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {po.statusBreakdown.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend />
                </PieChart>
              </ChartCard>
            </div>
          </section>

          {/* ── Shipment KPI row ─────────────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeading title="Shipments" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <KpiCard
                title="On-Time Delivery Rate"
                value={<RateBadge value={ship.onTimeDeliveryRate} />}
                note="Delivered / total in range"
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <KpiCard
                title="Delayed Shipment Rate"
                value={<RateBadge value={ship.delayedShipmentRate} invert />}
                note="DELAYED / total in range"
                icon={<TrendingDown className="h-4 w-4" />}
              />
              <KpiCard
                title="Status Distribution"
                value={
                  <div className="flex flex-wrap gap-1">
                    {ship.statusBreakdown.map((s) => (
                      <Badge key={s.status} variant="outline" className="text-xs">
                        {s.status} {s.count}
                      </Badge>
                    ))}
                  </div>
                }
                note="All shipments in range"
                icon={<Minus className="h-4 w-4" />}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Shipment Volume Trend">
                <LineChart data={ship.shipmentVolumeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tickMargin={8} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="shipments"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={{ fill: "#0284c7" }}
                  />
                </LineChart>
              </ChartCard>

              <ChartCard title="Shipment Status Distribution">
                <PieChart>
                  <Pie
                    data={ship.statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {ship.statusBreakdown.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ChartCard>
            </div>
          </section>

          {/* ── Inventory section ─────────────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeading title="Inventory" />

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Inventory Value Trend">
                <LineChart data={inv.inventoryValueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tickMargin={8} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${(v as number / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => money.format(v as number)} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0d6e4f"
                    strokeWidth={2}
                    dot={{ fill: "#0d6e4f" }}
                  />
                </LineChart>
              </ChartCard>

              <ChartCard title="Inbound vs Outbound Movement">
                <BarChart
                  data={inv.inboundTrend.map((row, i) => ({
                    month: row.month,
                    inbound: row.value,
                    outbound: inv.outboundTrend[i]?.value ?? 0,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tickMargin={8} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="inbound" fill="#0d6e4f" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outbound" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Inventory by Warehouse">
                <BarChart data={inv.inventoryByWarehouse} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={(v) => `$${(v as number / 1000).toFixed(0)}k`} />
                  <YAxis
                    type="category"
                    dataKey="warehouseName"
                    width={110}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(v) => money.format(v as number)} />
                  <Bar dataKey="totalValue" fill="#0284c7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartCard>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Stocked Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Value</TableHead>
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
                <CardHeader>
                  <CardTitle className="text-base">Fast-Moving Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Units Out</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inv.fastMovingProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-sm text-muted-foreground py-6">
                            No outbound movements in selected range
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
                <CardHeader>
                  <CardTitle className="text-base">Slow-Moving Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Units Out</TableHead>
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

          {/* ── Certificate section ───────────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeading title="Certificate Compliance" />
            <div className="grid gap-4 sm:grid-cols-3">
              <KpiCard
                title="Active Certificates"
                value={<span className="text-2xl font-semibold text-success">{cert.activeCertificates}</span>}
                note="Not yet expired"
                icon={<TrendingUp className="h-4 w-4 text-success" />}
              />
              <KpiCard
                title="Expiring within 90 days"
                value={<span className="text-2xl font-semibold text-warning">{cert.expiringCertificates}</span>}
                note="Requires attention"
                icon={<TrendingDown className="h-4 w-4 text-warning" />}
              />
              <KpiCard
                title="Expired Certificates"
                value={<span className="text-2xl font-semibold text-destructive">{cert.expiredCertificates}</span>}
                note="Must be renewed"
                icon={<TrendingDown className="h-4 w-4 text-destructive" />}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Supplier Compliance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Active</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cert.supplierComplianceScore.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                          No supplier data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      cert.supplierComplianceScore.map((row) => (
                        <TableRow key={row.supplierId}>
                          <TableCell className="font-medium">{row.supplierName}</TableCell>
                          <TableCell className="text-right">
                            <RateBadge value={row.score} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{row.activeCertificates}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.totalCertificates}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

        </div>
      )}
    </div>
  );
}

// ─── Small KPI card ───────────────────────────────────────────────────────────

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
