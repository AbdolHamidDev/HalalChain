import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container-genesis">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-background/50 text-sm text-muted-foreground mb-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full rounded-full bg-emerald-400 opacity-40 blur-[1px]" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Trusted by halal supply chain businesses
          </div>

          {/* Headline */}
          <h1 className="text-display text-balance mb-6">
            End-to-End Halal Supply Chain{" "}
            <span className="text-primary">Traceability</span>
          </h1>

          {/* Subheadline */}
          <p className="text-body text-muted-foreground max-w-2xl mx-auto mb-10 text-balance">
            Track products, suppliers, certifications, inventory and shipments
            through a unified platform built for modern halal businesses.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto min-w-[180px]" asChild>
              <Link href="/register">
                Get Started
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto min-w-[180px]"
              asChild
            >
              <Link href="/traceability/product/demo">
                <PlayCircle className="mr-1 size-4" />
                View Demo
              </Link>
            </Button>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="relative rounded-2xl border border-border/60 overflow-hidden shadow-2xl">
            <div className="absolute top-0 inset-x-0 h-10 bg-muted/50 border-b border-border/40 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="ml-4 text-xs text-muted-foreground">app.halalchain.io/dashboard</div>
            </div>
            <div className="pt-10 bg-card">
              <div className="p-6 md:p-8 grid grid-cols-3 gap-4 md:gap-6">
                {/* Mock sidebar */}
                <div className="col-span-1 hidden md:flex flex-col gap-3">
                  {["Dashboard", "Products", "Suppliers", "Shipments", "Certifications", "Reports"].map((item) => (
                    <div
                      key={item}
                      className="h-9 rounded-lg bg-muted/50 border border-border/30 flex items-center px-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary/60 mr-2" />
                      <span className="text-xs text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                {/* Mock main content */}
                <div className="col-span-3 md:col-span-2 space-y-4">
                  <div className="h-8 w-48 rounded-lg bg-muted/50 border border-border/30" />
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Products", value: "2,847", color: "bg-primary/10" },
                      { label: "Suppliers", value: "128", color: "bg-emerald-500/10" },
                      { label: "Shipments", value: "493", color: "bg-amber-500/10" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className={`rounded-xl border border-border/30 p-3 ${stat.color}`}
                      >
                        <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                        <div className="text-xl font-semibold font-display">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="h-40 rounded-xl border border-border/30 bg-muted/20 p-4">
                    <div className="text-xs text-muted-foreground mb-3">Recent Activity</div>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        <div className="flex-1 h-3 rounded bg-muted/40" />
                        <div className="w-16 h-3 rounded bg-muted/30" />
                      </div>
                    ))}
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