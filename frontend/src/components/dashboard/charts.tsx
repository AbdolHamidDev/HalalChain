"use client";

import { useId } from "react";
import type React from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type DashboardStats } from "@/lib/api";

/* ── Color Palette (uses CSS variables so it adapts to light/dark) ── */
const COLORS = {
  primary: "var(--chart-1)",
  emerald: "var(--chart-2)",
  amber: "var(--chart-3)",
  red: "var(--chart-4)",
  muted: "var(--chart-5)",
} as const;

/* ── Shared axis / grid / tooltip styles ── */
const AXIS_STYLE = {
  fontSize: 12,
  fill: "var(--muted-foreground)",
  fontWeight: 400 as const,
};

const GRID_STYLE = {
  strokeDasharray: "3 3",
  stroke: "var(--border)",
  strokeOpacity: 0.45,
};

/** Compact custom tooltip */
function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatter?: (value: number, name: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}
    >
      {label && (
        <p className="mb-1.5 text-xs font-medium text-[var(--muted-foreground)]">
          {label}
        </p>
      )}
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[var(--muted-foreground)]">{entry.name}</span>
          <span className="ml-auto font-semibold text-[var(--foreground)]">
            {formatter ? formatter(entry.value, entry.name) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* DashboardCharts – main export                                       */
/* ──────────────────────────────────────────────────────────────────── */

const DONUT_COLORS = [COLORS.primary, COLORS.emerald, COLORS.amber, COLORS.red, COLORS.muted];

type DonutLabelProps = { name?: string | number; percent?: number };
function renderDonutLabel(props: unknown) {
  const { name, percent } = props as DonutLabelProps;
  if (!percent || percent <= 0.06) return null;
  return `${name ?? ""} ${(percent * 100).toFixed(0)}%`;
}

export function DashboardCharts({ data }: { data: DashboardStats }) {
  const charts = data?.charts;

  if (!charts) return null;

  const {
    inventoryTrend,
    purchaseOrdersPerMonth,
    shipmentVolumeTrend,
    certificateExpiryTimeline,
    shipmentStatusDistribution,
  } = charts;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {/* 1. Inventory Trend – Area chart */}
      <ChartCard title="Inventory Trend">
        <InventoryAreaChart data={inventoryTrend ?? []} />
      </ChartCard>

      {/* 2. Orders Trend – Bar chart */}
      <ChartCard title="Orders Trend">
        <OrdersBarChart data={purchaseOrdersPerMonth ?? []} />
      </ChartCard>

      {/* 3. Shipment Trend – Area chart */}
      <ChartCard title="Shipment Trend">
        <ShipmentAreaChart data={shipmentVolumeTrend ?? []} />
      </ChartCard>

      {/* 4. Certificate Trend – Bar chart */}
      <ChartCard title="Certificate Trend">
        <CertificateBarChart data={certificateExpiryTimeline ?? []} />
      </ChartCard>

      {/* 5. Shipment Status – Donut chart */}
      {shipmentStatusDistribution && shipmentStatusDistribution.length > 0 && (
        <ChartCard title="Shipment Status">
          <ShipmentStatusDonut data={shipmentStatusDistribution} />
        </ChartCard>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* Individual chart compositions                                       */
/* ──────────────────────────────────────────────────────────────────── */

function InventoryAreaChart({ data }: { data: Record<string, unknown>[] }) {
  const id = useId();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.28} />
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID_STYLE} vertical={false} />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={AXIS_STYLE}
          tickMargin={10}
        />
        <YAxis axisLine={false} tickLine={false} tick={AXIS_STYLE} />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="quantity"
          name="Quantity"
          stroke={COLORS.primary}
          strokeWidth={2.2}
          fill={`url(#${id}-grad)`}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, fill: "var(--card)", stroke: COLORS.primary }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function OrdersBarChart({ data }: { data: Record<string, unknown>[] }) {
  const id = useId();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={1} />
            <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0.65} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID_STYLE} vertical={false} />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={AXIS_STYLE}
          tickMargin={10}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={AXIS_STYLE}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.35 }}
          content={<ChartTooltip />}
        />
        <Bar
          dataKey="orders"
          name="Orders"
          fill={`url(#${id}-grad)`}
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ShipmentAreaChart({ data }: { data: Record<string, unknown>[] }) {
  const id = useId();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.amber} stopOpacity={0.28} />
            <stop offset="95%" stopColor={COLORS.amber} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID_STYLE} vertical={false} />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={AXIS_STYLE}
          tickMargin={10}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={AXIS_STYLE}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="shipments"
          name="Shipments"
          stroke={COLORS.amber}
          strokeWidth={2.2}
          fill={`url(#${id}-grad)`}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, fill: "var(--card)", stroke: COLORS.amber }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CertificateBarChart({ data }: { data: Record<string, unknown>[] }) {
  const id = useId();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.red} stopOpacity={1} />
            <stop offset="100%" stopColor={COLORS.red} stopOpacity={0.65} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID_STYLE} vertical={false} />
        <XAxis
          dataKey="quarter"
          axisLine={false}
          tickLine={false}
          tick={AXIS_STYLE}
          tickMargin={10}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={AXIS_STYLE}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.35 }}
          content={<ChartTooltip />}
        />
        <Bar
          dataKey="count"
          name="Certificates"
          fill={`url(#${id}-grad)`}
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Donut Chart – Shipment Status Distribution */
function ShipmentStatusDonut({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
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
            <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* Reusable ChartCard wrapper                                          */
/* ──────────────────────────────────────────────────────────────────── */

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <CardTitle className="text-[15px]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72 pt-4">
        {children}
      </CardContent>
    </Card>
  );
}