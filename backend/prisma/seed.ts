import {
  PrismaClient,
  PurchaseOrderStatus,
  ShipmentStatus,
  UserRole,
  InventoryMovementType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 12);

  // ── USERS ──────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@halalchain.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@halalchain.com",
      passwordHash,
      role: UserRole.ADMIN,
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

  // ── SUPPLIERS ──────────────────────────────────────────
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

  // ── HALAL CERTIFICATES ─────────────────────────────────
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

  await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000102" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000102",
      supplierId: supplierID.id,
      certificateNumber: "MUI-LPPOM-45678",
      issuedBy: "MUI",
      issueDate: new Date("2024-06-01"),
      expiryDate: new Date("2025-12-31"), // sắp hết hạn — tốt cho test alert
    },
  });

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

  await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000104" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000104",
      supplierId: supplierSG.id,
      certificateNumber: "MUIS-SG-2023-441",
      issuedBy: "MUIS",
      issueDate: new Date("2023-09-01"),
      expiryDate: new Date("2025-08-31"), // đã gần hết hạn
    },
  });

  // ── WAREHOUSES ─────────────────────────────────────────
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

  // ── PRODUCTS ───────────────────────────────────────────
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

  // ── INVENTORY ──────────────────────────────────────────
  const inventoryItems = [
    { productId: productCoco.id,    warehouseId: warehouseHCM.id, quantity: 500, reorderLevel: 100 },
    { productId: productBeef.id,    warehouseId: warehouseHCM.id, quantity: 320, reorderLevel: 80  },
    { productId: productRice.id,    warehouseId: warehouseHN.id,  quantity: 180, reorderLevel: 50  },
    { productId: productChicken.id, warehouseId: warehouseHCM.id, quantity: 60,  reorderLevel: 100 }, // dưới reorder — test alert
    { productId: productSoy.id,     warehouseId: warehouseHN.id,  quantity: 240, reorderLevel: 60  },
    { productId: productDates.id,   warehouseId: warehouseHCM.id, quantity: 95,  reorderLevel: 40  },
    { productId: productCurry.id,   warehouseId: warehouseDN.id,  quantity: 150, reorderLevel: 30  },
    { productId: productRice.id,    warehouseId: warehouseDN.id,  quantity: 200, reorderLevel: 50  },
    { productId: productCoco.id,    warehouseId: warehouseHN.id,  quantity: 10,  reorderLevel: 80  }, // rất thấp
  ];

  for (const item of inventoryItems) {
    await prisma.inventory.upsert({
      where: { productId_warehouseId: { productId: item.productId, warehouseId: item.warehouseId } },
      update: { quantity: item.quantity },
      create: item,
    });
  }

  // ── PURCHASE ORDERS ────────────────────────────────────
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
      status: PurchaseOrderStatus.PENDING,
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

  // ── SHIPMENTS ──────────────────────────────────────────
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
      estimatedArrival: new Date("2025-06-20"),
    },
  });

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
      estimatedArrival: new Date("2025-06-28"),
    },
  });

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
      estimatedArrival: new Date("2025-07-05"),
    },
  });

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

  // ── INVENTORY MOVEMENTS ────────────────────────────────
  const movementSeed = [
    // Coco HCM — inbound đợt đầu
    { productId: productCoco.id,    warehouseId: warehouseHCM.id, type: InventoryMovementType.INBOUND,  quantity: 200, monthsAgo: 5, note: "PO-2025-0005 receipt" },
    { productId: productCoco.id,    warehouseId: warehouseHCM.id, type: InventoryMovementType.OUTBOUND, quantity: 80,  monthsAgo: 4, note: "Export dispatch — Batch #A01" },
    // Beef HCM
    { productId: productBeef.id,    warehouseId: warehouseHCM.id, type: InventoryMovementType.INBOUND,  quantity: 150, monthsAgo: 3, note: "PO-2025-0002 partial receipt" },
    { productId: productBeef.id,    warehouseId: warehouseHCM.id, type: InventoryMovementType.OUTBOUND, quantity: 45,  monthsAgo: 0, note: "Export dispatch — Batch #B04" },
    // Rice HN
    { productId: productRice.id,    warehouseId: warehouseHN.id,  type: InventoryMovementType.INBOUND,  quantity: 120, monthsAgo: 2, note: "PO-2025-0003 receipt" },
    { productId: productRice.id,    warehouseId: warehouseHN.id,  type: InventoryMovementType.OUTBOUND, quantity: 30,  monthsAgo: 1, note: "Retail distribution" },
    // Coco HCM — đợt 2
    { productId: productCoco.id,    warehouseId: warehouseHCM.id, type: InventoryMovementType.INBOUND,  quantity: 300, monthsAgo: 1, note: "PO-2025-0001 partial receipt" },
    // Chicken HCM — sắp cạn
    { productId: productChicken.id, warehouseId: warehouseHCM.id, type: InventoryMovementType.INBOUND,  quantity: 200, monthsAgo: 3, note: "PO-2025-0005 receipt" },
    { productId: productChicken.id, warehouseId: warehouseHCM.id, type: InventoryMovementType.OUTBOUND, quantity: 140, monthsAgo: 1, note: "Hotel chain order" },
    // Soy HN
    { productId: productSoy.id,     warehouseId: warehouseHN.id,  type: InventoryMovementType.INBOUND,  quantity: 300, monthsAgo: 4, note: "PO-2025-0004 receipt" },
    { productId: productSoy.id,     warehouseId: warehouseHN.id,  type: InventoryMovementType.OUTBOUND, quantity: 60,  monthsAgo: 2, note: "Retail dispatch" },
    // Dates HCM
    { productId: productDates.id,   warehouseId: warehouseHCM.id, type: InventoryMovementType.INBOUND,  quantity: 120, monthsAgo: 2, note: "PO-2025-0002 receipt" },
    { productId: productDates.id,   warehouseId: warehouseHCM.id, type: InventoryMovementType.OUTBOUND, quantity: 25,  monthsAgo: 0, note: "Online order fulfillment" },
    // Curry DN
    { productId: productCurry.id,   warehouseId: warehouseDN.id,  type: InventoryMovementType.INBOUND,  quantity: 180, monthsAgo: 3, note: "PO-2025-0003 receipt" },
    { productId: productCurry.id,   warehouseId: warehouseDN.id,  type: InventoryMovementType.OUTBOUND, quantity: 30,  monthsAgo: 1, note: "Restaurant chain dispatch" },
    // Adjustment
    { productId: productRice.id,    warehouseId: warehouseHN.id,  type: InventoryMovementType.ADJUSTMENT, quantity: 10, monthsAgo: 0, note: "Stock count adjustment" },
  ];

  for (const [index, m] of movementSeed.entries()) {
    const createdAt = new Date();
    createdAt.setMonth(createdAt.getMonth() - m.monthsAgo);
    createdAt.setDate(5 + index);

    await prisma.inventoryMovement.create({
      data: {
        productId: m.productId,
        warehouseId: m.warehouseId,
        type: m.type,
        quantity: m.quantity,
        note: m.note,
        performedBy: index % 2 === 0 ? staff.id : staff2.id,
        createdAt,
      },
    });
  }

  console.log("✅ Seed completed:", {
    users: [admin.email, manager.email, staff.email, staff2.email],
    suppliers: [supplierMY.name, supplierID.name, supplierTH.name, supplierSG.name],
    warehouses: [warehouseHCM.name, warehouseHN.name, warehouseDN.name],
    products: [productCoco.sku, productBeef.sku, productRice.sku, productChicken.sku, productSoy.sku, productDates.sku, productCurry.sku],
    purchaseOrders: [po1.poNumber, po2.poNumber, po3.poNumber, po4.poNumber, po5.poNumber, po6.poNumber],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });