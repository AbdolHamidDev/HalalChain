import "dotenv/config";
import app from "./app";
import { httpServer } from "./app";
import { startScheduler } from "./lib/scheduler";
import { startWorkers } from "./lib/queue";
import { logRedisMetrics, logQueueMetrics } from "./lib/redisMonitor";

const PORT = Number(process.env.PORT) || 4000;

httpServer.listen(PORT, () => {
  console.log(`HalalChain API running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}/ws`);
  startScheduler();
  startWorkers();

  // Log Redis and Queue metrics every 5 minutes
  setInterval(() => {
    logRedisMetrics();
    logQueueMetrics();
  }, 5 * 60 * 1000);

  // Initial metrics log after 30 seconds
  setTimeout(() => {
    logRedisMetrics();
    logQueueMetrics();
  }, 30000);
});
