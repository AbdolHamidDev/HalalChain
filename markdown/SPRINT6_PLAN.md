# Sprint 6 — Compliance & Automation Engine
## Deliverable: Capability Audit, Architecture Proposal, ROI Ranking, & Implementation Plan

---

# Phase 1 — Existing Capability Audit Report

## 1.1 Scheduler Jobs
**File:** `backend/src/lib/scheduler.ts`

| Metric | Value |
|--------|-------|
| Number of scheduled jobs | **1** |
| Schedule | Daily at 08:00 AM |
| Logic | Queries `halal_certificates` where expiry is within next 30 days, calls `notifyCertificateExpiring` |
| Duplicate prevention | Yes — daily dedup via checking `createdAt >= today` in notificationService |
| Gap | Only certificate expiry is scheduled. No scheduler for: expired certificates, low inventory detection, shipment delay detection |

## 1.2 Notification System
**File:** `backend/src/lib/notificationService.ts`

| Function | Trigger | Audience | Real-time | Email |
|----------|---------|----------|-----------|-------|
| `notifyCertificateExpiring` | Scheduler | ADMIN + MANAGER | SSE | Yes |
| `notifyLowStock` | Inventory movement | ADMIN + MANAGER | SSE | Yes |
| `notifyShipmentDelayed` | Shipment status → DELAYED | ADMIN + MANAGER | SSE | Yes |
| `notifyCertificateExpired` | **MISSING** — function referenced in imports but never called | — | — | — |

**Deduplication Mechanisms:**
- Certificate expiring: checks if notification with same cert number exists for today
- Low stock: checks if notification with same inventoryId exists for today
- Shipment delayed: **NO** deduplication

**Notification Types (Prisma enum):**
- `LOW_STOCK`, `CERTIFICATE_EXPIRING`, `SHIPMENT_DELAYED`, `SYSTEM`
- Missing: `CERTIFICATE_EXPIRED`, `COMPLIANCE_ISSUE`

## 1.3 Email Capabilities
**File:** `backend/src/lib/emailService.ts`

| Feature | Status |
|---------|--------|
| Provider | Dual: Resend API or Nodemailer SMTP |
| Retry logic | 3 attempts with exponential backoff (200ms → 400ms) |
| Fire-and-forget | Yes — never blocks HTTP response |
| Preference filtering | Per-user `NotificationPreference` flags respected |
| Templates | certExpiring, certExpired, lowStock, shipmentDelayed, invitation |
| Missing | Compliance score alerts, dashboard alert emails |

## 1.4 Analytics Capabilities
**File:** `backend/src/lib/analyticsService.ts`

| Function | What it computes |
|----------|-----------------|
| `getInventoryAnalytics` | Value trends, movement trends, low stock count, warehouse/product breakdowns, fast/slow moving products |
| `getPurchaseOrderAnalytics` | Monthly order volume, approval rate, fulfillment rate, status breakdown |
| `getShipmentAnalytics` | On-time delivery rate, delayed rate, volume trends, status breakdown |
| `getCertificateAnalytics` | Active/expiring/expired counts, **supplier compliance score** (score per supplier based on certificate ratio) |

**Key observation:** `getCertificateAnalytics` already computes a `supplierComplianceScore` — this can be extended to an overall platform compliance score.

## 1.5 Certificate Logic
**File:** `backend/src/lib/certificateUtils.ts`

| Status | Definition | Usage |
|--------|-----------|-------|
| `VALID` | expiry > 30 days from now | Response serialization only |
| `EXPIRING_SOON` | expiry within 30 days | Response + Scheduler notification |
| `EXPIRED` | expiry in the past | Response only — **no automated notifications for expired certs** |

**Gap:** `notifyCertificateExpired` is imported in notificationService.ts (line 5) and its email template exists (`dispatchCertExpiredEmails` in emailService.ts), but **it is never called from any scheduler or route**.

## 1.6 Inventory Calculations
**File:** `backend/src/routes/inventory.ts`

| Feature | Implementation |
|---------|---------------|
| Movement types | INBOUND, OUTBOUND, ADJUSTMENT |
| Stock validation | OUTBOUND checks `quantity >= requested` |
| Reorder level tracking | `reorderLevel` field on Inventory model (default 10) |
| Low stock notification | Triggered on ANY movement type (inbound/outbound/adjustment) |
| belowReorder filter | Query parameter to filter inventory where `quantity <= reorder_level` |
| Gap | No scheduled low-inventory scan — only triggered on movements |

## 1.7 Shipment Status Logic
**File:** `backend/src/routes/shipments.ts`

| Status | Transitions |
|--------|------------|
| PENDING | → IN_TRANSIT, DELAYED |
| IN_TRANSIT | → DELIVERED, DELAYED |
| DELIVERED | Terminal |
| DELAYED | Terminal |

**Current automatic triggers:**
- Setting status to DELAYED → calls `notifyShipmentDelayed`
- No automatic detection of over-due shipments (expected delivery passed but not marked DELIVERED)

