import { Router } from "express";
import { createDatabaseBackup, listBackups, restoreFromBackup, deleteBackup } from "../lib/backup";
import { authorize } from "../middleware/auth";
import { UserRole } from "@prisma/client";

const router = Router();

/**
 * POST /api/admin/system/backup
 * Trigger a manual database backup - ADMIN only
 */
router.post("/backup", authorize(UserRole.ADMIN), async (_req, res) => {
  try {
    const backup = await createDatabaseBackup("manual");
    
    if (!backup) {
      return res.status(500).json({ error: "Failed to create backup" });
    }

    res.status(201).json({
      message: "Backup created successfully",
      backup,
    });
  } catch (error) {
    console.error("Manual backup failed:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create backup",
    });
  }
});

/**
 * GET /api/admin/system/backups
 * List all available backups - ADMIN only
 */
router.get("/backups", authorize(UserRole.ADMIN), async (_req, res) => {
  try {
    const backups = await listBackups();
    res.json({ backups });
  } catch (error) {
    console.error("Failed to list backups:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to list backups",
    });
  }
});

/**
 * POST /api/admin/system/restore
 * Restore database from backup - ADMIN only
 */
router.post("/restore", authorize(UserRole.ADMIN), async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: "Filename is required" });
    }

    const success = await restoreFromBackup(filename);

    if (!success) {
      return res.status(500).json({ error: "Failed to restore backup" });
    }

    res.json({
      message: "Database restored successfully",
      filename,
    });
  } catch (error) {
    console.error("Restore failed:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to restore backup",
    });
  }
});

/**
 * DELETE /api/admin/system/backups/:filename
 * Delete a specific backup - ADMIN only
 */
router.delete("/backups/:filename", authorize(UserRole.ADMIN), async (req, res) => {
  try {
    const filename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;

    const success = await deleteBackup(filename);

    if (!success) {
      return res.status(404).json({ error: "Backup not found" });
    }

    res.json({
      message: "Backup deleted successfully",
      filename,
    });
  } catch (error) {
    console.error("Failed to delete backup:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete backup",
    });
  }
});

export default router;