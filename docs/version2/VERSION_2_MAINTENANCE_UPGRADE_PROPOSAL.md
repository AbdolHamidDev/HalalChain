# HalalChain v2.0 — Maintenance & Operations Upgrade Proposal

> **Version**: 2.0.0  
> **Target**: Expand platform maintainability, observability, and operational control  
> **Status**: Proposal

---

## 1. Executive Summary

HalalChain v1.x delivers a robust compliance and traceability platform. However, as the platform scales, **operational maintenance gaps** become critical. This proposal outlines a **v2.0 upgrade** focused on making HalalChain **production-grade, self-maintaining, and operationally transparent**.

### Key Objectives

| Objective | Impact |
|-----------|--------|
| **Observability** | Real-time system health, metrics, and alerting |
| **Maintainability** | Automated cleanup, backups, and system hygiene |
| **Operational Control** | Feature flags, maintenance mode, rule scheduling |
| **Resilience** | Graceful shutdown, dependency health checks, circuit breakers |
| **Auditability** | Configuration change tracking, system event logging |

---

## 2. Current State Analysis

### 2.1 Existing Strengths

- ✅ Solid automation engine with 4 rules
- ✅ Real-time notifications (SSE + WebSocket)
- ✅ BullMQ queue system
- ✅ RBAC + audit logs
- ✅ Multi-language support (6 locales)
- ✅ Docker deployment ready

### 2.2 Identified Maintenance Gaps

| Gap | Severity | Current State |
|-----|----------|---------------|
| **No system health dashboard** | 🔴 High | Only basic `/api/health` endpoint |
| **No metrics/monitoring** | 🔴 High | Console.log only, no structured metrics |
| **No backup/restore** | 🔴 High | Manual database backups only |
| **Hardcoded configuration** | 🟡 Medium | Magic numbers scattered in code |
| **No data archival** | 🟡 Medium | Notifications/logs accumulate forever |
| **No maintenance mode** | 🟡 Medium | No way to take system offline safely |
| **No feature flags** | 🟡 Medium | Deploy required for every toggle |
| **No graceful shutdown** | 🟡 Medium | Abrupt connection drops |
| **No dependency monitoring** | 🟡 Medium | No alerts if Redis/DB/email fails |
| **No system settings UI** | 🟡 Medium | Config only via env vars |

---

## 3. Proposed v2.0 Features

### 3.1 System Health & Observability

#### 3.1.1 Enhanced Health Check Endpoint

**New Endpoint**: `GET /api/admin/system/health`

```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T08:00:00Z",
  "uptime": 864000,
  "checks": {
    "database": { "status": "up", "latency": 2.3 },
    "redis": { "status": "up", "latency": 0.5 },
    "queues": {
      "shipment-tracking": { "waiting": 0, "active": 2, "completed": 150 },
      "notifications": { "waiting": 0, "active": 0, "completed": 89 },
      "emails": { "waiting": 1, "active": 0, "completed": 45 }
    },
    "scheduler": { "lastRun": "2025-01-15T08:00:00Z", "nextRun": "2025-01-16T08:00:00Z" },
    "memory": { "used": 145, "total": 512, "unit": "MB" },
    "disk": { "used": 2.1, "total": 20, "unit": "GB" }
  }
}
```

**Implementation**:
- Add `systemHealth.ts` in `backend/src/lib/`
- Expose via new route `backend/src/routes/system-health.ts`
- Protected by ADMIN role

#### 3.1.2 Metrics Collection Service

**New Module**: `backend/src/lib/metrics.ts`

```typescript
interface SystemMetrics {
  timestamp: Date;
  cpu: number; // %
  memory: { used: number; total: number };
  eventLoopLag: number; // ms
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number; // %
}
```

**Features**:
- Collect metrics every 30 seconds
- Store in Redis with 1-hour TTL
- Expose via `/api/admin/system/metrics`
- Alert if thresholds exceeded (CPU > 80%, memory > 90%)

#### 3.1.3 Structured Logging

**New Module**: `backend/src/lib/logger.ts`

