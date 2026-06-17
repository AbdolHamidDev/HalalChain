# Upstash Redis Configuration

## Overview

HalalChain is configured to use **Upstash Redis** for production, providing a fully managed Redis service with TLS support, high availability, and global replication.

## Configuration

### Environment Variables

Your `backend/.env` is already configured with:

```env
REDIS_URL=redis://default:gQAAAAAAAfQtAAIgcDE2OGNmYjIwY2FkZWM0NjNkOTdjNjYyZDZhY2QyYmE1YQ@modest-liger-128045.upstash.io:6379
```

### Redis Client Configuration

The `backend/src/lib/redis.ts` file automatically detects Upstash and enables:

1. **TLS Connection** - Secure encrypted connection
2. **Connection Keep-Alive** - Maintain persistent connections (30s interval)
3. **Extended Timeouts** - Accommodate network latency to Upstash servers
4. **Auto-Detection** - No code changes needed when switching between local/Upstash

```typescript
const isUpstash = redisUrl.includes("upstash.io");

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: isUpstash ? {} : undefined,  // Enable TLS for Upstash
  ...(isUpstash && {
    keepAlive: 30000,      // Keep connections alive
    connectTimeout: 10000, // 10s connection timeout
    commandTimeout: 5000,  // 5s command timeout
  }),
});
```

## Upstash Features Utilized

### 1. BullMQ Queue Backend
- All job queues (shipment-tracking, notifications, emails) use Upstash Redis
- Jobs persist across server restarts
- Retry logic and dead letter queues work automatically

### 2. Real-Time Pub/Sub
- WebSocket scaling via Redis pub/sub (when using Socket.IO Redis adapter)
- Cross-server message broadcasting
- Room-based message distribution

### 3. Caching Layer
- Dashboard stats caching
- Session storage
- Rate limiting counters

### 4. Session Management
- User sessions stored in Redis
- Fast session validation
- Distributed session support

## Testing the Connection

### 1. Using Upstash CLI

```bash
# Install Upstash CLI
npm install -g @upstash/cli

# Connect to your Redis instance
upstash redis connect

# Or use redis-cli with TLS
redis-cli --tls -u redis://default:gQAAAAAAAfQtAAIgcDE2OGNmYjIwY2FkZWM0NjNkOTdjNjYyZDZhY2QyYmE1YQ@modest-liger-128045.upstash.io:6379
```

### 2. Test from Application

```typescript
// In backend/src/lib/redis.ts or a test script
import { redis } from "./lib/redis";

async function testRedis() {
  try {
    // Test connection
    const pong = await redis.ping();
    console.log("Redis ping:", pong); // Should print "PONG"

    // Test set/get
    await redis.set("test:key", "Hello Upstash!", "EX", 60);
    const value = await redis.get("test:key");
    console.log("Retrieved:", value); // Should print "Hello Upstash!"

    // Test queue (BullMQ)
    const queues = ["shipment-tracking", "notifications", "emails"];
    for (const queueName of queues) {
      const counts = await redis.hgetall(`bull:${queueName}:id`);
      console.log(`Queue ${queueName}:`, counts);
    }

    console.log("✅ Upstash Redis is working correctly!");
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
  }
}

testRedis();
```

### 3. Test Queue Jobs

```typescript
// scripts/test-queue.ts
import { addShipmentTrackingJob, addNotificationJob } from "../src/lib/queue";

async function testQueues() {
  console.log("Testing BullMQ queues with Upstash Redis...\n");

  // Test shipment tracking queue
  console.log("1. Adding shipment tracking job...");
  const shipmentJob = await addShipmentTrackingJob({
    shipmentId: "test-shipment-123",
    status: "IN_TRANSIT",
    location: "Singapore Port",
    notes: "Customs clearance completed"
  });
  console.log("   Job ID:", shipmentJob.id);

  // Test notification queue
  console.log("\n2. Adding notification job...");
  const notificationJob = await addNotificationJob({
    userId: "test-user-456",
    type: "SHIPMENT_UPDATE",
    title: "Shipment Update",
    message: "Your shipment is now in transit"
  });
  console.log("   Job ID:", notificationJob.id);

  console.log("\n✅ Jobs added successfully!");
  console.log("Check worker logs to see them being processed.");
}

testQueues().catch(console.error);
```

Run the test:
```bash
cd backend
npx tsx scripts/test-queue.ts
```

## Upstash Dashboard

### Access Your Redis Instance

