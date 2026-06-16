import { prisma } from "../prisma";
import { NotificationType, UserRole } from "@prisma/client";
import type { AutomationAction, AutomationRuleResult } from "./types";
import { evaluateCertificateExpiringRule } from "./rules/certificate-expiring";
import { evaluateCertificateExpiredRule } from "./rules/certificate-expired";
import { evaluateLowInventoryRule } from "./rules/low-inventory";
import { evaluateShipmentDelayRule } from "./rules/shipment-delay";
import { computeComplianceScore, loadComplianceScoreData } from "./complianceScore";
import { publishCreatedNotifications } from "../notificationStream";
import {
  dispatchCertExpiringEmails,
  dispatchCertExpiredEmails,
  dispatchLowStockEmails,
  dispatchShipmentDelayedEmails,
} from "../emailService";

type TxClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Get all MANAGER and ADMIN user IDs for notification routing.
 */
async function getManagerAndAdminUserIds(tx: TxClient): Promise<string[]> {
  const users = await tx.user.findMany({
    where: { role: { in: [UserRole.MANAGER, UserRole.ADMIN] } },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

/**
 * Execute an automation action by creating notifications and dispatching emails.
 */
async function executeAction(tx: TxClient, action: AutomationAction): Promise<void> {
  if (!action.userIds || action.userIds.length === 0) return;

  // Create NOTIFICATION type actions
  if (action.type === "NOTIFICATION" || action.type === "ALERT") {
    const notifications = await Promise.all(
      action.userIds.map((userId) =>
        tx.notification.create({
          data: {
            userId,
            title: action.title,
            message: action.message,
            type: action.notificationType ?? NotificationType.SYSTEM,
          },
        })
      )
    );

    // Publish to real-time stream (fire-and-forget)
    setImmediate(() => publishCreatedNotifications(notifications));
  }
}

/**
 * Execute EMAIL type actions by dispatching to the email service.
 * Email dispatch is fire-and-forget.
 */
async function executeEmailAction(action: AutomationAction): Promise<void> {
  const emailType = action.metadata?.emailType as string | undefined;

  if (emailType === "certExpiring") {
    dispatchCertExpiringEmails({
      certificateNumber: action.metadata?.certificateNumber as string,
      supplierName: action.metadata?.supplierName as string,
      expiryDate: new Date(action.metadata?.expiryDate as string),
    }).catch(() => {});
  } else if (emailType === "certExpired") {
    dispatchCertExpiredEmails({
      certificateNumber: action.metadata?.certificateNumber as string,
      supplierName: action.metadata?.supplierName as string,
      expiryDate: new Date(action.metadata?.expiryDate as string),
    }).catch(() => {});
  } else if (emailType === "lowStock") {
    dispatchLowStockEmails({
      productName: action.metadata?.productName as string,
      sku: action.metadata?.sku as string,
      warehouseName: action.metadata?.warehouseName as string,
      quantity: action.metadata?.quantity as number,
      reorderLevel: action.metadata?.reorderLevel as number,
    }).catch(() => {});
  } else if (emailType === "shipmentDelayed") {
    dispatchShipmentDelayedEmails({
      trackingNumber: action.metadata?.trackingNumber as string,
      poNumber: action.metadata?.poNumber as string,
    }).catch(() => {});
  }
}

/**
 * Run all automation rules and execute their actions.
 *
 * This is designed to be called from the scheduler once per day.
 * It is idempotent: duplicate notifications are prevented per-entity per-day.
 */
export async function evaluateAllRules(): Promise<AutomationRuleResult[]> {
  const results: AutomationRuleResult[] = [];

  await prisma.$transaction(async (tx) => {
    const params = { tx, getManagerAndAdminUserIds };

    // Run all rules
    const ruleResults = await Promise.all([
      evaluateCertificateExpiringRule(params),
      evaluateCertificateExpiredRule(params),
      evaluateLowInventoryRule(params),
      evaluateShipmentDelayRule(params),
    ]);

    for (const result of ruleResults) {
      if (!result.triggered) {
        results.push(result);
        continue;
      }

      // Execute NOTIFICATION and ALERT actions within the transaction
      for (const action of result.actions) {
        if (action.type === "NOTIFICATION" || action.type === "ALERT") {
          await executeAction(tx, action);
        }
      }

      results.push(result);
    }
  });

  // Execute EMAIL actions outside the transaction (fire-and-forget)
  for (const result of results) {
    if (!result.triggered) continue;
    for (const action of result.actions) {
      if (action.type === "EMAIL") {
        executeEmailAction(action);
      }
    }
  }

  return results;
}

/**
 * Compute and return the current compliance score.
 * This is a synchronous computation based on live DB data.
 */
export async function getComplianceScore() {
  const data = await loadComplianceScoreData(prisma);
  return computeComplianceScore(data);
}

export type { AutomationRuleResult, AutomationAction };