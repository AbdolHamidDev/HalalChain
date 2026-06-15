"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/hooks";

export function LandingHeader() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { label: t("landing.header.features"), href: "#features" },
    { label: t("landing.header.workflow"), href: "#workflow" },
    { label: t("landing.header.architecture"), href: "#architecture" },
    { label: t("landing.header.techStack"), href: "#tech-stack" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container-genesis flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden ring-1 ring-border/50">
            <Image
              src="/icon1.png"
              alt="HalalChain"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            Halal<span className="text-primary">Chain</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">{t("landing.header.signIn")}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">{t("landing.header.getStarted")}</Link>
            </Button>
          </div>
          <button
            className="md:hidden p-2 -mr-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setOpen(!open)}
            aria-label={t("landing.header.toggleMenu")}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div
        className={cn(
          "md:hidden border-t border-border/40 overflow-hidden transition-all duration-300",
          open ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="container-genesis py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Button variant="ghost" size="sm" asChild className="w-full justify-center">
              <Link href="/login">{t("landing.header.signIn")}</Link>
            </Button>
            <Button size="sm" asChild className="w-full justify-center">
              <Link href="/register">{t("landing.header.getStarted")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