1. Go to [Upstash Console](https://console.upstash.com/)
2. Navigate to your Redis instance: `modest-liger-128045`
3. You'll see:
   - **Memory Usage**: Current memory consumption
   - **Commands/sec**: Query throughput
   - **Connected Clients**: Active connections
   - **Keys**: Total number of keys stored

### Monitor Queues

In the Upstash Console:
1. Go to **Data Browser**
2. Browse keys with prefix `bull:*` to see queue data
3. Monitor job states: waiting, active, completed, failed

### Useful Redis Commands

```bash
# Connect via Upstash CLI
upstash redis connect

# Check all keys
KEYS *

# Check queue statistics
HGETALL bull:shipment-tracking:id
HGETALL bull:notifications:id
HGETALL bull:emails:id

# Check specific job
HGET bull:shipment-tracking:1

# Monitor real-time commands
MONITOR

# Check memory usage
INFO memory

# Check connected clients
CLIENT LIST
```

## Production Considerations

### 1. Rate Limits

Upstash Redis has generous rate limits, but monitor usage:
- **Free Tier**: 10,000 commands/day
- **Paid Plans**: 1M+ commands/day

Check your usage in the Upstash Console.

### 2. Connection Pooling

The current configuration uses a single Redis connection. For high-traffic production:

```typescript
// For multiple concurrent operations
import { Redis } from "ioredis";

// Create connection pool
const redisPool = [];
for (let i = 0; i < 5; i++) {
  redisPool.push(new Redis(redisUrl, { tls: {} }));
}

// Use different connections for different operations
export const redis = redisPool[0]; // General operations
export const queueRedis = redisPool[1]; // BullMQ operations
```

### 3. Cost Optimization

- **TTL on Cache Keys**: Always set expiration times
- **Clean Up Old Jobs**: BullMQ auto-removes completed jobs (configured in `queue.ts`)
- **Avoid Large Values**: Keep values < 1MB
- **Use Efficient Data Structures**: Hashes > Strings for multiple fields

### 4. Monitoring

Add to your application:

```typescript
// Monitor Redis memory usage
setInterval(async () => {
  const info = await redis.info("memory");
  const match = info.match(/used_memory:(\d+)/);
  if (match) {
    const memoryMB = parseInt(match[1]) / 1024 / 1024;
    console.log(`Redis memory: ${memoryMB.toFixed(2)} MB`);
  }
}, 60000); // Every minute
```

## Troubleshooting

### Connection Issues

**Problem**: `Redis connection timeout`

**Solutions**:
1. Check your internet connection
2. Verify REDIS_URL in .env is correct
3. Upstash might be experiencing issues (check status.upstash.com)
4. Increase timeout values in redis.ts

```typescript
// Increase timeouts for slow connections
connectTimeout: 30000,  // 30s
commandTimeout: 10000,  // 10s
```

### TLS Errors

**Problem**: `SSL routines:tls_process_server_certificate:certificate verify failed`

**Solutions**:
1. Ensure you're using the latest ioredis version
2. Check if your Node.js version supports TLS 1.3
3. Try adding `rejectUnauthorized: false` (not recommended for production):

```typescript
tls: {
  rejectUnauthorized: false  // Only for debugging
}
```

### Rate Limit Errors

**Problem**: `MAXCLIENTS reached` or `OOM command not allowed`

**Solutions**:
1. Upgrade your Upstash plan
2. Implement connection pooling
3. Add caching to reduce Redis calls
4. Use batch operations where possible

```typescript
// Use pipeline for multiple commands
const pipeline = redis.pipeline();
pipeline.set("key1", "value1");
pipeline.set("key2", "value2");
pipeline.set("key3", "value3");
await pipeline.exec();
```

## Migration from Local Redis

If you were using local Redis and want to migrate to Upstash:

### 1. Export Local Data

```bash
# Connect to local Redis
redis-cli

# Export all keys
redis-cli --rdb /tmp/dump.rdb
```

### 2. Import to Upstash

```bash
# Use Upstash CLI to import
upstash redis import /tmp/dump.rdb
```

### 3. Update Application

The application automatically detects Upstash via the URL pattern. Just update `.env`:

```env
# Old (local)
REDIS_URL=redis://localhost:6379

# New (Upstash)
REDIS_URL=redis://default:password@host:6379
```

No code changes needed!

## Security

### 1. Credentials Protection

- Never commit `.env` to git (already in `.gitignore`)
- Rotate credentials periodically via Upstash Console
- Use environment variables in production (Vercel, Railway, etc.)

### 2. Network Security

- Upstash Redis is only accessible via TLS
- IP whitelisting available on paid plans
- All data encrypted in transit and at rest

### 3. Access Control

```typescript
// Implement Redis ACL (Upstash supports this)
// In Upstash Console > Redis > ACL
// Create users with specific permissions:
// - read-only user for caching
// - read-write user for queues
// - admin user for management
```

## Performance Tips

### 1. Use Appropriate Data Structures

```typescript
// ❌ Bad: Multiple keys
await redis.set("user:123:name", "John");
await redis.set("user:123:email", "john@example.com");
await redis.set("user:123:role", "admin");

// ✅ Good: Hash
await redis.hset("user:123", {
  name: "John",
  email: "john@example.com",
  role: "admin"
});
```

### 2. Batch Operations

```typescript
// ❌ Bad: Multiple round trips
await redis.set("key1", "value1");
await redis.set("key2", "value2");
await redis.set("key3", "value3");

// ✅ Good: Pipeline
const pipeline = redis.pipeline();
pipeline.set("key1", "value1");
pipeline.set("key2", "value2");
pipeline.set("key3", "value3");
await pipeline.exec();
```

### 3. Use TTLs

```typescript
// Always set expiration for cache keys
await redis.setex("cache:stats", 300, JSON.stringify(stats)); // 5 minutes

// For session data
await redis.setex("session:user123", 3600, JSON.stringify(session)); // 1 hour
```

## Cost Management

### Monitor Usage

1. **Upstash Console**: View daily command usage
2. **Set up alerts**: Get notified when approaching limits
3. **Optimize queries**: Reduce unnecessary Redis calls

### Estimate Costs

```typescript
// Calculate commands per request
const commandsPerRequest = 5; // Average
const requestsPerDay = 10000; // Your traffic
const totalCommands = commandsPerRequest * requestsPerDay;

console.log(`Estimated daily commands: ${totalCommands}`);
// Upstash Free Tier: 10,000 commands/day
// Upstash Pay-as-you-go: $0.20 per 100K commands
```

## Support

- **Upstash Documentation**: https://docs.upstash.com/redis
- **Upstash Status**: https://status.upstash.com/
- **Upstash Support**: support@upstash.com
- **Community**: https://discord.gg/upstash

## Next Steps

1. ✅ Configuration complete - Upstash Redis is ready to use
2. Test connection with the scripts above
3. Monitor usage in Upstash Console
4. Set up alerts for rate limits
5. Consider upgrading plan for production traffic

Your HalalChain application is now production-ready with managed Redis!