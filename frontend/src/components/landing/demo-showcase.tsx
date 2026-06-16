"use client";

import { useState } from "react";
import Image from "next/image";
import { PlayCircle, Maximize2, Monitor } from "lucide-react";
import { useTranslation } from "@/i18n/hooks";

export function DemoShowcaseSection() {
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-primary/[0.04] rounded-full blur-[100px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="container-genesis">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-gradient-to-r from-primary/[0.04] to-transparent text-sm text-muted-foreground mb-6 backdrop-blur-sm">
            <Monitor className="size-3.5" />
            <span>{t("landing.demoShowcase.badge")}</span>
          </div>
          <h2 className="text-section mb-4">
            {t("landing.demoShowcase.title")}
          </h2>
          <p className="text-body text-muted-foreground">
            {t("landing.demoShowcase.subtitle")}
          </p>
        </div>

        {/* Demo GIF Showcase */}
        <div className="max-w-5xl mx-auto">
          <div className="relative group">
            {/* Glow behind the browser frame */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-[20px] blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Browser chrome frame */}
            <div className="relative rounded-2xl border border-border/60 shadow-2xl bg-card overflow-hidden">
              {/* Top bar */}
              <div className="relative h-11 bg-muted/50 border-b border-border/40 flex items-center px-5 gap-2">
                {/* Traffic lights */}
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80 hover:bg-red-500 transition-colors" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80 hover:bg-amber-500 transition-colors" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80 hover:bg-emerald-500 transition-colors" />
                </div>

                {/* URL bar */}
                <div className="ml-4 flex-1 max-w-md">
                  <div className="h-7 rounded-lg bg-background/60 border border-border/30 flex items-center px-3 gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                    <span className="text-xs text-muted-foreground/60 font-mono truncate">
                      app.halalchain.io/dashboard
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    className="p-1.5 rounded-md hover:bg-muted/60 transition-colors"
                    aria-label="Fullscreen demo"
                  >
                    <Maximize2 className="size-3.5 text-muted-foreground/50" />
                  </button>
                </div>
              </div>

              {/* GIF Content */}
              <div className="relative aspect-[16/9] bg-gradient-to-br from-muted/30 via-background to-muted/20">
                {/* Loading shimmer */}
                {!isLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                      <span className="text-xs text-muted-foreground/50">
                        {t("landing.demoShowcase.loading")}
                      </span>
                    </div>
                  </div>
                )}

                <Image
                  src="/demo/demo.gif"
                  alt={t("landing.demoShowcase.alt")}
                  fill
                  className={`object-contain transition-opacity duration-500 ${
                    isLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  priority
                  unoptimized
                  onLoad={() => setIsLoaded(true)}
                />
              </div>

              {/* Bottom info bar */}
              <div className="h-10 bg-muted/30 border-t border-border/30 flex items-center justify-between px-5">
                <div className="flex items-center gap-2">
                  <PlayCircle className="size-3.5 text-primary/60" />
                  <span className="text-[11px] text-muted-foreground/50 font-medium">
                    {t("landing.demoShowcase.footerLabel")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-muted-foreground/50">
                    {t("landing.demoShowcase.liveLabel")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Caption below */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground/60">
              {t("landing.demoShowcase.caption")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}