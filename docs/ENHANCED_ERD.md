# Enhanced ERD — HalalChain Supply Chain Schema

## Overview

This document describes the enhanced Prisma schema with proper M:N (many-to-many) relationships, version tracking, batch/lot management, and audit-trail logging that real-world supply chain systems require.

## Migration from Flat to Complex Relationships

### M:N Relationships (Junction Tables)

| Relationship | Junction Table | Purpose |
|---|---|---|
| Product ↔ Supplier | `SupplierProduct` | A product can be sourced from multiple suppliers; each supplier can supply many products |
| Product ↔ HalalCertificate | `ProductCertification` | A certificate can cover multiple products; a product can have many certificates |
| Product ↔ Tag | `ProductTag` | Many-to-many product taxonomy tags |
| PurchaseOrder ↔ User (Approver) | `PurchaseOrderApproval` | PO approval workflow with full status-transition audit |

### New Models for Version Tracking

| Model | Parent | What It Tracks |
|---|---|---|
| `ProductVersion` | Product (1:N) | Immutable snapshot of product attributes on every update |
| `SupplierProductPriceHistory` | SupplierProduct (1:N) | Append-only price changes for each supplier-product relationship |
| `ShipmentEvent` | Shipment (1:N) | Append-only status-change log for shipments |

### New Models for Inventory Depth

| Model | Parent | Purpose |
|---|---|---|
| `SupplierContact` | Supplier (1:N) | Multiple contacts per supplier |
| `WarehouseZone` | Warehouse (1:N) | Physical zones within a warehouse |
| `BatchLot` | Product + Warehouse + Zone (1:N) | Track inventory by batch/lot number with expiry dates |
| `PurchaseOrderApproval` | PurchaseOrder + User (1:N) | Full approval workflow audit trail |

---

## Entity Relationship Diagram (Textual)

```
┌──────────────┐       ┌─────────────────────┐       ┌──────────────────┐
│    User      │       │  PurchaseOrder       │       │   Supplier       │
│──────────────│       │─────────────────────│       │──────────────────│
│ id (PK)      │──┐    │ id (PK)             │──┐    │ id (PK)          │
│ name         │  │    │ poNumber (UQ)        │  │    │ name             │
│ email (UQ)   │  │    │ status (enum)        │  │    │ country          │
│ role         │  │    │ totalAmount          │  │    │ complianceScore  │
│              │  │    │ version (counter)    │  │    │                  │
└──────────────┘  │    └───────┬─────────────┘  │    └────┬─────────────┘
                  │            │                 │         │
                  │    ┌───────┴─────────────┐   │   ┌─────┴──────────────┐
                  │    │ PurchaseOrderApproval│  │   │  SupplierContact   │
                  │    │─────────────────────│   │   │───────────────────│
                  │    │ purchaseOrderId (FK) │  │   │ supplierId (FK)    │
                  └────│ approverId (FK)      │  │   │ name, role, email  │
                       │ fromStatus, toStatus │  └───│ isPrimary          │
                       └─────────────────────┘      └────────────────────┘

┌──────────────────────┐        ┌──────────────────────┐
│   ProductVersion     │        │    Product            │
│──────────────────────│        │───────────────────────│
│ productId (FK) + ver │──┐     │ id (PK)              │──┐
│ name, sku, category  │  │     │ supplierId (FK)       │  │
│ unitPrice, desc      │  │     │ sku (UQ), barcode (UQ)│  │
│ changedBy, changeNote│  │     │ currentVersion        │  │
└──────────────────────┘  │     │ isActive              │  │
                          │     └──┬────────┬──────────┘  │
                          │        │        │             │
                ┌─────────┘   ┌────┴───┐ ┌──┴────────┐   │
                │             │  (M:N) │ │  (M:N)    │   │
                │      ┌──────┴──┐ ┌───┴────┐┌───────┴┐  │
                │      │Supplier │ │Product ││Product  │  │
                │      │Product  │ │Certifi.││Tag      │  │
                │      │─────────│ │────────││──────── │  │
                │      │spId (FK)│ │pId (FK)││pId (FK) │  │
                │      │pId (FK) │ │hcId(FK)││tagId(FK)│  │
                │      │unitCost │ │scope   │└─────────┘  │
                │      │currency │ └────────┘             │
                │      │leadTime │                        │
                │      └────┬────┘                        │
                │           │                             │
                │    ┌──────┴──────────┐                  │
                │    │SupplierProduct  │                  │
                │    │PriceHistory     │                  │
                │    │─────────────────│                  │
                │    │spId (FK) + date │                  │
                │    │unitCost, curr.  │                  │
                │    │effectiveFrom    │                  │
                └────│effectiveUntil   │                  │
                     └─────────────────┘                  │
                                                          │
┌──────────────┐       ┌──────────────┐                  │
│  Warehouse   │       │  Inventory   │                  │
│──────────────│       │──────────────│                  │
│ id (PK)      │──┐    │ productId(FK)│◄─────────────────┘
│ name         │  │    │ warehouseId  │
│ location     │  │    │ zoneId (FK)  │
│ capacity     │  │    │ quantity     │
│ isActive     │  │    │ reservedQty  │
└──────────────┘  │    │ reorderLevel │
                  │    └──────────────┘
          ┌───────┘
    ┌─────┴──────────┐      ┌──────────────────────┐
    │  WarehouseZone  │      │     BatchLot          │
    │─────────────────│      │───────────────────────│
    │ warehouseId(FK) │──┐   │ productId (FK)        │
    │ name (unique)   │  │   │ warehouseId (FK)      │
    │ zoneType(enum)  │  │   │ zoneId (FK)           │
    │ capacity        │  │   │ lotNumber             │
    └─────────────────┘  │   │ quantity              │
                         └───│ manufacturedAt        │
                             │ expiresAt             │
                             │ status (enum)         │
                             │ purchaseOrderId (FK)  │
                             └──────────┬────────────┘
                                        │
                              ┌─────────┴────────────┐
                              │ InventoryMovement     │
                              │──────────────────────│
                              │ batchLotId (FK)       │
                              │ productId (FK)        │
                              │ warehouseId (FK)      │
                              │ type (enum)           │
                              │ quantity              │
                              │ unitCost              │
                              │ purchaseOrderItemId   │
                              │ performedBy (FK→User) │
                              └──────────────────────┘

┌──────────────────────┐   ┌──────────────────────┐
│  PurchaseOrderItem   │   │  Shipment             │
│──────────────────────│   │───────────────────────│
│ purchaseOrderId (FK) │   │ purchaseOrderId (FK)  │
│ productId (FK)       │   │ trackingNumber        │
│ supplierProductId(FK)│   │ carrier               │
│ quantity             │   │ status (enum)         │
│ unitPrice            │   │ estimatedArrival      │
│ receivedQty          │   │ ───┐                  │
└──────────────────────┘      │  ─│─────────────────┘
                              │    │
                              │ ┌──┴──────────────────┐
                              │ │  ShipmentEvent       │
                              │ │─────────────────────│
                              │ │ shipmentId (FK)      │
                              └─│ status               │
                                │ location, note       │
                                │ occurredAt           │
                                └─────────────────────┘
```

