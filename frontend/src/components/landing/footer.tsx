import Link from "next/link";
import { Hexagon } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Workflow", href: "#workflow" },
    { label: "Architecture", href: "#architecture" },
    { label: "Tech Stack", href: "#tech-stack" },
  ],
  Resources: [
    { label: "Documentation", href: "/api-docs" },
    { label: "API Reference", href: "/api-docs" },
    { label: "Status", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
};

export function LandingFooter() {
  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="container-genesis py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
                <Hexagon className="size-4" />
              </div>
              <span className="font-display text-base font-bold tracking-tight">
                Halal<span className="text-primary">Chain</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              End-to-end halal supply chain traceability platform for modern
              halal businesses.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} HalalChain. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}