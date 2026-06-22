# Real-Time Architecture for HalalChain

## Overview

This document describes the real-time features implemented in HalalChain using **Redis**, **WebSocket (Socket.IO)**, and **BullMQ Queue** for scalable background job processing.

## Architecture Components

### 1. Redis (`backend/src/lib/redis.ts`)
- **Purpose**: In-memory data store for caching, pub/sub, and queue backend
- **Connection**: ioredis client with connection pooling
- **Use Cases**:
  - BullMQ queue backend
  - Session storage
  - Real-time data caching
  - Pub/Sub for horizontal scaling

### 2. WebSocket Server (`backend/src/lib/websocket.ts`)
- **Technology**: Socket.IO
- **Path**: `/ws`
- **Authentication**: JWT-based via `authenticateSocket` middleware
- **Events**:
  - `shipment_updated` - Real-time shipment status changes
  - `activity_created` - Live activity feed updates
  - `notification_created` - Instant notifications

### 3. Queue System (`backend/src/lib/queue.ts`)
- **Technology**: BullMQ
- **Queues**:
  - `shipment-tracking` - Process shipment updates
  - `notifications` - Handle notification delivery
  - `emails` - Send emails asynchronously
- **Features**:
  - Retry with exponential backoff
  - Job prioritization
  - Dead letter queue
  - Job scheduling

## Data Flow

### Shipment Tracking Real-Time Updates

```
┌─────────────┐
│   Client    │
│   (Frontend)│
└──────┬──────┘
       │ 1. PATCH /api/shipments/:id
       ▼
┌─────────────────┐
│  API Server     │
│  (Express)      │
└──────┬──────────┘
       │ 2. Update DB + Audit Log
       ▼
┌─────────────────┐
│  PostgreSQL     │
└──────┬──────────┘
       │ 3. Queue Job
       ▼
┌─────────────────┐
│  BullMQ Queue   │
│  (Redis)        │
└──────┬──────────┘
       │ 4. Process Job
       ▼
┌─────────────────┐
│  Queue Worker   │
└──────┬──────────┘
       │ 5. Broadcast via WebSocket
       ▼
┌─────────────────┐
│  Socket.IO      │
│  Server         │
└──────┬──────────┘
       │ 6. Emit to subscribed clients
       ▼
┌─────────────────┐
│  Connected      │
│  Clients        │
└─────────────────┘
```

### Notification Flow

```
┌──────────────┐
│   System     │
│   Trigger    │ (e.g., certificate expiring, low stock)
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  Notification    │
│  Service         │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  BullMQ Queue    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Worker          │
│  - Save to DB    │
│  - Send Email    │
│  - Push to WS    │
└──────────────────┘
```

## Implementation Details

### WebSocket Connection (Frontend)

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  auth: {
    token: localStorage.getItem("token")
  }
});

// Join shipment tracking room
socket.emit("join_shipment", shipmentId);

// Listen for updates
socket.on("shipment_updated", (data) => {
  console.log("Shipment update:", data);
  // Update UI in real-time
});

// Listen for notifications
socket.on("notification_created", (data) => {
  console.log("New notification:", data);
  // Show notification badge
});

// Leave room when component unmounts
socket.emit("leave_shipment", shipmentId);
```

### Queue Job Example

```typescript
// Add a shipment tracking job
await addShipmentTrackingJob({
  shipmentId: "shipment-uuid",
  status: "IN_TRANSIT",
  location: "Port of Singapore",
  notes: "Customs clearance completed"
});

// Add a notification job
await addNotificationJob({
  userId: "user-uuid",
  type: "SHIPMENT_DELAYED",
  title: "Shipment Delayed",
  message: "Your shipment #12345 is delayed"
});

// Add an email job
await addEmailJob({
  to: "user@example.com",
  subject: "Shipment Update",
  html: "<h1>Your shipment has been updated</h1>"
});
```

### Redis Caching Example

```typescript
import { redis } from "./lib/redis";

// Cache dashboard stats for 5 minutes
const cacheKey = "dashboard:stats:admin:123";
await redis.setex(cacheKey, 300, JSON.stringify(stats));

// Retrieve cached data
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Fetch from DB and cache
const stats = await fetchStatsFromDB();
await redis.setex(cacheKey, 300, JSON.stringify(stats));
```

## Docker Compose Setup

```yaml
services:
  postgres:
    image: postgres:16-alpine
    # ... existing config
  
  redis:
    image: redis:7-alpine
    container_name: halalchain-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - halalchain_redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  halalchain_pgdata:
  halalchain_redisdata:
```

## Environment Variables

Add to `.env`:

```env
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-here
```

## Installation & Running

```bash
# Install dependencies
cd backend
npm install

# Start Redis and PostgreSQL
docker-compose up -d

# Run database migrations
npm run db:migrate

# Start development server (with WebSocket + Workers)
npm run dev

