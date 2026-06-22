import redis from "./redis";

export interface SystemMetrics {
  timestamp: Date;
  cpu: number;
  memory: { used: number; total: number };
  eventLoopLag: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
}

const METRICS_KEY = "halalchain:metrics";
const METRICS_TTL = 3600; // 1 hour

/**
 * Collect current system metrics
 */
export async function collectMetrics(): Promise<SystemMetrics> {
  const usage = process.memoryUsage();
  const memory = {
    used: Math.round(usage.heapUsed / 1024 / 1024),
    total: Math.round(usage.heapTotal / 1024 / 1024),
  };

  // Event loop lag (simplified - in production use event-loop-lag package)
  const eventLoopLag = 0;

  // CPU usage (simplified - in production use os module for accurate measurement)
  const cpu = 0;

  return {
    timestamp: new Date(),
    cpu,
    memory,
    eventLoopLag,
    activeConnections: 0, // Would need to track from HTTP server
    requestsPerMinute: 0, // Would need middleware to track
    errorRate: 0, // Would need to track from error logs
  };
}

/**
 * Store metrics in Redis
 */
export async function storeMetrics(metrics: SystemMetrics): Promise<void> {
  try {
    await redis.setex(METRICS_KEY, METRICS_TTL, JSON.stringify(metrics));
  } catch (error) {
    console.error("Failed to store metrics:", error);
  }
}

/**
 * Get latest metrics from Redis
 */
export async function getLatestMetrics(): Promise<SystemMetrics | null> {
  try {
    const data = await redis.get(METRICS_KEY);
    if (!data) return null;
    return JSON.parse(data) as SystemMetrics;
  } catch (error) {
    console.error("Failed to get metrics:", error);
    return null;
  }
}

/**
 * Start metrics collection interval
 */
export function startMetricsCollection(intervalMs: number = 30000): NodeJS.Timeout {
  return setInterval(async () => {
    const metrics = await collectMetrics();
    await storeMetrics(metrics);
  }, intervalMs);
}