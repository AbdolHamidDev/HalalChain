"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle, LayoutDashboard, Shield } from "lucide-react";
import { useTranslation } from "@/i18n/hooks";
import { useAuth } from "@/components/providers/auth-provider";

export function CTASection() {
  const { t } = useTranslation();
  const { user, loginDemo } = useAuth();

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container-genesis">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-headline text-balance mb-6">
            {t("landing.cta.title")}{" "}
            <span className="text-primary">{t("landing.cta.titleAccent")}</span>{" "}
            {t("landing.cta.titleSuffix")}
          </h2>
          <p className="text-body text-muted-foreground max-w-xl mx-auto mb-10 text-balance">
            {t("landing.cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Button size="lg" className="w-full sm:w-auto min-w-[200px]" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 size-4" />
                  {t("landing.header.dashboard")}
                </Link>
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto min-w-[200px]" 
                  onClick={() => loginDemo("demo-admin@halalchain.local", "demo-admin-2024")}
                >
                  <Shield className="mr-2 size-4" />
                  Try Demo Admin
                </Button>
                <Button size="lg" className="w-full sm:w-auto min-w-[200px]" asChild>
                  <Link href="/demo">
                    <PlayCircle className="mr-2 size-4" />
                    QR Code Demo
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto min-w-[200px]"
                  asChild
                >
                  <Link href="/login">
                    {t("landing.cta.signIn")}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}