Replace `console.log` with structured logger (Pino or Winston):

```typescript
logger.info({
  event: 'automation_rule_executed',
  rule: 'certificate_expiring',
  triggered: true,
  actions: 3,
  duration: 245
});
```

**Benefits**:
- JSON logs for ELK/Datadog integration
- Log levels (debug, info, warn, error)
- Correlation IDs for request tracing

---

### 3.2 Backup & Restore

#### 3.2.1 Automated Database Backups

**New Module**: `backend/src/lib/backup.ts`

**Features**:
- Daily automated PostgreSQL dumps
- Compressed (gzip) storage in `/backups/` or S3
- Retention policy: 7 daily, 4 weekly, 12 monthly
- Backup verification (test restore)
- Email notification on backup success/failure

**New Endpoints**:
- `POST /api/admin/system/backup` — Trigger manual backup
- `GET /api/admin/system/backups` — List available backups
- `POST /api/admin/system/restore` — Restore from backup
- `DELETE /api/admin/system/backups/:id` — Delete backup

**Cron Schedule**:
```typescript
cron.schedule("0 2 * * *", async () => {
  await createDatabaseBackup();
});
// Daily at 2:00 AM
```

#### 3.2.2 Backup Configuration

**New Environment Variables**:
```env
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=7
BACKUP_S3_BUCKET=halalchain-backups
BACKUP_S3_REGION=ap-southeast-1
BACKUP_NOTIFY_EMAIL=admin@halalchain.com
```

---

### 3.3 Data Archival & Cleanup

#### 3.3.1 Automated Data Cleanup

**New Module**: `backend/src/lib/cleanup.ts`

**Cleanup Policies**:

| Data Type | Retention | Action |
|-----------|-----------|--------|
| **Read notifications** | 90 days | Soft delete |
| **Completed BullMQ jobs** | 7 days | Already configured |
| **Old audit logs** | 2 years | Archive to cold storage |
| **Expired invitations** | 30 days post-expiry | Delete |
| **Old SSE connections** | Real-time | Auto-close on disconnect |

**New Cron Job**:
```typescript
cron.schedule("0 3 * * 0", async () => {
  // Weekly on Sunday at 3:00 AM
  await cleanupOldNotifications();
  await archiveOldAuditLogs();
  await purgeExpiredInvitations();
});
```

#### 3.3.2 Archival Service

**New Module**: `backend/src/lib/archive.ts`

- Move old audit logs to `audit_logs_archive` table
- Export to S3/Cloud Storage for long-term retention
- Maintain referential integrity

---

### 3.4 System Configuration Management

#### 3.4.1 Centralized Configuration

**New Model**: `SystemConfig`

```prisma
model SystemConfig {
  key          String   @id @map("key")
  value        String
  category     String   // "automation", "email", "notifications", "system"
  description  String?
  isSecret     Boolean  @default(false) @map("is_secret") // hide in UI
  updatedBy    String?  @map("updated_by") @db.Uuid
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@index([category])
  @@map("system_configs")
}
```

**Example Configs**:

| Key | Value | Category | Description |
|-----|-------|----------|-------------|
| `automation.cert_expiry_days` | `30` | automation | Days before expiry to trigger alert |
| `automation.schedule_cron` | `0 8 * * *` | automation | Daily cron schedule |
| `email.retry_attempts` | `3` | email | Email retry attempts |
| `notifications.heartbeat_interval` | `25` | notifications | SSE heartbeat interval (seconds) |
| `system.maintenance_mode` | `false` | system | Enable maintenance mode |

**Benefits**:
- No more hardcoded magic numbers
- Runtime configuration changes (no deploy needed)
- Audit trail for config changes
- Environment-specific configs

#### 3.4.2 Configuration UI

**New Page**: `/dashboard/settings/system`

Features:
- Edit configs by category
- Toggle maintenance mode
- View change history
- Export/import configs

---

### 3.5 Maintenance Mode

#### 3.5.1 Maintenance Mode Middleware

