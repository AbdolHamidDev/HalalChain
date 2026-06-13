"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { navItems } from "@/lib/navigation";
import {
  type Notification,
  fetchNotifications,
} from "@/components/layout/notification-bell";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";

function useBreadcrumb() {
  const pathname = usePathname();
  const current = navItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href))
  );
  return current?.label ?? "Dashboard";
}

const roleColors: Record<string, "success" | "info" | "secondary"> = {
  ADMIN: "success",
  MANAGER: "info",
  STAFF: "secondary",
};

export function DashboardHeader() {
  const { user } = useAuth();
  const pageTitle = useBreadcrumb();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30_000,
  });

  const notifications: Notification[] = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-10 -mx-8 -mt-8 mb-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">HalalChain</span>
          <Separator orientation="vertical" className="h-4" />
          <span className="font-medium text-foreground">{pageTitle}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {user && (
            <Badge variant={roleColors[user.role] ?? "secondary"}>
              {user.role}
            </Badge>
          )}
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
          />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
