import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, Globe, Server, Database, Mail, Bell, Cloud } from "lucide-react";

interface ArchNode {
  icon: typeof Server;
  label: string;
  subtitle: string;
  color: string;
}

const mainStack: ArchNode[] = [
  { icon: Globe, label: "Next.js", subtitle: "Frontend & SSR", color: "text-primary bg-primary/10" },
  { icon: Server, label: "Express API", subtitle: "RESTful backend", color: "text-emerald-500 bg-emerald-500/10" },
  { icon: Database, label: "Prisma ORM", subtitle: "Type-safe queries", color: "text-amber-500 bg-amber-500/10" },
  { icon: Database, label: "PostgreSQL", subtitle: "Relational database", color: "text-sky-500 bg-sky-500/10" },
];

const externalServices = [
  { icon: Cloud, label: "Cloudinary", description: "Media & file uploads" },
  { icon: Mail, label: "Resend", description: "Email notifications" },
  { icon: Bell, label: "SSE Notifications", description: "Real-time updates" },
];

export function ArchitectureSection() {
  return (
    <section id="architecture" className="py-20 md:py-28 bg-muted/30">
      <div className="container-genesis">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-section mb-4">Platform Architecture</h2>
          <p className="text-body text-muted-foreground">
            Built on a modern, scalable stack designed for performance and reliability.
          </p>
        </div>

        {/* Main Stack */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {mainStack.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="relative">
                <Card className="border-border/50 bg-background h-full">
                  <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                      <Icon className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-semibold">{item.label}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                    </div>
                  </CardContent>
                </Card>
                {/* Arrow connector (hidden on small screens) */}
                {index < mainStack.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowDown className="size-5 text-muted-foreground/40 rotate-[-90deg]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* External Services */}
        <div className="max-w-3xl mx-auto">
          <h3 className="font-display text-base font-semibold tracking-tight text-center mb-6">
            External Services
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {externalServices.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.label} className="border-border/50 bg-background">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{service.label}</h4>
                      <p className="text-xs text-muted-foreground">{service.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}