**New Middleware**: `backend/src/middleware/maintenance.ts`

```typescript
export function maintenanceModeMiddleware(req, res, next) {
  const config = await getSystemConfig('system.maintenance_mode');
  
  if (config.value === 'true') {
    // Allow admin access
    if (req.user?.role === 'ADMIN') return next();
    
    // Return maintenance page for others
    return res.status(503).json({
      error: 'System under maintenance',
      retryAfter: 3600
    });
  }
  
  next();
}
```

**Features**:
- Enable/disable via UI or API
- Scheduled maintenance windows
- Custom maintenance message
- Admin bypass

#### 3.5.2 Scheduled Maintenance

**New Model**: `MaintenanceWindow`

```prisma
model MaintenanceWindow {
  id          String   @id @default(uuid()) @db.Uuid
  startAt     DateTime @map("start_at")
  endAt       DateTime @map("end_at")
  message     String?
  createdBy   String   @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("maintenance_windows")
}
```

---

### 3.6 Feature Flags

#### 3.6.1 Feature Flag System

**New Model**: `FeatureFlag`

```prisma
model FeatureFlag {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique
  enabled     Boolean  @default(false)
  description String?
  rollout     Int?     @default(100) // percentage
  updatedBy   String?  @map("updated_by") @db.Uuid
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("feature_flags")
}
```

**Example Flags**:

| Key | Description | Rollout |
|-----|-------------|---------|
| `new_dashboard_v2` | New dashboard design | 100% |
| `advanced_analytics` | Predictive insights | 50% |
| `batch_tracking_v2` | Enhanced batch tracking | 25% |

**Middleware**:
```typescript
export function featureFlagMiddleware(flagKey: string) {
  return async (req, res, next) => {
    const flag = await getFeatureFlag(flagKey);
    if (!flag.enabled) {
      return res.status(404).json({ error: 'Feature not available' });
    }
    next();
  };
}
```

**Frontend Hook**:
```typescript
const { data: enabled } = useFeatureFlag('new_dashboard_v2');
if (!enabled) return <LegacyDashboard />;
return <NewDashboard />;
```

---

### 3.7 Automation Rule Management

#### 3.7.1 Rule Scheduling UI

**Current Limitation**: All rules run at 08:00 daily. No way to:
- Pause individual rules
- Change schedule per rule
- Run rules on-demand
- View rule execution history

**New Features**:

**Database Changes**:
```prisma
model AutomationRule {
  id            String   @id @default(uuid()) @db.Uuid
  name          String
  type          String   // "CERTIFICATE_EXPIRING", etc.
  cronSchedule  String   @map("cron_schedule") @default("0 8 * * *")
  isEnabled     Boolean  @default(true) @map("is_enabled")
  lastRunAt     DateTime? @map("last_run_at")
  lastRunStatus String?  @map("last_run_status") // "success", "failed"
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  executions    RuleExecution[]

  @@map("automation_rules")
}

model RuleExecution {
  id              String   @id @default(uuid()) @db.Uuid
  ruleId          String   @map("rule_id") @db.Uuid
  triggered       Boolean
  actionsExecuted Int      @default(0) @map("actions_executed")
  duration        Int      // milliseconds
  error           String?
  executedAt      DateTime @default(now()) @map("executed_at")

  rule            AutomationRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)

  @@index([ruleId])
  @@index([executedAt])
  @@map("rule_executions")
}
```

**New Endpoints**:
- `GET /api/admin/automation/rules` — List all rules
- `PATCH /api/admin/automation/rules/:id` — Update rule (enable/disable, schedule)
- `POST /api/admin/automation/rules/:id/execute` — Run rule on-demand
- `GET /api/admin/automation/rules/:id/history` — View execution history

**New UI Page**: `/dashboard/settings/automation`

Features:
- Toggle rules on/off
- Edit cron schedules
- Run rules manually
- View execution history with charts
- See triggered actions per execution

---

### 3.8 Graceful Shutdown

#### 3.8.1 Graceful Shutdown Handler

**New Module**: `backend/src/lib/shutdown.ts`

