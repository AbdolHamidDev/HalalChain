"use client";

import { Award, Boxes, CircleDollarSign, FileClock, Package, Shield, Truck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type DashboardStats } from "@/lib/api";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function KpiCards({ data }: { data: DashboardStats }) {
  const kpis = data?.kpis;
  const compliance = data?.compliance;

  if (!kpis) return null;

  const complianceScore = compliance?.score ?? 0;
  const scoreColor =
    complianceScore >= 80 ? "text-success bg-success/10" :
    complianceScore >= 50 ? "text-warning bg-warning/10" :
    "text-destructive bg-destructive/10";

  const cards = [
    {
      title: "Compliance Score",
      value: `${complianceScore}/100`,
      note: complianceScore >= 80 ? "Good standing" : complianceScore >= 50 ? "Needs attention" : "Critical issues",
      icon: Shield,
      tone: scoreColor,
    },
    {
      title: "Total Products",
      value: (kpis.totalProducts ?? 0).toLocaleString(),
      note: "Tracked SKUs",
      icon: Package,
      tone: "text-primary bg-primary/10",
    },
    {
      title: "Inventory Value",
      value: money.format(kpis.inventoryValue ?? 0),
      note: "Quantity x unit price",
      icon: CircleDollarSign,
      tone: "text-success bg-success/10",
    },
    {
      title: "Active Suppliers",
      value: (kpis.activeSuppliers ?? 0).toLocaleString(),
      note: "Approved network",
      icon: Users,
      tone: "text-sky-600 bg-sky-500/10",
    },
    {
      title: "Active Certificates",
      value: (kpis.activeCertificates ?? 0).toLocaleString(),
      note: `${kpis.expiringSoonCertificates ?? 0} expiring within 90 days`,
      icon: Award,
      tone: "text-warning bg-warning/10",
    },
    {
      title: "Open Purchase Orders",
      value: (kpis.openPurchaseOrders ?? 0).toLocaleString(),
      note: "Draft through shipping",
      icon: Boxes,
      tone: "text-primary bg-primary/10",
    },
    {
      title: "Delayed Shipments",
      value: (kpis.delayedShipments ?? 0).toLocaleString(),
      note: "Needs follow-up",
      icon: Truck,
      tone: "text-destructive bg-destructive/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-md p-2 ${card.tone}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-normal">{card.value}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <FileClock className="h-3 w-3" />
                {card.note}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