---

## Relationship Details

### 1. Supplier ↔ Product (M:N via SupplierProduct)

**Problem before:** A Product could only have one Supplier. In reality, a single product (e.g., "Organic Chicken Breast") can be sourced from multiple suppliers at different prices.

**Solution:** The `SupplierProduct` junction table decouples the M:N relationship and adds:
- `unitCost` — price this supplier charges for this product
- `leadTimeDays` — how long this supplier takes to deliver
- `moq` — minimum order quantity
- `isPreferred` — preferred supplier flag
- `validFrom / validUntil` — contract validity period

**Price History:** `SupplierProductPriceHistory` is an append-only log of price changes per `SupplierProduct` pair. This enables:
- Price trend analysis
- Audit trail for cost changes
- PO price validation at time of ordering

### 2. Product ↔ HalalCertificate (M:N via ProductCertification)

**Problem before:** A HalalCertificate belonged to a Supplier, but a single certificate can cover multiple products (e.g., a facility-level cert). Conversely, a product may need multiple certs for different markets.

**Solution:** `ProductCertification` junction with:
- `scope` — e.g., "manufacturing", "ingredients", "packaging"

### 3. Product Versioning

**Problem before:** When a product was updated, the old data was lost. No way to track what the product looked like at the time of a past PurchaseOrder.

**Solution:** Every product update creates an immutable `ProductVersion` record. `Product.currentVersion` is a denormalised counter for fast reads. Each version stores a complete snapshot of the product's attributes.

### 4. Inventory with Batch/Lot Tracking

**Problem before:** Inventory was a simple quantity count. No ability to track:
- Which specific batch of product is in stock
- Expiry dates per batch (critical for perishable halal goods)
- Which PO brought the batch in
- Which warehouse zone the batch is stored in

