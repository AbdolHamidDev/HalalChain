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
    color: "text-primary bg-primary/10",
  },
  {
    icon: Scan,
    title: "Product Verification",
    description:
      "The public portal displays product origin, batch number, production date, and halal status instantly.",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: ShieldCheck,
    title: "Certificate Validation",
    description:
      "View all attached halal certificates, certifying bodies, and expiry dates with a single click.",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    icon: Route,
    title: "Shipment History",
    description:
      "Track the complete journey from supplier to warehouse to retailer with timestamps and locations.",
    color: "text-sky-500 bg-sky-500/10",
  },
];

export function VerificationDemoSection() {
  return (
    <section className="py-20 md:py-28">
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
              <Card key={step.title} className="border-border/50">
                <CardContent className="p-6 flex gap-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${step.color}`}
                  >
                    <Icon className="size-6" />
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

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" asChild>
            <Link href="/traceability/product/demo">
              Try the demo
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}