```typescript
export function setupGracefulShutdown(server: http.Server): void {
  const gracefulShutdown = async (signal: string) => {
    console.log(`[Shutdown] Received ${signal}, starting graceful shutdown...`);
    
    // 1. Stop accepting new connections
    server.close();
    
    // 2. Close BullMQ connections
    await closeAllQueues();
    
    // 3. Close Redis connections
    await prisma.$disconnect();
    await redis.quit();
    
    // 4. Wait for active jobs to complete (max 30s)
    await waitForActiveJobs(30000);
    
    console.log('[Shutdown] Graceful shutdown complete');
    process.exit(0);
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
```

**Benefits**:
- No dropped requests during deployment
- No lost BullMQ jobs
- Clean database connections
- Proper resource cleanup

---

### 3.9 Dependency Health Monitoring

#### 3.9.1 Dependency Health Checks

**New Module**: `backend/src/lib/healthChecks.ts`

```typescript
interface DependencyHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latency: number;
  lastCheck: Date;
  error?: string;
}

async function checkDatabase(): Promise<DependencyHealth> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { name: 'PostgreSQL', status: 'up', latency: Date.now() - start, lastCheck: new Date() };
  } catch (error) {
    return { name: 'PostgreSQL', status: 'down', latency: Date.now() - start, lastCheck: new Date(), error: error.message };
  }
}

async function checkRedis(): Promise<DependencyHealth> {
  const start = Date.now();
  try {
    await redis.ping();
    return { name: 'Redis', status: 'up', latency: Date.now() - start, lastCheck: new Date() };
  } catch (error) {
    return { name: 'Redis', status: 'down', latency: Date.now() - start, lastCheck: new Date(), error: error.message };
  }
}

async function checkEmailService(): Promise<DependencyHealth> {
  // Test SMTP/Resend connection
}
```

**Alerting**:
- Alert if any dependency is down for > 1 minute
- Alert if latency exceeds threshold
- Include in health check endpoint

---

### 3.10 System Settings UI

#### 3.10.1 New Settings Pages

**New Navigation Items**:
- `/dashboard/settings/system` — System configuration
- `/dashboard/settings/automation` — Automation rules
- `/dashboard/settings/maintenance` — Maintenance mode
- `/dashboard/settings/backups` — Backup management
- `/dashboard/settings/feature-flags` — Feature flags

**Features**:
- Role-based access (ADMIN only)
- Real-time config updates
- Change history with audit log
- Export/import configuration

---

### 3.11 System Event Log

#### 3.11.1 System Event Model

**New Model**: `SystemEvent`

```prisma
model SystemEvent {
  id          String      @id @default(uuid()) @db.Uuid
  type        String      // "backup_completed", "rule_executed", "config_changed"
  severity    String      // "info", "warning", "error"
  message     String
  metadata    Json?
  createdAt   DateTime    @default(now()) @map("created_at")

  @@index([type])
  @@index([createdAt])
  @@map("system_events")
}
```

**Event Types**:
- `backup_completed` / `backup_failed`
- `rule_executed` / `rule_failed`
- `config_changed`
- `maintenance_started` / `maintenance_ended`
- `dependency_down` / `dependency_recovered`
- `queue_overflow`

**New Endpoint**: `GET /api/admin/system/events`

---

### 3.12 Queue Management UI

#### 3.12.1 Queue Monitoring Dashboard

**New Page**: `/dashboard/settings/queues`

**Metrics Displayed**:
- Queue depth (waiting, active, completed, failed)
- Job processing rate (jobs/minute)
- Average job duration
- Failed jobs list with retry option
- Worker status (online/offline)

**Actions**:
- Retry failed jobs
- Purge completed jobs
- Pause/resume queues
- View job details

---

## 4. Technical Implementation Plan

### 4.1 Phase 1: Foundation (Week 1-2)

**Goal**: Core infrastructure for observability and health

