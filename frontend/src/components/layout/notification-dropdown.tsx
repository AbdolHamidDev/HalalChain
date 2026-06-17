"use client";

import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/hooks";
import { type Notification } from "@/components/layout/notification-bell";

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
}

const typeVariant: Record<
  Notification["type"],
  "warning" | "danger" | "info" | "default"
> = {
  LOW_STOCK: "warning",
  CERTIFICATE_EXPIRING: "danger",
  CERTIFICATE_EXPIRED: "danger",
  SHIPMENT_DELAYED: "info",
  SYSTEM: "default",
  COMPLIANCE_ISSUE: "danger",
  BATCH_EXPIRING: "warning",
};

const typeKeys: Record<Notification["type"], string> = {
  LOW_STOCK: "notifications.types.lowStock",
  CERTIFICATE_EXPIRING: "notifications.types.certificateExpiring",
  CERTIFICATE_EXPIRED: "notifications.types.certificateExpired",
  SHIPMENT_DELAYED: "notifications.types.shipmentDelayed",
  SYSTEM: "notifications.types.system",
  COMPLIANCE_ISSUE: "notifications.types.complianceIssue",
  BATCH_EXPIRING: "notifications.types.batchExpiring",
};

async function markAllRead(): Promise<{ updated: number }> {
  const res = await fetch("/api/notifications/read-all", {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to mark all as read");
  return res.json();
}

export function NotificationDropdown({
  notifications,
  unreadCount,
}: NotificationDropdownProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: markAll, isPending } = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const recent = notifications.slice(0, 10);

  // Guard: ensure t() never receives undefined to prevent split() crash
  function safeT(key: string | undefined): string {
    if (!key) return "";
    return t(key as any);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`${unreadCount} unread notifications`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("notifications.title")}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={() => markAll()}
              disabled={isPending}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              {t("common.markAllRead")}
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {recent.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            {t("notifications.noNotifications")}
          </div>
        ) : (
          recent.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="relative flex cursor-default flex-col items-start gap-1 px-3 py-2.5 focus:bg-accent"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span
                  className={
                    notification.isRead
                      ? "text-sm font-medium text-muted-foreground"
                      : "text-sm font-semibold text-foreground"
                  }
                >
                  {notification.title}
                </span>
                <Badge
                  variant={typeVariant[notification.type]}
                  className="shrink-0 text-[10px]"
                >
                  {safeT(typeKeys[notification.type])}
                </Badge>
              </div>

              <p className="line-clamp-2 text-xs text-muted-foreground">
                {notification.message}
              </p>

              <span className="text-[10px] text-muted-foreground/70">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </span>

              {!notification.isRead && (
                <span className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-blue-500" />
              )}
            </DropdownMenuItem>
          ))
        )}

        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-center">
              <Button variant="ghost" size="sm" className="h-auto text-xs">
                {t("notifications.viewAll")}
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}