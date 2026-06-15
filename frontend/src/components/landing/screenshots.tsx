"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    title: "Dashboard Analytics",
    description: "Comprehensive overview of your supply chain operations",
    src: "/screenshots/dashboard.png",
    gradient: "from-primary/10 via-primary/5 to-background",
  },
  {
    title: "Product Management",
    description: "Manage products with batch tracking and halal status",
    src: "/screenshots/inventory.png",
    gradient: "from-emerald-500/10 via-emerald-500/5 to-background",
  },
  {
    title: "Traceability Portal",
    description: "Public-facing product verification with full supply chain timeline",
    src: "/screenshots/traceability.png",
    gradient: "from-amber-500/10 via-amber-500/5 to-background",
  },
  {
    title: "User Management",
    description: "Role-based access control with detailed permissions",
    src: "/screenshots/users.png",
    gradient: "from-sky-500/10 via-sky-500/5 to-background",
  },
];

export function ScreenshotsSection() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, next]);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-muted/30">
      <div className="container-genesis">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-section mb-4">
            See HalalChain in action
          </h2>
          <p className="text-body text-muted-foreground">
            {`A glimpse into the platform's intuitive interface and powerful features.`}
          </p>
        </div>

        {/* Carousel */}
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            <div
              className="relative overflow-hidden rounded-2xl border border-border/60 shadow-xl bg-card"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              {/* Browser chrome */}
              <div className="relative h-11 bg-muted/50 border-b border-border/40 flex items-center px-5 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="ml-4 text-xs text-muted-foreground/70 font-mono">
                  app.halalchain.io
                </div>
              </div>

              {/* Screenshot/Content area */}
              <div className={`aspect-video bg-gradient-to-br ${slides[current].gradient} relative flex items-center justify-center overflow-hidden`}>
                {imageErrors[current] ? (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                      <div className="w-6 h-6 rounded bg-muted-foreground/30" />
                    </div>
                    <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-3">
                      {slides[current].title}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      {slides[current].description}
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-4">
                      TODO: Replace with actual screenshot
                    </p>
                  </div>
                ) : (
                  <Image
                    src={slides[current].src}
                    alt={slides[current].title}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    priority={current === 0}
                    onError={() => setImageErrors((prev) => ({ ...prev, [current]: true }))}
                  />
                )}
              </div>

              {/* Navigation arrows */}
              <button
                onClick={prev}
                className="absolute left-3 top-[calc(50%+5px)] -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 border border-border/50 flex items-center justify-center hover:bg-background transition-colors shadow-sm backdrop-blur-sm"
                aria-label="Previous slide"
              >
                <ChevronLeft className="size-5 text-muted-foreground" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-[calc(50%+5px)] -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 border border-border/50 flex items-center justify-center hover:bg-background transition-colors shadow-sm backdrop-blur-sm"
                aria-label="Next slide"
              >
                <ChevronRight className="size-5 text-muted-foreground" />
              </button>
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    index === current
                      ? "bg-primary w-8 h-2"
                      : "bg-border h-2 w-2 hover:bg-muted-foreground/40"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}