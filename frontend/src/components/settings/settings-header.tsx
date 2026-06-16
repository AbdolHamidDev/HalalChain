"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { useTranslation } from "@/i18n/hooks";

export function SettingsHeader() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center gap-3 px-4 sm:px-6">
        <Link href="/dashboard" className="hidden shrink-0 items-center gap-2 md:flex">
          <Image src="/logo.png" alt="HalalChain" width={28} height={28} />
          <span className="text-sm font-semibold text-foreground">HalalChain</span>
        </Link>

        <Separator orientation="vertical" className="hidden h-4 md:block" />

        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("navigation.dashboard")}
        </Link>

        <Separator orientation="vertical" className="h-4" />

        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Settings className="h-4 w-4" />
          <span>{t("settings.pageTitle")}</span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}