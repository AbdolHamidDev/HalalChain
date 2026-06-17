import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

// Detect if using Upstash Redis (requires TLS)
const isUpstash = redisUrl.includes("upstash.io");

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: isUpstash ? {} : undefined,
  // Upstash-specific optimizations
  ...(isUpstash && {
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
  }),
});

redis.on("connect", () => {
  console.log("[Redis] Connected", isUpstash ? "(Upstash)" : "(local)");
});

redis.on("error", (err) => {
  console.error("[Redis] Error:", err);
});

export default redis;
