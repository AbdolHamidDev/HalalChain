"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { navItems } from "@/lib/navigation";
import { useMobileNav } from "@/components/layout/mobile-nav-provider";
import {
  type Notification,
  fetchNotifications,
} from "@/components/layout/notification-bell";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { UserMenu } from "@/components/layout/user-menu";

function useBreadcrumb() {
  const pathname = usePathname();
  const current = navItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href))
  );
  return current?.label ?? "Dashboard";
}

export function DashboardHeader() {
  const pageTitle = useBreadcrumb();
  const { toggle } = useMobileNav();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30_000,
  });

  const notifications: Notification[] = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex h-14 w-full max-w-[1280px] min-w-0 items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={toggle}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-2 text-small">
          <span className="hidden shrink-0 text-muted-foreground sm:inline">
            HalalChain
          </span>
          <Separator
            orientation="vertical"
            className="hidden h-4 sm:block"
          />
          <span className="truncate font-medium text-foreground">
            {pageTitle}
          </span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
          />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
