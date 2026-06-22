import cron from "node-cron";
import { evaluateAllRules } from "./automation/engine";
import { createDatabaseBackup, cleanupOldBackups } from "./backup";
import { runAllCleanupTasks } from "./cleanup";
import { logger } from "./logger";

/**
 * Start all automated scheduler jobs.
 *
 * Replaces the previous single-job scheduler with the automation engine
 * which evaluates multiple rules in a single cron execution.
 *
 * Schedule: Daily at 08:00 AM (same as before)
 * Rules evaluated:
 *   - Certificate Expiring Soon
 *   - Certificate Expired (NEW)
 *   - Low Inventory Scan (NEW — scheduled, previously only movement-triggered)
 *   - Shipment Delay Detection (NEW)
 *
 * All rules include deduplication logic to prevent duplicate notifications.
 */
export function startScheduler(): void {
  // Daily automation rules at 08:00
  cron.schedule("0 8 * * *", async () => {
    logger.info({ event: "scheduler_automation_started" });
    console.log("[AutomationScheduler] Starting daily rule evaluation...");
    try {
      const results = await evaluateAllRules();
      const triggered = results.filter((r) => r.triggered);
      const totalActions = triggered.reduce((sum, r) => sum + r.actions.length, 0);

      logger.info({
        event: "scheduler_automation_completed",
        triggered: triggered.length,
        total: results.length,
        actions: totalActions,
      });

      console.log(
        `[AutomationScheduler] Completed. ` +
        `${triggered.length}/${results.length} rules triggered, ` +
        `${totalActions} actions executed.`
      );

      for (const result of triggered) {
        console.log(
          `  ✓ ${result.ruleName}: ${result.actions.length} action(s)`
        );
      }
    } catch (err) {
      logger.error({ event: "scheduler_automation_failed", error: err });
      console.error("[AutomationScheduler] Failed:", err);
    }
  });

  // Daily database backup at 02:00
  cron.schedule("0 2 * * *", async () => {
    logger.info({ event: "scheduler_backup_started" });
    console.log("[BackupScheduler] Starting daily backup...");
    try {
      const backup = await createDatabaseBackup("scheduled");
      if (backup) {
        logger.info({ event: "scheduler_backup_completed", filename: backup.filename, size: backup.size });
        console.log(`[BackupScheduler] Backup completed: ${backup.filename}`);
      } else {
        logger.error({ event: "scheduler_backup_failed" });
        console.error("[BackupScheduler] Backup failed");
      }
    } catch (err) {
      logger.error({ event: "scheduler_backup_failed", error: err });
      console.error("[BackupScheduler] Failed:", err);
    }
  });

  // Weekly cleanup on Sunday at 03:00
  cron.schedule("0 3 * * 0", async () => {
    logger.info({ event: "scheduler_cleanup_started" });
    console.log("[CleanupScheduler] Starting weekly cleanup...");
    try {
      const results = await runAllCleanupTasks();
      logger.info({ event: "scheduler_cleanup_completed", results });
      console.log(`[CleanupScheduler] Cleanup completed:`, results);
    } catch (err) {
      logger.error({ event: "scheduler_cleanup_failed", error: err });
      console.error("[CleanupScheduler] Failed:", err);
    }
  });

  // Daily backup cleanup at 04:00
  cron.schedule("0 4 * * *", async () => {
    logger.info({ event: "scheduler_backup_cleanup_started" });
    try {
      const deletedCount = await cleanupOldBackups();
      logger.info({ event: "scheduler_backup_cleanup_completed", deletedCount });
      console.log(`[BackupScheduler] Cleaned up ${deletedCount} old backups`);
    } catch (err) {
      logger.error({ event: "scheduler_backup_cleanup_failed", error: err });
      console.error("[BackupScheduler] Cleanup failed:", err);
    }
  });

  console.log("[Scheduler] All jobs scheduled:");
  console.log("  - Automation rules: daily at 08:00");
  console.log("  - Database backup: daily at 02:00");
  console.log("  - Backup cleanup: daily at 04:00");
  console.log("  - Data cleanup: weekly on Sunday at 03:00");
}
