# Real-Time Features Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install:
- `ioredis` - Redis client
- `socket.io` - WebSocket server
- `bullmq` - Queue system

### 2. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify Redis is running
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### 3. Configure Environment

Add to `backend/.env`:

```env
# Redis
REDIS_URL=redis://localhost:6379

# JWT (required for WebSocket auth)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 4. Run Database Migrations

```bash
cd backend
npm run db:migrate
```

### 5. Start the Server

```bash
npm run dev
```

You should see:
```
[Redis] Connected
HalalChain API running on http://localhost:4000
WebSocket server running on ws://localhost:4000/ws
[AutomationScheduler] Scheduled daily at 08:00
[ShipmentWorker] Ready
[NotificationWorker] Ready
[EmailWorker] Ready
```

## Frontend Integration

### Install Socket.IO Client

```bash
cd frontend
npm install socket.io-client
```

### Create WebSocket Service

```typescript
// frontend/src/lib/socket.ts
import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
      auth: {
        token
      }
    });

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    this.socket.on("connect_error", (err) => {
      console.error("WebSocket error:", err);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  // Shipment tracking
  joinShipment(shipmentId: string) {
    this.socket?.emit("join_shipment", shipmentId);
  }

  leaveShipment(shipmentId: string) {
    this.socket?.emit("leave_shipment", shipmentId);
  }

  onShipmentUpdate(callback: (data: any) => void) {
    this.socket?.on("shipment_updated", callback);
  }

  // Notifications
  onNotificationCreated(callback: (data: any) => void) {
    this.socket?.on("notification_created", callback);
  }

  // Activity feed
  onActivityCreated(callback: (data: any) => void) {
    this.socket?.on("activity_created", callback);
  }

  // Heartbeat
  onHeartbeat(callback: (data: any) => void) {
    this.socket?.on("heartbeat", callback);
  }
}

export const socketService = new SocketService();
```

### Use in React Components

```typescript
// Example: Shipment tracking page
import { useEffect } from "react";
import { socketService } from "@/lib/socket";

function ShipmentTracker({ shipmentId }: { shipmentId: string }) {
  useEffect(() => {
    // Join shipment room
    socketService.joinShipment(shipmentId);

    // Listen for updates
    const handleUpdate = (data) => {
      console.log("Shipment updated:", data);
      // Update your state here
      setShipmentStatus(data.status);
      setLocation(data.location);
    };

    socketService.onShipmentUpdate(handleUpdate);

    // Cleanup
    return () => {
      socketService.leaveShipment(shipmentId);
      socketService.onShipmentUpdate(handleUpdate); // Remove listener
    };
  }, [shipmentId]);

  return <div>Tracking shipment {shipmentId}...</div>;
}
```

```typescript
// Example: Notification bell
import { useEffect, useState } from "react";
import { socketService } from "@/lib/socket";

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleNotification = (notification) => {
      if (!notification.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    };

    socketService.onNotificationCreated(handleNotification);

    return () => {
      socketService.onNotificationCreated(handleNotification);
    };
  }, []);

  return (
    <div className="notification-bell">
      <span>🔔</span>
      {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
    </div>
  );
}
```

## Testing the Features

### Test WebSocket Connection

```bash
# Install wscat for testing
npm install -g wscat

# Connect to WebSocket (replace TOKEN with actual JWT)
wscat -c "ws://localhost:4000/ws" -H "Authorization: Bearer TOKEN"
```

### Test Queue Jobs

```typescript
// In Node.js script or API endpoint
import { addShipmentTrackingJob, addNotificationJob } from "./lib/queue";

// Test shipment tracking
await addShipmentTrackingJob({
  shipmentId: "test-shipment-id",
  status: "IN_TRANSIT",
  location: "Singapore Port",
  notes: "Customs cleared"
});

// Test notification
await addNotificationJob({
  userId: "user-id",
  type: "SHIPMENT_UPDATE",
  title: "Shipment Update",
  message: "Your shipment is in transit"
});
```

### Monitor Queues

```bash
# Install Bull Board for queue monitoring UI
npm install @bull-board/api @bull-board/express

# Add to app.ts (see docs/REALTIME_ARCHITECTURE.md for code)
```

## Production Deployment

### 1. Use Redis Cluster

```yaml
# docker-compose.prod.yml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
```

### 2. Enable Redis Persistence

```bash
# In redis.conf
appendonly yes
appendfsync everysec
save 900 1
save 300 10
save 60 10000
```

### 3. Use Socket.IO Redis Adapter

```typescript
// For horizontal scaling across multiple servers
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const io = new Server(server);
const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### 4. Environment Variables (Production)

