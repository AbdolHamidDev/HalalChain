"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  BellRing,
  KeyRound,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/hooks";

const settingsNavItems = [
  { labelKey: "settings.navigation.profile", href: "/settings/profile", icon: User },
  { labelKey: "settings.navigation.security", href: "/settings/security", icon: KeyRound },
  { labelKey: "settings.navigation.preferences", href: "/settings/preferences", icon: Bell },
  { labelKey: "settings.navigation.notifications", href: "/settings/notifications", icon: BellRing },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="p-3 pb-1">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent/50 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span>{t("navigation.dashboard")}</span>
        </Link>
      </div>

      <div className="mx-4 my-2 border-t border-border" />

      <nav className="flex flex-col gap-1 p-3 pt-0">
        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {t("settings.pageTitle")}
        </p>
        {settingsNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150",
                active
                  ? "bg-accent font-semibold text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(item.labelKey as any)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function SettingsSidebar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-border">
        <div className="sticky top-0 pt-4">
          <SidebarContent />
        </div>
      </aside>

      <button
        type="button"
        aria-label={t("common.openMenu")}
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background shadow-sm md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <button
          type="button"
          aria-label={t("common.closeMenu")}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[220px] bg-background shadow-lg transition-transform duration-200 ease-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{t("settings.pageTitle")}</span>
          </div>
          <button
            type="button"
            aria-label={t("common.closeMenu")}
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </div>
    </>
  );
}