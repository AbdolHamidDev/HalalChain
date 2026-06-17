<div align="center">

<img src="frontend/public/logo.png" alt="HalalChain Logo" width="120" />

# HalalChain

![Build](https://github.com/AbdolHamidDev/HalalChain/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**Supply Chain Compliance & Traceability Platform** · **Nền tảng Tuân thủ & Truy xuất Chuỗi Cung ứng Halal**

Automated compliance monitoring, end-to-end traceability, QR verification, real-time alerts, operational intelligence, and scalable background job processing for modern halal supply chains across Southeast Asia.

[English](#english) · [Tiếng Việt](#tiếng-việt)

</div>

<img src="frontend/public/halalchain-hero-banner.png" alt="HalalChain Hero Banner" width="100%" />


### Demo

<p align="center">
  <img src="docs/demo/demo.gif" alt="HalalChain Demo" width="100%" />
</p>

---

## English

### What is HalalChain?

HalalChain is not just a CRUD management system. It is a **compliance-driven automation platform** that monitors, alerts, and scores your supply chain health through four key capabilities:

#### 🔍 Product Traceability
Public-facing traceability pages with QR code verification — consumers scan, no login required.

#### ⚖️ Compliance Monitoring
Automated certificate expiry detection (30-day window), expired certificate escalation with high-severity alerts, compliance issue tracking, and a transparent **Compliance Score (0–100)**.

#### 🤖 Automation Engine
Four automated rules run daily via cron:

| Rule | Condition | Actions |
|------|-----------|---------|
| **Certificate Expiring** | Expiry within 30 days | Notification + Alert + Email |
| **Certificate Expired** | Expiry date passed | HIGH severity notification + Compliance Issue + Email |
| **Low Inventory** | Stock ≤ reorder level | Notification + Replenishment suggestion |
| **Shipment Delay** | Past due + not delivered | Warning notification + Dashboard indicator |

All rules include **idempotent deduplication** — no duplicate notifications per entity per day.

#### 📊 Real-time Alerts & Background Processing
- In-app notifications via **Server-Sent Events** (SSE) with 25-second heartbeat
- **WebSocket (Socket.IO)** for real-time shipment tracking and activity streaming
- **BullMQ** queue system for reliable background job processing (emails, notifications, tracking events)
- **Redis** (Upstash managed) for caching, pub/sub, and queue backend
- Fire-and-forget email delivery via **Resend** or **SMTP** with exponential backoff retry (3 attempts)
- Per-user notification preferences

### Platform Features

| Category | Capabilities |
|----------|-------------|
| **Traceability** | Public traceability page, QR-based verification, product journey visualization |
| **Compliance Monitoring** | Certificate expiry detection, expired certificate alerts, compliance issue tracking, compliance scoring (0–100) |
| **Operations Monitoring** | Low inventory detection, shipment delay detection, dashboard alerts, automated notifications |
| **Real-time** | WebSocket (Socket.IO) for shipment tracking, SSE for notifications, BullMQ queues, Redis caching |
| **Platform** | RBAC (ADMIN/MANAGER/STAFF), audit logs (CREATE/UPDATE/DELETE/STATUS_CHANGE), email notifications (Resend/SMTP), real-time updates, dashboard analytics (6-month trends), Swagger API docs, **6-language i18n** with RTL support |

### Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│  Next.js 15 (Frontend) — React 19, Tailwind CSS 4            │
│  /dashboard/*  /settings/*  /traceability/*                  │
└──────────────────────┬───────────────────────────────────────┘
                        │  rewrites: /api/* → backend
                        │            /uploads/* → backend
                        ▼
┌──────────────────────────────────────────────────────────────┐
│  Express 5 (Backend) — TypeScript, Zod validation            │
│  /api/docs (Swagger UI)  /api/health                         │
│  /ws (WebSocket / Socket.IO)                                 │
└──────────────────────┬───────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Redis 7        │ │  BullMQ Queue   │ │  Socket.IO      │
│  (Upstash)      │ │  (3 queues)     │ │  WebSocket      │
│  - Cache        │ │  - shipments    │ │  - Rooms        │
│  - Pub/Sub      │ │  - notifications│ │  - Real-time    │
│  - Queue backend│ │  - emails       │ │    events       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│  Automation Engine (Daily at 08:00)                          │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Rule Evaluation  →  Condition Check  →  Action       │    │
│  │  ┌────────────────────────────────────────────────┐   │    │
│  │  │ Certificate Expiring  │ Certificate Expired    │   │    │
│  │  │ Low Inventory         │ Shipment Delay         │   │    │
│  │  └────────────────────────────────────────────────┘   │    │
│  │         ↓          ↓           ↓                      │    │
│  │  Notification  +  Alert  +  Email (fire-and-forget)   │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  PostgreSQL 16 + Prisma ORM                                  │
│  node-cron — automation rules evaluated daily at 08:00       │
└──────────────────────────────────────────────────────────────┘
```

Monorepo managed with **npm workspaces** (`backend/`, `frontend/`).

### Compliance Score

The Compliance Score (0–100) is computed on-the-fly from 5 transparent factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| Expired Certificates | 30pt | Full penalty if any expired certificate exists |
| Expiring Certificates | 15pt | Full penalty if any cert expires within 30 days |
| Delayed Shipments | up to 20pt | Proportional to delayed/total shipments |
| Low Inventory Items | up to 15pt | Proportional to low-stock/total items |
| Certificate Coverage | up to 20pt | Proportional to suppliers without active certs |

The breakdown is returned with every score so users can see **why** each point was deducted.

### User Roles & Account Management

| Role | Access |
|------|--------|
| **ADMIN** | Full platform access — all modules, user management, audit logs, destructive actions |
| **MANAGER** | Dashboard KPI/reports, analytics, suppliers, products, inventory, warehouses, POs, shipments, certificates |
| **STAFF** | Simplified dashboard, inventory operations (inbound/outbound/adjustment), warehouse read |

Role-based navigation is enforced on both frontend (`src/lib/navigation.ts`) and backend (`authorize` middleware).

**Account statuses:** Users can be `ACTIVE` or `SUSPENDED` — suspended accounts are rejected at login with a clear message. Additional user properties: `isVerified` boolean, `lastLoginAt` timestamp, and `tokenVersion` for forced invalidation.

**Invitation flow:** ADMINs invite new users via email — the invitation includes a role selection (ADMIN/MANAGER/STAFF), an expiry date, and an `accept-invite` page flow.

### 🌐 Multilingual Support (i18n)

HalalChain is fully internationalised with 6 locale options:

| Locale | Language | Direction | Flag |
|--------|----------|-----------|------|
| `en` | English | LTR | 🇬🇧 |
| `vi` | Tiếng Việt | LTR | 🇻🇳 |
| `ms` | Bahasa Melayu | LTR | 🇲🇾 |
| `id` | Bahasa Indonesia | LTR | 🇮🇩 |
| `ar` | العربية | **RTL** | 🇸🇦 |
| `th` | ไทย | LTR | 🇹🇭 |

Language preference is persisted via cookie (`halalchain_lang`). Includes **RTL layout support** for Arabic. Every UI module (navigation, auth, dashboard, products, suppliers, inventory, warehouses, POs, shipments, certificates, reports, settings, notifications, traceability) has its own namespace for clean translation management.

### Quick Start

#### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL + Redis)
- Cloudinary account *(optional — required only for avatar and certificate file uploads)*
- Resend API key or SMTP credentials *(optional — required only for email alerts)*
- Upstash Redis account *(optional — production Redis is configured with Upstash; local Redis via Docker works for development)*

#### Setup

```bash
npm install
npm run db:up
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run db:migrate
npm run db:seed
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000 |
| Swagger docs | http://localhost:4000/api/docs |
| WebSocket | ws://localhost:4000/ws |
| Prisma Studio | `npm run db:studio` |

Edit `backend/.env` — at minimum set `JWT_SECRET`. For avatar/certificate uploads, fill in the Cloudinary variables. For email alerts, set either `RESEND_API_KEY` or SMTP variables. For Redis, set `REDIS_URL` (local: `redis://localhost:6379`, or Upstash URL).

#### Demo accounts

| Email | Password | Role |
|-------|----------|------|
| admin@halalchain.com | Admin@123 | ADMIN |
| manager@halalchain.com | Admin@123 | MANAGER |
| staff@halalchain.com | Admin@123 | STAFF |
| staff2@halalchain.com | Admin@123 | STAFF |

Seed data creates all automation demo conditions:
- **3 expired certificates** → Rule 2 fires → Compliance Score affected
- **1 certificate expiring in 14 days** → Rule 1 fires
- **2 low-stock inventory items** → Rule 3 fires
- **3 overdue shipments** → Rule 4 fires
- **1 supplier without certificates** → Coverage factor affected

### Project Structure

```text
HalalChain/
├── backend/
│   ├── prisma/              # Schema, migrations, seed
│   └── src/
│       ├── routes/          # 20 REST API route files
│       │   ├── settings/    # Notification preferences, etc.
│       │   └── websocket.ts # WebSocket info endpoint
│       ├── middleware/      # JWT auth + role authorization + WebSocket auth
│       ├── lib/
│       │   ├── automation/  # Automation Engine (Sprint 6)
│       │   │   ├── engine.ts             # Rule orchestrator
│       │   │   ├── types.ts              # Shared types
│       │   │   ├── complianceScore.ts    # 0–100 scoring
│       │   │   └── rules/                # 4 automation rules
│       │   ├── redis.ts      # Redis client (Upstash-ready)
│       │   ├── websocket.ts  # Socket.IO server
│       │   ├── queue.ts      # BullMQ queues (shipments, notifications, emails)
│       │   ├── shipmentTracking.ts # Real-time tracking events
│       │   ├── analyticsService.ts
│       │   ├── notificationService.ts
│       │   ├── notificationStream.ts  # SSE streaming
│       │   ├── emailService.ts        # Resend/SMTP
│       │   ├── scheduler.ts          # Daily cron
│       │   ├── certificateUtils.ts
│       │   ├── qrService.ts
│       │   ├── auditLog.ts
│       │   ├── activityStream.ts
│       │   └── ...
│       └── tests/       # Vitest unit & property-based tests
├── frontend/
│   └── src/
│       ├── app/         # Next.js App Router pages (auth, dashboard, settings, traceability)
│       ├── components/  # UI modules, layout, shadcn/ui, settings
│       ├── lib/         # API client, navigation, SSE hook, WebSocket hook, utils
│       ├── i18n/        # 6-language internationalisation (EN, VI, MS, ID, AR, TH)
│       └── types/       # TypeScript declarations
├── docs/                # Architecture docs, screenshots, demo
│   ├── ENHANCED_ERD.md
│   ├── REALTIME_ARCHITECTURE.md
│   ├── REALTIME_IMPLEMENTATION_SUMMARY.md
│   ├── REALTIME_SETUP_GUIDE.md
│   ├── UI_UX_IMPROVEMENTS.md
│   ├── UPSTASH_REDIS_SETUP.md
│   ├── screenshots/
│   └── demo/
├── markdown/            # Internal design & sprint docs
│   ├── DESIGN.md
│   ├── SPRINT6_PLAN.md
│   └── ADMIN_USER_MANAGEMENT.md
├── docker-compose.yml   # PostgreSQL 16 + Redis 7
└── README.md
```

### API Overview

All protected routes require the `halalchain_token` cookie. Public endpoints live under `/api/public/`.

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Register, login, logout, token refresh, `/me` |
| `/api/dashboard` | KPI stats + Compliance Score, charts, activity feed |
| `/api/analytics` | Date-range analytics (certificates, inventory, POs, shipments) |
| `/api/suppliers` | Supplier CRUD |
| `/api/supplier-contacts` | Supplier contact management |
| `/api/products` | Product CRUD + traceability + QR |
| `/api/certificates` | Halal certificate CRUD + file upload |
| `/api/inventory` | Stock levels + movements |
| `/api/warehouses` | Warehouse CRUD |
| `/api/warehouse-zones` | Warehouse zone management |
| `/api/batch-lots` | Batch/lot tracking |
| `/api/tags` | Tag management |
| `/api/purchase-orders` | PO workflow + line items |
| `/api/shipments` | Shipment tracking |
| `/api/reports` | Summary + CSV/XLSX/PDF export (6 modules: products, inventory, suppliers, certificates, purchase-orders, shipments) with date-range filtering |
| `/api/notifications` | User notifications (SSE stream + WebSocket) |
| `/api/audit-logs` | Audit trail (ADMIN) |
| `/api/admin/users` | User management (ADMIN) |
| `/api/invitations` | User invite flow (ADMIN) |
| `/api/profile` | Profile (name, email), avatar upload (256×256 WebP via Cloudinary), password change with validation |
| `/api/settings/notifications` | Per-user notification preferences (certificate alerts, inventory alerts, shipment alerts, invitation emails) |
| `/api/public` | Public traceability (no auth) |
| `/ws` | WebSocket endpoint (Socket.IO) — real-time shipment tracking, activity feed, notifications |

**Traceability Engine:** The public traceability endpoint (`/api/public/traceability/:sku`) uses a dedicated engine (`traceabilityEngine.ts`) that builds a chronological timeline of events per product: supplier info → certificates → product details → purchase orders → shipments → inventory movements. All events are sorted ascending by date and returned as a structured JSON timeline.

**Real-time Features:**
- **WebSocket (Socket.IO)**: Room-based shipment tracking, live activity feed, instant notifications
- **SSE (Server-Sent Events)**: Notification stream with 25-second heartbeat
- **BullMQ Queues**: 3 queues for reliable background processing (shipment-tracking, notifications, emails)
- **Redis**: Caching, pub/sub, queue backend (Upstash managed in production)

Full OpenAPI 3 spec: `backend/src/swagger.yaml` — interactive docs at `/api/docs`.

### Enums & Statuses

| Model | Values |
|-------|--------|
| **UserRole** | `ADMIN`, `MANAGER`, `STAFF` |
| **UserStatus** | `ACTIVE`, `SUSPENDED` |
| **SupplierStatus** | `ACTIVE`, `INACTIVE` |
| **PurchaseOrderStatus** | `DRAFT`, `APPROVED`, `SHIPPING`, `RECEIVED`, `CANCELLED`, `PARTIAL` |
| **ShipmentStatus** | `PENDING`, `IN_TRANSIT`, `DELIVERED`, `DELAYED` |
| **InventoryMovementType** | `INBOUND`, `OUTBOUND`, `ADJUSTMENT` |
| **AuditAction** | `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE` |
| **NotificationType** | `LOW_STOCK`, `CERTIFICATE_EXPIRING`, `CERTIFICATE_EXPIRED`, `SHIPMENT_DELAYED`, `SYSTEM`, `COMPLIANCE_ISSUE` |

### Database Schema

```text
User ──┬── InventoryMovement
       ├── Notification
       ├── AuditLog
       ├── RefreshToken
       ├── NotificationPreference
       └── UserInvitation (invitedBy)

Supplier ──┬── Product ──┬── Inventory ── Warehouse
           │             ├── InventoryMovement
           │             └── PurchaseOrderItem
           ├── HalalCertificate
           ├── PurchaseOrder ──┬── PurchaseOrderItem
           │                   └── Shipment
           ├── SupplierContact
           └── Tag

Warehouse ── WarehouseZone

BatchLot ─── (product tracking)
```

### Technical Highlights

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Dialog, Select, DropdownMenu, Avatar, Checkbox, Tooltip, Collapsible, Label, Slot, Separator), TanStack React Query, Zustand (state), react-hook-form, Zod, Recharts, Framer Motion, Sonner (toast), next-themes (dark/light), Lucide icons, react-simple-maps, tw-animate-css |
| **Backend** | Express 5, TypeScript, Prisma, Zod, Helmet, JWT + Refresh Tokens, node-cron, Redis (ioredis + Upstash), BullMQ, Socket.IO |
| **Automation** | 4-rule engine, idempotent deduplication, daily cron, SSE + WebSocket streaming |
| **Database** | PostgreSQL 16, Prisma ORM |
| **Email** | Resend (primary) / SMTP (fallback), exponential backoff retry, 3 attempts |
| **File Storage** | Cloudinary (avatars: 256×256 WebP resize, certificate files), multer for upload handling |
| **Auth** | JWT access token (HttpOnly cookie), Refresh Token rotation (bcrypt-hashed), token version invalidation, rate limiter (5 req/min on refresh), user suspension support |
| **Real-time** | Server-Sent Events (SSE) with 25-second heartbeat + WebSocket (Socket.IO) for bidirectional communication |
| **Queue** | BullMQ with Redis backend — 3 queues: shipment-tracking, notifications, emails |
| **Deployment** | Docker Compose, npm workspaces, GitHub Actions CI |

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend concurrently |
| `npm run dev:api` | Backend only |
| `npm run dev:web` | Frontend only |
| `npm run db:up` | Start PostgreSQL + Redis (Docker) |
| `npm run db:down` | Stop PostgreSQL + Redis |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run test -w backend` | Run backend tests |

### Testing

Backend tests use **Vitest** with unit tests and property-based tests (`fast-check`) for notification deduplication logic.

```bash
npm run test -w backend
```

### Documentation

| Document | Description |
|----------|-------------|
| `docs/ENHANCED_ERD.md` | Enhanced Entity-Relationship Diagram |
| `docs/REALTIME_ARCHITECTURE.md` | Real-time architecture (Redis, WebSocket, BullMQ) |
| `docs/REALTIME_IMPLEMENTATION_SUMMARY.md` | Real-time features implementation summary |
| `docs/REALTIME_SETUP_GUIDE.md` | Step-by-step real-time setup guide |
| `docs/UI_UX_IMPROVEMENTS.md` | Dashboard & certificates UI/UX improvement proposals |
| `docs/UPSTASH_REDIS_SETUP.md` | Upstash Redis configuration & production setup |
| `markdown/SPRINT6_PLAN.md` | Sprint 6 — Compliance & Automation Engine plan |
| `markdown/DESIGN.md` | System design documentation |
| `markdown/ADMIN_USER_MANAGEMENT.md` | Admin user management guide |

### Deployment (planned)

| Layer | Target |
|-------|--------|
| Frontend | Vercel |
| API + DB + Redis | Railway |

Set `NODE_ENV=production`, a strong `JWT_SECRET`, and `FRONTEND_URL` to your production frontend origin. Configure `NEXT_PUBLIC_API_URL` on the frontend to point at the deployed API. For Redis, use Upstash or self-hosted Redis.

### Screenshots

| Compliance Dashboard | Inventory Management |
|:--------------------:|:--------------------:|
| ![Compliance Dashboard](docs/screenshots/dashboard.png) | ![Inventory with Low Stock Alerts](docs/screenshots/inventory.png) |
| Compliance Score KPI, automation alerts, operational widgets | Stock levels, movements, and automated low-stock detection |

| Product Traceability | User Management |
|:--------------------:|:---------------:|
| ![Public Traceability Portal](docs/screenshots/traceability.png) | ![RBAC User Management](docs/screenshots/users.png) |
| Public timeline — no login required | Role-based access with audit logs and invitation flow |

### Contributing

HalalChain is open-source and welcomes contributions from the community! 🎉

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines — including branch naming, commit message conventions, development workflow, and PR process.

Quick links:
- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)
- [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md)

Whether you're fixing a bug, adding a feature, improving documentation, or just experimenting — feel free to **fork**, **star**, and send a **pull request**.
We also welcome issues, feature requests, and discussions. Let's build better halal supply chain compliance together.

### License

**MIT** — see [LICENSE](LICENSE) for details. You are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software.

---

## Tiếng Việt

### HalalChain là gì?

HalalChain không chỉ là một hệ thống quản lý CRUD. Đây là **nền tảng tự động hóa tuân thủ** giám sát, cảnh báo và chấm điểm sức khỏe chuỗi cung ứng của bạn thông qua bốn khả năng chính:

#### 🔍 Truy xuất nguồn gốc sản phẩm
Trang truy xuất công khai với mã QR — người tiêu dùng quét mã, không cần đăng nhập.

#### ⚖️ Giám sát tuân thủ
Phát hiện chứng nhận sắp hết hạn (trong vòng 30 ngày), cảnh báo chứng nhận đã hết hạn với mức ưu tiên CAO, theo dõi vấn đề tuân thủ, và **Điểm Tuân thủ (0–100)** minh bạch.

#### 🤖 Công cụ tự động hóa
Bốn quy tắc tự động chạy hàng ngày qua cron:

| Quy tắc | Điều kiện | Hành động |
|---------|-----------|-----------|
| **Chứng nhận sắp hết hạn** | Hết hạn trong vòng 30 ngày | Thông báo + Cảnh báo + Email |
| **Chứng nhận đã hết hạn** | Ngày hết hạn đã qua | Cảnh báo mức CAO + Vấn đề tuân thủ + Email |
| **Tồn kho thấp** | Số lượng ≤ mức đặt hàng lại | Thông báo + Đề xuất bổ sung |
| **Giao hàng trễ** | Quá hạn + chưa giao | Cảnh báo + Chỉ báo trên dashboard |

Tất cả quy tắc đều có **cơ chế chống trùng lặp** — không có thông báo trùng lặp cho mỗi thực thể mỗi ngày.

#### 📊 Cảnh báo thời gian thực & Xử lý nền
- Thông báo trong ứng dụng qua **Server-Sent Events** (SSE) với heartbeat 25 giây
- **WebSocket (Socket.IO)** cho theo dõi lô hàng thời gian thực và luồng hoạt động
- Hàng đợi **BullMQ** để xử lý công việc nền đáng tin cậy (email, thông báo, sự kiện theo dõi)
- **Redis** (Upstash quản lý) cho bộ nhớ đệm, pub/sub, và backend hàng đợi
- Gửi email qua **Resend** hoặc **SMTP** với cơ chế thử lại 3 lần

### Tính năng nền tảng

| Danh mục | Khả năng |
|----------|----------|
| **Truy xuất** | Trang truy xuất công khai, xác minh QR, trực quan hóa hành trình sản phẩm |
| **Giám sát tuân thủ** | Phát hiện chứng nhận hết hạn, cảnh báo chứng nhận quá hạn, theo dõi vấn đề tuân thủ, điểm tuân thủ (0–100) |
| **Giám sát vận hành** | Phát hiện tồn kho thấp, phát hiện giao hàng trễ, cảnh báo dashboard, thông báo tự động |
| **Thời gian thực** | WebSocket (Socket.IO) cho theo dõi lô hàng, SSE cho thông báo, hàng đợi BullMQ, bộ nhớ đệm Redis |
| **Nền tảng** | RBAC (ADMIN/MANAGER/STAFF), audit logs, email, cập nhật thời gian thực, phân tích, Swagger API docs, đa ngôn ngữ (6 ngôn ngữ) với hỗ trợ RTL |

### Kiến trúc

```text
┌──────────────────────────────────────────────────────────────┐
│  Next.js 15 (Frontend) — React 19, Tailwind CSS 4            │
│  /dashboard/*  /settings/*  /traceability/*                  │
└──────────────────────┬───────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│  Express 5 (Backend) — TypeScript, Zod                       │
│  /api/docs  /api/health  /ws (WebSocket)                     │
└──────────────────────┬───────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Redis 7        │ │  BullMQ Queue   │ │  Socket.IO      │
│  (Upstash)      │ │  (3 hàng đợi)   │ │  WebSocket      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│  Automation Engine (Hàng ngày lúc 08:00)                     │
│  → 4 quy tắc: Chứng nhận sắp hết hạn / Đã hết hạn          │
│     Tồn kho thấp / Giao hàng trễ                             │
│  → Thông báo + Cảnh báo + Email                             │
└──────────────────────────┬───────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  PostgreSQL 16 + Prisma ORM                                  │
└──────────────────────────────────────────────────────────────┘
```

### Quản lý tài khoản & Vai trò

| Vai trò | Truy cập |
|---------|----------|
| **ADMIN** | Toàn bộ nền tảng — tất cả modules, quản lý người dùng, audit logs, hành động phá hủy |
| **MANAGER** | Dashboard KPI/báo cáo, analytics, nhà cung cấp, sản phẩm, tồn kho, kho hàng, đơn đặt hàng, lô hàng, chứng nhận |
| **STAFF** | Dashboard đơn giản, thao tác tồn kho (nhập/xuất/điều chỉnh), xem kho |

Trạng thái tài khoản: `ACTIVE` hoặc `SUSPENDED` — tài khoản bị đình chỉ sẽ bị từ chối khi đăng nhập.

Luồng mời: ADMIN mời người dùng mới qua email — lời mời bao gồm chọn vai trò (ADMIN/MANAGER/STAFF), ngày hết hạn, và trang `accept-invite`.

### Đa ngôn ngữ (i18n)

HalalChain hỗ trợ 6 ngôn ngữ:

| Ngôn ngữ | Hướng | Cờ |
|----------|-------|-----|
| English | LTR | 🇬🇧 |
| Tiếng Việt | LTR | 🇻🇳 |
| Bahasa Melayu | LTR | 🇲🇾 |
| Bahasa Indonesia | LTR | 🇮🇩 |
| العربية | **RTL** | 🇸🇦 |
| ไทย | LTR | 🇹🇭 |

Ngôn ngữ được lưu qua cookie (`halalchain_lang`). Hỗ trợ bố cục RTL cho tiếng Ả Rập.

### Tài khoản demo

| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| admin@halalchain.com | Admin@123 | ADMIN |
| manager@halalchain.com | Admin@123 | MANAGER |
| staff@halalchain.com | Admin@123 | STAFF |
| staff2@halalchain.com | Admin@123 | STAFF |

### Công nghệ

**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Dialog, Select, DropdownMenu, Avatar, Checkbox, Tooltip, Collapsible, Label, Slot, Separator), TanStack React Query, Zustand (state), react-hook-form, Zod, Recharts, Framer Motion, Sonner (toast), next-themes (dark/light), Lucide icons, react-simple-maps, tw-animate-css

**Backend:** Express 5, Prisma, PostgreSQL, JWT + Refresh Tokens (rotation, bcrypt-hashed), Zod, Helmet, node-cron, Redis (ioredis + Upstash), BullMQ, Socket.IO, Cloudinary (avatar: 256×256 WebP), Resend/SMTP, multer

**Thời gian thực & Hàng đợi:** WebSocket (Socket.IO), SSE, BullMQ (3 hàng đợi), Redis (Upstash)

**Đa ngôn ngữ:** 6 ngôn ngữ (EN, VI, MS, ID, AR, TH) với hỗ trợ RTL cho tiếng Ả Rập

### Đóng góp

HalalChain là mã nguồn mở và hoan nghênh sự đóng góp từ cộng đồng! 🎉

Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết hướng dẫn chi tiết — bao gồm quy tắc đặt tên nhánh, quy ước commit message, quy trình phát triển và quy trình PR.

Liên kết nhanh:
- [Hướng dẫn đóng góp](CONTRIBUTING.md)
- [Quy tắc ứng xử](CODE_OF_CONDUCT.md)
- [Chính sách bảo mật](SECURITY.md)
- [Mẫu báo cáo lỗi](.github/ISSUE_TEMPLATE/bug_report.md)
- [Mẫu yêu cầu tính năng](.github/ISSUE_TEMPLATE/feature_request.md)
- [Mẫu Pull Request](.github/PULL_REQUEST_TEMPLATE.md)

Cho dù bạn sửa lỗi, thêm tính năng, cải thiện tài liệu hay chỉ đang thử nghiệm — hãy thoải mái **fork**, **star**, và gửi **pull request**.
Chúng tôi cũng hoan nghênh các issue, yêu cầu tính năng và thảo luận. Cùng nhau xây dựng hệ thống tuân thủ chuỗi cung ứng Halal tốt hơn.

### Giấy phép

**MIT** — xem [LICENSE](LICENSE) để biết chi tiết. Bạn được tự do sử dụng, sao chép, sửa đổi, hợp nhất, xuất bản, phân phối, cấp phép lại và/hoặc bán các bản sao phần mềm.