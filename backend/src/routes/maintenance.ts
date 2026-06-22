import { Router } from "express";
import { isInMaintenanceMode, setMaintenanceWindow, getActiveMaintenanceWindow } from "../middleware/maintenance";
import { authorize } from "../middleware/auth";
import { AuthRequest } from "../middleware/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const router = Router();

// Validation schemas
const maintenanceWindowSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  message: z.string().optional(),
});

/**
 * GET /api/admin/maintenance/status
 * Get current maintenance status - ADMIN only
 */
router.get("/maintenance/status", authorize(UserRole.ADMIN), async (_req, res) => {
  try {
    const inMaintenance = await isInMaintenanceMode();
    const activeWindow = getActiveMaintenanceWindow();

    res.json({
      inMaintenance,
      activeWindow: activeWindow ? {
        startAt: activeWindow.startAt,
        endAt: activeWindow.endAt,
        message: activeWindow.message,
      } : null,
    });
  } catch (error) {
    console.error("Failed to get maintenance status:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get maintenance status",
    });
  }
});

/**
 * POST /api/admin/maintenance/enable
 * Enable maintenance mode - ADMIN only
 */
router.post("/maintenance/enable", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const validation = maintenanceWindowSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
    }

    const { startAt, endAt, message } = validation.data;

    // Set maintenance window
    setMaintenanceWindow({
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      message,
    });

    // Note: In a real implementation, you would update the system config here
    // For now, we're using the in-memory window
    const userId = req.user?.sub || "unknown";

    res.json({
      message: "Maintenance mode enabled",
      window: {
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        message,
      },
      userId,
    });
  } catch (error) {
    console.error("Failed to enable maintenance mode:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to enable maintenance mode",
    });
  }
});

/**
 * POST /api/admin/maintenance/disable
 * Disable maintenance mode - ADMIN only
 */
router.post("/maintenance/disable", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    setMaintenanceWindow(null);
    const userId = req.user?.sub || "unknown";

    res.json({
      message: "Maintenance mode disabled",
      userId,
    });
  } catch (error) {
    console.error("Failed to disable maintenance mode:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to disable maintenance mode",
    });
  }
});

export default router;