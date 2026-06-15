"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, ScrollText, Users, ShieldCheck, QrCode, FileSpreadsheet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Stat {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix: string;
  gradient: string;
}

const stats: Stat[] = [
  { icon: Bell, label: "Real-time Notifications", value: 100, suffix: "%", gradient: "from-primary/20 via-primary/5 to-transparent" },
  { icon: ScrollText, label: "Audit Logging", value: 100, suffix: "%", gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent" },
  { icon: Users, label: "Multi-role Access", value: 5, suffix: "+ roles", gradient: "from-amber-500/20 via-amber-500/5 to-transparent" },
  { icon: ShieldCheck, label: "Secure Authentication", value: 100, suffix: "%", gradient: "from-sky-500/20 via-sky-500/5 to-transparent" },
  { icon: QrCode, label: "QR Verification", value: 100, suffix: "%", gradient: "from-violet-500/20 via-violet-500/5 to-transparent" },
  { icon: FileSpreadsheet, label: "Reporting Exports", value: 5, suffix: "+ formats", gradient: "from-rose-500/20 via-rose-500/5 to-transparent" },
];

function AnimatedCounter({ value, suffix, duration = 2000 }: { value: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <div ref={ref} className="text-3xl md:text-4xl font-display font-bold tracking-tight">
      {count}
      {suffix}
    </div>
  );
}

export function StatsSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-genesis">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-section mb-4">
            Enterprise-grade platform capabilities
          </h2>
          <p className="text-body text-muted-foreground">
            Built for businesses that require complete visibility and control
            over their halal supply chain operations.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="group relative overflow-hidden border-border/50 hover:border-border transition-all duration-300"
              >
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${stat.gradient}`}
                />
                <CardContent className="relative p-6 space-y-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all duration-300">
                    <Icon className="size-6" />
                  </div>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}