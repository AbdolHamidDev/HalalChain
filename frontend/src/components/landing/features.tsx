"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ScanSearch,
  ShieldCheck,
  Bell,
  Award,
  BarChart3,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimateItem } from "@/components/landing/animate-section";
import { useTranslation } from "@/i18n/hooks";
import type { TranslationKey } from "@/i18n/types";

interface Feature {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  gradient: string;
  accent: string;
}

export function FeaturesSection() {
  const { t } = useTranslation();

  const features: Feature[] = [
    {
      icon: ScanSearch,
      titleKey: "landing.features.items.traceability.title",
      descKey: "landing.features.items.traceability.description",
      gradient: "from-primary/10 via-primary/5 to-transparent",
      accent: "bg-primary",
    },
    {
      icon: ShieldCheck,
      titleKey: "landing.features.items.compliance.title",
      descKey: "landing.features.items.compliance.description",
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      accent: "bg-emerald-500",
    },
    {
      icon: Workflow,
      titleKey: "landing.features.items.automation.title",
      descKey: "landing.features.items.automation.description",
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      accent: "bg-amber-500",
    },
    {
      icon: Award,
      titleKey: "landing.features.items.certifications.title",
      descKey: "landing.features.items.certifications.description",
      gradient: "from-violet-500/10 via-violet-500/5 to-transparent",
      accent: "bg-violet-500",
    },
    {
      icon: BarChart3,
      titleKey: "landing.features.items.analytics.title",
      descKey: "landing.features.items.analytics.description",
      gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
      accent: "bg-rose-500",
    },
    {
      icon: Bell,
      titleKey: "landing.features.items.notifications.title",
      descKey: "landing.features.items.notifications.description",
      gradient: "from-sky-500/10 via-sky-500/5 to-transparent",
      accent: "bg-sky-500",
    },
  ];

  return (
    <section id="features" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-primary/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="container-genesis">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-section mb-4">
            {t("landing.features.title")}
          </h2>
          <p className="text-body text-muted-foreground">
            {t("landing.features.subtitle")}
          </p>
        </div>

        {/* Features Grid with stagger */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <AnimateItem key={feature.titleKey}>
                <Card className="group relative overflow-hidden transition-all duration-500 bg-card/60 backdrop-blur-sm">
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br ${feature.gradient}`}
                  />
                  <CardContent className="relative p-8 space-y-4">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-2xl ${feature.accent}/10 group-hover:scale-110 transition-all duration-300`}>
                      <div className={`w-5 h-5 rounded-full ${feature.accent} opacity-80`} />
                      <Icon className="absolute size-5 text-white" />
                    </div>
                    <h3 className="font-display text-lg font-semibold tracking-tight">
                      {t(feature.titleKey as TranslationKey)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(feature.descKey as TranslationKey)}
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