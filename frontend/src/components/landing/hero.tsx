"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import { useTranslation } from "@/i18n/hooks";

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/[0.02] rounded-full blur-3xl" />
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] bg-primary/[0.03] rounded-full blur-3xl" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="container-genesis">
        <div className="max-w-4xl mx-auto text-center">
          {/* Premium badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-gradient-to-r from-primary/[0.04] to-transparent text-sm text-muted-foreground mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full rounded-full bg-emerald-400 animate-ping opacity-40" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {t("landing.hero.badge")}
          </div>

          {/* Headline with gradient accent */}
          <h1 className="text-display text-balance mb-6 leading-[0.95] tracking-[-0.04em]">
            {t("landing.hero.title")}{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {t("landing.hero.titleAccent")}
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-body text-muted-foreground max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
            {t("landing.hero.subtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto min-w-[180px] h-12 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all duration-300"
              asChild
            >
              <Link href="/register">
                {t("landing.hero.getStarted")}
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto min-w-[180px] h-12 text-base border-2 hover:bg-accent/50 transition-all duration-300"
              asChild
            >
              <Link href="/demo">
                <PlayCircle className="mr-1.5 size-4" />
                {t("landing.hero.viewDemo")}
              </Link>
            </Button>
          </div>
        </div>

        {/* Dashboard Preview with device mockup */}
        <div className="mt-20 relative">
          {/* Glow behind the mockup */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[300px] bg-gradient-to-r from-primary/5 via-transparent to-primary/5 blur-3xl" />

          <div className="relative rounded-2xl border border-border/60 overflow-hidden shadow-2xl bg-card">
            {/* Browser chrome */}
            <div className="relative h-10 bg-muted/50 border-b border-border/40 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
              </div>
              <div className="ml-4 text-xs text-muted-foreground/70 font-mono">
                {t("landing.hero.dashboardPreview")}
              </div>
            </div>

            {/* Dashboard content */}
            <div className="bg-card">
              <div className="p-6 md:p-8 grid grid-cols-3 gap-4 md:gap-6">
                {/* Sidebar */}
                <div className="col-span-1 hidden md:flex flex-col gap-2">
                  {[
                    { label: t("landing.hero.sidebar.dashboard"), active: true },
                    { label: t("landing.hero.sidebar.products"), active: false },
                    { label: t("landing.hero.sidebar.suppliers"), active: false },
                    { label: t("landing.hero.sidebar.shipments"), active: false },
                    { label: t("landing.hero.sidebar.certifications"), active: false },
                    { label: t("landing.hero.sidebar.reports"), active: false },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`h-9 rounded-lg border flex items-center px-3 transition-colors ${
                        item.active
                          ? "bg-primary/10 border-primary/20 text-foreground"
                          : "bg-muted/30 border-border/30 text-muted-foreground/60"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full mr-2.5 ${
                          item.active ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                      />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="col-span-3 md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-7 w-36 rounded-md bg-muted/40 border border-border/30" />
                    <div className="h-7 w-24 rounded-md bg-muted/30 border border-border/30" />
                  </div>

                  {/* Stats cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: t("landing.hero.stats.products"), value: "2,847", color: "from-primary/10 to-primary/5", accent: "bg-primary" },
                      { label: t("landing.hero.stats.suppliers"), value: "128", color: "from-emerald-500/10 to-emerald-500/5", accent: "bg-emerald-500" },
                      { label: t("landing.hero.stats.shipments"), value: "493", color: "from-amber-500/10 to-amber-500/5", accent: "bg-amber-500" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className={`rounded-xl border border-border/30 p-3 bg-gradient-to-br ${stat.color}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${stat.accent} mb-2`} />
                        <div className="text-xs text-muted-foreground mb-0.5">{stat.label}</div>
                        <div className="text-xl font-semibold font-display tracking-tight">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Activity table */}
                  <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground">{t("landing.hero.activity.title")}</span>
                      <span className="text-[10px] text-muted-foreground/50">{t("landing.hero.activity.today")}</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: t("landing.hero.activity.newShipment"), time: `2 ${t("landing.hero.activity.minutesAgo")}` },
                        { label: t("landing.hero.activity.certificateExpiring"), time: `1 ${t("landing.hero.activity.hourAgo")}` },
                        { label: t("landing.hero.activity.inventoryAdjusted"), time: `3 ${t("landing.hero.activity.hoursAgo")}` },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3 py-1.5 border-b border-border/10 last:border-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                          <span className="text-xs text-foreground/70 flex-1">{item.label}</span>
                          <span className="text-[10px] text-muted-foreground/50">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
