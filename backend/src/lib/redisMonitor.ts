import { redis, queueRedis, cacheRedis } from "./redis";

export interface RedisMetrics {
  name: string;
  connected: boolean;
  memory?: string;
  commandsProcessed?: number;
  keyspaceHits?: number;
  keyspaceMisses?: number;
}

export async function getRedisMetrics(): Promise<RedisMetrics[]> {
  const metrics: RedisMetrics[] = [];

  const connections = [
    { client: redis, name: "General" },
    { client: queueRedis, name: "Queue" },
    { client: cacheRedis, name: "Cache" },
  ];

  for (const { client, name } of connections) {
    try {
      const info = await client.info("stats");
      const memory = await client.info("memory");

      const parseInfo = (infoStr: string) => {
        const result: Record<string, string> = {};
        for (const line of infoStr.split("\r\n")) {
          if (line && !line.startsWith("#")) {
            const [key, value] = line.split(":");
            if (key && value) {
              result[key] = value;
            }
          }
        }
        return result;
      };

      const stats = parseInfo(info);
      const mem = parseInfo(memory);

      metrics.push({
        name,
        connected: true,
        memory: mem.used_memory_human,
        commandsProcessed: parseInt(stats.total_commands_processed || "0"),
        keyspaceHits: parseInt(stats.keyspace_hits || "0"),
        keyspaceMisses: parseInt(stats.keyspace_misses || "0"),
      });
    } catch (error) {
      console.error(`[RedisMonitor] Error getting metrics for ${name}:`, error);
      metrics.push({
        name,
        connected: false,
      });
    }
  }

  return metrics;
}

export async function logRedisMetrics(): Promise<void> {
  try {
    const metrics = await getRedisMetrics();
    console.log("\n=== Redis Metrics ===");
    for (const metric of metrics) {
      console.log(`[${metric.name}] Connected: ${metric.connected}`);
      if (metric.memory) {
        console.log(`  Memory: ${metric.memory}`);
      }
      if (metric.commandsProcessed !== undefined) {
        console.log(`  Commands: ${metric.commandsProcessed}`);
      }
      if (metric.keyspaceHits !== undefined && metric.keyspaceMisses !== undefined) {
        const hitRate = metric.keyspaceHits + metric.keyspaceMisses > 0
          ? ((metric.keyspaceHits / (metric.keyspaceHits + metric.keyspaceMisses)) * 100).toFixed(2)
          : "0.00";
        console.log(`  Cache Hit Rate: ${hitRate}%`);
      }
    }
    console.log("=====================\n");
  } catch (error) {
    console.error("[RedisMonitor] Failed to log metrics:", error);
  }
}

// Monitor BullMQ queues
export async function getQueueMetrics() {
  try {
    const queueNames = ["shipment-tracking", "notifications", "emails"];
    const metrics: Record<string, { waiting: number; active: number; completed: number; failed: number }> = {};

    for (const queueName of queueNames) {
      const [waiting, active, completed, failed] = await Promise.all([
        queueRedis.zcard(`bull:${queueName}:waiting`),
        queueRedis.zcard(`bull:${queueName}:active`),
        queueRedis.zcard(`bull:${queueName}:completed`),
        queueRedis.zcard(`bull:${queueName}:failed`),
      ]);

      metrics[queueName] = { waiting, active, completed, failed };
    }

    return metrics;
  } catch (error) {
    console.error("[RedisMonitor] Failed to get queue metrics:", error);
    return {};
  }
}

export async function logQueueMetrics(): Promise<void> {
  try {
    const metrics = await getQueueMetrics();
    console.log("\n=== BullMQ Queue Metrics ===");
    for (const [queueName, data] of Object.entries(metrics)) {
      console.log(`[${queueName}]`);
      console.log(`  Waiting: ${data.waiting}`);
      console.log(`  Active: ${data.active}`);
      console.log(`  Completed: ${data.completed}`);
      console.log(`  Failed: ${data.failed}`);
    }
    console.log("============================\n");
  } catch (error) {
    console.error("[RedisMonitor] Failed to log queue metrics:", error);
  }
}