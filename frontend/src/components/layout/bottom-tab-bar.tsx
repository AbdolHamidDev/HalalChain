"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Warehouse,
  Package,
  Truck,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/hooks";
import { useAuth } from "@/components/providers/auth-provider";
import { hapticImpact, hapticSelection } from "@/lib/haptics";

interface TabItem {
  href: string;
  label: string;
  translationKey: string;
  icon: LucideIcon;
}

function getTabsForRole(role: string): TabItem[] {
  const baseTabs: TabItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      translationKey: "navigation.dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/inventory",
      label: "Inventory",
      translationKey: "navigation.inventory",
      icon: Warehouse,
    },
    {
      href: "/dashboard/products",
      label: "Products",
      translationKey: "navigation.products",
      icon: Package,
    },
  ];

  if (role === "ADMIN" || role === "MANAGER") {
    baseTabs.push({
      href: "/dashboard/shipments",
      label: "Shipments",
      translationKey: "navigation.shipments",
      icon: Truck,
    });
  }

  baseTabs.push({
    href: "/dashboard/settings",
    label: "Settings",
    translationKey: "navigation.settings",
    icon: Settings,
  });

  return baseTabs;
}

export function BottomTabBar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user } = useAuth();
  const tabs = user ? getTabsForRole(user.role) : getTabsForRole("STAFF");
  const indicatorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapTime = useRef<Map<string, number>>(new Map());

  // Animate the active indicator
  useEffect(() => {
    if (!containerRef.current || !indicatorRef.current) return;
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>("button[data-tab]");
    const activeIndex = tabs.findIndex(
      (tab) =>
        pathname === tab.href ||
        (tab.href !== "/dashboard" && pathname.startsWith(tab.href))
    );
    if (activeIndex >= 0 && buttons[activeIndex]) {
      const btn = buttons[activeIndex];
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      indicatorRef.current.style.width = `${btnRect.width * 0.5}px`;
      indicatorRef.current.style.left = `${btnRect.left - containerRect.left + btnRect.width * 0.25}px`;
    }
  }, [pathname, tabs]);

  const handleTabTap = useCallback(
    (href: string, active: boolean) => {
      const now = Date.now();
      const lastTap = lastTapTime.current.get(href) ?? 0;
      lastTapTime.current.set(href, now);

      // Double-tap detected and already on this tab → scroll to top
      if (active && now - lastTap < 300) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        hapticImpact();
      } else if (!active) {
        hapticSelection();
      }
    },
    []
  );

  return (
    <nav
      className="fixed bottom-0 z-40 lg:hidden border-t border-border bg-background/80 backdrop-blur-xl w-full max-w-full"
      style={{
        left: "env(safe-area-inset-left, 0px)",
        right: "env(safe-area-inset-right, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div ref={containerRef} className="relative flex items-center justify-around px-2 pt-1.5 pb-1.5">
        {/* Animated active indicator */}
        <div
          ref={indicatorRef}
          className="absolute top-0 h-0.5 rounded-full bg-primary transition-all duration-300 ease-out"
        />
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            pathname === tab.href ||
            (tab.href !== "/dashboard" && pathname.startsWith(tab.href));

          return (
            <Link key={tab.href} href={tab.href} className="flex-1">
              <button
                type="button"
                data-tab
                onClick={() => handleTabTap(tab.href, active)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1 w-full min-h-[48px]",
                  "transition-colors duration-200",
                  active
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    active ? "stroke-[2.2px]" : "stroke-[1.5px]"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] leading-tight transition-all duration-200",
                    active ? "font-semibold" : "font-medium"
                  )}
                >
                  {t(tab.translationKey)}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}