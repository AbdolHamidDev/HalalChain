import { Request, Response, NextFunction } from "express";
import { getSystemConfig } from "../lib/systemConfig";

export interface MaintenanceWindow {
  startAt: Date;
  endAt: Date;
  message?: string;
}

// In-memory cache for maintenance windows
let activeMaintenanceWindow: MaintenanceWindow | null = null;

/**
 * Check if system is in maintenance mode
 */
export async function isInMaintenanceMode(): Promise<boolean> {
  try {
    const enabled = await getSystemConfig("system.maintenance_mode");
    return enabled === "true";
  } catch (error) {
    console.error("Failed to check maintenance mode:", error);
    return false;
  }
}

/**
 * Set active maintenance window
 */
export function setMaintenanceWindow(window: MaintenanceWindow | null): void {
  activeMaintenanceWindow = window;
}

/**
 * Get active maintenance window
 */
export function getActiveMaintenanceWindow(): MaintenanceWindow | null {
  if (!activeMaintenanceWindow) return null;

  const now = new Date();
  if (now >= activeMaintenanceWindow.startAt && now <= activeMaintenanceWindow.endAt) {
    return activeMaintenanceWindow;
  }

  return null;
}

/**
 * Maintenance mode middleware
 * Blocks non-admin users during maintenance
 */
export async function maintenanceModeMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inMaintenance = await isInMaintenanceMode();
    const activeWindow = getActiveMaintenanceWindow();

    if (!inMaintenance && !activeWindow) {
      next();
      return;
    }

    // Allow admin users to bypass
    const userRole = (req as any).user?.role;
    if (userRole === "ADMIN") {
      next();
      return;
    }

    // Allow health check endpoints
    if (req.path.startsWith("/api/health")) {
      next();
      return;
    }

    // Return maintenance response
    const message = activeWindow?.message || "System under maintenance. Please check back later.";
    res.status(503).json({
      error: "System under maintenance",
      message,
      retryAfter: 3600, // 1 hour in seconds
    });
  } catch (error) {
    console.error("Maintenance mode check failed:", error);
    next();
  }
}