| Task | Files | Description |
|------|-------|-------------|
| **Structured Logging** | `backend/src/lib/logger.ts` | Replace console.log with Pino |
| **Health Check Enhancement** | `backend/src/lib/healthChecks.ts`, `backend/src/routes/system-health.ts` | Dependency checks |
| **Metrics Collection** | `backend/src/lib/metrics.ts` | System metrics collector |
| **Graceful Shutdown** | `backend/src/lib/shutdown.ts` | SIGTERM/SIGINT handler |
| **System Config Model** | `backend/prisma/schema.prisma` | Add `SystemConfig` model |

**Deliverable**: `/api/admin/system/health` returns comprehensive health data

### 4.2 Phase 2: Backup & Cleanup (Week 3-4)

**Goal**: Data protection and hygiene

| Task | Files | Description |
|------|-------|-------------|
| **Backup Service** | `backend/src/lib/backup.ts` | Automated PostgreSQL backups |
| **Cleanup Service** | `backend/src/lib/cleanup.ts` | Data archival and cleanup |
| **Backup Routes** | `backend/src/routes/backups.ts` | Backup management API |
| **Migration** | `backend/prisma/migrations/` | Add new tables |

**Deliverable**: Automated daily backups with retention policy

### 4.3 Phase 3: Configuration & Feature Flags (Week 5-6)

**Goal**: Runtime configurability

| Task | Files | Description |
|------|-------|-------------|
| **System Config Service** | `backend/src/lib/systemConfig.ts` | Config CRUD operations |
| **Feature Flag Middleware** | `backend/src/middleware/featureFlags.ts` | Feature flag checks |
| **Config Routes** | `backend/src/routes/system-config.ts` | Config API |
| **Frontend Config Page** | `frontend/src/app/dashboard/settings/system/page.tsx` | Config UI |

**Deliverable**: Runtime config changes without deployment

### 4.4 Phase 4: Automation Management (Week 7-8)

**Goal**: Rule management and monitoring

| Task | Files | Description |
|------|-------|-------------|
| **Rule Execution Model** | `backend/prisma/schema.prisma` | Add `AutomationRule`, `RuleExecution` |
| **Rule Manager Service** | `backend/src/lib/ruleManager.ts` | Rule CRUD + scheduling |
| **Rule Routes** | `backend/src/routes/automation-rules.ts` | Rule management API |
| **Frontend Automation Page** | `frontend/src/app/dashboard/settings/automation/page.tsx` | Rule UI |

**Deliverable**: UI to manage automation rules

### 4.5 Phase 5: Polish & Integration (Week 9-10)

**Goal**: Final integration and testing

| Task | Files | Description |
|------|-------|-------------|
| **Queue Management UI** | `frontend/src/app/dashboard/settings/queues/page.tsx` | Queue monitoring |
| **System Event Log** | `backend/src/lib/systemEvents.ts` | Event tracking |
| **Maintenance Mode** | `backend/src/middleware/maintenance.ts` | Maintenance mode |
| **Testing** | `backend/src/tests/` | Unit + integration tests |
| **Documentation** | `docs/` | Update docs |

**Deliverable**: Complete v2.0 feature set

---

## 5. Database Schema Changes

### 5.1 New Models

