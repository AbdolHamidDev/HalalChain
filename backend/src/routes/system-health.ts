import { Router } from "express";
import { getSystemHealth, checkDatabase, checkRedis } from "../lib/healthChecks";
import { authorize } from "../middleware/auth";
import { UserRole } from "@prisma/client";

const router = Router();

/**
 * GET /api/admin/system/health
 * Comprehensive health check - ADMIN only
 */
router.get("/health", authorize(UserRole.ADMIN), async (_req, res) => {
  try {
    const health = await getSystemHealth();
    const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 503 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/admin/system/health/database
 * Quick database health check
 */
router.get("/health/database", authorize(UserRole.ADMIN), async (_req, res) => {
  try {
    const health = await checkDatabase();
    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: "down",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/admin/system/health/redis
 * Quick Redis health check
 */
router.get("/health/redis", authorize(UserRole.ADMIN), async (_req, res) => {
  try {
    const health = await checkRedis();
    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: "down",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;