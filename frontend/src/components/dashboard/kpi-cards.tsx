"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, DollarSign, Loader2, Truck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const kpiMeta = [
  {
    key: "totalSuppliers" as const,
    title: "Total Suppliers",
    icon: Users,
    iconClass: "text-success",
    bgClass: "bg-success/10",
    format: (v: number) => String(v),
    subtitle: (data: Awaited<ReturnType<typeof api.dashboardStats>>) =>
      `${data.kpis.totalSuppliers} active trong mạng lưới SEA`,
  },
  {
    key: "activeCertificates" as const,
    title: "Active Certificates",
    icon: Award,
    iconClass: "text-warning",
    bgClass: "bg-warning/10",
    format: (v: number) => String(v),
    subtitle: (data: Awaited<ReturnType<typeof api.dashboardStats>>) =>
      `${data.kpis.expiringSoonCertificates} sắp hết hạn (90 ngày)`,
  },
  {
    key: "inventoryValue" as const,
    title: "Inventory Value",
    icon: DollarSign,
    iconClass: "text-primary",
    bgClass: "bg-primary/10",
    format: (v: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(v),
    subtitle: () => "Tính theo quantity × unit price",
  },
  {
    key: "pendingShipments" as const,
    title: "Pending Shipments",
    icon: Truck,
    iconClass: "text-muted-foreground",
    bgClass: "bg-secondary",
    format: (v: number) => String(v),
    subtitle: () => "Pending · In transit · Delayed",
  },
];

export function KpiCards() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.dashboardStats(),
  });

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border bg-card">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Không thể tải KPI. Vui lòng đăng nhập với quyền Admin hoặc Manager.
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {kpiMeta.map((kpi) => {
        const Icon = kpi.icon;
        const value = data.kpis[kpi.key];

        return (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-small font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${kpi.bgClass}`}>
                <Icon className={`h-4 w-4 ${kpi.iconClass}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl tracking-tight sm:text-section">{kpi.format(value)}</p>
              <p className="mt-1 text-caption text-muted-foreground">{kpi.subtitle(data)}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
