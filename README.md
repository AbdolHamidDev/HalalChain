# HalalChain

**Halal Supply Chain Management Platform** enabling supplier management, inventory tracking, shipment monitoring and halal certification compliance across Southeast Asian trade networks.

## Architecture

```text
Next.js 15 (Frontend)
       ↓  REST /api proxy
Express.js (Backend)
       ↓
PostgreSQL + Prisma ORM
```

## MVP Modules

| Module | Status |
|--------|--------|
| Authentication (JWT + HttpOnly cookie) | ✅ |
| Dashboard KPI & Charts (live data) | ✅ |
| Supplier / Product / Certificate CRUD | ✅ |
| Inventory inbound / outbound | ✅ |
| Purchase Orders workflow | ✅ |
| Shipment tracking | ✅ |
| Reports + CSV export | ✅ |

## User Roles

| Role | Access |
|------|--------|
| **ADMIN** | Full platform access |
| **MANAGER** | KPI, reports, read modules |
| **STAFF** | Dashboard + inventory operations |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### 1. Install dependencies

```bash
npm install
```

### 2. Start database

```bash
npm run db:up
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
```

### 4. Run migrations & seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start development

```bash
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:4000

### Demo accounts

| Email | Password | Role |
|-------|----------|------|
| admin@halalchain.com | Admin@123 | ADMIN |
| manager@halalchain.com | Admin@123 | MANAGER |
| staff@halalchain.com | Admin@123 | STAFF |

## Deployment

| Layer | Target |
|-------|--------|
| Frontend | Vercel |
| API + DB | Railway |

## Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, React Query, Zod, React Hook Form, Recharts

**Backend:** Express, Prisma, PostgreSQL, JWT, bcrypt

## Database ERD

```text
Supplier ──┬── Product ── Inventory ── Warehouse
           ├── PurchaseOrder ── Shipment
           └── HalalCertificate

User ── InventoryMovement
```