## 1.8 Real-time Notification Stream
**File:** `backend/src/lib/notificationStream.ts`

- SSE (Server-Sent Events) at `/api/notifications/stream`
- Supports events: `notification_created`, `notification_read`, `certificate_expiring`, `low_stock`, `shipment_delayed`
- Heartbeat every 25 seconds
- Frontend hook: `useNotificationStream` in `frontend/src/lib/useNotificationStream.ts`

## 1.9 Frontend Summary

| Component | Purpose |
|-----------|---------|
| `dashboard-content.tsx` | Main dashboard — KPIs, charts, 3 widget cards |
| `kpi-cards.tsx` | 6 KPI cards (products, inventory value, suppliers, certificates, POs, shipments) |
| `charts.tsx` | 4 charts (inventory trend, orders, shipments, certificates) |
| `notification-bell.tsx` | Bell icon with unread count badge |
| `notification-dropdown.tsx` | Dropdown showing recent notifications with actions |
| `sidebar.tsx` | Navigation with role-based filtering |

---

# Phase 2 — Automation Opportunities (Ranked by ROI)

## ROI Rankings

| Rank | Opportunity | Business Value | Implementation Cost | Reasoning |
|------|-------------|---------------|-------------------|-----------|
| **1** | **Certificate Expired → Automated Alert** | HIGH | LOW | Code already exists (`notifyCertificateExpired` + `dispatchCertExpiredEmails` + template) but never wired. Add to daily scheduler. Zero new models needed. |
| **2** | **Overdue Shipment Detection** | HIGH | LOW | Business critical. Use scheduler to query shipments where `estimatedArrival < today AND status != DELIVERED`. Reuse existing notification infra. |
| **3** | **Scheduled Low Inventory Scan** | MEDIUM | LOW | Currently movement-triggered only. A scheduled daily scan catches restocks that skipped movement or manual adjustments. Reuse `notifyLowStock`. |
| **4** | **Compliance Score Engine** | HIGH | MEDIUM | Combines 4 risk factors into a single KPI. Uses existing analytics functions. Zero new DB tables. Frontend dashboard card only. |
| **5** | **Reusable Rule Engine** | MEDIUM | MEDIUM | Extract notification logic from scattered services into a clean `automation/` directory. Enables future rules without touching core services. |
| **6** | **Dashboard Compliance Widget** | MEDIUM | LOW | Add compliance score + issues count to existing dashboard. Reuse existing widget card pattern. |
| **7** | **Duplicate Alert Prevention for Shipments** | MEDIUM | VERY LOW | Add same `existingToday` check pattern used in `notifyCertificateExpiring`. Single day of effort. |

---

# Phase 3 — Automation Architecture Proposal

## Directory Structure

```
backend/src/lib/automation/
├── engine.ts                  # Orchestrator — runs all rules, prevents duplicates
├── types.ts                   # Shared types (RuleResult, Severity, etc.)
├── complianceScore.ts         # Compliance scoring engine
├── rules/
│   ├── certificate-expiring.ts   # Rule 1
│   ├── certificate-expired.ts    # Rule 2
│   ├── low-inventory.ts          # Rule 3
│   └── shipment-delay.ts         # Rule 4
```

## Engine Flow

```
AutomationEngine.evaluate()
    │
    ├── Rule 1: CertificateExpiring → Condition → Action
    ├── Rule 2: CertificateExpired  → Condition → Action
    ├── Rule 3: LowInventory       → Condition → Action
    └── Rule 4: ShipmentDelay      → Condition → Action
                │
                └── RuleResult { triggered, actions[] }
                    │
                    ├── createNotification()  → Notification table
                    ├── createAlert()         → Dashboard alert (reuses Notification with type=SYSTEM)
                    └── sendEmail()           → EmailService (optional, preference-based)
```

## Key Design Decisions

1. **No new DB tables** — Reuse `Notification` model with existing types. Compliance score is computed on-the-fly.
2. **No new cron jobs** — Single `startAutomationScheduler()` replaces scattered scheduler logic.
3. **Deduplication via idempotency keys** — Each rule generates a daily-unique key (e.g., `cert-expired-{certId}-{YYYY-MM-DD}`).
4. **Notification type NEW: `CERTIFICATE_EXPIRED`** — Add to Prisma enum.
5. **Compliance Score** — Pure computation, no persistence. Calculated from current DB state.

---

# Phase 4 — Files to Modify

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Add `CERTIFICATE_EXPIRED` and `COMPLIANCE_ISSUE` to NotificationType enum |
| `backend/src/lib/scheduler.ts` | Replace with new automation scheduler |
| `backend/src/lib/notificationService.ts` | Add `notifyCertificateExpired` (function exists but unused) |
| `backend/src/routes/dashboard.ts` | Add compliance score + issues to stats response |
| `frontend/src/lib/api.ts` | Add types for compliance score, compliance issues |
| `frontend/src/components/dashboard/kpi-cards.tsx` | Add compliance score KPI card |
| `frontend/src/components/dashboard/dashboard-content.tsx` | Add compliance issues widget |
| `frontend/src/components/dashboard/charts.tsx` | Add compliance score trend |

