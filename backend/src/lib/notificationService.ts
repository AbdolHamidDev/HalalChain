import { PrismaClient, UserRole, NotificationType } from "@prisma/client";
import {
  dispatchCertExpiringEmails,
  dispatchCertExpiredEmails,
  dispatchLowStockEmails,
  dispatchShipmentDelayedEmails,
} from "./emailService";
import { publishCreatedNotifications } from "./notificationStream";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

async function getManagerAndAdminUserIds(tx: TxClient): Promise<string[]> {
  const users = await tx.user.findMany({
    where: { role: { in: [UserRole.MANAGER, UserRole.ADMIN] } },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export async function notifyLowStock(
  tx: TxClient,
  params: {
    inventoryId: string;
    productName: string;
    sku: string;
    warehouseName: string;
    quantity: number;
    reorderLevel: number;
  }
): Promise<void> {
  // Kiểm tra duplicate trong cùng ngày
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existingToday = await tx.notification.findFirst({
    where: {
      type: NotificationType.LOW_STOCK,
      message: { contains: params.inventoryId },
      createdAt: { gte: today },
    },
  });
  if (existingToday) return;

  const userIds = await getManagerAndAdminUserIds(tx);
  if (userIds.length === 0) return;

  const message = `Product ${params.productName} (SKU: ${params.sku}) in ${params.warehouseName} is below reorder level. Current: ${params.quantity}, Reorder level: ${params.reorderLevel}.`;

  const { count } = await tx.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: "Low Stock Alert",
      message,
      type: NotificationType.LOW_STOCK,
    })),
  });

  const notifications = Array.from({ length: count }, (_, i) => ({
    userId: userIds[i],
    title: "Low Stock Alert",
    message,
    type: NotificationType.LOW_STOCK,
  })) as any[];

  setImmediate(() => publishCreatedNotifications(notifications));

  // Fire-and-forget email dispatch — outside transaction, no await
  dispatchLowStockEmails({
    productName: params.productName,
    sku: params.sku,
    warehouseName: params.warehouseName,
    quantity: params.quantity,
    reorderLevel: params.reorderLevel,
  }).catch(() => {});
}

export async function notifyShipmentDelayed(
  tx: TxClient,
  params: { trackingNumber: string; poNumber: string }
): Promise<void> {
  const userIds = await getManagerAndAdminUserIds(tx);
  if (userIds.length === 0) return;

  const message = `Shipment ${params.trackingNumber} for PO ${params.poNumber} has been marked as DELAYED.`;

  const { count } = await tx.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: "Shipment Delayed",
      message,
      type: NotificationType.SHIPMENT_DELAYED,
    })),
  });

  const notifications = Array.from({ length: count }, (_, i) => ({
    userId: userIds[i],
    title: "Shipment Delayed",
    message,
    type: NotificationType.SHIPMENT_DELAYED,
  })) as any[];

  setImmediate(() => publishCreatedNotifications(notifications));

  // Fire-and-forget email dispatch — outside transaction, no await
  dispatchShipmentDelayedEmails({
    trackingNumber: params.trackingNumber,
    poNumber: params.poNumber,
  }).catch(() => {});
}

export async function notifyCertificateExpiring(
  tx: TxClient,
  params: { certificateNumber: string; supplierName: string; expiryDate: Date }
): Promise<void> {
  // Kiểm tra duplicate trong cùng ngày
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existingToday = await tx.notification.findFirst({
    where: {
      type: NotificationType.CERTIFICATE_EXPIRING,
      message: { contains: params.certificateNumber },
      createdAt: { gte: today },
    },
  });
  if (existingToday) return;

  const userIds = await getManagerAndAdminUserIds(tx);
  if (userIds.length === 0) return;

  const dateStr = isNaN(params.expiryDate.getTime())
    ? "unknown"
    : params.expiryDate.toISOString().split("T")[0];
  const message = `Certificate ${params.certificateNumber} for ${params.supplierName} expires on ${dateStr}.`;

  const { count } = await tx.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: "Certificate Expiring Soon",
      message,
      type: NotificationType.CERTIFICATE_EXPIRING,
    })),
  });

  const notifications = Array.from({ length: count }, (_, i) => ({
    userId: userIds[i],
    title: "Certificate Expiring Soon",
    message,
    type: NotificationType.CERTIFICATE_EXPIRING,
  })) as any[];

  setImmediate(() => publishCreatedNotifications(notifications));

  // Fire-and-forget email dispatch — outside transaction, no await
  dispatchCertExpiringEmails({
    certificateNumber: params.certificateNumber,
    supplierName: params.supplierName,
    expiryDate: params.expiryDate,
  }).catch(() => {});
}

export async function notifyCertificateExpired(
  tx: TxClient,
  params: { certificateNumber: string; supplierName: string; expiryDate: Date }
): Promise<void> {
  // Kiểm tra duplicate trong cùng ngày
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existingToday = await tx.notification.findFirst({
    where: {
      type: NotificationType.CERTIFICATE_EXPIRED,
      message: { contains: params.certificateNumber },
      createdAt: { gte: today },
    },
  });
  if (existingToday) return;

  const userIds = await getManagerAndAdminUserIds(tx);
  if (userIds.length === 0) return;

  const dateStr = isNaN(params.expiryDate.getTime())
    ? "unknown"
    : params.expiryDate.toISOString().split("T")[0];
  const message = `Certificate ${params.certificateNumber} for ${params.supplierName} expired on ${dateStr}. Immediate renewal required.`;

  const { count } = await tx.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: "Certificate Expired — Compliance Issue",
      message,
      type: NotificationType.CERTIFICATE_EXPIRED,
    })),
  });

  const notifications = Array.from({ length: count }, (_, i) => ({
    userId: userIds[i],
    title: "Certificate Expired — Compliance Issue",
    message,
    type: NotificationType.CERTIFICATE_EXPIRED,
  })) as any[];

  setImmediate(() => publishCreatedNotifications(notifications));

  // Fire-and-forget email dispatch — outside transaction, no await
  dispatchCertExpiredEmails({
    certificateNumber: params.certificateNumber,
    supplierName: params.supplierName,
    expiryDate: params.expiryDate,
  }).catch(() => {});
}
