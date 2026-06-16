import type { NotificationType } from "@prisma/client";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AutomationRuleResult {
  ruleName: string;
  triggered: boolean;
  actions: AutomationAction[];
}

export interface AutomationAction {
  type: "NOTIFICATION" | "ALERT" | "EMAIL";
  severity: Severity;
  title: string;
  message: string;
  notificationType?: NotificationType;
  userIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface ComplianceFactor {
  factor: string;
  weight: number;
  deduction: number;
  detail: string;
}

export interface ComplianceScore {
  score: number;
  factors: ComplianceFactor[];
}

export interface DailyDedupKey {
  /**
   * Unique key per rule per entity per day.
   * Format: `${ruleName}-${entityId}-${YYYY-MM-DD}`
   */
  key: string;
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}