### New Files

| File | Purpose |
|------|---------|
| `backend/src/lib/automation/engine.ts` | Rule orchestrator |
| `backend/src/lib/automation/types.ts` | Shared types |
| `backend/src/lib/automation/complianceScore.ts` | Score computation |
| `backend/src/lib/automation/rules/certificate-expiring.ts` | Rule 1 |
| `backend/src/lib/automation/rules/certificate-expired.ts` | Rule 2 |
| `backend/src/lib/automation/rules/low-inventory.ts` | Rule 3 |
| `backend/src/lib/automation/rules/shipment-delay.ts` | Rule 4 |

---

# Phase 5 — Compliance Score Design

## Formula (0–100)

```
Score = 100 - (WEIGHTED_PENALTIES)

Components:
  1. Expired Certificates    Weight: 30pts  — Deduct 30 if ANY expired, else 0
  2. Expiring Certificates   Weight: 15pts  — Deduct 15 if ANY expiring within 30d, else 0
  3. Delayed Shipments       Weight: 20pts  — Deduct (delayed/total * 20)
  4. Low Inventory Items     Weight: 15pts  — Deduct (lowStock/total * 15)
  5. Certificate Coverage    Weight: 20pts  — Deduct (suppliersWithoutCerts/totalSuppliers * 20)
```

**Transparency:** Each factor is returned with its individual deduction so users can see WHY the score is what it is.

## Dashboard Display

```
┌──────────────────────────┐
│ Compliance Score: 78/100 │
│                          │
│ - Expired Certs:         │  -30 (0 expired)
│ - Expiring Certs:        │  -15 (3 expiring)
│ - Delayed Shipments:     │   -5 (2 delayed)
│ - Low Inventory:         │   -2 (3 items low)
│ - Certificate Coverage:  │   -0 (all covered)
└──────────────────────────┘
```

---

# Phase 6 — Dashboard Integration Plan

1. **Backend** (`/api/dashboard/stats`): Add compliance section to response
   - `complianceScore`: number (0–100)
   - `complianceBreakdown`: { factor: string, deduction: number, detail: string }[]
   - `complianceIssues`: { type: string, count: number }[]

2. **Frontend API types** (`api.ts`): Add compliance fields to `DashboardStats`

3. **KPI Cards**: Add 7th card "Compliance Score" with color-coded severity

4. **Dashboard Widgets**: Add 4th widget card "Compliance Issues" showing:
   - Number of expired certificates (severity: high)
   - Number of delayed shipments
   - Number of low inventory items
   - Button/link to relevant pages

5. **Charts**: Optional — add compliance score trend line

---

# Phase 7 — Implementation Plan

1. Prisma schema update (NotificationType enum)
2. Create `automation/types.ts` with shared types
3. Create `automation/rules/` with 4 rule files
4. Create `automation/complianceScore.ts`
5. Create `automation/engine.ts` as orchestrator
6. Update `notificationService.ts` — add missing `notifyCertificateExpired`
7. Update `scheduler.ts` — wire new automation engine
8. Update `dashboard.ts` route — add compliance score to stats
9. Update `api.ts` frontend — add compliance types
10. Update `kpi-cards.tsx` — add compliance score card
11. Update `dashboard-content.tsx` — add compliance issues widget
12. Generate Prisma client
13. Verification checklist

---

# Phase 8 — Safety Measures

| Concern | Mitigation |
|---------|-----------|
| Duplicate notifications | Daily-unique dedup keys per rule (checked before creation) |
| Notification spam | Max notifications per rule per day = 1 per entity |
| Repeated cron triggers | `node-cron` guarantees single execution. Engine is idempotent. |
| Performance degradation | All queries use indexed columns (expiryDate, status, estimatedArrival). Result caching via `staleTime: 60_000` on frontend. |
| Email overload | Respects user `NotificationPreference` flags. Fire-and-forget with retry. |

---

# Verification Checklist

- [ ] Rule 1 generates notification for certs expiring within 30 days
- [ ] Rule 1 does NOT re-notify same cert on same day
- [ ] Rule 2 generates HIGH severity notification for expired certs
- [ ] Rule 3 generates notifications for inventory where quantity <= reorderLevel
- [ ] Rule 4 generates notifications for shipments past estimated arrival
- [ ] Rule 4 does NOT re-notify same shipment on same day
- [ ] Compliance score returns value 0–100
- [ ] Compliance breakdown explains each factor
- [ ] Dashboard shows compliance score KPI
- [ ] Dashboard shows compliance issues widget
- [ ] No duplicate notifications in database
- [ ] All existing functionality continues working
- [ ] Frontend TypeScript compiles without errors
- [ ] Backend TypeScript compiles without errors