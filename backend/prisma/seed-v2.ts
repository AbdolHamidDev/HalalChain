/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedV2Data() {
  console.log("🌱 Seeding v2.0 data...\n");

  // 1. Seed default system configs
  console.log("📋 Seeding system configs...");
  const configs = [
    { key: "automation.cert_expiry_days", value: "30", category: "automation", description: "Days before certificate expiry to trigger alert" },
    { key: "automation.schedule_cron", value: "0 8 * * *", category: "automation", description: "Daily automation rule schedule (cron format)" },
    { key: "email.retry_attempts", value: "3", category: "email", description: "Number of email retry attempts" },
    { key: "notifications.heartbeat_interval", value: "25", category: "notifications", description: "SSE heartbeat interval in seconds" },
    { key: "system.maintenance_mode", value: "false", category: "system", description: "Enable/disable maintenance mode" },
    { key: "system.maintenance_message", value: "System under maintenance. Please check back later.", category: "system", description: "Maintenance mode message", isSecret: false },
    { key: "backup.retention_days", value: "7", category: "backup", description: "Number of days to retain backups" },
    { key: "cleanup.notifications_retention_days", value: "90", category: "cleanup", description: "Days to retain read notifications" },
    { key: "cleanup.invitations_retention_days", value: "30", category: "cleanup", description: "Days to retain expired invitations" },
    { key: "cleanup.audit_logs_retention_days", value: "730", category: "cleanup", description: "Days to retain audit logs (2 years)" },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log(`  ✓ Created/updated ${configs.length} system configs\n`);

  // 2. Seed default feature flags
  console.log("🚩 Seeding feature flags...");
  const featureFlags = [
    { key: "new_dashboard_v2", enabled: false, description: "New dashboard design (v2)", rollout: 100 },
    { key: "advanced_analytics", enabled: false, description: "Advanced analytics with predictive insights", rollout: 50 },
    { key: "batch_tracking_v2", enabled: false, description: "Enhanced batch tracking features", rollout: 25 },
    { key: "real_time_notifications", enabled: true, description: "Real-time notifications via WebSocket", rollout: 100 },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }
  console.log(`  ✓ Created/updated ${featureFlags.length} feature flags\n`);

  // 3. Seed default automation rules
  console.log("🤖 Seeding automation rules...");
  const existingRules = await prisma.automationRule.count();
  
  if (existingRules === 0) {
    const rules = [
      { name: "Certificate Expiring", type: "CERTIFICATE_EXPIRING", cronSchedule: "0 8 * * *", isEnabled: true },
      { name: "Certificate Expired", type: "CERTIFICATE_EXPIRED", cronSchedule: "0 8 * * *", isEnabled: true },
      { name: "Low Inventory", type: "LOW_INVENTORY", cronSchedule: "0 8 * * *", isEnabled: true },
      { name: "Shipment Delay", type: "SHIPMENT_DELAY", cronSchedule: "0 8 * * *", isEnabled: true },
    ];

    for (const rule of rules) {
      await prisma.automationRule.create({ data: rule });
    }
    console.log(`  ✓ Created ${rules.length} automation rules\n`);
  } else {
    console.log(`  ✓ Automation rules already exist (${existingRules} rules)\n`);
  }

  console.log("✅ v2.0 seeding completed successfully!");
  console.log("\nNext steps:");
  console.log("  1. Run 'npm run db:migrate' to create new tables");
  console.log("  2. Run 'npm run db:seed' to seed initial data");
  console.log("  3. Start the server with 'npm run dev'");
}

seedV2Data()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });