import { Router } from "express";
import { getAutomationRules, getAutomationRule, updateAutomationRule, executeRuleOnDemand, getRuleExecutionHistory, initializeDefaultRules } from "../lib/ruleManager";
import { authorize } from "../middleware/auth";
import { AuthRequest } from "../middleware/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const router = Router();

// Validation schemas
const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  cronSchedule: z.string().min(1).optional(),
  isEnabled: z.boolean().optional(),
});

/**
 * GET /api/admin/automation/rules
 * List all automation rules - ADMIN only
 */
router.get("/automation/rules", authorize(UserRole.ADMIN), async (_req, res) => {
  try {
    const rules = await getAutomationRules();
    res.json({ rules });
  } catch (error) {
    console.error("Failed to get automation rules:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get automation rules",
    });
  }
});

/**
 * GET /api/admin/automation/rules/:id
 * Get a specific automation rule - ADMIN only
 */
router.get("/automation/rules/:id", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const rule = await getAutomationRule(id);

    if (!rule) {
      return res.status(404).json({ error: "Automation rule not found" });
    }

    res.json({ rule });
  } catch (error) {
    console.error("Failed to get automation rule:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get automation rule",
    });
  }
});

/**
 * PATCH /api/admin/automation/rules/:id
 * Update an automation rule - ADMIN only
 */
router.patch("/automation/rules/:id", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const validation = updateRuleSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
    }

    const userId = req.user?.sub || "unknown";
    const updated = await updateAutomationRule(id, validation.data, userId);

    if (!updated) {
      return res.status(404).json({ error: "Automation rule not found" });
    }

    res.json({
      message: "Automation rule updated successfully",
      rule: updated,
    });
  } catch (error) {
    console.error("Failed to update automation rule:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update automation rule",
    });
  }
});

/**
 * POST /api/admin/automation/rules/:id/execute
 * Execute a rule on-demand - ADMIN only
 */
router.post("/automation/rules/:id/execute", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.sub || "unknown";

    const result = await executeRuleOnDemand(id, userId);

    if (!result.success) {
      return res.status(500).json({
        error: result.error || "Failed to execute rule",
        ...result,
      });
    }

    res.json({
      message: "Rule executed successfully",
      ...result,
    });
  } catch (error) {
    console.error("Failed to execute automation rule:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to execute automation rule",
    });
  }
});

/**
 * GET /api/admin/automation/rules/:id/history
 * Get execution history for a rule - ADMIN only
 */
router.get("/automation/rules/:id/history", authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const history = await getRuleExecutionHistory(id, limit);

    res.json({ history });
  } catch (error) {
    console.error("Failed to get rule execution history:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get rule execution history",
    });
  }
});

/**
 * POST /api/admin/automation/rules/initialize
 * Initialize default automation rules - ADMIN only
 */
router.post("/automation/rules/initialize", authorize(UserRole.ADMIN), async (_req, res) => {
  try {
    await initializeDefaultRules();
    res.json({
      message: "Default automation rules initialized successfully",
    });
  } catch (error) {
    console.error("Failed to initialize default rules:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to initialize default rules",
    });
  }
});

export default router;