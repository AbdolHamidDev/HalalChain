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
import { type Notification } from "@/components/layout/notification-bell";

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
}

const typeVariant: Record<
  Notification["type"],
  "warning" | "danger" | "info" | "secondary"
> = {
  LOW_STOCK: "warning",
  CERTIFICATE_EXPIRING: "danger",
  SHIPMENT_DELAYED: "info",
  SYSTEM: "secondary",
};

const typeLabel: Record<Notification["type"], string> = {
  LOW_STOCK: "Low Stock",
  CERTIFICATE_EXPIRING: "Cert Expiring",
  SHIPMENT_DELAYED: "Delayed",
  SYSTEM: "System",
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
  const queryClient = useQueryClient();

  const { mutate: markAll, isPending } = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Show only the 10 most recent
  const recent = notifications.slice(0, 10);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="px-0 py-0">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({unreadCount} unread)
              </span>
            )}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                markAll();
              }}
              disabled={isPending}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all as read
            </button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Notification items */}
        {recent.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          recent.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="relative flex cursor-default flex-col items-start gap-1 px-3 py-2.5 focus:bg-accent"
            >
              {/* Title row */}
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
                  {typeLabel[notification.type]}
                </Badge>
              </div>

              {/* Message */}
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {notification.message}
              </p>

              {/* Relative timestamp using date-fns */}
              <span className="text-[10px] text-muted-foreground/70">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </span>

              {/* Unread dot indicator */}
              {!notification.isRead && (
                <span className="absolute right-2 top-3 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
