"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, CalendarDays, Warehouse } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/charts";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useTranslation } from "@/i18n/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/shared/state-blocks";
import { api } from "@/lib/api";

export function DashboardContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 5);
    return date.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const canViewActivity = user?.role === "ADMIN" || user?.role === "MANAGER";
  const params = useMemo(() => ({ from, to }), [from, to]);

  const stats = useQuery({
    queryKey: ["dashboard-stats", params],
    queryFn: () => api.dashboardStats(params),
    enabled: user?.role === "ADMIN" || user?.role === "MANAGER",
    staleTime: 60_000,
  });

  if (user?.role === "STAFF") {
    return (
      <div className="space-y-6">
        <PageHeader title={t("dashboard.warehouseOpsTitle")} description={t("dashboard.warehouseOpsDescription")} />
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Warehouse className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{t("dashboard.warehouseOpsCardTitle")}</p>
                <p className="text-sm text-muted-foreground">{t("dashboard.warehouseOpsCardDescription")}</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <Link href="/dashboard/inventory">
                {t("dashboard.goToInventory")} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.pageTitle")}
        description={t("dashboard.pageDescription")}
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

      {stats.isLoading && <DashboardSkeleton />}
      {stats.isError && <ErrorState message={t("dashboard.errors.loadFailed")} onRetry={() => stats.refetch()} />}
      {stats.data && (
        <>
          <KpiCards data={stats.data} />
          <DashboardCharts data={stats.data} />
          <OperationalWidgets data={stats.data} />
          {canViewActivity && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("dashboard.recentActivity")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg border bg-muted/30" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-80 animate-pulse rounded-lg border bg-muted/30" />
        ))}
      </div>
    </div>
  );
}

function OperationalWidgets({ data }: { data: Awaited<ReturnType<typeof api.dashboardStats>> }) {
  const { t } = useTranslation();
  const widgets = data?.widgets;
  const lowStockAlerts = widgets?.lowStockAlerts ?? [];
  const expiringCertificates = widgets?.expiringCertificates ?? [];
  const shipmentDelays = widgets?.shipmentDelays ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <WidgetCard title={t("dashboard.widgets.lowStockAlerts")}>
        {lowStockAlerts.length === 0 ? (
          <EmptyState title={t("dashboard.widgets.stockHealthy")} description={t("dashboard.widgets.stockHealthyDesc")} />
        ) : (
          lowStockAlerts.map((item) => (
            <WidgetRow key={item.id} title={item.productName} meta={`${item.warehouseName} · ${item.sku}`}>
              <Badge variant="warning">{item.quantity} / {item.reorderLevel}</Badge>
            </WidgetRow>
          ))
        )}
      </WidgetCard>

      <WidgetCard title={t("dashboard.widgets.expiringCertificates")}>
        {expiringCertificates.length === 0 ? (
          <EmptyState title={t("dashboard.widgets.noExpiries")} description={t("dashboard.widgets.noExpiriesDesc")} />
        ) : (
          expiringCertificates.map((item) => (
            <WidgetRow key={item.id} title={item.supplierName} meta={item.certificateNumber}>
              <span className="text-xs text-muted-foreground">{new Date(item.expiryDate).toLocaleDateString()}</span>
            </WidgetRow>
          ))
        )}
      </WidgetCard>

      <WidgetCard title={t("dashboard.widgets.shipmentDelays")}>
        {shipmentDelays.length === 0 ? (
          <EmptyState title={t("dashboard.widgets.noDelays")} description={t("dashboard.widgets.noDelaysDesc")} />
        ) : (
          shipmentDelays.map((item) => (
            <WidgetRow key={item.id} title={item.trackingNumber} meta={`${item.poNumber} · ${item.supplierName}`}>
              <Badge variant="danger">{t("dashboard.widgets.delayed")}</Badge>
            </WidgetRow>
          ))
        )}
      </WidgetCard>
    </div>
  );
}

function WidgetCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function WidgetRow({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 rounded-md border px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}