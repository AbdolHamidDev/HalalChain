import { Card, CardContent } from "@/components/ui/card";

const steps = [
  { label: "Supplier", description: "Register and verify halal-certified suppliers", color: "bg-primary" },
  { label: "Product", description: "Log products with batch numbers and ingredients", color: "bg-emerald-500" },
  { label: "Certification", description: "Attach halal certificates and track expiry", color: "bg-amber-500" },
  { label: "Warehouse", description: "Manage inventory across multiple locations", color: "bg-sky-500" },
  { label: "Shipment", description: "Track shipments with real-time status updates", color: "bg-violet-500" },
  { label: "Consumer", description: "End customers verify authenticity via QR code", color: "bg-rose-500" },
];

export function WorkflowSection() {
  return (
    <section id="workflow" className="py-20 md:py-28 bg-muted/30">
      <div className="container-genesis">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-section mb-4">How HalalChain Works</h2>
          <p className="text-body text-muted-foreground">
            From supplier registration to consumer verification, every step is
            tracked and recorded on an immutable audit trail.
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-12 left-[calc(8.33%+24px)] right-[calc(8.33%+24px)] h-0.5 bg-gradient-to-r from-primary via-emerald-500 via-amber-500 via-sky-500 via-violet-500 to-rose-500" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {steps.map((step, index) => {
              return (
                <Card
                  key={step.label}
                  className="relative border-border/50 bg-background"
                >
                  <CardContent className="p-5 text-center space-y-3">
                    {/* Step Number */}
                    <div
                      className={`mx-auto w-10 h-10 rounded-full ${step.color} text-white flex items-center justify-center text-sm font-bold relative z-10`}
                    >
                      {index + 1}
                    </div>
                    <h3 className="font-display text-sm font-semibold tracking-tight">
                      {step.label}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-16 max-w-3xl mx-auto">
          <Card className="border-border/50 bg-background">
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