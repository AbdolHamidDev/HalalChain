import { prisma } from "./prisma";
import { logger } from "./logger";

export interface SystemEventData {
  type: string;
  severity: "info" | "warning" | "error";
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Create a system event
 */
export async function createSystemEvent(data: SystemEventData): Promise<void> {
  try {
    await prisma.systemEvent.create({
      data: {
        type: data.type,
        severity: data.severity,
        message: data.message,
        metadata: data.metadata,
      },
    });

    logger.debug({ event: "system_event_created", type: data.type, severity: data.severity });
  } catch (error) {
    logger.error({ event: "system_event_creation_failed", type: data.type, error });
  }
}

/**
 * Get system events with optional filtering
 */
export async function getSystemEvents(options: {
  type?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}): Promise<{ events: any[]; total: number }> {
  try {
    const { type, severity, limit = 50, offset = 0 } = options;

    const where: any = {};
    if (type) where.type = type;
    if (severity) where.severity = severity;

    const [events, total] = await Promise.all([
      prisma.systemEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.systemEvent.count({ where }),
    ]);

    return { events, total };
  } catch (error) {
    logger.error({ event: "get_system_events_failed", error });
    return { events: [], total: 0 };
  }
}

/**
 * Delete old system events based on retention policy
 */
export async function cleanupOldEvents(retentionDays: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.systemEvent.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    if (result.count > 0) {
      logger.info({ event: "old_events_cleaned", count: result.count, retentionDays });
    }

    return result.count;
  } catch (error) {
    logger.error({ event: "cleanup_old_events_failed", error });
    return 0;
  }
}