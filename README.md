<div align="center">

# HalalChain

![Build](https://github.com/AbdolHamidDev/HalalChain/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)

**Halal Supply Chain Management Platform** · **Nền tảng Quản lý Chuỗi Cung ứng Halal**

Quản lý nhà cung cấp, tồn kho, đơn mua hàng, vận chuyển, chứng nhận Halal và truy xuất nguồn gốc sản phẩm trên mạng lưới thương mại Đông Nam Á.

Supplier management, inventory tracking, purchase orders, shipment monitoring, halal certification compliance, and product traceability for Southeast Asian trade networks.

[English](#english) · [Tiếng Việt](#tiếng-việt)

</div>

---

## English

### Features

| Module | Description |
|--------|-------------|
| **Authentication** | JWT in HttpOnly cookie (`halalchain_token`), register, login/logout, session invalidation via `tokenVersion` |
| **Dashboard** | Live KPI cards, charts, and activity feed (ADMIN/MANAGER); simplified warehouse view for STAFF |
| **Suppliers** | CRUD, country flags, active/inactive status |
| **Products** | CRUD with SKU, category, pricing; internal traceability view + QR code generation |
| **Halal Certificates** | Linked to suppliers, expiry tracking, file URL support |
| **Warehouses** | Multi-warehouse locations |
| **Inventory** | Stock levels, reorder alerts, inbound / outbound / adjustment movements |
| **Purchase Orders** | Draft → Approved → Shipping → Received / Partial / Cancelled workflow with line items |
| **Shipments** | Tracking numbers, origin/destination, status (Pending, In Transit, Delivered, Delayed) |
| **Reports** | Inventory summary + CSV export |
| **Notifications** | In-app alerts for low stock, delayed shipments, expiring certificates |
| **Audit Logs** | CREATE / UPDATE / DELETE / STATUS_CHANGE history (ADMIN) |
| **User Management** | Invite users, suspend accounts, verified badge (ADMIN) |
| **Product Traceability** | Public timeline page (no login) + QR codes for consumer verification |
| **Settings** | Profile (avatar via Cloudinary), password change, light/dark theme |

### Architecture

```text
┌─────────────────────────────────────────────────────────┐
│  Next.js 15 (Frontend) — React 19, Tailwind CSS 4       │
│  /dashboard/*  /settings/*  /traceability/*             │
└───────────────────────┬─────────────────────────────────┘
                        │  rewrites: /api/* → backend
                        │            /uploads/* → backend
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Express 5 (Backend) — TypeScript, Zod validation       │
│  /api/docs (Swagger UI)  /api/health                      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL 16 + Prisma ORM                             │
│  node-cron scheduler (certificate expiry alerts)        │
└─────────────────────────────────────────────────────────┘
```

Monorepo managed with **npm workspaces** (`backend/`, `frontend/`).

### User Roles

| Role | Access |
|------|--------|
| **ADMIN** | Full platform access — all modules, user management, audit logs, destructive actions |
| **MANAGER** | Dashboard KPI/reports, suppliers, products, inventory, warehouses, POs, shipments, certificates |
| **STAFF** | Simplified dashboard, inventory operations (inbound/outbound/adjustment), warehouse read |

Role-based navigation is enforced on both frontend (`src/lib/navigation.ts`) and backend (`authorize` middleware).

### Quick Start

#### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- Cloudinary account *(optional — required only for avatar uploads)*

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
| Prisma Studio | `npm run db:studio` |

Edit `backend/.env` — at minimum set `JWT_SECRET`. For avatar uploads, fill in the Cloudinary variables.

#### Demo accounts

| Email | Password | Role |
|-------|----------|------|
| admin@halalchain.com | Admin@123 | ADMIN |
| manager@halalchain.com | Admin@123 | MANAGER |
| staff@halalchain.com | Admin@123 | STAFF |
| staff2@halalchain.com | Admin@123 | STAFF |

Seed data includes suppliers from Malaysia, Indonesia, Thailand, and Singapore with sample products, certificates, inventory, purchase orders, and shipments.

### Project Structure

```text
HalalChain/
├── backend/
│   ├── prisma/          # Schema, migrations, seed
│   └── src/
│       ├── routes/      # REST API endpoints
│       ├── middleware/  # JWT auth + role authorization
│       ├── lib/         # Services (analytics, notifications, QR, audit, …)
│       └── tests/       # Vitest unit & property tests
├── frontend/
│   └── src/
│       ├── app/         # Next.js App Router pages
│       ├── components/  # UI modules, layout, shadcn/ui
│       └── lib/         # API client, navigation, utils
├── docker-compose.yml   # PostgreSQL 16
└── markdown/            # Internal design & admin docs
```

### API Overview

All protected routes require the `halalchain_token` cookie. Public endpoints live under `/api/public/`.

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Register, login, logout, `/me` |
| `/api/dashboard` | KPI stats, charts, activity feed |
| `/api/suppliers` | Supplier CRUD |
| `/api/products` | Product CRUD + traceability + QR |
| `/api/certificates` | Halal certificate CRUD |
| `/api/warehouses` | Warehouse CRUD |
| `/api/inventory` | Stock levels + movements |
| `/api/purchase-orders` | PO workflow + line items |
| `/api/shipments` | Shipment tracking |
| `/api/reports` | Summary + CSV export |
| `/api/notifications` | User notifications |
| `/api/audit-logs` | Audit trail (ADMIN) |
| `/api/admin/users` | User management (ADMIN) |
| `/api/invitations` | User invite flow (ADMIN) |
| `/api/profile` | Profile & password |
| `/api/public` | Public traceability (no auth) |

Full OpenAPI 3 spec: `backend/src/swagger.yaml` — interactive docs at `/api/docs`.

### Database Schema

```text
User ──┬── InventoryMovement
       ├── Notification
       ├── AuditLog
       └── UserInvitation (invitedBy)

Supplier ──┬── Product ──┬── Inventory ── Warehouse
           │             └── InventoryMovement
           ├── HalalCertificate
           └── PurchaseOrder ──┬── PurchaseOrderItem ── Product
                               └── Shipment
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend concurrently |
| `npm run dev:api` | Backend only |
| `npm run dev:web` | Frontend only |
| `npm run db:up` | Start PostgreSQL (Docker) |
| `npm run db:down` | Stop PostgreSQL |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run test -w backend` | Run backend tests |

### Tech Stack

**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack React Query, Zod, React Hook Form, Recharts, next-themes, Sonner, Zustand, Lucide icons

**Backend:** Express 5, Prisma, PostgreSQL, JWT, bcrypt, Zod, Helmet, express-rate-limit, node-cron, Cloudinary, Multer, QRCode, Swagger UI

**DevOps:** Docker Compose (PostgreSQL 16), npm workspaces, GitHub Actions CI

### Testing

Backend tests use **Vitest** with unit tests and property-based tests (`fast-check`) for notification deduplication logic.

```bash
npm run test -w backend
```

### Deployment (planned)

| Layer | Target |
|-------|--------|
| Frontend | Vercel |
| API + DB | Railway |

Set `NODE_ENV=production`, a strong `JWT_SECRET`, and `FRONTEND_URL` to your production frontend origin. Configure `NEXT_PUBLIC_API_URL` on the frontend to point at the deployed API.

### Screenshots

| Dashboard | Inventory |
|:---------:|:---------:|
| ![Operations Dashboard](docs/screenshots/dashboard.png) | ![Inventory Management](docs/screenshots/inventory.png) |
| KPI cards, charts, and activity feed | Stock levels, movements, and reorder alerts |

| Product Traceability | User Management |
|:--------------------:|:---------------:|
| ![Public Traceability](docs/screenshots/traceability.png) | ![User Management](docs/screenshots/users.png) |
| Public timeline — no login required | Invite, suspend, and verify users (ADMIN) |

### License

**Proprietary** — all rights reserved. Unauthorized copying, distribution, or use is prohibited.

---

## Tiếng Việt

### Tính năng

| Module | Mô tả |
|--------|-------|
| **Xác thực** | JWT trong HttpOnly cookie (`halalchain_token`), đăng ký, đăng nhập/đăng xuất, vô hiệu hóa phiên qua `tokenVersion` |
| **Dashboard** | KPI, biểu đồ, activity feed (ADMIN/MANAGER); giao diện kho đơn giản cho STAFF |
| **Nhà cung cấp** | CRUD, cờ quốc gia, trạng thái active/inactive |
| **Sản phẩm** | CRUD với SKU, danh mục, giá; truy xuất nội bộ + mã QR |
| **Chứng nhận Halal** | Gắn với nhà cung cấp, theo dõi hạn hết, hỗ trợ file URL |
| **Kho hàng** | Quản lý nhiều kho |
| **Tồn kho** | Mức tồn, cảnh báo reorder, nhập / xuất / điều chỉnh |
| **Đơn mua hàng** | Quy trình Draft → Approved → Shipping → Received / Partial / Cancelled kèm line items |
| **Vận chuyển** | Mã tracking, xuất xứ/đích, trạng thái (Pending, In Transit, Delivered, Delayed) |
| **Báo cáo** | Tổng hợp tồn kho + xuất CSV |
| **Thông báo** | Cảnh báo tồn thấp, giao hàng trễ, chứng nhận sắp hết hạn |
| **Audit Logs** | Lịch sử CREATE / UPDATE / DELETE / STATUS_CHANGE (ADMIN) |
| **Quản lý người dùng** | Mời user, khóa tài khoản, badge xác minh (ADMIN) |
| **Truy xuất nguồn gốc** | Trang công khai (không cần đăng nhập) + mã QR cho người tiêu dùng |
| **Cài đặt** | Hồ sơ (avatar qua Cloudinary), đổi mật khẩu, giao diện sáng/tối |

### Kiến trúc

```text
┌─────────────────────────────────────────────────────────┐
│  Next.js 15 (Frontend) — React 19, Tailwind CSS 4       │
│  /dashboard/*  /settings/*  /traceability/*             │
└───────────────────────┬─────────────────────────────────┘
                        │  rewrites: /api/* → backend
                        │            /uploads/* → backend
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Express 5 (Backend) — TypeScript, Zod validation       │
│  /api/docs (Swagger UI)  /api/health                      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL 16 + Prisma ORM                             │
│  node-cron — cảnh báo chứng nhận sắp hết hạn (8h sáng)   │
└─────────────────────────────────────────────────────────┘
```

Monorepo dùng **npm workspaces** (`backend/`, `frontend/`).

### Vai trò người dùng

| Vai trò | Quyền truy cập |
|---------|----------------|
| **ADMIN** | Toàn quyền — mọi module, quản lý user, audit logs, thao tác xóa |
| **MANAGER** | Dashboard KPI/báo cáo, nhà cung cấp, sản phẩm, tồn kho, kho, PO, vận chuyển, chứng nhận |
| **STAFF** | Dashboard đơn giản, thao tác tồn kho (nhập/xuất/điều chỉnh), xem kho |

Phân quyền được áp dụng ở cả frontend (`src/lib/navigation.ts`) và backend (middleware `authorize`).

### Cài đặt nhanh

#### Yêu cầu

- Node.js 20+
- Docker (PostgreSQL)
- Tài khoản Cloudinary *(tùy chọn — chỉ cần khi upload avatar)*

#### Các bước

```bash
npm install
npm run db:up
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run db:migrate
npm run db:seed
npm run dev
```

| Dịch vụ | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000 |
| Swagger docs | http://localhost:4000/api/docs |
| Prisma Studio | `npm run db:studio` |

Chỉnh `backend/.env` — tối thiểu đặt `JWT_SECRET`. Để upload avatar, điền biến Cloudinary.

#### Tài khoản demo

| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| admin@halalchain.com | Admin@123 | ADMIN |
| manager@halalchain.com | Admin@123 | MANAGER |
| staff@halalchain.com | Admin@123 | STAFF |
| staff2@halalchain.com | Admin@123 | STAFF |

Dữ liệu seed gồm nhà cung cấp từ Malaysia, Indonesia, Thái Lan, Singapore cùng sản phẩm, chứng nhận, tồn kho, đơn mua hàng và lô hàng mẫu.

### Cấu trúc dự án

```text
HalalChain/
├── backend/
│   ├── prisma/          # Schema, migrations, seed
│   └── src/
│       ├── routes/      # REST API endpoints
│       ├── middleware/  # JWT auth + phân quyền
│       ├── lib/         # Services (analytics, notifications, QR, audit, …)
│       └── tests/       # Vitest unit & property tests
├── frontend/
│   └── src/
│       ├── app/         # Next.js App Router
│       ├── components/  # UI modules, layout, shadcn/ui
│       └── lib/         # API client, navigation, utils
├── docker-compose.yml   # PostgreSQL 16
└── markdown/            # Tài liệu thiết kế & admin nội bộ
```

### Tổng quan API

Route được bảo vệ yêu cầu cookie `halalchain_token`. Endpoint công khai nằm dưới `/api/public/`.

| Prefix | Mục đích |
|--------|----------|
| `/api/auth` | Đăng ký, đăng nhập, đăng xuất, `/me` |
| `/api/dashboard` | KPI, biểu đồ, activity feed |
| `/api/suppliers` | CRUD nhà cung cấp |
| `/api/products` | CRUD sản phẩm + truy xuất + QR |
| `/api/certificates` | CRUD chứng nhận Halal |
| `/api/warehouses` | CRUD kho |
| `/api/inventory` | Tồn kho + biến động |
| `/api/purchase-orders` | Quy trình PO + line items |
| `/api/shipments` | Theo dõi vận chuyển |
| `/api/reports` | Tổng hợp + xuất CSV |
| `/api/notifications` | Thông báo người dùng |
| `/api/audit-logs` | Audit trail (ADMIN) |
| `/api/admin/users` | Quản lý user (ADMIN) |
| `/api/invitations` | Luồng mời user (ADMIN) |
| `/api/profile` | Hồ sơ & mật khẩu |
| `/api/public` | Truy xuất công khai (không auth) |

OpenAPI 3 đầy đủ: `backend/src/swagger.yaml` — tài liệu tương tác tại `/api/docs`.

### Sơ đồ cơ sở dữ liệu

```text
User ──┬── InventoryMovement
       ├── Notification
       ├── AuditLog
       └── UserInvitation (invitedBy)

Supplier ──┬── Product ──┬── Inventory ── Warehouse
           │             └── InventoryMovement
           ├── HalalCertificate
           └── PurchaseOrder ──┬── PurchaseOrderItem ── Product
                               └── Shipment
```

### Lệnh thường dùng

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy backend + frontend |
| `npm run dev:api` | Chỉ backend |
| `npm run dev:web` | Chỉ frontend |
| `npm run db:up` | Khởi động PostgreSQL (Docker) |
| `npm run db:down` | Dừng PostgreSQL |
| `npm run db:migrate` | Chạy Prisma migrations |
| `npm run db:seed` | Seed dữ liệu demo |
| `npm run db:studio` | Mở Prisma Studio |
| `npm run test -w backend` | Chạy test backend |

### Công nghệ

**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack React Query, Zod, React Hook Form, Recharts, next-themes, Sonner, Zustand, Lucide icons

**Backend:** Express 5, Prisma, PostgreSQL, JWT, bcrypt, Zod, Helmet, express-rate-limit, node-cron, Cloudinary, Multer, QRCode, Swagger UI

**DevOps:** Docker Compose (PostgreSQL 16), npm workspaces, GitHub Actions CI

### Kiểm thử

Backend dùng **Vitest** kèm unit test và property-based test (`fast-check`) cho logic deduplicate thông báo.

```bash
npm run test -w backend
```

### Triển khai (dự kiến)

| Tầng | Nền tảng |
|------|----------|
| Frontend | Vercel |
| API + DB | Railway |

Đặt `NODE_ENV=production`, `JWT_SECRET` mạnh, và `FRONTEND_URL` trỏ về frontend production. Cấu hình `NEXT_PUBLIC_API_URL` trên frontend trỏ tới API đã deploy.

### Ảnh chụp màn hình

| Dashboard | Tồn kho |
|:---------:|:-------:|
| ![Operations Dashboard](docs/screenshots/dashboard.png) | ![Inventory Management](docs/screenshots/inventory.png) |
| KPI, biểu đồ và activity feed | Mức tồn, biến động và cảnh báo reorder |

| Truy xuất nguồn gốc | Quản lý người dùng |
|:------------------:|:------------------:|
| ![Public Traceability](docs/screenshots/traceability.png) | ![User Management](docs/screenshots/users.png) |
| Timeline công khai — không cần đăng nhập | Mời, khóa và xác minh user (ADMIN) |

### Giấy phép

**Proprietary (Độc quyền)** — mọi quyền được bảo lưu. Cấm sao chép, phân phối hoặc sử dụng trái phép.
