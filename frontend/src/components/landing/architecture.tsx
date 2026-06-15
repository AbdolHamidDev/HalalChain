"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Globe, Server, Database, Mail, Bell, Cloud } from "lucide-react";
import { useTranslation } from "@/i18n/hooks";
import type { TranslationKey } from "@/i18n/types";

export function ArchitectureSection() {
  const { t } = useTranslation();

  const mainStack = [
    { icon: Globe, labelKey: "landing.architecture.mainStack.nextjs.label", subtitleKey: "landing.architecture.mainStack.nextjs.description", color: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { icon: Server, labelKey: "landing.architecture.mainStack.express.label", subtitleKey: "landing.architecture.mainStack.express.description", color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-500" },
    { icon: Database, labelKey: "landing.architecture.mainStack.prisma.label", subtitleKey: "landing.architecture.mainStack.prisma.description", color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-500" },
    { icon: Database, labelKey: "landing.architecture.mainStack.postgresql.label", subtitleKey: "landing.architecture.mainStack.postgresql.description", color: "from-sky-500/20 to-sky-500/5", iconColor: "text-sky-500" },
  ];

  const externalServices = [
    { icon: Cloud, labelKey: "landing.architecture.services.cloudinary.label", descriptionKey: "landing.architecture.services.cloudinary.description" },
    { icon: Mail, labelKey: "landing.architecture.services.resend.label", descriptionKey: "landing.architecture.services.resend.description" },
    { icon: Bell, labelKey: "landing.architecture.services.sse.label", descriptionKey: "landing.architecture.services.sse.description" },
  ];

  return (
    <section id="architecture" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-muted/30" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container-genesis">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-section mb-4">{t("landing.architecture.title")}</h2>
          <p className="text-body text-muted-foreground">
            {t("landing.architecture.subtitle")}
          </p>
        </div>

        {/* Main Stack - Vertical Flow */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="flex flex-col items-center gap-0">
            {mainStack.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.labelKey} className="flex flex-col items-center w-full">
                  <Card className="w-full max-w-sm border-border/40 bg-background/80 backdrop-blur-sm hover:shadow-lg hover:border-border/70 transition-all duration-300">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center ${item.iconColor}`}>
                        <Icon className="size-6" />
                      </div>
                      <div>
                      <h3 className="font-display text-sm font-semibold">{t(item.labelKey as TranslationKey)}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{t(item.subtitleKey as TranslationKey)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  {index < mainStack.length - 1 && (
                    <div className="flex items-center justify-center h-8">
                      <div className="w-px h-full bg-gradient-to-b from-border to-border/30" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* External Services */}
        <div className="max-w-3xl mx-auto">
          <h3 className="font-display text-base font-semibold tracking-tight text-center mb-8">
            {t("landing.architecture.externalServices")}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {externalServices.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.labelKey} className="border-border/40 bg-background/80 backdrop-blur-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{t(service.labelKey as TranslationKey)}</h4>
                      <p className="text-xs text-muted-foreground">{t(service.descriptionKey as TranslationKey)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}