import pino from "pino";

/**
 * Structured logger for HalalChain v2.0
 * Uses Pino for high-performance JSON logging
 */

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatter: (log) => {
    return {
      timestamp: new Date().toISOString(),
      level: log.level,
      message: log.msg,
      ...(log.data && { data: log.data }),
    };
  },
});

// Convenience methods for common log patterns
export const logAutomation = {
  ruleStart: (ruleName: string) =>
    logger.info({ event: "automation_rule_start", rule: ruleName }),
  
  ruleComplete: (ruleName: string, triggered: boolean, actions: number, duration: number) =>
    logger.info({
      event: "automation_rule_complete",
      rule: ruleName,
      triggered,
      actions,
      duration,
    }),
  
  ruleFailed: (ruleName: string, error: string) =>
    logger.error({
      event: "automation_rule_failed",
      rule: ruleName,
      error,
    }),
};

export const logBackup = {
  started: (type: string) =>
    logger.info({ event: "backup_started", type }),
  
  completed: (type: string, size: number, duration: number) =>
    logger.info({
      event: "backup_completed",
      type,
      size,
      duration,
    }),
  
  failed: (type: string, error: string) =>
    logger.error({
      event: "backup_failed",
      type,
      error,
    }),
};

export const logSystem = {
  configChanged: (key: string, oldValue: string, newValue: string, userId: string) =>
    logger.info({
      event: "config_changed",
      key,
      oldValue,
      newValue,
      userId,
    }),
  
  maintenanceModeChanged: (enabled: boolean, userId: string) =>
    logger.info({
      event: "maintenance_mode_changed",
      enabled,
      userId,
    }),
  
  featureFlagChanged: (flagKey: string, enabled: boolean, userId: string) =>
    logger.info({
      event: "feature_flag_changed",
      flagKey,
      enabled,
      userId,
    }),
};

export const logDependency = {
  up: (name: string, latency: number) =>
    logger.debug({ event: "dependency_check", name, status: "up", latency }),
  
  down: (name: string, error: string) =>
    logger.error({ event: "dependency_check", name, status: "down", error }),
  
  degraded: (name: string, latency: number, threshold: number) =>
    logger.warn({
      event: "dependency_check",
      name,
      status: "degraded",
      latency,
      threshold,
    }),
};

export default logger;