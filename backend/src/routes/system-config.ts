import { Router } from "express";
import { getSystemConfig, getSystemConfigs, updateSystemConfig, createSystemConfig, deleteSystemConfig } from "../lib/systemConfig";
import { authorize, AuthRequest } from "../middleware/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const router = Router();

// Validation schemas
const updateConfigSchema = z.object({
  value: z.string().min(1),
});

const createConfigSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  isSecret: z.boolean().default(false),
});

/**
 * GET /api/admin/system/configs
 * List all system configs, optionally filtered by category - ADMIN only
 */
router.get("/configs", authorize(UserRole.ADMIN), async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const configs = await getSystemConfigs(category);
    res.json({ configs });
  } catch (error) {
    console.error("Failed to get configs:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get configs",
    });
  }
});

/**
 * GET /api/admin/system/configs/:key
 * Get a specific config by key - ADMIN only
 */
router.get("/configs/:key", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const value = await getSystemConfig(key);

    if (value === null) {
      return res.status(404).json({ error: "Config not found" });
    }

    res.json({ key, value });
  } catch (error) {
    console.error("Failed to get config:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get config",
    });
  }
});

/**
 * PATCH /api/admin/system/configs/:key
 * Update a config value - ADMIN only
 */
router.patch("/configs/:key", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const validation = updateConfigSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
    }

    const { value } = validation.data;
    const userId = req.user?.sub || "unknown";

    const updated = await updateSystemConfig(key, value, userId);

    if (!updated) {
      return res.status(404).json({ error: "Config not found" });
    }

    res.json({
      message: "Config updated successfully",
      config: updated,
    });
  } catch (error) {
    console.error("Failed to update config:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update config",
    });
  }
});

/**
 * POST /api/admin/system/configs
 * Create a new config - ADMIN only
 */
router.post("/configs", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const validation = createConfigSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
    }

    const { key, value, category, description, isSecret } = validation.data;
    const userId = req.user?.sub || "unknown";

    const created = await createSystemConfig(key, value, category, description, isSecret, userId);

    if (!created) {
      return res.status(500).json({ error: "Failed to create config" });
    }

    res.status(201).json({
      message: "Config created successfully",
      config: created,
    });
  } catch (error) {
    console.error("Failed to create config:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create config",
    });
  }
});

/**
 * DELETE /api/admin/system/configs/:key
 * Delete a config - ADMIN only
 */
router.delete("/configs/:key", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const userId = req.user?.sub || "unknown";

    const success = await deleteSystemConfig(key, userId);

    if (!success) {
      return res.status(404).json({ error: "Config not found" });
    }

    res.json({
      message: "Config deleted successfully",
      key,
    });
  } catch (error) {
    console.error("Failed to delete config:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete config",
    });
  }
});

export default router;