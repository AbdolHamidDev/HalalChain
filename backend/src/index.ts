import "dotenv/config";
import app from "./app";
import { httpServer } from "./app";
import { startScheduler } from "./lib/scheduler";
import { startWorkers } from "./lib/queue";

const PORT = Number(process.env.PORT) || 4000;

httpServer.listen(PORT, () => {
  console.log(`HalalChain API running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}/ws`);
  startScheduler();
  startWorkers();
});