# Server will be available at:
# - HTTP API: http://localhost:4000
# - WebSocket: ws://localhost:4000/ws
# - API Docs: http://localhost:4000/api/docs
```

## Key Interview Points

### 1. Why Redis?
- **Performance**: In-memory operations (sub-millisecond latency)
- **Data Structures**: Sorted sets, hashes, streams for complex operations
- **Pub/Sub**: Real-time messaging between services
- **Persistence**: Optional RDB/AOF for durability
- **Scalability**: Cluster mode for horizontal scaling

### 2. Why BullMQ over simple queues?
- **Reliability**: Retry logic, dead letter queues
- **Monitoring**: Built-in UI (Bull Board) for job monitoring
- **Rate Limiting**: Prevent overwhelming downstream services
- **Scheduling**: Delayed jobs, cron-like recurring jobs
- **Concurrency**: Control parallel job execution

### 3. Why Socket.IO over raw WebSockets?
- **Fallbacks**: Automatically falls back to HTTP long-polling
- **Rooms**: Easy channel-based broadcasting (`socket.join('shipment:123')`)
- **Acknowledgments**: Confirm message delivery
- **Reconnection**: Automatic reconnection with backoff
- **Namespaces**: Organize endpoints (`/ws`, `/ws-admin`)

### 4. Horizontal Scaling Considerations

**Current Implementation (Single Server)**:
- In-memory Socket.IO clients
- BullMQ workers on same server
- Redis for queue persistence

**Production Scaling**:
```typescript
// Use Redis adapter for Socket.IO
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const io = new Server(server);
io.adapter(createAdapter(pubClient, subClient));

// Multiple worker processes
// Each worker connects to same Redis queue
// BullMQ handles job distribution
```

### 5. Monitoring & Observability

```typescript
// Queue metrics
const queue = new Queue("shipments", { connection: redis });
const jobs = await queue.getJobs(["waiting", "active", "completed", "failed"]);
console.log(`Waiting: ${jobs.waiting.length}, Active: ${jobs.active.length}`);

// WebSocket metrics
io.of("/").adapter.on("error", (err) => console.error(err));
const sockets = await io.fetchSockets();
console.log(`Connected clients: ${sockets.length}`);
```

## Testing

```typescript
// Test WebSocket connection
const socket = io("http://localhost:4000", {
  auth: { token: testUserToken }
});

await new Promise((resolve) => socket.on("connect", resolve));

// Test shipment update
socket.emit("join_shipment", shipmentId);
socket.on("shipment_updated", (data) => {
  expect(data.status).toBe("DELIVERED");
});

// Test queue job
await addShipmentTrackingJob({...});
const jobs = await shipmentTrackingQueue.getJobs(["completed"]);
expect(jobs.length).toBe(1);
```

## Performance Considerations

1. **Connection Pooling**: Redis connection pool (default: 10 connections)
2. **Message Size**: Keep WebSocket messages < 1KB for low latency
3. **Room Management**: Clean up rooms when users disconnect
4. **Job Batching**: Process multiple updates in single job when possible
5. **Cache TTL**: Set appropriate TTLs to prevent stale data

## Security

1. **Authentication**: JWT validation on WebSocket connection
2. **Authorization**: Check user permissions before joining rooms
3. **Rate Limiting**: Limit WebSocket messages per second
4. **Input Validation**: Validate all incoming data
5. **CORS**: Restrict WebSocket origins in production

## Common Interview Questions

**Q: How do you handle real-time updates at scale?**
A: Use Redis pub/sub for message broadcasting across multiple server instances. Socket.IO Redis adapter allows multiple Node.js processes to share WebSocket connections.

**Q: What happens if Redis goes down?**
A: BullMQ jobs are persisted in Redis. If Redis fails, jobs are lost unless using Redis Cluster with persistence enabled. Consider Redis Sentinel for high availability.

**Q: How do you ensure message delivery?**
A: Socket.IO provides acknowledgments. For critical updates, implement a message queue with retry logic and store failed messages for manual retry.

**Q: When would you use WebSockets vs Server-Sent Events?**
A: 
- **WebSockets**: Bidirectional communication, low latency, complex interactions
- **SSE**: Unidirectional (server→client), simpler, better for notifications/feeds

**Q: How do you prevent memory leaks with WebSockets?**
A: 
- Implement heartbeat/ping-pong to detect dead connections
- Clean up event listeners on disconnect
- Limit concurrent connections per user
- Use WeakMap for client storage where possible

## Next Steps

1. **Add Bull Board** for queue monitoring:
   ```typescript
   import { createBullBoard } from "@bull-board/api";
   import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
   import { ExpressAdapter } from "@bull-board/express";
   
   const serverAdapter = new ExpressAdapter();
   createBullBoard([
     new BullMQAdapter(shipmentTrackingQueue),
     new BullMQAdapter(notificationQueue)
   ], serverAdapter);
   
   app.use("/admin/queues", serverAdapter);
   ```

2. **Implement Redis caching** for dashboard stats

3. **Add message persistence** for offline users

4. **Implement rate limiting** on WebSocket events

5. **Add metrics** (Prometheus/Grafana) for monitoring

## References

- [Socket.IO Documentation](https://socket.io/docs/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [ioredis Documentation](https://github.com/luin/ioredis)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)