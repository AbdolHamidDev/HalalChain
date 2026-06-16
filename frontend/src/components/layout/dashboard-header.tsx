"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { navItems } from "@/lib/navigation";
import { useNotificationStream } from "@/lib/useNotificationStream";
import { useMobileNav } from "@/components/layout/mobile-nav-provider";
import { useSidebar } from "@/components/layout/sidebar-provider";
import { useTranslation } from "@/i18n/hooks";
import {
  type Notification,
  fetchNotifications,
} from "@/components/layout/notification-bell";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { UserMenu } from "@/components/layout/user-menu";

function useBreadcrumb() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const current = navItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href))
  );
  return current ? t(current.translationKey) : t("navigation.dashboard");
}

export function DashboardHeader() {
  const pageTitle = useBreadcrumb();
  const { toggle } = useMobileNav();
  const { collapsed, toggle: toggleSidebar } = useSidebar();
  useNotificationStream();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 30_000,
  });

  const notifications: Notification[] = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex h-12 w-full min-w-0 items-center gap-2 px-4 sm:gap-3 sm:px-5">
        {/* Mobile: hamburger menu */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={toggle}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Desktop: sidebar collapse toggle */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 hidden lg:flex h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-2 text-small">
          <Separator
            orientation="vertical"
            className="hidden h-4 sm:block bg-sidebar-border"
          />
          <span className="truncate font-medium text-sidebar-accent-foreground">
            {pageTitle}
          </span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
          />
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}