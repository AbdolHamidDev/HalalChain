import { Router } from "express";
import { getFeatureFlags, getFeatureFlag, updateFeatureFlag, createFeatureFlag, deleteFeatureFlag, isFeatureEnabled } from "../lib/featureFlags";
import { authorize } from "../middleware/auth";
import { AuthRequest } from "../middleware/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const router = Router();

// Validation schemas
const updateFlagSchema = z.object({
  enabled: z.boolean().optional(),
  description: z.string().optional(),
  rollout: z.number().min(0).max(100).optional(),
});

const createFlagSchema = z.object({
  key: z.string().min(1),
  enabled: z.boolean().default(false),
  description: z.string().optional(),
  rollout: z.number().min(0).max(100).default(100),
});

/**
 * GET /api/admin/feature-flags
 * List all feature flags - ADMIN only
 */
router.get("/feature-flags", authorize(UserRole.ADMIN), async (_req, res) => {
  try {
    const flags = await getFeatureFlags();
    res.json({ flags });
  } catch (error) {
    console.error("Failed to get feature flags:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get feature flags",
    });
  }
});

/**
 * GET /api/admin/feature-flags/:id
 * Get a specific feature flag - ADMIN only
 */
router.get("/feature-flags/:id", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const flag = await getFeatureFlag(id);

    if (!flag) {
      return res.status(404).json({ error: "Feature flag not found" });
    }

    res.json({ flag });
  } catch (error) {
    console.error("Failed to get feature flag:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get feature flag",
    });
  }
});

/**
 * PATCH /api/admin/feature-flags/:id
 * Update a feature flag - ADMIN only
 */
router.patch("/feature-flags/:id", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const validation = updateFlagSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
    }

    const userId = req.user?.sub || "unknown";
    const updated = await updateFeatureFlag(id, validation.data, userId);

    if (!updated) {
      return res.status(404).json({ error: "Feature flag not found" });
    }

    res.json({
      message: "Feature flag updated successfully",
      flag: updated,
    });
  } catch (error) {
    console.error("Failed to update feature flag:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update feature flag",
    });
  }
});

/**
 * POST /api/admin/feature-flags
 * Create a new feature flag - ADMIN only
 */
router.post("/feature-flags", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const validation = createFlagSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
    }

    const { key, enabled, description, rollout } = validation.data;
    const userId = req.user?.sub || "unknown";

    const created = await createFeatureFlag(key, enabled, description, rollout, userId);

    if (!created) {
      return res.status(500).json({ error: "Failed to create feature flag" });
    }

    res.status(201).json({
      message: "Feature flag created successfully",
      flag: created,
    });
  } catch (error) {
    console.error("Failed to create feature flag:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create feature flag",
    });
  }
});

/**
 * DELETE /api/admin/feature-flags/:id
 * Delete a feature flag - ADMIN only
 */
router.delete("/feature-flags/:id", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.sub || "unknown";

    const success = await deleteFeatureFlag(id, userId);

    if (!success) {
      return res.status(404).json({ error: "Feature flag not found" });
    }

    res.json({
      message: "Feature flag deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Failed to delete feature flag:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete feature flag",
    });
  }
});

/**
 * GET /api/feature-flags/:key/check
 * Check if a feature flag is enabled (public endpoint for frontend)
 */
router.get("/feature-flags/:key/check", async (req: AuthRequest, res) => {
  try {
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const userId = req.user?.sub; // Optional: from auth middleware if available

    const enabled = await isFeatureEnabled(key, userId);
    res.json({ key, enabled });
  } catch (error) {
    console.error("Failed to check feature flag:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to check feature flag",
    });
  }
});

export default router;