**Solution:** `BatchLot` model with:
- `lotNumber` — batch/lot ID (e.g., supplier's batch #)
- `manufacturedAt / expiresAt` — date tracking
- `status` — AVAILABLE, RESERVED, QUARANTINE, EXPIRED, CONSUMED
- `purchaseOrderId` — links back to the receiving PO

InventoryMovements can now optionally reference a specific `BatchLot`.

### 5. Warehouse Zones

**Problem before:** Warehouses were a flat list. No way to segregate inventory by zone type (cold storage, hazmat, returns, quarantine).

**Solution:** `WarehouseZone` with `zoneType` enum. Inventory records can optionally reference a zone. Each zone has `capacity` and `isActive` flags.

### 6. PO Approval Workflow

**Problem before:** No approval tracking for PurchaseOrders — just a status field.

**Solution:** `PurchaseOrderApproval` records every status transition with:
- `fromStatus`, `toStatus` — exact transition
- `comment` — approver's note
- `approverId` → User

`PurchaseOrder.version` is incremented on each edit/status change.

### 7. Shipment Event Log

**Problem before:** Shipments had a single `status` field with no history. You couldn't see when it went from PENDING → IN_TRANSIT → DELAYED → DELIVERED.

**Solution:** `ShipmentEvent` is an append-only log. Each event captures the `status`, `location`, `note`, and `occurredAt` timestamp.

### 8. InventoryMovement Enhancements

**Problem before:** Movements linked to Product + Warehouse + User only.

**New:**
- `batchLotId` → optional link to specific batch
- `unitCost` → cost at time of movement (useful for COGS calculation)
- `purchaseOrderItemId` → link back to the PO item that triggered the inbound
- New types: `TRANSFER` (between warehouses/zones), `RETURN` (to supplier)

---

## New Enums

| Enum | Values | Purpose |
|---|---|---|
| `ZoneType` | GENERAL, COLD_STORAGE, HAZMAT, QUARANTINE, RETURNS | Warehouse zone classification |
| `BatchLotStatus` | AVAILABLE, RESERVED, QUARANTINE, EXPIRED, CONSUMED | Lifecycle of a batch |
| `ShipmentStatus` | Added `CANCELLED` | Ability to cancel shipments |
| `InventoryMovementType` | Added `TRANSFER`, `RETURN` | Inter-warehouse moves and supplier returns |
| `NotificationType` | Added `CERTIFICATE_EXPIRED`, `COMPLIANCE_ISSUE`, `BATCH_EXPIRING` | New notification types for automation |

---

## Migration Strategy

Since this is a development environment with non-production data, the cleanest approach is:

1. Drop existing DB — `npx prisma migrate reset`
2. Apply new schema — `npx prisma migrate dev --name enhanced_erd`

**For production**, a more careful approach would be needed with:
- Backward-compatible migrations (adding nullable columns first)
- Data migration scripts for existing records
- Zero-downtime deployment

---

## Query Patterns Enabled

```typescript
// Get all suppliers for a product with pricing
const product = await prisma.product.findUnique({
  where: { id },
  include: {
    supplierProducts: {
      include: { supplier: true, priceHistory: { take: 5, orderBy: { createdAt: 'desc' } } },
    },
  },
});

// Get batch-level inventory with expiry tracking
const expiringBatches = await prisma.batchLot.findMany({
  where: {
    expiresAt: { lte: thirtyDaysFromNow },
    status: BatchLotStatus.AVAILABLE,
    quantity: { gt: 0 },
  },
  include: { product: true, warehouse: true, zone: true },
});

// Full PO approval history
const po = await prisma.purchaseOrder.findUnique({
  where: { id },
  include: {
    approvals: { include: { approver: true }, orderBy: { createdAt: 'asc' } },
    items: {
      include: { inventoryMovements: { include: { batchLot: true } } },
    },
  },
});

// Product version diff
const versions = await prisma.productVersion.findMany({
  where: { productId },
  orderBy: { version: 'desc' },
  take: 2,
});
```

---

## Traceability Chain

```
Supplier → SupplierProduct → Product → ProductVersion
    ↓                                       ↓
SupplierContact                     SupplierProduct (pricing)
    ↓                                       ↓
HalalCertificate ──→ ProductCertification ──┘
                         ↓
                    BatchLot (lot #, expiry)
                         ↓
                   InventoryMovement
                         ↓
                  PurchaseOrderItem
                         ↓
                    PurchaseOrder
                         ↓
                     Shipment → ShipmentEvent
```

This chain enables full farm-to-fork traceability: from raw ingredient supplier → certificate verification → production batch → warehouse storage → shipment to customer.