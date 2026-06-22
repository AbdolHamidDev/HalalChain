import { prisma } from "./prisma";
import { logger, logSystem } from "./logger";

export interface FeatureFlagData {
  id: string;
  key: string;
  enabled: boolean;
  description?: string;
  rollout?: number;
}

/**
 * Get all feature flags
 */
export async function getFeatureFlags(): Promise<FeatureFlagData[]> {
  try {
    const flags = await prisma.featureFlag.findMany({
      orderBy: { key: "asc" },
    });

    return flags.map((flag) => ({
      id: flag.id,
      key: flag.key,
      enabled: flag.enabled,
      description: flag.description ?? undefined,
      rollout: flag.rollout ?? undefined,
    }));
  } catch (error) {
    logger.error({ event: "get_feature_flags_failed", error });
    return [];
  }
}

/**
 * Get a specific feature flag by key
 */
export async function getFeatureFlag(key: string): Promise<FeatureFlagData | null> {
  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { key },
    });

    if (!flag) return null;

    return {
      id: flag.id,
      key: flag.key,
      enabled: flag.enabled,
      description: flag.description ?? undefined,
      rollout: flag.rollout ?? undefined,
    };
  } catch (error) {
    logger.error({ event: "get_feature_flag_failed", key, error });
    return null;
  }
}

/**
 * Check if a feature flag is enabled for a user
 */
export async function isFeatureEnabled(key: string, userId?: string): Promise<boolean> {
  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { key },
    });

    if (!flag || !flag.enabled) {
      return false;
    }

    // If rollout is set, check if user is in the rollout percentage
    if (flag.rollout !== null && flag.rollout !== undefined && userId) {
      // Simple hash-based rollout: hash userId % 100 < rollout
      const hash = hashCode(userId);
      const percentage = Math.abs(hash % 100);
      return percentage < flag.rollout;
    }

    return true;
  } catch (error) {
    logger.error({ event: "check_feature_flag_failed", key, error });
    return false;
  }
}

/**
 * Update a feature flag
 */
export async function updateFeatureFlag(
  id: string,
  data: { enabled?: boolean; description?: string; rollout?: number },
  userId: string
): Promise<FeatureFlagData | null> {
  try {
    const existing = await prisma.featureFlag.findUnique({
      where: { id },
    });

    if (!existing) {
      logger.warn({ event: "feature_flag_not_found", id });
      return null;
    }

    const updated = await prisma.featureFlag.update({
      where: { id },
      data: {
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.rollout !== undefined && { rollout: data.rollout }),
        updatedBy: userId,
      },
    });

    logSystem.featureFlagChanged(updated.key, updated.enabled, userId);
    logger.info({ event: "feature_flag_updated", key: updated.key, userId });

    return {
      id: updated.id,
      key: updated.key,
      enabled: updated.enabled,
      description: updated.description ?? undefined,
      rollout: updated.rollout ?? undefined,
    };
  } catch (error) {
    logger.error({ event: "update_feature_flag_failed", id, error });
    return null;
  }
}

/**
 * Create a new feature flag
 */
export async function createFeatureFlag(
  key: string,
  enabled: boolean = false,
  description?: string,
  rollout: number = 100,
  userId?: string
): Promise<FeatureFlagData | null> {
  try {
    const created = await prisma.featureFlag.create({
      data: {
        key,
        enabled,
        description,
        rollout,
        updatedBy: userId,
      },
    });

    logSystem.featureFlagChanged(key, enabled, userId ?? "system");
    logger.info({ event: "feature_flag_created", key, userId });

    return {
      id: created.id,
      key: created.key,
      enabled: created.enabled,
      description: created.description ?? undefined,
      rollout: created.rollout ?? undefined,
    };
  } catch (error) {
    logger.error({ event: "create_feature_flag_failed", key, error });
    return null;
  }
}

/**
 * Delete a feature flag
 */
export async function deleteFeatureFlag(id: string, userId: string): Promise<boolean> {
  try {
    await prisma.featureFlag.delete({
      where: { id },
    });

    logger.info({ event: "feature_flag_deleted", id, userId });
    return true;
  } catch (error) {
    logger.error({ event: "delete_feature_flag_failed", id, error });
    return false;
  }
}

/**
 * Simple hash function for userId-based rollout
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}