```prisma
// System configuration
model SystemConfig {
  key          String   @id @map("key")
  value        String
  category     String
  description  String?
  isSecret     Boolean  @default(false) @map("is_secret")
  updatedBy    String?  @map("updated_by") @db.Uuid
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@index([category])
  @@map("system_configs")
}

// Feature flags
model FeatureFlag {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique
  enabled     Boolean  @default(false)
  description String?
  rollout     Int?     @default(100)
  updatedBy   String?  @map("updated_by") @db.Uuid
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("feature_flags")
}

// Automation rules
model AutomationRule {
  id            String   @id @default(uuid()) @db.Uuid
  name          String
  type          String
  cronSchedule  String   @map("cron_schedule") @default("0 8 * * *")
  isEnabled     Boolean  @default(true) @map("is_enabled")
  lastRunAt     DateTime? @map("last_run_at")
  lastRunStatus String?  @map("last_run_status")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  executions    RuleExecution[]

  @@map("automation_rules")
}

model RuleExecution {
  id              String   @id @default(uuid()) @db.Uuid
  ruleId          String   @map("rule_id") @db.Uuid
  triggered       Boolean
  actionsExecuted Int      @default(0) @map("actions_executed")
  duration        Int
  error           String?
  executedAt      DateTime @default(now()) @map("executed_at")

  rule            AutomationRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)

  @@index([ruleId])
  @@index([executedAt])
  @@map("rule_executions")
}

// System events
model SystemEvent {
  id          String      @id @default(uuid()) @db.Uuid
  type        String
  severity    String
  message     String
  metadata    Json?
  createdAt   DateTime    @default(now()) @map("created_at")

  @@index([type])
  @@index([createdAt])
  @@map("system_events")
}

// Maintenance windows
model MaintenanceWindow {
  id          String   @id @default(uuid()) @db.Uuid
  startAt     DateTime @map("start_at")
  endAt       DateTime @map("end_at")
  message     String?
  createdBy   String   @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("maintenance_windows")
}
```

### 5.2 Migration Strategy

```bash
# Generate migration
npm run db:migrate -- --name add_v2_system_tables

# Seed initial configs
npm run db:seed
```

**Seed Data**:
- Default system configs
- Default feature flags (all disabled except stable features)
- Default automation rules (migrate from hardcoded)

---

## 6. API Endpoints Summary

### 6.1 New Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/system/health` | Comprehensive health check |
| `GET` | `/api/admin/system/metrics` | System metrics |
| `GET` | `/api/admin/system/events` | System event log |
| `POST` | `/api/admin/system/backup` | Trigger backup |
| `GET` | `/api/admin/system/backups` | List backups |
| `POST` | `/api/admin/system/restore` | Restore backup |
| `DELETE` | `/api/admin/system/backups/:id` | Delete backup |
| `GET` | `/api/admin/system/configs` | List configs |
| `PATCH` | `/api/admin/system/configs/:key` | Update config |
| `GET` | `/api/admin/feature-flags` | List feature flags |
| `PATCH` | `/api/admin/feature-flags/:id` | Update feature flag |
| `GET` | `/api/admin/automation/rules` | List automation rules |
| `PATCH` | `/api/admin/automation/rules/:id` | Update rule |
| `POST` | `/api/admin/automation/rules/:id/execute` | Run rule on-demand |
| `GET` | `/api/admin/automation/rules/:id/history` | Rule execution history |
| `GET` | `/api/admin/queues` | Queue status |
| `POST` | `/api/admin/queues/:name/retry` | Retry failed jobs |
| `POST` | `/api/admin/queues/:name/purge` | Purge queue |
| `POST` | `/api/admin/maintenance/enable` | Enable maintenance mode |
| `POST` | `/api/admin/maintenance/disable` | Disable maintenance mode |
| `POST` | `/api/admin/maintenance/schedule` | Schedule maintenance |

---

## 7. Frontend Pages

### 7.1 New Settings Pages

```
/dashboard/settings/
├── system/          # System configuration
├── automation/      # Automation rules management
├── maintenance/     # Maintenance mode
├── backups/         # Backup management
├── feature-flags/   # Feature flags
└── queues/          # Queue monitoring
```

### 7.2 UI Components

**New Components**:
- `components/settings/system-config-form.tsx`
- `components/settings/automation-rule-card.tsx`
- `components/settings/backup-list.tsx`
- `components/settings/queue-monitor.tsx`
- `components/settings/feature-flag-toggle.tsx`
- `components/dashboard/system-health-widget.tsx`

---

## 8. Environment Variables

### 8.1 New Variables

