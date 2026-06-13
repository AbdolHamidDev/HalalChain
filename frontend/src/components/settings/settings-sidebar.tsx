"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Profile", href: "/settings/profile" },
  { label: "Security", href: "/settings/security" },
  { label: "Preferences", href: "/settings/preferences" },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm transition-colors duration-150",
              active
                ? "bg-accent font-semibold text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SettingsSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile overlay when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when overlay is open
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
      {/* Desktop sidebar — visible on md and above */}
      <aside className="hidden md:block w-[220px] shrink-0 border-r border-border">
        <div className="sticky top-0 pt-6">
          <p className="px-6 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Settings
          </p>
          <SidebarNav />
        </div>
      </aside>

      {/* Mobile: hamburger button */}
      <button
        type="button"
        aria-label="Open settings menu"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background shadow-sm md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile: backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Close settings menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile: sidebar panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[220px] bg-background shadow-lg transition-transform duration-200 ease-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-semibold">Settings</span>
          <button
            type="button"
            aria-label="Close settings menu"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </div>
    </>
  );
}
