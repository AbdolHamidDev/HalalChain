import { prisma } from "./prisma";
import { logger, logSystem } from "./logger";

export interface SystemConfigValue {
  key: string;
  value: string;
  category: string;
  description?: string;
  isSecret: boolean;
}

/**
 * Get a system config value by key
 */
export async function getSystemConfig(key: string): Promise<string | null> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key },
    });
    return config?.value ?? null;
  } catch (error) {
    logger.error({ event: "get_config_failed", key, error });
    return null;
  }
}

/**
 * Get all system configs, optionally filtered by category
 */
export async function getSystemConfigs(category?: string): Promise<SystemConfigValue[]> {
  try {
    const where = category ? { category } : {};
    const configs = await prisma.systemConfig.findMany({
      where,
      orderBy: { category: "asc" },
    });

    return configs.map((config) => ({
      key: config.key,
      value: config.isSecret ? "***" : config.value,
      category: config.category,
      description: config.description ?? undefined,
      isSecret: config.isSecret,
    }));
  } catch (error) {
    logger.error({ event: "get_configs_failed", category, error });
    return [];
  }
}

/**
 * Update a system config value
 */
export async function updateSystemConfig(
  key: string,
  value: string,
  userId: string
): Promise<SystemConfigValue | null> {
  try {
    const existing = await prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!existing) {
      logger.warn({ event: "config_not_found", key });
      return null;
    }

    const oldValue = existing.value;
    const updated = await prisma.systemConfig.update({
      where: { key },
      data: {
        value,
        updatedBy: userId,
      },
    });

    logSystem.configChanged(key, oldValue, value, userId);
    logger.info({ event: "config_updated", key, userId });

    return {
      key: updated.key,
      value: updated.isSecret ? "***" : updated.value,
      category: updated.category,
      description: updated.description ?? undefined,
      isSecret: updated.isSecret,
    };
  } catch (error) {
    logger.error({ event: "update_config_failed", key, error });
    return null;
  }
}

/**
 * Create a new system config
 */
export async function createSystemConfig(
  key: string,
  value: string,
  category: string,
  description?: string,
  isSecret: boolean = false,
  userId?: string
): Promise<SystemConfigValue | null> {
  try {
    const created = await prisma.systemConfig.create({
      data: {
        key,
        value,
        category,
        description,
        isSecret,
        updatedBy: userId,
      },
    });

    logSystem.configChanged(key, "", value, userId ?? "system");
    logger.info({ event: "config_created", key, category });

    return {
      key: created.key,
      value: created.isSecret ? "***" : created.value,
      category: created.category,
      description: created.description ?? undefined,
      isSecret: created.isSecret,
    };
  } catch (error) {
    logger.error({ event: "create_config_failed", key, error });
    return null;
  }
}

/**
 * Delete a system config
 */
export async function deleteSystemConfig(key: string, userId: string): Promise<boolean> {
  try {
    await prisma.systemConfig.delete({
      where: { key },
    });

    logger.info({ event: "config_deleted", key, userId });
    return true;
  } catch (error) {
    logger.error({ event: "delete_config_failed", key, error });
    return false;
  }
}