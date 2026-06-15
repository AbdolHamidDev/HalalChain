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
import { AnimateItem } from "@/components/landing/animate-section";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  accent: string;
}

const features: Feature[] = [
  {
    icon: ScanSearch,
    title: "Product Traceability",
    description:
      "End-to-end tracking from raw materials to finished goods with QR code verification at every stage.",
    gradient: "from-primary/10 via-primary/5 to-transparent",
    accent: "bg-primary",
  },
  {
    icon: Building2,
    title: "Supplier Management",
    description:
      "Manage supplier profiles, certifications, performance scores, and compliance documentation in one place.",
    gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    accent: "bg-emerald-500",
  },
  {
    icon: Warehouse,
    title: "Inventory Control",
    description:
      "Real-time inventory tracking across multiple warehouses with automated stock alerts and batch management.",
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    accent: "bg-amber-500",
  },
  {
    icon: Ship,
    title: "Shipment Tracking",
    description:
      "Monitor shipments in real-time with status updates, location tracking, and delivery confirmation.",
    gradient: "from-sky-500/10 via-sky-500/5 to-transparent",
    accent: "bg-sky-500",
  },
  {
    icon: ShieldCheck,
    title: "Halal Certifications",
    description:
      "Centralize certification management with expiry monitoring, document storage, and audit trail logging.",
    gradient: "from-violet-500/10 via-violet-500/5 to-transparent",
    accent: "bg-violet-500",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description:
      "Comprehensive dashboards and exportable reports covering all aspects of your supply chain operations.",
    gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
    accent: "bg-rose-500",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-primary/[0.02] rounded-full blur-3xl" />
      </div>

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

        {/* Features Grid with stagger */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <AnimateItem key={feature.title}>
                <Card className="group relative overflow-hidden border-border/40 hover:border-border/80 transition-all duration-500 hover:shadow-xl bg-background/50 backdrop-blur-sm">
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br ${feature.gradient}`}
                  />
                  <CardContent className="relative p-6 space-y-4">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${feature.accent}/10 group-hover:scale-110 transition-all duration-300`}>
                      <div className={`w-5 h-5 rounded-full ${feature.accent} opacity-80`} />
                      <Icon className="absolute size-5 text-white" />
                    </div>
                    <h3 className="font-display text-lg font-semibold tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </AnimateItem>
            );
          })}
        </div>
      </div>
    </section>
  );
}