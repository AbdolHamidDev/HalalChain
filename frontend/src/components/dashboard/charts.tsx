"use client";

import type React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type DashboardStats } from "@/lib/api";

export function DashboardCharts({ data }: { data: DashboardStats }) {
  const charts = data?.charts;

  if (!charts) return null;

  const {
    inventoryTrend,
    purchaseOrdersPerMonth,
    shipmentVolumeTrend,
    certificateExpiryTimeline,
  } = charts;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Inventory Trend">
        <LineChart data={inventoryTrend ?? []}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tickMargin={8} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="quantity" stroke="#0d6e4f" strokeWidth={2} dot={{ fill: "#0d6e4f" }} />
        </LineChart>
      </ChartCard>

      <ChartCard title="Orders Trend">
        <BarChart data={purchaseOrdersPerMonth ?? []}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tickMargin={8} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="orders" fill="#0d6e4f" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Shipment Trend">
        <LineChart data={shipmentVolumeTrend ?? []}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tickMargin={8} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="shipments" stroke="#0284c7" strokeWidth={2} dot={{ fill: "#0284c7" }} />
        </LineChart>
      </ChartCard>

      <ChartCard title="Certificate Trend">
        <BarChart data={certificateExpiryTimeline ?? []}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="quarter" tickMargin={8} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