```env
# Backup
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=7
BACKUP_S3_BUCKET=
BACKUP_S3_REGION=ap-southeast-1
BACKUP_NOTIFY_EMAIL=

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_TIMEOUT=5000
DEPENDENCY_ALERT_EMAIL=

# Logging
LOG_LEVEL=info  # debug, info, warn, error
LOG_FORMAT=json  # json, pretty

# Feature Flags
FEATURE_FLAGS_ENABLED=true

# Maintenance
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE="System under maintenance. Please check back later."
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

- `systemConfig.service.test.ts` — Config CRUD
- `backup.service.test.ts` — Backup creation/restore
- `cleanup.service.test.ts` — Data cleanup logic
- `healthChecks.service.test.ts` — Dependency checks
- `ruleManager.service.test.ts` — Rule execution
- `featureFlags.middleware.test.ts` — Feature flag checks

### 9.2 Integration Tests

- `system-health.integration.test.ts` — Health endpoint
- `backup-restore.integration.test.ts` — Full backup/restore cycle
- `automation-rules.integration.test.ts` — Rule management

### 9.3 E2E Tests

- Admin can enable maintenance mode
- Admin can trigger backup
- Admin can update system config
- Admin can manage automation rules

---

## 10. Deployment Considerations

### 10.1 Docker Changes

**New Volumes**:
```yaml
volumes:
  halalchain_pgdata:
  halalchain_redisdata:
  halalchain_uploads:
  halalchain_backups:  # NEW
```

**New Environment Variables**:
```yaml
backend:
  environment:
    BACKUP_ENABLED: "true"
    BACKUP_RETENTION_DAYS: "7"
    LOG_LEVEL: "info"
```

### 10.2 CI/CD Updates

**New GitHub Actions Jobs**:
- `backup-verification` — Test backup/restore in CI
- `dependency-check` — Scan for outdated packages
- `security-audit` — npm audit

### 10.3 Monitoring Integration

**Recommended Stack**:
- **Metrics**: Prometheus + Grafana
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Alerts**: Alertmanager → Email/Slack
- **Uptime**: UptimeRobot or Pingdom

---

## 11. Migration Guide

### 11.1 Database Migration

```bash
# 1. Backup existing database
pg_dump -U halalchain -d halalchain > backup_before_v2.sql

# 2. Run migrations
npm run db:migrate

# 3. Seed initial data
npm run db:seed

