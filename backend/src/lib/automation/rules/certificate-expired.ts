import { PrismaClient, NotificationType } from "@prisma/client";
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
 * Rule 2 — Certificate Expired
 *
 * Condition: certificate expiration date < today
 * Actions:
 *   - Create HIGH severity notification
 *   - Mark compliance issue (ALERT)
 *   - Notify responsible users
 *   - Optional email
 *
 * Deduplication: checks for existing notification with same cert number today
 */
export async function evaluateCertificateExpiredRule({
  tx,
  getManagerAndAdminUserIds,
}: Params): Promise<AutomationRuleResult> {
  const now = new Date();
  const today = todayKey();

  const expiredCerts = await tx.halalCertificate.findMany({
    where: {
      expiryDate: { lt: now },
    },
    include: { supplier: { select: { name: true } } },
  });

  if (expiredCerts.length === 0) {
    return { ruleName: "certificate-expired", triggered: false, actions: [] };
  }

  const userIds = await getManagerAndAdminUserIds(tx);
  const actions: AutomationRuleResult["actions"] = [];

  for (const cert of expiredCerts) {
    // Deduplication: check if notification already created today for this expired cert
    const existingToday = await tx.notification.findFirst({
      where: {
        type: NotificationType.CERTIFICATE_EXPIRED,
        message: { contains: cert.certificateNumber },
        createdAt: { gte: new Date(`${today}T00:00:00.000Z`) },
      },
    });

    if (existingToday) continue;

    const dateStr = cert.expiryDate.toISOString().split("T")[0];
    const title = "Certificate Expired — Compliance Issue";
    const message = `Certificate ${cert.certificateNumber} for ${cert.supplier.name} expired on ${dateStr}. Immediate renewal required to maintain halal compliance.`;

    actions.push({
      type: "NOTIFICATION",
      severity: "HIGH" as Severity,
      title,
      message,
      notificationType: NotificationType.CERTIFICATE_EXPIRED,
      userIds,
      metadata: {
        certificateNumber: cert.certificateNumber,
        supplierName: cert.supplier.name,
        expiryDate: cert.expiryDate.toISOString(),
        complianceIssue: true,
      },
    });

    actions.push({
      type: "ALERT",
      severity: "HIGH" as Severity,
      title,
      message,
      notificationType: NotificationType.COMPLIANCE_ISSUE,
      userIds,
      metadata: {
        certificateNumber: cert.certificateNumber,
        supplierName: cert.supplier.name,
        complianceIssue: true,
      },
    });

    actions.push({
      type: "EMAIL",
      severity: "HIGH" as Severity,
      title,
      message: `Certificate ${cert.certificateNumber} for ${cert.supplier.name} expired on ${dateStr}. This certificate has expired. Please renew it immediately to maintain halal compliance.`,
      metadata: {
        certificateNumber: cert.certificateNumber,
        supplierName: cert.supplier.name,
        expiryDate: cert.expiryDate.toISOString(),
        emailType: "certExpired",
      },
    });
  }

  return { ruleName: "certificate-expired", triggered: actions.length > 0, actions };
}