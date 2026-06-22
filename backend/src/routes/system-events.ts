import { Router } from "express";
import { getSystemEvents, cleanupOldEvents } from "../lib/systemEvents";
import { authorize } from "../middleware/auth";
import { AuthRequest } from "../middleware/auth";
import { UserRole } from "@prisma/client";

const router = Router();

/**
 * GET /api/admin/system/events
 * Get system events with optional filtering - ADMIN only
 */
router.get("/system/events", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const type = req.query.type as string | undefined;
    const severity = req.query.severity as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await getSystemEvents({
      type,
      severity,
      limit,
      offset,
    });

    res.json({
      events: result.events,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Failed to get system events:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get system events",
    });
  }
});

/**
 * DELETE /api/admin/system/events/cleanup
 * Cleanup old system events - ADMIN only
 */
router.delete("/system/events/cleanup", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const retentionDays = parseInt(req.query.retentionDays as string) || 90;
    const deletedCount = await cleanupOldEvents(retentionDays);

    res.json({
      message: "Old events cleaned up successfully",
      deletedCount,
      retentionDays,
    });
  } catch (error) {
    console.error("Failed to cleanup system events:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to cleanup system events",
    });
  }
});

export default router;