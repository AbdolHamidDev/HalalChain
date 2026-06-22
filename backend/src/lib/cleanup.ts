import { prisma } from "./prisma";
import { logger } from "./logger";
import { cleanupOldEvents } from "./systemEvents";

const RETENTION_DAYS_NOTIFICATIONS = 90;
const RETENTION_DAYS_INVITATIONS = 30;
const RETENTION_DAYS_AUDIT_LOGS = 730; // 2 years

/**
 * Cleanup old read notifications
 */
export async function cleanupOldNotifications(): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS_NOTIFICATIONS);

    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    if (result.count > 0) {
      logger.info({ event: "old_notifications_cleaned", count: result.count, retentionDays: RETENTION_DAYS_NOTIFICATIONS });
    }

    return result.count;
  } catch (error) {
    logger.error({ event: "cleanup_notifications_failed", error });
    return 0;
  }
}

/**
 * Cleanup expired invitations
 */
export async function cleanupExpiredInvitations(): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS_INVITATIONS);

    const result = await prisma.userInvitation.deleteMany({
      where: {
        expiresAt: {
          lt: cutoffDate,
        },
        acceptedAt: null, // Only delete unaccepted invitations
      },
    });

    if (result.count > 0) {
      logger.info({ event: "expired_invitations_cleaned", count: result.count, retentionDays: RETENTION_DAYS_INVITATIONS });
    }

    return result.count;
  } catch (error) {
    logger.error({ event: "cleanup_invitations_failed", error });
    return 0;
  }
}

/**
 * Archive old audit logs (move to archive table or delete)
 */
export async function cleanupOldAuditLogs(): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS_AUDIT_LOGS);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    if (result.count > 0) {
      logger.info({ event: "old_audit_logs_cleaned", count: result.count, retentionDays: RETENTION_DAYS_AUDIT_LOGS });
    }

    return result.count;
  } catch (error) {
    logger.error({ event: "cleanup_audit_logs_failed", error });
    return 0;
  }
}

/**
 * Run all cleanup tasks
 */
export async function runAllCleanupTasks(): Promise<{
  notifications: number;
  invitations: number;
  auditLogs: number;
  events: number;
}> {
  logger.info({ event: "cleanup_started" });

  const [notifications, invitations, auditLogs, events] = await Promise.all([
    cleanupOldNotifications(),
    cleanupExpiredInvitations(),
    cleanupOldAuditLogs(),
    cleanupOldEvents(90),
  ]);

  const total = notifications + invitations + auditLogs + events;
  logger.info({ event: "cleanup_completed", total, notifications, invitations, auditLogs, events });

  return {
    notifications,
    invitations,
    auditLogs,
    events,
  };
}