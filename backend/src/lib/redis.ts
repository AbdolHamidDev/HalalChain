import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

// Detect if using Upstash Redis (requires TLS)
const isUpstash = redisUrl.includes("upstash.io");

// Connection pool for different purposes to reduce contention
const createRedisConnection = () => {
  const baseConfig = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: isUpstash ? {} : undefined,
    ...(isUpstash && {
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    }),
  };

  return new Redis(redisUrl, baseConfig);
};

// Connection pool: 1 for BullMQ, 1 for general operations, 1 for caching
export const queueRedis = createRedisConnection();
export const cacheRedis = createRedisConnection();
export const redis = createRedisConnection(); // Default for general use

// Monitor connections
const setupConnectionMonitoring = (client: Redis, name: string) => {
  client.on("connect", () => {
    console.log(`[Redis:${name}] Connected`, isUpstash ? "(Upstash)" : "(local)");
  });

  client.on("error", (err) => {
    console.error(`[Redis:${name}] Error:`, err);
  });

  client.on("close", () => {
    console.warn(`[Redis:${name}] Connection closed`);
  });
};

setupConnectionMonitoring(queueRedis, "Queue");
setupConnectionMonitoring(cacheRedis, "Cache");
setupConnectionMonitoring(redis, "General");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Redis] Closing connections...");
  await Promise.all([
    queueRedis.quit(),
    cacheRedis.quit(),
    redis.quit(),
  ]);
  console.log("[Redis] All connections closed");
});

export default redis;
