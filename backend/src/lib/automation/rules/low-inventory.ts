import { PrismaClient } from "@prisma/client";
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
 * Rule 3 — Low Inventory
 *
 * Condition: current stock < minimum stock threshold (reorderLevel)
 * Actions:
 *   - Create notification
 *   - Dashboard warning
 *   - Suggest replenishment (does NOT automatically place orders)
 *
 * Deduplication: checks for existing notification with same inventory ID today
 */
export async function evaluateLowInventoryRule({
  tx,
  getManagerAndAdminUserIds,
}: Params): Promise<AutomationRuleResult> {
  const today = todayKey();

  // Use raw SQL since Prisma doesn't support cross-field comparisons (quantity <= reorderLevel)
  type LowStockRow = {
    id: string;
    quantity: number;
    reorder_level: number;
    product_name: string;
    sku: string;
    warehouse_name: string;
  };

  const rows = await tx.$queryRaw<LowStockRow[]>`
    SELECT i.id, i.quantity, i.reorder_level,
           p.name AS product_name, p.sku,
           w.name AS warehouse_name
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    JOIN warehouses w ON w.id = i.warehouse_id
    WHERE i.quantity <= i.reorder_level
  `;

  if (rows.length === 0) {
    return { ruleName: "low-inventory", triggered: false, actions: [] };
  }

  const userIds = await getManagerAndAdminUserIds(tx);
  const actions: AutomationRuleResult["actions"] = [];

  for (const item of rows) {
    // Deduplication: check if notification already created today for this inventory item
    const existingToday = await tx.notification.findFirst({
      where: {
        type: "LOW_STOCK",
        message: { contains: item.id },
        createdAt: { gte: new Date(`${today}T00:00:00.000Z`) },
      },
    });

    if (existingToday) continue;

    const title = "Low Stock Alert";
    const message = `Product ${item.product_name} (SKU: ${item.sku}) in ${item.warehouse_name} is below reorder level. Current: ${item.quantity}, Reorder level: ${item.reorder_level}.`;

    actions.push({
      type: "NOTIFICATION",
      severity: "MEDIUM" as Severity,
      title,
      message,
      notificationType: "LOW_STOCK",
      userIds,
      metadata: {
        inventoryId: item.id,
        productName: item.product_name,
        sku: item.sku,
        warehouseName: item.warehouse_name,
        quantity: item.quantity,
        reorderLevel: item.reorder_level,
      },
    });

    actions.push({
      type: "ALERT",
      severity: "MEDIUM" as Severity,
      title,
      message,
      notificationType: "LOW_STOCK",
      userIds,
    });

    // Suggest replenishment (informational only — no auto-order)
    actions.push({
      type: "EMAIL",
      severity: "LOW" as Severity,
      title,
      message: `Product ${item.product_name} (SKU: ${item.sku}) in ${item.warehouse_name} is low: ${item.quantity} units remaining (reorder at ${item.reorder_level}). Please consider placing a replenishment order.`,
      metadata: {
        inventoryId: item.id,
        productName: item.product_name,
        sku: item.sku,
        warehouseName: item.warehouse_name,
        quantity: item.quantity,
        reorderLevel: item.reorder_level,
        emailType: "lowStock",
        replenishmentSuggested: true,
      },
    });
  }

  return { ruleName: "low-inventory", triggered: actions.length > 0, actions };
}