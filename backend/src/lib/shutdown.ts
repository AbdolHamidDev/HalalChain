import { prisma } from "./prisma";
import redis from "./redis";

let isShuttingDown = false;

/**
 * Setup graceful shutdown handlers for SIGTERM and SIGINT
 */
export function setupGracefulShutdown(server: any): void {
  const gracefulShutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      console.log(`[Shutdown] Already shutting down, forcing exit...`);
      process.exit(1);
    }

    isShuttingDown = true;
    console.log(`[Shutdown] Received ${signal}, starting graceful shutdown...`);

    try {
      // 1. Stop accepting new connections
      console.log("[Shutdown] Closing HTTP server...");
      server.close();

      // 2. Wait a bit for in-flight requests to complete
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // 3. Disconnect from database
      console.log("[Shutdown] Disconnecting from database...");
      await prisma.$disconnect();

      // 4. Disconnect from Redis
      console.log("[Shutdown] Disconnecting from Redis...");
      await redis.quit();

      console.log("[Shutdown] Graceful shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("[Shutdown] Error during graceful shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    console.error("[Shutdown] Uncaught exception:", error);
    gracefulShutdown("uncaughtException");
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason) => {
    console.error("[Shutdown] Unhandled rejection:", reason);
    gracefulShutdown("unhandledRejection");
  });
}