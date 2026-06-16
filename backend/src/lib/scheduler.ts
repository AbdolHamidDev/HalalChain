import cron from "node-cron";
import { evaluateAllRules } from "./automation/engine";

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
  cron.schedule("0 8 * * *", async () => {
    console.log("[AutomationScheduler] Starting daily rule evaluation...");
    try {
      const results = await evaluateAllRules();
      const triggered = results.filter((r) => r.triggered);
      const totalActions = triggered.reduce((sum, r) => sum + r.actions.length, 0);

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
      console.error("[AutomationScheduler] Failed:", err);
    }
  });

  console.log("[AutomationScheduler] Scheduled daily at 08:00");
}