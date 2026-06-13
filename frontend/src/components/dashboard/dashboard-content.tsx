"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { DashboardCharts } from "@/components/dashboard/charts";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";
import { ArrowRight, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardContent() {
  const { user } = useAuth();

  const canViewActivity =
    user?.role === "ADMIN" || user?.role === "MANAGER";

  if (user?.role === "STAFF") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Warehouse Operations"
          description="Quick access to inbound and outbound stock movements"
        />
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Warehouse className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Warehouse Operations</p>
                <p className="text-sm text-muted-foreground">
                  Process inbound receipts and outbound dispatch orders
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/inventory">
                Go to Inventory <ArrowRight className="h-3.5 w-3.5" />
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
        title="Operations Dashboard"
        description="Monitor suppliers, inventory, shipments and halal certification compliance across Southeast Asian trade networks"
      />
      <KpiCards />
      <DashboardCharts />
      {canViewActivity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
