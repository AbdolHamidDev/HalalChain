import { prisma } from "./prisma";
import { logger, logAutomation } from "./logger";
import { evaluateAllRules } from "./automation/engine";

export interface AutomationRuleData {
  id: string;
  name: string;
  type: string;
  cronSchedule: string;
  isEnabled: boolean;
  lastRunAt?: Date;
  lastRunStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleExecutionData {
  id: string;
  ruleId: string;
  triggered: boolean;
  actionsExecuted: number;
  duration: number;
  error?: string;
  executedAt: Date;
}

/**
 * Get all automation rules
 */
export async function getAutomationRules(): Promise<AutomationRuleData[]> {
  try {
    const rules = await prisma.automationRule.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        executions: {
          take: 1,
          orderBy: { executedAt: "desc" },
        },
      },
    });

    return rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      type: rule.type,
      cronSchedule: rule.cronSchedule,
      isEnabled: rule.isEnabled,
      lastRunAt: rule.lastRunAt ?? undefined,
      lastRunStatus: rule.lastRunStatus ?? undefined,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    }));
  } catch (error) {
    logger.error({ event: "get_automation_rules_failed", error });
    return [];
  }
}

/**
 * Get a specific automation rule
 */
export async function getAutomationRule(id: string): Promise<AutomationRuleData | null> {
  try {
    const rule = await prisma.automationRule.findUnique({
      where: { id },
      include: {
        executions: {
          take: 10,
          orderBy: { executedAt: "desc" },
        },
      },
    });

    if (!rule) return null;

    return {
      id: rule.id,
      name: rule.name,
      type: rule.type,
      cronSchedule: rule.cronSchedule,
      isEnabled: rule.isEnabled,
      lastRunAt: rule.lastRunAt ?? undefined,
      lastRunStatus: rule.lastRunStatus ?? undefined,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  } catch (error) {
    logger.error({ event: "get_automation_rule_failed", id, error });
    return null;
  }
}

/**
 * Update an automation rule
 */
export async function updateAutomationRule(
  id: string,
  data: {
    name?: string;
    cronSchedule?: string;
    isEnabled?: boolean;
  },
  userId: string
): Promise<AutomationRuleData | null> {
  try {
    const existing = await prisma.automationRule.findUnique({
      where: { id },
    });

    if (!existing) {
      logger.warn({ event: "automation_rule_not_found", id });
      return null;
    }

    const updated = await prisma.automationRule.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.cronSchedule !== undefined && { cronSchedule: data.cronSchedule }),
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
      },
    });

    logger.info({
      event: "automation_rule_updated",
      ruleId: id,
      ruleName: updated.name,
      userId,
      changes: data,
    });

    return {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      cronSchedule: updated.cronSchedule,
      isEnabled: updated.isEnabled,
      lastRunAt: updated.lastRunAt ?? undefined,
      lastRunStatus: updated.lastRunStatus ?? undefined,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  } catch (error) {
    logger.error({ event: "update_automation_rule_failed", id, error });
    return null;
  }
}

/**
 * Execute a rule on-demand
 */
export async function executeRuleOnDemand(id: string, userId: string): Promise<{
  success: boolean;
  triggered: boolean;
  actions: number;
  duration: number;
  error?: string;
}> {
  try {
    const rule = await prisma.automationRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return { success: false, triggered: false, actions: 0, duration: 0, error: "Rule not found" };
    }

    if (!rule.isEnabled) {
      return { success: false, triggered: false, actions: 0, duration: 0, error: "Rule is disabled" };
    }

    const startTime = Date.now();
    logAutomation.ruleStart(rule.name);

    try {
      const results = await evaluateAllRules();
      const duration = Date.now() - startTime;

      // Find the result for this specific rule type
      const ruleResult = results.find((r) => r.ruleName === rule.name);
      const triggered = ruleResult?.triggered ?? false;
      const actions = ruleResult?.actions.length ?? 0;

      // Record execution
      await prisma.ruleExecution.create({
        data: {
          ruleId: id,
          triggered,
          actionsExecuted: actions,
          duration,
        },
      });

      // Update rule last run info
      await prisma.automationRule.update({
        where: { id },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: "success",
        },
      });

      logAutomation.ruleComplete(rule.name, triggered, actions, duration);
      logger.info({
        event: "rule_executed_on_demand",
        ruleId: id,
        ruleName: rule.name,
        triggered,
        actions,
        duration,
        userId,
      });

      return { success: true, triggered, actions, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Record failed execution
      await prisma.ruleExecution.create({
        data: {
          ruleId: id,
          triggered: false,
          actionsExecuted: 0,
          duration,
          error: errorMessage,
        },
      });

      // Update rule last run info
      await prisma.automationRule.update({
        where: { id },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: "failed",
        },
      });

      logAutomation.ruleFailed(rule.name, errorMessage);
      logger.error({
        event: "rule_execution_failed",
        ruleId: id,
        ruleName: rule.name,
        error: errorMessage,
        userId,
      });

      return { success: false, triggered: false, actions: 0, duration, error: errorMessage };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ event: "execute_rule_on_demand_failed", id, error: errorMessage });
    return { success: false, triggered: false, actions: 0, duration: 0, error: errorMessage };
  }
}

/**
 * Get execution history for a rule
 */
export async function getRuleExecutionHistory(ruleId: string, limit: number = 20): Promise<RuleExecutionData[]> {
  try {
    const executions = await prisma.ruleExecution.findMany({
      where: { ruleId },
      orderBy: { executedAt: "desc" },
      take: limit,
    });

    return executions.map((exec) => ({
      id: exec.id,
      ruleId: exec.ruleId,
      triggered: exec.triggered,
      actionsExecuted: exec.actionsExecuted,
      duration: exec.duration,
      error: exec.error ?? undefined,
      executedAt: exec.executedAt,
    }));
  } catch (error) {
    logger.error({ event: "get_rule_execution_history_failed", ruleId, error });
    return [];
  }
}

/**
 * Initialize default automation rules from hardcoded configs
 */
export async function initializeDefaultRules(): Promise<void> {
  try {
    const existingRules = await prisma.automationRule.findMany();
    if (existingRules.length > 0) {
      logger.info({ event: "automation_rules_already_initialized", count: existingRules.length });
      return;
    }

    const defaultRules = [
      {
        name: "Certificate Expiring",
        type: "CERTIFICATE_EXPIRING",
        cronSchedule: "0 8 * * *",
        isEnabled: true,
      },
      {
        name: "Certificate Expired",
        type: "CERTIFICATE_EXPIRED",
        cronSchedule: "0 8 * * *",
        isEnabled: true,
      },
      {
        name: "Low Inventory",
        type: "LOW_INVENTORY",
        cronSchedule: "0 8 * * *",
        isEnabled: true,
      },
      {
        name: "Shipment Delay",
        type: "SHIPMENT_DELAY",
        cronSchedule: "0 8 * * *",
        isEnabled: true,
      },
    ];

    await prisma.automationRule.createMany({
      data: defaultRules,
    });

    logger.info({ event: "default_automation_rules_created", count: defaultRules.length });
  } catch (error) {
    logger.error({ event: "initialize_default_rules_failed", error });
  }
}