"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/i18n/hooks";

export function LandingFooter() {
  const { t } = useTranslation();

  const footerLinks = {
    [t("landing.footer.product")]: [
      { label: t("landing.footer.features"), href: "#features" },
      { label: t("landing.footer.workflow"), href: "#workflow" },
      { label: t("landing.footer.architecture"), href: "#architecture" },
      { label: t("landing.footer.techStack"), href: "#tech-stack" },
    ],
    [t("landing.footer.resources")]: [
      { label: t("landing.footer.apiDocs"), href: "/api-docs" },
      { label: t("landing.footer.traceabilityDemo"), href: "/traceability/product/00000000-0000-4000-8000-000000000001" },
      { label: t("landing.footer.status"), href: "#" },
    ],
    [t("landing.footer.company")]: [
      { label: t("landing.footer.about"), href: "#" },
      { label: t("landing.footer.privacy"), href: "#" },
      { label: t("landing.footer.terms"), href: "#" },
    ],
  };

  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="container-genesis py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden ring-1 ring-border/50">
                <Image
                  src="/icon1.png"
                  alt="HalalChain"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="font-display text-base font-bold tracking-tight">
                Halal<span className="text-primary">Chain</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              {t("landing.footer.description")}
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
            &copy; {new Date().getFullYear()} HalalChain. {t("landing.footer.copyright")}
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.footer.privacyPolicy")}
            </Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.footer.termsOfService")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}