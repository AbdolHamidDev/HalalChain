"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { type Notification, type PaginatedResponse } from "@/lib/api";

type NotificationEvent =
  | "notification_created"
  | "notification_read"
  | "certificate_expiring"
  | "low_stock"
  | "shipment_delayed";

function isNotification(value: unknown): value is Notification {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "title" in value &&
    "message" in value &&
    "isRead" in value
  );
}

export function useNotificationStream(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const source = new EventSource("/api/notifications/stream", {
      withCredentials: true,
    });

    const upsertNotification = (notification: Notification) => {
      queryClient.setQueryData<{ notifications: Notification[]; page?: number; limit?: number; total?: number; totalPages?: number }>(
        ["notifications"],
        (current) => {
          const notifications = current?.notifications ?? [];
          const exists = notifications.some((item) => item.id === notification.id);
          return {
            ...current,
            notifications: exists
              ? notifications.map((item) => (item.id === notification.id ? notification : item))
              : [notification, ...notifications],
          };
        }
      );

      queryClient.setQueryData<PaginatedResponse<Notification>>(
        ["notifications", "paginated"],
        (current) =>
          current
            ? {
                ...current,
                data: current.data.some((item) => item.id === notification.id)
                  ? current.data.map((item) => (item.id === notification.id ? notification : item))
                  : [notification, ...current.data],
                total: current.total + (current.data.some((item) => item.id === notification.id) ? 0 : 1),
              }
            : current
      );
    };

    const markRead = (payload: unknown) => {
      queryClient.setQueryData<{ notifications: Notification[] }>(["notifications"], (current) => {
        if (!current) return current;
        if (typeof payload === "object" && payload !== null && "scope" in payload) {
          return { ...current, notifications: current.notifications.map((item) => ({ ...item, isRead: true })) };
        }
        if (!isNotification(payload)) return current;
        return {
          ...current,
          notifications: current.notifications.map((item) =>
            item.id === payload.id ? { ...item, isRead: true } : item
          ),
        };
      });
    };

    const handleCreated = (event: MessageEvent<string>) => {
      const parsed = JSON.parse(event.data) as unknown;
      if (isNotification(parsed)) upsertNotification(parsed);
    };

    const handleRead = (event: MessageEvent<string>) => {
      markRead(JSON.parse(event.data) as unknown);
    };

    const eventNames: NotificationEvent[] = [
      "notification_created",
      "certificate_expiring",
      "low_stock",
      "shipment_delayed",
    ];

    eventNames.forEach((eventName) => source.addEventListener(eventName, handleCreated));
    source.addEventListener("notification_read", handleRead);
    source.onerror = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    return () => {
      eventNames.forEach((eventName) => source.removeEventListener(eventName, handleCreated));
      source.removeEventListener("notification_read", handleRead);
      source.close();
    };
  }, [enabled, queryClient]);
}
