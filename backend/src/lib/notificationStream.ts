import { Response } from "express";
import { Notification, NotificationType } from "@prisma/client";
import { randomUUID } from "crypto";

export type NotificationStreamEvent =
  | "notification_created"
  | "notification_read"
  | "certificate_expiring"
  | "certificate_expired"
  | "compliance_issue"
  | "low_stock"
  | "shipment_delayed";

type Client = {
  id: string;
  res: Response;
  heartbeat: NodeJS.Timeout;
};

const clients = new Map<string, Map<string, Client>>();

function send(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function addNotificationClient(userId: string, res: Response): () => void {
  const clientId = randomUUID();
  const heartbeat = setInterval(() => {
    send(res, "heartbeat", { at: new Date().toISOString() });
  }, 25_000);

  const client: Client = { id: clientId, res, heartbeat };
  const userClients = clients.get(userId) ?? new Map<string, Client>();
  userClients.set(clientId, client);
  clients.set(userId, userClients);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  send(res, "connected", { at: new Date().toISOString() });

  return () => {
    clearInterval(heartbeat);
    const current = clients.get(userId);
    current?.delete(clientId);
    if (current?.size === 0) clients.delete(userId);
  };
}

export function publishNotificationEvent(
  userIds: string[],
  event: NotificationStreamEvent,
  payload: unknown
) {
  for (const userId of userIds) {
    const userClients = clients.get(userId);
    if (!userClients) continue;
    for (const client of userClients.values()) {
      send(client.res, event, payload);
    }
  }
}

export function publishCreatedNotifications(notifications: Notification[]) {
  for (const notification of notifications) {
    if (!notification.userId) continue;
    publishNotificationEvent([notification.userId], "notification_created", notification);

    const type = notification.type;
    if (type === NotificationType.LOW_STOCK) {
      publishNotificationEvent([notification.userId], "low_stock", notification);
    } else if (type === NotificationType.CERTIFICATE_EXPIRING) {
      publishNotificationEvent([notification.userId], "certificate_expiring", notification);
    } else if (type === NotificationType.CERTIFICATE_EXPIRED) {
      publishNotificationEvent([notification.userId], "certificate_expired", notification);
    } else if (type === NotificationType.COMPLIANCE_ISSUE) {
      publishNotificationEvent([notification.userId], "compliance_issue", notification);
    } else if (type === NotificationType.SHIPMENT_DELAYED) {
      publishNotificationEvent([notification.userId], "shipment_delayed", notification);
    }
  }
}
