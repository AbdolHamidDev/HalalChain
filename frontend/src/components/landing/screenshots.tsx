"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    title: "Dashboard Analytics",
    description: "Comprehensive overview of your supply chain operations",
    gradient: "from-primary/20 via-primary/5 to-background",
  },
  {
    title: "Product Management",
    description: "Manage products with batch tracking and halal status",
    gradient: "from-emerald-500/20 via-emerald-500/5 to-background",
  },
  {
    title: "Supplier Portal",
    description: "Supplier profiles, certifications, and performance metrics",
    gradient: "from-amber-500/20 via-amber-500/5 to-background",
  },
  {
    title: "Shipment Tracking",
    description: "Real-time shipment monitoring with status updates",
    gradient: "from-sky-500/20 via-sky-500/5 to-background",
  },
];

export function ScreenshotsSection() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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
    <section className="py-20 md:py-28 bg-muted/30">
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
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Slide */}
            <div
              className="relative overflow-hidden rounded-2xl border border-border/60 shadow-xl bg-card"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              {/* Browser chrome */}
              <div className="h-10 bg-muted/50 border-b border-border/40 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="ml-4 text-xs text-muted-foreground">app.halalchain.io</div>
              </div>
              {/* Content area */}
              <div className={`aspect-video bg-gradient-to-br ${slides[current].gradient} flex items-center justify-center p-8 md:p-12`}>
                <div className="text-center max-w-md">
                  <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-3">
                    {slides[current].title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {slides[current].description}
                  </p>
                </div>
              </div>
              {/* Navigation arrows */}
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 border border-border/50 flex items-center justify-center hover:bg-background transition-colors shadow-sm"
                aria-label="Previous slide"
              >
                <ChevronLeft className="size-5 text-muted-foreground" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 border border-border/50 flex items-center justify-center hover:bg-background transition-colors shadow-sm"
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
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === current
                      ? "bg-primary w-6"
                      : "bg-border hover:bg-muted-foreground/40"
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