# 4. Verify
npm run db:studio
```

### 11.2 Code Migration

**Breaking Changes**: None — v2.0 is backward compatible

**New Dependencies**:
```json
{
  "pino": "^8.0.0",
  "pino-pretty": "^10.0.0",
  "@aws-sdk/client-s3": "^3.0.0"  // optional, for S3 backups
}
```

### 11.3 Configuration Migration

**Old → New**:

| Old (Hardcoded) | New (Config Key) |
|-----------------|------------------|
| `30` (cert expiry days) | `automation.cert_expiry_days` |
| `25` (SSE heartbeat) | `notifications.heartbeat_interval` |
| `3` (email retry) | `email.retry_attempts` |
| `0 8 * * *` (cron) | `automation.schedule_cron` |

**Migration Script**:
```typescript
// backend/prisma/seed-v2-configs.ts
async function seedSystemConfigs() {
  await prisma.systemConfig.createMany({
    data: [
      { key: 'automation.cert_expiry_days', value: '30', category: 'automation' },
      { key: 'notifications.heartbeat_interval', value: '25', category: 'notifications' },
      // ...
    ]
  });
}
```

---

## 12. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Database migration failure** | Low | High | Backup before migration, test in staging |
| **Performance degradation** | Medium | Medium | Load testing, metrics monitoring |
| **Breaking changes** | Low | High | Backward compatibility, feature flags |
| **Increased complexity** | Medium | Low | Comprehensive documentation |
| **Longer deployment time** | Medium | Low | Blue-green deployment |

---

## 13. Success Metrics

### 13.1 Operational Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **System uptime** | 99.9% | Health check monitoring |
| **Backup success rate** | 100% | Backup job logs |
| **Rule execution success** | > 95% | Rule execution history |
| **Mean time to detect (MTTD)** | < 5 min | Dependency health checks |
| **Mean time to recover (MTTR)** | < 15 min | Alert → resolution |

### 13.2 Developer Experience

| Metric | Target |
|--------|--------|
| **Time to add new automation rule** | < 1 hour |
| **Time to change system config** | < 5 min (no deploy) |
| **Time to enable/disable feature** | < 1 min |

---

## 14. Alternatives Considered

| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **Third-party monitoring (Datadog)** | Rich features, no dev work | Costly, vendor lock-in | ❌ Rejected |
| **Kubernetes + Helm** | Scalable, industry standard | Overkill for current scale | ❌ Rejected |
| **Manual backups only** | Simple | Error-prone, no automation | ❌ Rejected |
| **No feature flags** | Simpler | Requires deploy for every change | ❌ Rejected |

---

## 15. Conclusion

HalalChain v2.0 transforms the platform from a **feature-complete application** to a **production-grade, self-maintaining system**. The proposed changes address critical operational gaps while maintaining backward compatibility and the existing user experience.

### Key Takeaways

1. **Observability**: Know what's happening in your system
2. **Automation**: Let the system maintain itself
3. **Control**: Change behavior without deploying
4. **Resilience**: Handle failures gracefully
5. **Auditability**: Track every change

### Next Steps

1. ✅ Review and approve this proposal
2. ✅ Prioritize phases (suggest: start with Phase 1)
3. ✅ Assign development resources
4. ✅ Set up staging environment for testing
5. ✅ Begin Phase 1 implementation

---

## Appendix A: File Structure Changes

```
backend/src/
├── lib/
│   ├── logger.ts                    # NEW - Structured logging
│   ├── metrics.ts                   # NEW - Metrics collection
│   ├── healthChecks.ts              # NEW - Dependency health checks
│   ├── backup.ts                    # NEW - Backup service
│   ├── cleanup.ts                   # NEW - Data cleanup
│   ├── archive.ts                   # NEW - Data archival
│   ├── systemConfig.ts              # NEW - Config management
│   ├── featureFlags.ts              # NEW - Feature flags
│   ├── ruleManager.ts               # NEW - Rule management
│   ├── shutdown.ts                  # NEW - Graceful shutdown
│   ├── systemEvents.ts              # NEW - System event logging
│   └── automation/
│       └── engine.ts                # MODIFIED - Use SystemConfig
├── middleware/
│   ├── maintenance.ts               # NEW - Maintenance mode
│   └── featureFlags.ts              # NEW - Feature flag middleware
├── routes/
│   ├── system-health.ts             # NEW - Health endpoint
│   ├── system-config.ts             # NEW - Config API
│   ├── automation-rules.ts          # NEW - Rule management
│   ├── backups.ts                   # NEW - Backup API
│   └── ... (existing routes)
└── tests/
    ├── logger.test.ts               # NEW
    ├── backup.test.ts               # NEW
    ├── cleanup.test.ts              # NEW
    └── ... (existing tests)

backend/prisma/
└── schema.prisma                    # MODIFIED - Add new models

frontend/src/
├── app/
│   └── dashboard/
│       └── settings/
│           ├── system/              # NEW - System config page
│           ├── automation/          # NEW - Automation rules page
│           ├── maintenance/         # NEW - Maintenance mode page
│           ├── backups/             # NEW - Backup management page
│           ├── feature-flags/       # NEW - Feature flags page
│           └── queues/              # NEW - Queue monitoring page
└── components/
    └── settings/
        ├── system-config-form.tsx   # NEW
        ├── automation-rule-card.tsx # NEW
        ├── backup-list.tsx          # NEW
        ├── queue-monitor.tsx        # NEW
        └── feature-flag-toggle.tsx  # NEW
```

---

## Appendix B: Technology Additions

| Technology | Purpose | Justification |
|------------|---------|----------------|
| **Pino** | Structured logging | Fast, JSON-formatted, ecosystem |
| **node-cron** | Scheduled tasks | Already in use, reliable |
| **AWS SDK (optional)** | S3 backups | Industry standard for cloud storage |

**No new major frameworks required** — all additions are incremental.

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-15  
**Author**: HalalChain Development Team  
**Reviewers**: TBD