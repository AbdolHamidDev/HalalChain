import { prisma } from "./prisma";
import { logger, logBackup } from "./logger";
import { createSystemEvent } from "./systemEvents";

export interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  type: "manual" | "scheduled";
}

const BACKUP_DIR = process.env.BACKUP_DIR || "./backups";
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || "7");

/**
 * Create a database backup using pg_dump
 */
export async function createDatabaseBackup(type: "manual" | "scheduled" = "scheduled"): Promise<BackupInfo | null> {
  const startTime = Date.now();
  logBackup.started(type);

  try {
    // Ensure backup directory exists
    const fs = await import("fs");
    const path = await import("path");
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `halalchain-backup-${timestamp}.sql.gz`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Get database connection details from environment
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL not configured");
    }

    // Parse database URL
    const url = new URL(dbUrl);
    const dbName = url.pathname.slice(1).split("?")[0];
    const dbUser = url.username;
    const dbHost = url.hostname;
    const dbPort = url.port || "5432";
    const dbPassword = url.password;

    // Set PGPASSWORD environment variable for pg_dump
    const env = {
      ...process.env,
      PGPASSWORD: dbPassword,
    };

    // Execute pg_dump with gzip compression
    const command = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} | gzip > ${filepath}`;
    await execAsync(command, { env });

    // Get file size
    const stats = fs.statSync(filepath);
    const size = stats.size;
    const duration = Date.now() - startTime;

    logBackup.completed(type, size, duration);

    // Log system event
    await createSystemEvent({
      type: "backup_completed",
      severity: "info",
      message: `Database backup completed: ${filename}`,
      metadata: {
        filename,
        size,
        duration,
        type,
      },
    });

    return {
      id: filename,
      filename,
      size,
      createdAt: new Date(),
      type,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logBackup.failed(type, errorMessage);

    await createSystemEvent({
      type: "backup_failed",
      severity: "error",
      message: `Database backup failed: ${errorMessage}`,
      metadata: {
        type,
        error: errorMessage,
      },
    });

    return null;
  }
}

/**
 * List all available backups
 */
export async function listBackups(): Promise<BackupInfo[]> {
  try {
    const fs = await import("fs");
    const path = await import("path");

    if (!fs.existsSync(BACKUP_DIR)) {
      return [];
    }

    const files = fs.readdirSync(BACKUP_DIR).filter((file) => file.endsWith(".sql.gz"));

    const backups: BackupInfo[] = files.map((file) => {
      const filepath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filepath);
      const isManual = file.includes("manual");

      return {
        id: file,
        filename: file,
        size: stats.size,
        createdAt: stats.mtime,
        type: isManual ? "manual" : "scheduled",
      };
    });

    // Sort by creation date descending
    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    logger.error({ event: "list_backups_failed", error });
    return [];
  }
}

/**
 * Delete old backups based on retention policy
 */
export async function cleanupOldBackups(): Promise<number> {
  try {
    const fs = await import("fs");
    const path = await import("path");

    if (!fs.existsSync(BACKUP_DIR)) {
      return 0;
    }

    const files = fs.readdirSync(BACKUP_DIR).filter((file) => file.endsWith(".sql.gz"));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    let deletedCount = 0;

    for (const file of files) {
      const filepath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filepath);

      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filepath);
        deletedCount++;
        logger.info({ event: "backup_deleted", filename: file, age: cutoffDate });
      }
    }

    if (deletedCount > 0) {
      logger.info({ event: "backup_cleanup_completed", deletedCount });
    }

    return deletedCount;
  } catch (error) {
    logger.error({ event: "backup_cleanup_failed", error });
    return 0;
  }
}

/**
 * Restore database from backup
 */
export async function restoreFromBackup(filename: string): Promise<boolean> {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file not found: ${filename}`);
    }

    // Get database connection details
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL not configured");
    }

    const url = new URL(dbUrl);
    const dbName = url.pathname.slice(1).split("?")[0];
    const dbUser = url.username;
    const dbHost = url.hostname;
    const dbPort = url.port || "5432";
    const dbPassword = url.password;

    const env = {
      ...process.env,
      PGPASSWORD: dbPassword,
    };

    // Restore from gzipped backup
    const command = `gunzip -c ${filepath} | psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName}`;
    await execAsync(command, { env });

    logger.info({ event: "backup_restored", filename });
    await createSystemEvent({
      type: "backup_restored",
      severity: "info",
      message: `Database restored from backup: ${filename}`,
      metadata: { filename },
    });

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ event: "backup_restore_failed", filename, error: errorMessage });
    return false;
  }
}

/**
 * Delete a specific backup file
 */
export async function deleteBackup(filename: string): Promise<boolean> {
  try {
    const fs = await import("fs");
    const path = await import("path");

    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return false;
    }

    fs.unlinkSync(filepath);
    logger.info({ event: "backup_deleted_manual", filename });
    return true;
  } catch (error) {
    logger.error({ event: "backup_delete_failed", filename, error });
    return false;
  }
}