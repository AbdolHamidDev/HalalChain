import { prisma } from "./prisma";
import redis from "./redis";

export interface DependencyHealth {
  name: string;
  status: "up" | "down" | "degraded";
  latency: number;
  lastCheck: Date;
  error?: string;
}

export interface SystemHealth {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: Date;
  uptime: number;
  checks: {
    database: DependencyHealth;
    redis: DependencyHealth;
    queues: Record<string, { waiting: number; active: number; completed: number }>;
    memory: { used: number; total: number; unit: string };
  };
}

const startTime = Date.now();

/**
 * Check PostgreSQL database health
 */
export async function checkDatabase(): Promise<DependencyHealth> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: "PostgreSQL",
      status: "up",
      latency: Date.now() - start,
      lastCheck: new Date(),
    };
  } catch (error) {
    return {
      name: "PostgreSQL",
      status: "down",
      latency: Date.now() - start,
      lastCheck: new Date(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check Redis health
 */
export async function checkRedis(): Promise<DependencyHealth> {
  const start = Date.now();
  try {
    await redis.ping();
    return {
      name: "Redis",
      status: "up",
      latency: Date.now() - start,
      lastCheck: new Date(),
    };
  } catch (error) {
    return {
      name: "Redis",
      status: "down",
      latency: Date.now() - start,
      lastCheck: new Date(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check BullMQ queue status
 */
export async function checkQueues(): Promise<Record<string, { waiting: number; active: number; completed: number }>> {
  try {
    const { shipmentTrackingQueue, notificationQueue, emailQueue } = await import("./queue");
    
    const [shipmentStats, notificationStats, emailStats] = await Promise.all([
      shipmentTrackingQueue.getJobCounts(),
      notificationQueue.getJobCounts(),
      emailQueue.getJobCounts(),
    ]);

    return {
      "shipment-tracking": {
        waiting: shipmentStats.waiting ?? 0,
        active: shipmentStats.active ?? 0,
        completed: shipmentStats.completed ?? 0,
      },
      notifications: {
        waiting: notificationStats.waiting ?? 0,
        active: notificationStats.active ?? 0,
        completed: notificationStats.completed ?? 0,
      },
      emails: {
        waiting: emailStats.waiting ?? 0,
        active: emailStats.active ?? 0,
        completed: emailStats.completed ?? 0,
      },
    };
  } catch (error) {
    console.error("Failed to check queues:", error);
    return {
      "shipment-tracking": { waiting: 0, active: 0, completed: 0 },
      notifications: { waiting: 0, active: 0, completed: 0 },
      emails: { waiting: 0, active: 0, completed: 0 },
    };
  }
}

/**
 * Get memory usage
 */
function getMemoryUsage(): { used: number; total: number; unit: string } {
  const usage = process.memoryUsage();
  const used = Math.round(usage.heapUsed / 1024 / 1024);
  const total = Math.round(usage.heapTotal / 1024 / 1024);
  return { used, total, unit: "MB" };
}

/**
 * Comprehensive health check
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  const [database, redis, queues] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkQueues(),
  ]);

  const checks = {
    database,
    redis,
    queues,
    memory: getMemoryUsage(),
  };

  const hasDown = database.status === "down" || redis.status === "down";
  const hasDegraded = database.status === "degraded" || redis.status === "degraded";

  const status = hasDown ? "unhealthy" : hasDegraded ? "degraded" : "healthy";

  return {
    status,
    timestamp: new Date(),
    uptime: Date.now() - startTime,
    checks,
  };
}