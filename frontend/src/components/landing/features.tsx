import { Card, CardContent } from "@/components/ui/card";
import {
  ScanSearch,
  Building2,
  Warehouse,
  Ship,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

const features: Feature[] = [
  {
    icon: ScanSearch,
    title: "Product Traceability",
    description:
      "End-to-end tracking from raw materials to finished goods with QR code verification at every stage.",
    gradient: "from-primary/20 via-primary/5 to-transparent",
  },
  {
    icon: Building2,
    title: "Supplier Management",
    description:
      "Manage supplier profiles, certifications, performance scores, and compliance documentation in one place.",
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  },
  {
    icon: Warehouse,
    title: "Inventory Control",
    description:
      "Real-time inventory tracking across multiple warehouses with automated stock alerts and batch management.",
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
  },
  {
    icon: Ship,
    title: "Shipment Tracking",
    description:
      "Monitor shipments in real-time with status updates, location tracking, and delivery confirmation.",
    gradient: "from-sky-500/20 via-sky-500/5 to-transparent",
  },
  {
    icon: ShieldCheck,
    title: "Halal Certifications",
    description:
      "Centralize certification management with expiry monitoring, document storage, and audit trail logging.",
    gradient: "from-violet-500/20 via-violet-500/5 to-transparent",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description:
      "Comprehensive dashboards and exportable reports covering all aspects of your supply chain operations.",
    gradient: "from-rose-500/20 via-rose-500/5 to-transparent",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container-genesis">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-section mb-4">
            Everything you need to manage your halal supply chain
          </h2>
          <p className="text-body text-muted-foreground">
            A unified platform designed for modern halal businesses to track,
            verify, and optimize every step of their supply chain.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg"
              >
                {/* Gradient overlay on hover */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.gradient}`}
                />
                <CardContent className="relative p-6 space-y-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}