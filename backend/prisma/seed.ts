import {
  PrismaClient,
  PurchaseOrderStatus,
  ShipmentStatus,
  UserRole,
  InventoryMovementType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Seed data tailored for automation demo.
 *
 * Time context: current date is 2026-06-16
 *
 * Automation scenarios covered:
 *
 * Rule 1 — Certificate Expiring Soon:
 *   Cert "HFC-2026-88003" expires 2026-07-01 (14 days from now)
 *
 * Rule 2 — Certificate Expired:
 *   3 certs already expired (latest expiry 2026-03-09)
 *
 * Rule 3 — Low Inventory:
 *   Chicken HCM: 60 < 100, Coco HN: 10 < 80
 *
 * Rule 4 — Shipment Delay:
 *   3 shipments past estimated arrival, not delivered
 *
 * Compliance Score:
 *   - Expired certs present → -30pts
 *   - Expiring cert present → -15pts
 *   - 3/5 shipments delayed → -12pts (approximate)
 *   - 2/9 items low stock → -3.3pts (approximate)
 *   - 1/5 suppliers without certs → -4pts (approximate)
 *   → Score around 35–40 (demonstrates "needs attention" state)
 */

const NOW = new Date("2026-06-16");
const REFERENCE_DATE = new Date("2025-08-01"); // for past movement timestamps

function daysFromNow(days: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() + days);
  return d;
}

