import { PrismaClient, ShipmentStatus } from "@prisma/client";
import type { AutomationRuleResult, Severity } from "../types";
import { todayKey } from "../types";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

interface Params {
  tx: TxClient;
  getManagerAndAdminUserIds: (tx: TxClient) => Promise<string[]>;
}

/**
 * Rule 4 — Shipment Delay Detection
 *
 * Condition: estimatedArrival < today AND status != DELIVERED
 * Actions:
 *   - Warning notification
 *   - Dashboard indicator
 *
 * Deduplication: checks for existing notification with same tracking number today
 */
export async function evaluateShipmentDelayRule({
  tx,
  getManagerAndAdminUserIds,
}: Params): Promise<AutomationRuleResult> {
  const now = new Date();
  const today = todayKey();

  const delayedShipments = await tx.shipment.findMany({
    where: {
      estimatedArrival: { lt: now },
      status: { not: ShipmentStatus.DELIVERED },
    },
    include: {
      purchaseOrder: {
        select: { poNumber: true, supplier: { select: { name: true } } },
      },
    },
  });

  if (delayedShipments.length === 0) {
    return { ruleName: "shipment-delay", triggered: false, actions: [] };
  }

  const userIds = await getManagerAndAdminUserIds(tx);
  const actions: AutomationRuleResult["actions"] = [];

  for (const shipment of delayedShipments) {
    // Deduplication: check if notification already created today for this shipment
    const existingToday = await tx.notification.findFirst({
      where: {
        type: "SHIPMENT_DELAYED",
        message: { contains: shipment.trackingNumber },
        createdAt: { gte: new Date(`${today}T00:00:00.000Z`) },
      },
    });

    if (existingToday) continue;

    const title = "Shipment Delayed";
    const message = `Shipment ${shipment.trackingNumber} for PO ${shipment.purchaseOrder.poNumber} from ${shipment.purchaseOrder.supplier.name} was expected by ${shipment.estimatedArrival?.toISOString().split("T")[0] ?? "unknown"} but has not been delivered.`;

    actions.push({
      type: "NOTIFICATION",
      severity: "MEDIUM" as Severity,
      title,
      message,
      notificationType: "SHIPMENT_DELAYED",
      userIds,
      metadata: {
        trackingNumber: shipment.trackingNumber,
        poNumber: shipment.purchaseOrder.poNumber,
        supplierName: shipment.purchaseOrder.supplier.name,
        estimatedArrival: shipment.estimatedArrival?.toISOString(),
        shipmentId: shipment.id,
      },
    });

    actions.push({
      type: "ALERT",
      severity: "MEDIUM" as Severity,
      title,
      message,
      notificationType: "SHIPMENT_DELAYED",
      userIds,
    });

    actions.push({
      type: "EMAIL",
      severity: "MEDIUM" as Severity,
      title,
      message: `Shipment ${shipment.trackingNumber} for PO ${shipment.purchaseOrder.poNumber} is overdue. Please contact the supplier for status update.`,
      metadata: {
        trackingNumber: shipment.trackingNumber,
        poNumber: shipment.purchaseOrder.poNumber,
        emailType: "shipmentDelayed",
      },
    });
  }

  return { ruleName: "shipment-delay", triggered: actions.length > 0, actions };
}