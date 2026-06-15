import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Scan, ShieldCheck, Route, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: QrCode,
    title: "QR Code Scanning",
    description:
      "Each product has a unique QR code printed on packaging. Consumers scan it with any smartphone camera.",
    color: "from-primary/20 to-primary/5",
    accent: "bg-primary",
  },
  {
    icon: Scan,
    title: "Product Verification",
    description:
      "The public portal displays product origin, batch number, production date, and halal status instantly.",
    color: "from-emerald-500/20 to-emerald-500/5",
    accent: "bg-emerald-500",
  },
  {
    icon: ShieldCheck,
    title: "Certificate Validation",
    description:
      "View all attached halal certificates, certifying bodies, and expiry dates with a single click.",
    color: "from-amber-500/20 to-amber-500/5",
    accent: "bg-amber-500",
  },
  {
    icon: Route,
    title: "Shipment History",
    description:
      "Track the complete journey from supplier to warehouse to retailer with timestamps and locations.",
    color: "from-sky-500/20 to-sky-500/5",
    accent: "bg-sky-500",
  },
];

export function VerificationDemoSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="container-genesis">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-section mb-4">
            Public Product Verification
          </h2>
          <p className="text-body text-muted-foreground">
            End consumers can verify product authenticity instantly by scanning
            the QR code on packaging. No account required.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 gap-5 mb-12">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="group border-border/40 bg-background/50 backdrop-blur-sm hover:shadow-lg transition-all duration-500">
                <CardContent className="p-6 flex gap-5">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="size-5 text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display text-base font-semibold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
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
            Try it now with a real seeded product from our database
          </p>
          <Button size="lg" className="h-12 text-base shadow-lg shadow-primary/20" asChild>
            <Link href="/demo">
              Verify Organic Coconut Milk
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}