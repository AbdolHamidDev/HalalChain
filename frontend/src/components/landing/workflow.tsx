import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const steps = [
  { label: "Supplier", description: "Register and verify halal-certified suppliers", color: "from-primary to-primary/60" },
  { label: "Product", description: "Log products with batch numbers and ingredients", color: "from-emerald-500 to-emerald-400" },
  { label: "Certification", description: "Attach halal certificates and track expiry", color: "from-amber-500 to-amber-400" },
  { label: "Warehouse", description: "Manage inventory across multiple locations", color: "from-sky-500 to-sky-400" },
  { label: "Shipment", description: "Track shipments with real-time status updates", color: "from-violet-500 to-violet-400" },
  { label: "Consumer", description: "End customers verify authenticity via QR code", color: "from-rose-500 to-rose-400" },
];

export function WorkflowSection() {
  return (
    <section id="workflow" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-muted/30" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container-genesis">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-section mb-4">How HalalChain Works</h2>
          <p className="text-body text-muted-foreground">
            From supplier registration to consumer verification, every step is
            tracked and recorded on an immutable audit trail.
          </p>
        </div>

        {/* Premium Workflow Visualization */}
        <div className="relative max-w-5xl mx-auto">
          {/* Main connecting path */}
          <div className="hidden lg:block absolute top-12 left-[calc(8.33%+24px)] right-[calc(8.33%+24px)] h-[2px] bg-gradient-to-r from-primary via-emerald-500 via-amber-500 via-sky-500 via-violet-500 to-rose-500 opacity-50" />
          {/* Glow under the line */}
          <div className="hidden lg:block absolute top-12 left-[calc(8.33%+24px)] right-[calc(8.33%+24px)] h-8 bg-gradient-to-r from-primary/10 via-emerald-500/10 via-amber-500/10 via-sky-500/10 via-violet-500/10 to-rose-500/10 blur-xl -translate-y-1/2" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {steps.map((step, index) => (
              <div key={step.label} className="relative flex flex-col items-center">
                {/* Step circle */}
                <div className="relative mb-4">
                  {/* Outer ring glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-full blur-md opacity-30 scale-125`} />
                  <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${step.color} shadow-lg flex items-center justify-center`}>
                    <span className="text-white text-lg font-bold font-display">{index + 1}</span>
                  </div>
                  {/* Arrow connector */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-[calc(50%+32px)] top-1/2 -translate-y-1/2">
                      <ArrowRight className="size-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <Card className="w-full border-border/40 bg-background/80 backdrop-blur-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-4 text-center space-y-2">
                    <h3 className="font-display text-sm font-semibold tracking-tight">
                      {step.label}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Explanation card */}
        <div className="mt-16 max-w-3xl mx-auto">
          <Card className="border-border/40 bg-background/80 backdrop-blur-sm">
            <CardContent className="p-6 md:p-8 space-y-4">
              <h3 className="font-display text-subhead">
                Full supply chain transparency
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  HalalChain creates a digital thread connecting every entity in
                  your supply chain. Each product batch receives a unique
                  identifier that follows it from raw materials to the end
                  consumer.
                </p>
                <p>
                  Suppliers are onboarded with verified halal certifications.
                  Products are logged with complete ingredient lists and
                  processing methods. Certifications are attached digitally and
                  monitored for expiry.
                </p>
                <p>
                  Warehouse operators scan incoming and outgoing shipments,
                  updating inventory in real-time. When products ship, customers
                  receive tracking information and can verify authenticity by
                  scanning the QR code on the packaging.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}