```env
REDIS_URL=redis://your-redis-host:6379
REDIS_PASSWORD=your-redis-password
JWT_SECRET=your-production-jwt-secret-256-bit
NODE_ENV=production
```

### 5. Health Checks

```typescript
// Add to app.ts
app.get("/api/health/redis", async (req, res) => {
  try {
    await redis.ping();
    res.json({ status: "ok", redis: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", redis: "disconnected" });
  }
});

app.get("/api/health/queues", async (req, res) => {
  try {
    const queues = {
      shipment: await shipmentTrackingQueue.getJobCounts(),
      notification: await notificationQueue.getJobCounts(),
      email: await emailQueue.getJobCounts()
    };
    res.json({ status: "ok", queues });
  } catch (err) {
    res.status(500).json({ status: "error", queues: null });
  }
});
```

## Troubleshooting

### Redis Connection Issues

```bash
# Check if Redis is running
docker-compose ps redis

# Check Redis logs
docker-compose logs redis

# Test connection
redis-cli ping
```

### WebSocket Connection Fails

1. Check JWT_SECRET is set in .env
2. Verify token is valid (not expired)
3. Check CORS settings in websocket.ts
4. Ensure frontend is sending token in auth object

### Queue Jobs Not Processing

1. Verify Redis is running
2. Check worker logs for errors
3. Ensure workers are started (check index.ts)
4. Check queue connection in queue.ts

### High Memory Usage

```typescript
// Limit Redis memory
// In redis.conf or docker-compose:
command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

## Performance Tuning

### Redis Connection Pool

```typescript
// Already configured in redis.ts
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  // Add these for production:
  keepAlive: true,
  family: 4, // IPv4
  connectTimeout: 10000,
  commandTimeout: 5000,
});
```

### BullMQ Concurrency

```typescript
// In queue.ts, adjust worker concurrency
const shipmentWorker = new Worker("shipment-tracking", async (job) => {
  // Process job
}, {
  connection: redis,
  concurrency: 5, // Process 5 jobs simultaneously
  limiter: {
    max: 100, // Max 100 jobs
    duration: 1000 // Per second
  }
});
```

### WebSocket Scaling

```typescript
// Use sticky sessions for Socket.IO
// In production load balancer (nginx):
// ip_hash; directive ensures same client goes to same server

// Or use Socket.IO Redis adapter for multi-server
```

## Monitoring

### Key Metrics to Track

1. **Redis**:
   - Memory usage
   - Connected clients
   - Commands per second
   - Hit/miss ratio

2. **BullMQ**:
   - Queue lengths (waiting, active, completed, failed)
   - Job processing time
   - Failure rate
   - Worker count

3. **WebSocket**:
   - Connected clients
   - Messages per second
   - Room counts
   - Connection duration

### Example Monitoring Script

```typescript
// scripts/monitor.ts
import { redis } from "../src/lib/redis";
import { shipmentTrackingQueue, notificationQueue } from "../src/lib/queue";

async function monitor() {
  setInterval(async () => {
    // Redis info
    const redisInfo = await redis.info("stats");
    
    // Queue stats
    const shipmentStats = await shipmentTrackingQueue.getJobCounts();
    const notificationStats = await notificationQueue.getJobCounts();
    
    console.log({
      timestamp: new Date().toISOString(),
      redis: redisInfo,
      queues: {
        shipment: shipmentStats,
        notification: notificationStats
      }
    });
  }, 30000); // Every 30 seconds
}

monitor();
```

## Security Checklist

- [ ] JWT_SECRET is strong and unique (256-bit random)
- [ ] Redis has password protection in production
- [ ] WebSocket CORS is restricted to your domain
- [ ] Rate limiting is enabled on WebSocket events
- [ ] Input validation on all queue jobs
- [ ] Redis is not exposed to public internet
- [ ] Queue job data is sanitized
- [ ] WebSocket authentication is required
- [ ] Monitor for suspicious connection patterns

## Cost Estimation

### Redis (Redis Cloud or AWS ElastiCache)
- **Development**: Free tier (30MB)
- **Production**: ~$15-50/month for small-medium apps

### BullMQ
- **Cost**: Free (open source)
- **Infrastructure**: Uses existing Redis

### Socket.IO
- **Cost**: Free (open source)
- **Scaling**: May need load balancer (~$20/month)

### Total Monthly Cost
- **Small App** (< 1000 users): ~$15-30/month
- **Medium App** (1000-10000 users): ~$50-100/month
- **Large App** (> 10000 users): ~$200+/month

## Support

For issues or questions:
1. Check the main documentation: `docs/REALTIME_ARCHITECTURE.md`
2. Review logs: `docker-compose logs redis`
3. Test Redis connection: `redis-cli ping`
4. Check queue status: Bull Board UI (if configured)