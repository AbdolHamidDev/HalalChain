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
 * Rule 1 — Certificate Expiring Soon
 *
 * Condition: certificate expires within 30 days
 * Actions:
 *   - Create notification (NOTIFICATION)
 *   - Create dashboard alert (ALERT)
 *   - Optional email (EMAIL) — respects user preferences
 *
 * Deduplication: checks for existing notification with same cert number today
 */
export async function evaluateCertificateExpiringRule({
  tx,
  getManagerAndAdminUserIds,
}: Params): Promise<AutomationRuleResult> {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringCerts = await tx.halalCertificate.findMany({
    where: {
      expiryDate: { lte: thirtyDaysFromNow, gte: now },
    },
    include: { supplier: { select: { name: true } } },
  });

  if (expiringCerts.length === 0) {
    return { ruleName: "certificate-expiring", triggered: false, actions: [] };
  }

  const today = todayKey();
  const userIds = await getManagerAndAdminUserIds(tx);
  const actions: AutomationRuleResult["actions"] = [];

  for (const cert of expiringCerts) {
    // Deduplication: check if notification already created today for this cert
    const existingToday = await tx.notification.findFirst({
      where: {
        type: "CERTIFICATE_EXPIRING",
        message: { contains: cert.certificateNumber },
        createdAt: { gte: new Date(`${today}T00:00:00.000Z`) },
      },
    });

    if (existingToday) continue;

    const dateStr = cert.expiryDate.toISOString().split("T")[0];
    const title = "Certificate Expiring Soon";
    const message = `Certificate ${cert.certificateNumber} for ${cert.supplier.name} expires on ${dateStr}.`;

    actions.push({
      type: "NOTIFICATION",
      severity: "MEDIUM" as Severity,
      title,
      message,
      notificationType: "CERTIFICATE_EXPIRING",
      userIds,
      metadata: {
        certificateNumber: cert.certificateNumber,
        supplierName: cert.supplier.name,
        expiryDate: cert.expiryDate.toISOString(),
      },
    });

    actions.push({
      type: "ALERT",
      severity: "MEDIUM" as Severity,
      title,
      message,
      notificationType: "CERTIFICATE_EXPIRING",
      userIds,
    });

    actions.push({
      type: "EMAIL",
      severity: "MEDIUM" as Severity,
      title,
      message: `Certificate ${cert.certificateNumber} for ${cert.supplier.name} expires on ${dateStr}. Please renew before expiry.`,
      metadata: {
        certificateNumber: cert.certificateNumber,
        supplierName: cert.supplier.name,
        expiryDate: cert.expiryDate.toISOString(),
        emailType: "certExpiring",
      },
    });
  }

  return { ruleName: "certificate-expiring", triggered: actions.length > 0, actions };
}