function monthsAgo(months: number): Date {
  const d = new Date(REFERENCE_DATE);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 12);

  // ═══════════════════════════════════════════════════════════
  // 1. USERS
  // ═══════════════════════════════════════════════════════════
  const admin = await prisma.user.upsert({
    where: { email: "admin@halalchain.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@halalchain.com",
      passwordHash,
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@halalchain.com" },
    update: {},
    create: {
      name: "Operations Manager",
      email: "manager@halalchain.com",
      passwordHash,
      role: UserRole.MANAGER,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@halalchain.com" },
    update: {},
    create: {
      name: "Warehouse Staff",
      email: "staff@halalchain.com",
      passwordHash,
      role: UserRole.STAFF,
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: "staff2@halalchain.com" },
    update: {},
    create: {
      name: "Hanoi Staff",
      email: "staff2@halalchain.com",
      passwordHash,
      role: UserRole.STAFF,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // 2. SUPPLIERS (5 total — 1 without certs for coverage test)
  // ═══════════════════════════════════════════════════════════

  // Supplier with EXPIRED cert (Rule 2 trigger)
  const supplierMY = await prisma.supplier.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Halal Foods Malaysia Sdn Bhd",
      country: "Malaysia",
      email: "sales@halalfoods.my",
      phone: "+60-3-1234-5678",
    },
  });

  // Supplier with EXPIRED cert (Rule 2 trigger)
  const supplierID = await prisma.supplier.upsert({
    where: { id: "00000000-0000-4000-8000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000002",
      name: "Nusantara Halal Indonesia",
      country: "Indonesia",
      email: "export@nusantara.id",
      phone: "+62-21-9876-5432",
    },
  });

  // Supplier with EXPIRED cert (Rule 2 trigger)
  const supplierTH = await prisma.supplier.upsert({
    where: { id: "00000000-0000-4000-8000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000003",
      name: "Siam Halal Trading Co.",
      country: "Thailand",
      email: "orders@siamhalal.co.th",
      phone: "+66-2-555-0199",
    },
  });

  // Supplier with EXPIRING cert (Rule 1 trigger — expires in 14 days)
  const supplierSG = await prisma.supplier.upsert({
    where: { id: "00000000-0000-4000-8000-000000000004" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000004",
      name: "Muis Certified Foods Pte Ltd",
      country: "Singapore",
      email: "trade@muisfoods.sg",
      phone: "+65-6123-4567",
    },
  });

  // Supplier WITHOUT any certificates (coverage compliance factor test)
  const supplierVN = await prisma.supplier.upsert({
    where: { id: "00000000-0000-4000-8000-000000000005" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000005",
      name: "Vietnam Halal Importer Co.",
      country: "Vietnam",
      email: "info@vietnamhalal.vn",
      phone: "+84-28-3999-8888",
      status: "ACTIVE",
    },
  });

  // ═══════════════════════════════════════════════════════════
  // 3. HALAL CERTIFICATES
  // ═══════════════════════════════════════════════════════════

  // Cert 1 — EXPIRED (Rule 2 trigger) — expired ~5 months ago
  await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000101" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000101",
      supplierId: supplierMY.id,
      certificateNumber: "JAKIM-2024-00123",
      issuedBy: "JAKIM",
      issueDate: new Date("2024-01-15"),
      expiryDate: new Date("2026-01-14"),
    },
  });

  // Cert 2 — EXPIRED (Rule 2 trigger) — expired ~6 months ago
  await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000102" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000102",
      supplierId: supplierID.id,
      certificateNumber: "MUI-LPPOM-45678",
      issuedBy: "MUI",
      issueDate: new Date("2024-06-01"),
      expiryDate: new Date("2025-12-31"),
    },
  });

  // Cert 3 — EXPIRED (Rule 2 trigger) — expired ~3 months ago
  await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000103" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000103",
      supplierId: supplierTH.id,
      certificateNumber: "CICOT-TH-2024-889",
      issuedBy: "CICOT",
      issueDate: new Date("2024-03-10"),
      expiryDate: new Date("2026-03-09"),
    },
  });

  // Cert 4 — EXPIRING SOON (Rule 1 trigger) — expires in 14 days
  await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000104" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000104",
      supplierId: supplierSG.id,
      certificateNumber: "MUIS-SG-2026-003",
      issuedBy: "MUIS",
      issueDate: new Date("2025-09-01"),
      expiryDate: daysFromNow(14), // 2026-06-30
    },
  });

  // Cert 5 — VALID (no trigger) — expires in 1 year
  await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000105" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000105",
      supplierId: supplierSG.id,
      certificateNumber: "MUIS-SG-2026-004",
      issuedBy: "MUIS",
      issueDate: new Date("2026-01-01"),
      expiryDate: daysFromNow(365),
    },
  });

  // ═══════════════════════════════════════════════════════════
  // 4. WAREHOUSES
  // ═══════════════════════════════════════════════════════════
  const warehouseHCM = await prisma.warehouse.upsert({
    where: { id: "00000000-0000-4000-8000-000000000201" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000201",
      name: "HCM Logistics Hub",
      location: "Ho Chi Minh City, Vietnam",
    },
  });

  const warehouseHN = await prisma.warehouse.upsert({
    where: { id: "00000000-0000-4000-8000-000000000202" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000202",
      name: "Northern Distribution Center",
      location: "Hanoi, Vietnam",
    },
  });

  const warehouseDN = await prisma.warehouse.upsert({
    where: { id: "00000000-0000-4000-8000-000000000203" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000203",
      name: "Da Nang Transit Depot",
      location: "Da Nang, Vietnam",
    },
  });

  // ═══════════════════════════════════════════════════════════
  // 5. PRODUCTS
  // ═══════════════════════════════════════════════════════════
  const productCoco = await prisma.product.upsert({
    where: { sku: "HAL-COCO-001" },
    update: {},
    create: {
      supplierId: supplierMY.id,
      name: "Organic Coconut Milk",
      sku: "HAL-COCO-001",
      category: "Beverages",
      unit: "carton",
      unitPrice: 12.5,
    },
  });

  const productBeef = await prisma.product.upsert({
    where: { sku: "HAL-BEEF-002" },
    update: {},
    create: {
      supplierId: supplierID.id,
      name: "Premium Halal Beef Rendang Paste",
      sku: "HAL-BEEF-002",
      category: "Condiments",
      unit: "jar",
      unitPrice: 8.75,
    },
  });

  const productRice = await prisma.product.upsert({
    where: { sku: "HAL-RICE-003" },
    update: {},
    create: {
      supplierId: supplierTH.id,
      name: "Jasmine Halal Rice 25kg",
      sku: "HAL-RICE-003",
      category: "Grains",
      unit: "bag",
      unitPrice: 22.0,
    },
  });

  const productChicken = await prisma.product.upsert({
    where: { sku: "HAL-CHKN-004" },
    update: {},
    create: {
      supplierId: supplierMY.id,
      name: "Frozen Halal Whole Chicken",
      sku: "HAL-CHKN-004",
      category: "Meat & Poultry",
      unit: "kg",
      unitPrice: 6.3,
    },
  });

  const productSoy = await prisma.product.upsert({
    where: { sku: "HAL-SOY-005" },
    update: {},
    create: {
      supplierId: supplierSG.id,
      name: "Halal Soy Sauce 5L",
      sku: "HAL-SOY-005",
      category: "Condiments",
      unit: "bottle",
      unitPrice: 14.0,
    },
  });

  const productDates = await prisma.product.upsert({
    where: { sku: "HAL-DATE-006" },
    update: {},
    create: {
      supplierId: supplierID.id,
      name: "Medjool Dates 1kg Box",
      sku: "HAL-DATE-006",
      category: "Snacks & Dried Fruit",
      unit: "box",
      unitPrice: 18.5,
    },
  });

  const productCurry = await prisma.product.upsert({
    where: { sku: "HAL-CURR-007" },
    update: {},
    create: {
      supplierId: supplierTH.id,
      name: "Halal Green Curry Paste",
      sku: "HAL-CURR-007",
      category: "Condiments",
      unit: "tub",
      unitPrice: 5.5,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // 6. INVENTORY (with low-stock items for Rule 3 trigger)
  // ═══════════════════════════════════════════════════════════
  const inventoryItems = [
    // Well-stocked
    { productId: productCoco.id,    warehouseId: warehouseHCM.id, quantity: 500, reorderLevel: 100 },
    { productId: productBeef.id,    warehouseId: warehouseHCM.id, quantity: 320, reorderLevel: 80  },
    { productId: productRice.id,    warehouseId: warehouseHN.id,  quantity: 180, reorderLevel: 50  },
    // LOW STOCK — triggers Rule 3 (60 < 100)
    { productId: productChicken.id, warehouseId: warehouseHCM.id, quantity: 60,  reorderLevel: 100 },
    // Well-stocked
    { productId: productSoy.id,     warehouseId: warehouseHN.id,  quantity: 240, reorderLevel: 60  },
    { productId: productDates.id,   warehouseId: warehouseHCM.id, quantity: 95,  reorderLevel: 40  },
    // Well-stocked
    { productId: productCurry.id,   warehouseId: warehouseDN.id,  quantity: 150, reorderLevel: 30  },
    { productId: productRice.id,    warehouseId: warehouseDN.id,  quantity: 200, reorderLevel: 50  },
    // CRITICALLY LOW STOCK — triggers Rule 3 (10 < 80)
    { productId: productCoco.id,    warehouseId: warehouseHN.id,  quantity: 10,  reorderLevel: 80  },
  ];

  for (const item of inventoryItems) {
    await prisma.inventory.upsert({
      where: { productId_warehouseId: { productId: item.productId, warehouseId: item.warehouseId } },
      update: { quantity: item.quantity },
      create: item,
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 7. PURCHASE ORDERS
  // ═══════════════════════════════════════════════════════════
  const po1 = await prisma.purchaseOrder.upsert({
    where: { poNumber: "PO-2025-0001" },
    update: {},
    create: {
      supplierId: supplierMY.id,
      poNumber: "PO-2025-0001",
      status: PurchaseOrderStatus.SHIPPING,
      totalAmount: 15600,
      createdAt: new Date("2025-04-12"),
    },
  });

  const po2 = await prisma.purchaseOrder.upsert({
    where: { poNumber: "PO-2025-0002" },
    update: {},
    create: {
      supplierId: supplierID.id,
      poNumber: "PO-2025-0002",
      status: PurchaseOrderStatus.APPROVED,
      totalAmount: 8400,
      createdAt: new Date("2025-05-03"),
    },
  });

  const po3 = await prisma.purchaseOrder.upsert({
    where: { poNumber: "PO-2025-0003" },
    update: {},
    create: {
      supplierId: supplierTH.id,
      poNumber: "PO-2025-0003",
      status: PurchaseOrderStatus.RECEIVED,
      totalAmount: 11200,
      createdAt: new Date("2025-03-18"),
    },
  });

  const po4 = await prisma.purchaseOrder.upsert({
    where: { poNumber: "PO-2025-0004" },
    update: {},
    create: {
      supplierId: supplierSG.id,
      poNumber: "PO-2025-0004",
      status: PurchaseOrderStatus.DRAFT,
      totalAmount: 5320,
      createdAt: new Date("2025-05-20"),
    },
  });

  const po5 = await prisma.purchaseOrder.upsert({
    where: { poNumber: "PO-2025-0005" },
    update: {},
    create: {
      supplierId: supplierMY.id,
      poNumber: "PO-2025-0005",
      status: PurchaseOrderStatus.RECEIVED,
      totalAmount: 9870,
      createdAt: new Date("2025-02-10"),
    },
  });

  const po6 = await prisma.purchaseOrder.upsert({
    where: { poNumber: "PO-2025-0006" },
    update: {},
    create: {
      supplierId: supplierID.id,
      poNumber: "PO-2025-0006",
      status: PurchaseOrderStatus.CANCELLED,
      totalAmount: 3200,
      createdAt: new Date("2025-01-25"),
    },
  });

  // ═══════════════════════════════════════════════════════════
  // 8. SHIPMENTS (with past-due shipments for Rule 4 trigger)
  // ═══════════════════════════════════════════════════════════

  // Shipment 1 — DELAYED (past estimated arrival, IN_TRANSIT) → Rule 4 trigger
  await prisma.shipment.upsert({
    where: { id: "00000000-0000-4000-8000-000000000301" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000301",
      purchaseOrderId: po1.id,
      trackingNumber: "MY-HAL-784521",
      origin: "Port Klang, Malaysia",
      destination: "Cat Lai Port, Ho Chi Minh City",
      status: ShipmentStatus.IN_TRANSIT,
      estimatedArrival: new Date("2025-06-20"), // ~12 months ago
    },
  });

  // Shipment 2 — DELAYED (past estimated arrival, PENDING) → Rule 4 trigger
  await prisma.shipment.upsert({
    where: { id: "00000000-0000-4000-8000-000000000302" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000302",
      purchaseOrderId: po2.id,
      trackingNumber: "ID-HAL-992103",
      origin: "Tanjung Priok, Jakarta",
      destination: "Cat Lai Port, Ho Chi Minh City",
      status: ShipmentStatus.PENDING,
      estimatedArrival: new Date("2025-06-28"), // ~12 months ago
    },
  });

  // Shipment 3 — DELIVERED OK
  await prisma.shipment.upsert({
    where: { id: "00000000-0000-4000-8000-000000000303" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000303",
      purchaseOrderId: po3.id,
      trackingNumber: "TH-HAL-441002",
      origin: "Laem Chabang, Thailand",
      destination: "Hai Phong Port, Vietnam",
      status: ShipmentStatus.DELIVERED,
      estimatedArrival: new Date("2025-04-05"),
    },
  });

  // Shipment 4 — DELAYED (past estimated arrival, PENDING) → Rule 4 trigger
  await prisma.shipment.upsert({
    where: { id: "00000000-0000-4000-8000-000000000304" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000304",
      purchaseOrderId: po4.id,
      trackingNumber: "SG-HAL-110456",
      origin: "Singapore PSA Port",
      destination: "Cat Lai Port, Ho Chi Minh City",
      status: ShipmentStatus.PENDING,
      estimatedArrival: new Date("2025-07-05"), // ~11 months ago
    },
  });

  // Shipment 5 — DELIVERED OK
  await prisma.shipment.upsert({
    where: { id: "00000000-0000-4000-8000-000000000305" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000305",
      purchaseOrderId: po5.id,
      trackingNumber: "MY-HAL-603217",
      origin: "Port Klang, Malaysia",
      destination: "Hai Phong Port, Vietnam",
      status: ShipmentStatus.DELIVERED,
      estimatedArrival: new Date("2025-03-01"),
    },
  });

  // ═══════════════════════════════════════════════════════════
  // 9. INVENTORY MOVEMENTS
  // ═══════════════════════════════════════════════════════════
  interface MovementInput {
    productId: string;
    warehouseId: string;
    type: InventoryMovementType;
    quantity: number;
    note: string;
    createdAt: Date;
  }

  const movements: MovementInput[] = [
    // Coco HCM history
    { productId: productCoco.id, warehouseId: warehouseHCM.id, type: InventoryMovementType.INBOUND,  quantity: 600, note: "Initial stock PO-2025-0005", createdAt: monthsAgo(0) },
    { productId: productCoco.id, warehouseId: warehouseHCM.id, type: InventoryMovementType.OUTBOUND, quantity: 100, note: "Monthly retail distribution", createdAt: monthsAgo(0) },
    // Beef HCM
    { productId: productBeef.id, warehouseId: warehouseHCM.id, type: InventoryMovementType.INBOUND,  quantity: 400, note: "PO-2025-0002 receipt", createdAt: monthsAgo(0) },
    { productId: productBeef.id, warehouseId: warehouseHCM.id, type: InventoryMovementType.OUTBOUND, quantity: 80,  note: "Export dispatch — Batch #B04", createdAt: monthsAgo(0) },
    // Rice HN
    { productId: productRice.id, warehouseId: warehouseHN.id,  type: InventoryMovementType.INBOUND,  quantity: 200, note: "PO-2025-0003 receipt", createdAt: monthsAgo(0) },
    { productId: productRice.id, warehouseId: warehouseHN.id,  type: InventoryMovementType.OUTBOUND, quantity: 20,  note: "Retail distribution", createdAt: monthsAgo(0) },
    // Chicken HCM — now low stock
    { productId: productChicken.id, warehouseId: warehouseHCM.id, type: InventoryMovementType.INBOUND,  quantity: 200, note: "PO-2025-0005 receipt", createdAt: monthsAgo(0) },
    { productId: productChicken.id, warehouseId: warehouseHCM.id, type: InventoryMovementType.OUTBOUND, quantity: 140, note: "Hotel chain order — large dispatch", createdAt: monthsAgo(0) },
    // Soy HN
    { productId: productSoy.id,     warehouseId: warehouseHN.id,  type: InventoryMovementType.INBOUND,  quantity: 300, note: "PO-2025-0004 receipt", createdAt: monthsAgo(0) },
    { productId: productSoy.id,     warehouseId: warehouseHN.id,  type: InventoryMovementType.OUTBOUND, quantity: 60,  note: "Retail dispatch", createdAt: monthsAgo(0) },
    // Dates HCM
    { productId: productDates.id,   warehouseId: warehouseHCM.id, type: InventoryMovementType.INBOUND,  quantity: 120, note: "PO-2025-0002 receipt", createdAt: monthsAgo(0) },
    { productId: productDates.id,   warehouseId: warehouseHCM.id, type: InventoryMovementType.OUTBOUND, quantity: 25,  note: "Online order fulfillment", createdAt: monthsAgo(0) },
    // Curry DN
    { productId: productCurry.id,   warehouseId: warehouseDN.id,  type: InventoryMovementType.INBOUND,  quantity: 180, note: "PO-2025-0003 receipt", createdAt: monthsAgo(0) },
    { productId: productCurry.id,   warehouseId: warehouseDN.id,  type: InventoryMovementType.OUTBOUND, quantity: 30,  note: "Restaurant chain dispatch", createdAt: monthsAgo(0) },
    // Coco HN — critically low
    { productId: productCoco.id,    warehouseId: warehouseHN.id,  type: InventoryMovementType.INBOUND,  quantity: 50,  note: "Initial transfer from HCM", createdAt: monthsAgo(0) },
    { productId: productCoco.id,    warehouseId: warehouseHN.id,  type: InventoryMovementType.OUTBOUND, quantity: 40,  note: "Northern retail orders", createdAt: monthsAgo(0) },
    // Adjustment
    { productId: productRice.id,    warehouseId: warehouseHN.id,  type: InventoryMovementType.ADJUSTMENT, quantity: 10, note: "Stock count adjustment", createdAt: monthsAgo(0) },
  ];

  for (const [index, m] of movements.entries()) {
    await prisma.inventoryMovement.create({
      data: {
        productId: m.productId,
        warehouseId: m.warehouseId,
        type: m.type,
        quantity: m.quantity,
        note: m.note,
        performedBy: index % 2 === 0 ? staff.id : staff2.id,
        createdAt: m.createdAt,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 10. VERIFICATION SUMMARY
  // ═══════════════════════════════════════════════════════════

  const summary = {
    users: [admin.email, manager.email, staff.email, staff2.email],
    suppliers: [supplierMY.name, supplierID.name, supplierTH.name, supplierSG.name, supplierVN.name],
    warehouses: [warehouseHCM.name, warehouseHN.name, warehouseDN.name],
    products: 7,
    certificates: 5,
    inventoryItems: 9,
    purchaseOrders: 6,
    shipments: 5,
  };

  console.log("=".repeat(60));
  console.log("✅ HalalChain Seed Completed");
  console.log("=".repeat(60));
  console.log("  Users:        ", summary.users.join(", "));
  console.log("  Suppliers:    ", summary.suppliers.join(", "));
  console.log("  Warehouses:   ", summary.warehouses.join(", "));
  console.log("  Products:     ", summary.products);
  console.log("  Certificates: ", summary.certificates);
  console.log("  Inventory:    ", summary.inventoryItems, "items");
  console.log("  POs:          ", summary.purchaseOrders);
  console.log("  Shipments:    ", summary.shipments);
  console.log("-".repeat(60));
  console.log("🔍 AUTOMATION DEMO SCENARIOS:");
  console.log("  Rule 1 (Cert Expiring): MUIS-SG-2026-003 expires 2026-06-30 (14 days)");
  console.log("  Rule 2 (Cert Expired):  3 expired certs (JAKIM, MUI, CICOT)");
  console.log("  Rule 3 (Low Stock):     Chicken HCM (60/100), Coco HN (10/80)");
  console.log("  Rule 4 (Ship Delay):    3 overdue shipments (MY, ID, SG)");
  console.log("  Compliance Score:       ~38/100 (demonstrates all 5 factors)");
  console.log("=".repeat(60));
  console.log("🔑 Login: admin@halalchain.com / Admin@123");
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });