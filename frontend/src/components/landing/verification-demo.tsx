"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Scan, ShieldCheck, Route, ArrowRight } from "lucide-react";
import { useTranslation } from "@/i18n/hooks";
import type { TranslationKey } from "@/i18n/types";

export function VerificationDemoSection() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: QrCode,
      titleKey: "landing.verificationDemo.steps.qrScanning.title",
      descriptionKey: "landing.verificationDemo.steps.qrScanning.description",
      color: "from-primary/20 to-primary/5",
      accent: "bg-primary",
    },
    {
      icon: Scan,
      titleKey: "landing.verificationDemo.steps.productVerification.title",
      descriptionKey: "landing.verificationDemo.steps.productVerification.description",
      color: "from-emerald-500/20 to-emerald-500/5",
      accent: "bg-emerald-500",
    },
    {
      icon: ShieldCheck,
      titleKey: "landing.verificationDemo.steps.certificateValidation.title",
      descriptionKey: "landing.verificationDemo.steps.certificateValidation.description",
      color: "from-amber-500/20 to-amber-500/5",
      accent: "bg-amber-500",
    },
    {
      icon: Route,
      titleKey: "landing.verificationDemo.steps.shipmentHistory.title",
      descriptionKey: "landing.verificationDemo.steps.shipmentHistory.description",
      color: "from-sky-500/20 to-sky-500/5",
      accent: "bg-sky-500",
    },
  ];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="container-genesis">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-section mb-4">
            {t("landing.verificationDemo.title")}
          </h2>
          <p className="text-body text-muted-foreground">
            {t("landing.verificationDemo.subtitle")}
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 gap-5 mb-12">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.titleKey} className="group bg-card/60 backdrop-blur-sm transition-all duration-500">
                <CardContent className="p-8 flex gap-5">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="size-5 text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display text-base font-semibold tracking-tight">
                      {t(step.titleKey as TranslationKey)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(step.descriptionKey as TranslationKey)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA - links to real seeded product */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("landing.verificationDemo.cta.tryText")}
          </p>
          <Button size="lg" className="h-12 text-base shadow-lg shadow-primary/20" asChild>
            <Link href="/demo">
              {t("landing.verificationDemo.cta.button")}
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}