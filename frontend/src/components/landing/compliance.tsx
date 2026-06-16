"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarClock,
  AlertTriangle,
  PackageOpen,
  Truck,
  Gauge,
  BellRing,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimateItem } from "@/components/landing/animate-section";
import { useTranslation } from "@/i18n/hooks";
import type { TranslationKey } from "@/i18n/types";

interface ComplianceItem {
  icon: LucideIcon;
  titleKey: string;
  subtitleKey: string;
  gradient: string;
  accent: string;
}

export function ComplianceSection() {
  const { t } = useTranslation();

  const items: ComplianceItem[] = [
    {
      icon: CalendarClock,
      titleKey: "landing.compliance.items.certificateExpiry.title",
      subtitleKey: "landing.compliance.items.certificateExpiry.subtitle",
      gradient: "from-primary/20 via-primary/5 to-transparent",
      accent: "bg-primary",
    },
    {
      icon: AlertTriangle,
      titleKey: "landing.compliance.items.certificateExpired.title",
      subtitleKey: "landing.compliance.items.certificateExpired.subtitle",
      gradient: "from-red-500/20 via-red-500/5 to-transparent",
      accent: "bg-red-500",
    },
    {
      icon: PackageOpen,
      titleKey: "landing.compliance.items.lowInventory.title",
      subtitleKey: "landing.compliance.items.lowInventory.subtitle",
      gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
      accent: "bg-amber-500",
    },
    {
      icon: Truck,
      titleKey: "landing.compliance.items.shipmentDelay.title",
      subtitleKey: "landing.compliance.items.shipmentDelay.subtitle",
      gradient: "from-sky-500/20 via-sky-500/5 to-transparent",
      accent: "bg-sky-500",
    },
    {
      icon: Gauge,
      titleKey: "landing.compliance.items.complianceScore.title",
      subtitleKey: "landing.compliance.items.complianceScore.subtitle",
      gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
      accent: "bg-emerald-500",
    },
    {
      icon: BellRing,
      titleKey: "landing.compliance.items.realTimeAlerts.title",
      subtitleKey: "landing.compliance.items.realTimeAlerts.subtitle",
      gradient: "from-violet-500/20 via-violet-500/5 to-transparent",
      accent: "bg-violet-500",
    },
  ];

  return (
    <section id="compliance" className="relative py-24 md:py-32 overflow-hidden bg-muted/30">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/[0.02] rounded-full blur-3xl" />
      </div>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container-genesis">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-gradient-to-r from-emerald-500/[0.04] to-transparent text-sm text-muted-foreground mb-6 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full rounded-full bg-emerald-400 animate-ping opacity-40" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Automation Engine — Daily at 08:00
          </div>
          <h2 className="text-section mb-4">
            {t("landing.compliance.title")}
          </h2>
          <p className="text-body text-muted-foreground">
            {t("landing.compliance.subtitle")}
          </p>
        </div>

        {/* Compliance Items Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <AnimateItem key={item.titleKey}>
                <Card className="group relative overflow-hidden transition-all duration-500 bg-card/60 backdrop-blur-sm h-full">
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br ${item.gradient}`}
                  />
                  <CardContent className="relative p-8 space-y-4">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-2xl ${item.accent}/10 group-hover:scale-110 transition-all duration-300`}>
                      <div className={`w-5 h-5 rounded-full ${item.accent} opacity-80`} />
                      <Icon className="absolute size-5 text-white" />
                    </div>
                    <h3 className="font-display text-base font-semibold tracking-tight">
                      {t(item.titleKey as TranslationKey)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(item.subtitleKey as TranslationKey)}
                    </p>
                  </CardContent>
                </Card>
              </AnimateItem>
            );
          })}
        </div>

        {/* Score Note */}
        <div className="mt-10 max-w-2xl mx-auto text-center">
          <p className="text-sm text-muted-foreground/70 italic">
            {t("landing.compliance.scoreNote")}
          </p>
        </div>
      </div>
    </section>
  );
}