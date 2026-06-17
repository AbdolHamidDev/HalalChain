import {
  PrismaClient,
  PurchaseOrderStatus,
  ShipmentStatus,
  UserRole,
  InventoryMovementType,
  NotificationType,
  AuditAction,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * 🌟 HalalChain Showcase Seed
 *
 * Designed to populate the database with rich, realistic data for demos,
 * screenshots, investor presentations, and full feature exploration.
 *
 * Time context: current date is 2026-06-18
 *
 * Coverage:
 *   - 8 users across all roles
 *   - 10 suppliers from 8 countries
 *   - 16 halal certificates (valid, expiring, expired)
 *   - 5 warehouses across Vietnam
 *   - 20 products in diverse categories
 *   - 35 inventory records with varying stock levels
 *   - 20 purchase orders with all statuses
 *   - 16 shipments across all statuses
 *   - 50+ inventory movements with rich history
 *   - 20+ notifications (low stock, cert expiry, shipment delays)
 *   - 25+ audit logs for compliance tracking
 *   - 30+ purchase order line items
 *
 * Automation triggers preserved:
 *   - Rule 1: Certificates expiring within 30 days
 *   - Rule 2: Expired certificates
 *   - Rule 3: Low stock items (below reorder level)
 *   - Rule 4: Delayed shipments (past estimated arrival)
 */

const NOW = new Date("2026-06-18");

function daysFromNow(days: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgo(days: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - days);
  return d;
}

function monthsAgo(months: number): Date {
  const d = new Date("2025-06-01");
  d.setMonth(d.getMonth() + months);
  return d;
}

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 12);

  console.log("🌱 Seeding HalalChain showcase database...\n");

  // ═══════════════════════════════════════════════════════════
  // 1. USERS (8 — all roles, all statuses)
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
      status: "ACTIVE",
      lastLoginAt: daysAgo(0),
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
      isVerified: true,
      status: "ACTIVE",
      lastLoginAt: daysAgo(1),
    },
  });

  const auditor = await prisma.user.upsert({
    where: { email: "auditor@halalchain.com" },
    update: {},
    create: {
      name: "Compliance Auditor",
      email: "auditor@halalchain.com",
      passwordHash,
      role: UserRole.MANAGER,
      isVerified: true,
      status: "ACTIVE",
      lastLoginAt: daysAgo(3),
    },
  });

  const staffHCM = await prisma.user.upsert({
    where: { email: "staff@halalchain.com" },
    update: {},
    create: {
      name: "Nguyen Van Minh",
      email: "staff@halalchain.com",
      passwordHash,
      role: UserRole.STAFF,
      isVerified: true,
      status: "ACTIVE",
      lastLoginAt: daysAgo(0),
    },
  });

  const staffHN = await prisma.user.upsert({
    where: { email: "staff2@halalchain.com" },
    update: {},
    create: {
      name: "Tran Thi Lan",
      email: "staff2@halalchain.com",
      passwordHash,
      role: UserRole.STAFF,
      isVerified: true,
      status: "ACTIVE",
      lastLoginAt: daysAgo(2),
    },
  });

  const staffDN = await prisma.user.upsert({
    where: { email: "warehouse-dn@halalchain.com" },
    update: {},
    create: {
      name: "Le Quang Huy",
      email: "warehouse-dn@halalchain.com",
      passwordHash,
      role: UserRole.STAFF,
      isVerified: true,
      status: "ACTIVE",
      lastLoginAt: daysAgo(5),
    },
  });

  const staffQuality = await prisma.user.upsert({
    where: { email: "quality@halalchain.com" },
    update: {},
    create: {
      name: "Pham Thanh Binh",
      email: "quality@halalchain.com",
      passwordHash,
      role: UserRole.STAFF,
      isVerified: true,
      status: "ACTIVE",
      lastLoginAt: daysAgo(1),
    },
  });

  const suspendedUser = await prisma.user.upsert({
    where: { email: "intern@halalchain.com" },
    update: {},
    create: {
      name: "Nguyen Hoang (Suspended)",
      email: "intern@halalchain.com",
      passwordHash,
      role: UserRole.STAFF,
      isVerified: false,
      status: "SUSPENDED",
    },
  });

  // Notification preferences for all active users
  const users = [admin, manager, auditor, staffHCM, staffHN, staffDN, staffQuality];
  for (const user of users) {
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        certificateAlerts: true,
        inventoryAlerts: true,
        shipmentAlerts: true,
        invitationEmails: true,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 2. SUPPLIERS (10 — 8 countries, varied statuses)
  // ═══════════════════════════════════════════════════════════
  const supplierMY = await prisma.supplier.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Halal Foods Malaysia Sdn Bhd",
      country: "Malaysia",
      email: "sales@halalfoods.my",
      phone: "+60-3-1234-5678",
      status: "ACTIVE",
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
      status: "ACTIVE",
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
      status: "ACTIVE",
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
      status: "ACTIVE",
    },
  });

  const supplierAE = await prisma.supplier.upsert({
    where: { id: "00000000-0000-4000-8000-000000000005" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000005",
      name: "Emirates Halal Food Industries",
      country: "United Arab Emirates",
      email: "export@emirateshalal.ae",
      phone: "+971-4-555-1234",
      status: "ACTIVE",
    },
  });

  const supplierAU = await prisma.supplier.upsert({
    where: { id: "00000000-0000-4000-8000-000000000006" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000006",
      name: "Australian Halal Meats Pty Ltd",
      country: "Australia",
      email: "orders@aushalalmeats.com.au",
      phone: "+61-3-8888-7700",
      status: "ACTIVE",
    },
  });

  const supplierTR = await prisma.supplier.upsert({
    where: { id: "00000000-0000-4000-8000-000000000007" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000007",
      name: "Anatolia Halal Exporters Ltd",
      country: "Turkey",
      email: "info@anatoliahalal.com.tr",
      phone: "+90-212-444-6789",
      status: "ACTIVE",
    },
  });

  const supplierPK = await prisma.supplier.upsert({
    where: { id: "00000000-0000-4000-8000-000000000008" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000008",
      name: "Karachi Halal Spices Co.",
      country: "Pakistan",
      email: "trade@karachihalal.pk",
      phone: "+92-21-3333-5566",
      status: "ACTIVE",
    },
  });

  const supplierIN = await prisma.supplier.upsert({
    where: { id: "00000000-0000-4000-8000-000000000009" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000009",
      name: "Hyderabad Grain & Rice Mills",
      country: "India",
      email: "exports@hyderabadorganic.in",
      phone: "+91-40-2222-3344",
      status: "ACTIVE",
    },
  });

  const supplierVN = await prisma.supplier.upsert({
    where: { id: "00000000-0000-4000-8000-000000000010" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000010",
      name: "Saigon Halal Processors JSC",
      country: "Vietnam",
      email: "hello@saigonhalal.vn",
      phone: "+84-28-3999-3333",
      status: "ACTIVE",
    },
  });

  // ═══════════════════════════════════════════════════════════
  // 3. HALAL CERTIFICATES (16 — valid, expiring soon, expired)
  // ═══════════════════════════════════════════════════════════

  // --- EXPIRED certificates (Rule 2 triggers) ---
  const certExpired1 = await prisma.halalCertificate.upsert({
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

  const certExpired2 = await prisma.halalCertificate.upsert({
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

  const certExpired3 = await prisma.halalCertificate.upsert({
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

  // --- EXPIRING SOON certificates (Rule 1 triggers) ---
  const certExpiring1 = await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000104" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000104",
      supplierId: supplierSG.id,
      certificateNumber: "MUIS-SG-2026-003",
      issuedBy: "MUIS",
      issueDate: new Date("2025-09-01"),
      expiryDate: daysFromNow(12), // expires in 12 days
    },
  });

  const certExpiring2 = await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000106" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000106",
      supplierId: supplierAE.id,
      certificateNumber: "ESMA-UAE-2025-0721",
      issuedBy: "ESMA",
      issueDate: new Date("2025-06-01"),
      expiryDate: daysFromNow(25), // expires in 25 days
    },
  });

  const certExpiring3 = await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000107" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000107",
      supplierId: supplierIN.id,
      certificateNumber: "HMC-IND-2025-3344",
      issuedBy: "Halal India Certification",
      issueDate: new Date("2025-04-01"),
      expiryDate: daysFromNow(7), // expires in 7 days — urgent
    },
  });

  // --- VALID certificates ---
  const certValid1 = await prisma.halalCertificate.upsert({
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

  const certValid2 = await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000108" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000108",
      supplierId: supplierMY.id,
      certificateNumber: "JAKIM-2026-00891",
      issuedBy: "JAKIM",
      issueDate: new Date("2026-02-01"),
      expiryDate: daysFromNow(500),
    },
  });

  const certValid3 = await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000109" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000109",
      supplierId: supplierAU.id,
      certificateNumber: "HCA-AUS-2025-2210",
      issuedBy: "Halal Certification Authority Australia",
      issueDate: new Date("2025-11-01"),
      expiryDate: daysFromNow(220),
    },
  });

  const certValid4 = await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000110" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000110",
      supplierId: supplierTR.id,
      certificateNumber: "TSE-HALAL-2026-0551",
      issuedBy: "TSE Halal",
      issueDate: new Date("2026-01-15"),
      expiryDate: daysFromNow(300),
    },
  });

  const certValid5 = await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000111" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000111",
      supplierId: supplierPK.id,
      certificateNumber: "PSH-PK-2025-9981",
      issuedBy: "Pakistan Standards Halal",
      issueDate: new Date("2025-08-15"),
      expiryDate: daysFromNow(150),
    },
  });

  const certValid6 = await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000112" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000112",
      supplierId: supplierID.id,
      certificateNumber: "MUI-LPPOM-2026-99001",
      issuedBy: "MUI",
      issueDate: new Date("2026-05-01"),
      expiryDate: daysFromNow(680),
    },
  });

  const certValid7 = await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000113" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000113",
      supplierId: supplierTH.id,
      certificateNumber: "CICOT-TH-2026-1150",
      issuedBy: "CICOT",
      issueDate: new Date("2026-03-20"),
      expiryDate: daysFromNow(400),
    },
  });

  const certValid8 = await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000114" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000114",
      supplierId: supplierAE.id,
      certificateNumber: "GAC-UAE-2026-4401",
      issuedBy: "GAC (Gulf Accreditation Center)",
      issueDate: new Date("2026-04-01"),
      expiryDate: daysFromNow(550),
    },
  });

  const certValid9 = await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000115" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000115",
      supplierId: supplierVN.id,
      certificateNumber: "HCV-VN-2026-0088",
      issuedBy: "Halal Certification Vietnam",
      issueDate: new Date("2026-02-10"),
      expiryDate: daysFromNow(250),
    },
  });

  const certValid10 = await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000116" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000116",
      supplierId: supplierIN.id,
      certificateNumber: "HMC-IND-2026-5502",
      issuedBy: "Halal India Certification",
      issueDate: new Date("2026-05-20"),
      expiryDate: daysFromNow(700),
    },
  });

  // ═══════════════════════════════════════════════════════════
  // 4. WAREHOUSES (5 across Vietnam)
  // ═══════════════════════════════════════════════════════════
  const whHCM = await prisma.warehouse.upsert({
    where: { id: "00000000-0000-4000-8000-000000000201" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000201",
      name: "HCM Logistics Hub",
      location: "District 9, Ho Chi Minh City",
    },
  });

  const whHN = await prisma.warehouse.upsert({
    where: { id: "00000000-0000-4000-8000-000000000202" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000202",
      name: "Northern Distribution Center",
      location: "Gia Lam, Hanoi",
    },
  });

  const whDN = await prisma.warehouse.upsert({
    where: { id: "00000000-0000-4000-8000-000000000203" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000203",
      name: "Da Nang Transit Depot",
      location: "Lien Chieu, Da Nang",
    },
  });

  const whCT = await prisma.warehouse.upsert({
    where: { id: "00000000-0000-4000-8000-000000000204" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000204",
      name: "Mekong Cold Storage",
      location: "Binh Thuy, Can Tho",
    },
  });

  const whHP = await prisma.warehouse.upsert({
    where: { id: "00000000-0000-4000-8000-000000000205" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000205",
      name: "Hai Phong Port Warehouse",
      location: "Dinh Vu, Hai Phong",
    },
  });

  // ═══════════════════════════════════════════════════════════
  // 5. PRODUCTS (20 — diverse categories)
  // ═══════════════════════════════════════════════════════════
  const productsData = [
    { sku: "HAL-COCO-001", supplierId: supplierMY.id, name: "Organic Coconut Milk", category: "Beverages", unit: "carton", unitPrice: 12.5 },
    { sku: "HAL-BEEF-002", supplierId: supplierID.id, name: "Premium Halal Beef Rendang Paste", category: "Condiments", unit: "jar", unitPrice: 8.75 },
    { sku: "HAL-RICE-003", supplierId: supplierTH.id, name: "Jasmine Halal Rice 25kg", category: "Grains", unit: "bag", unitPrice: 22.0 },
    { sku: "HAL-CHKN-004", supplierId: supplierMY.id, name: "Frozen Halal Whole Chicken", category: "Meat & Poultry", unit: "kg", unitPrice: 6.3 },
    { sku: "HAL-SOY-005", supplierId: supplierSG.id, name: "Halal Soy Sauce 5L", category: "Condiments", unit: "bottle", unitPrice: 14.0 },
    { sku: "HAL-DATE-006", supplierId: supplierID.id, name: "Medjool Dates 1kg Box", category: "Snacks & Dried Fruit", unit: "box", unitPrice: 18.5 },
    { sku: "HAL-CURR-007", supplierId: supplierTH.id, name: "Halal Green Curry Paste", category: "Condiments", unit: "tub", unitPrice: 5.5 },
    { sku: "HAL-LAMB-008", supplierId: supplierAU.id, name: "Australian Halal Lamb Shoulder", category: "Meat & Poultry", unit: "kg", unitPrice: 16.8 },
    { sku: "HAL-OLIV-009", supplierId: supplierTR.id, name: "Extra Virgin Olive Oil 2L", category: "Oils & Fats", unit: "bottle", unitPrice: 19.9 },
    { sku: "HAL-SPIC-010", supplierId: supplierPK.id, name: "Halal Garam Masala Blend 500g", category: "Spices & Seasoning", unit: "pack", unitPrice: 9.2 },
    { sku: "HAL-BASM-011", supplierId: supplierIN.id, name: "Premium Basmati Rice 10kg", category: "Grains", unit: "bag", unitPrice: 25.0 },
    { sku: "HAL-FISH-012", supplierId: supplierVN.id, name: "Halal Certified Frozen Pangasius Fillet", category: "Seafood", unit: "kg", unitPrice: 7.5 },
    { sku: "HAL-HONE-013", supplierId: supplierAE.id, name: "Sidr Honey 500g Jar", category: "Sweeteners & Spreads", unit: "jar", unitPrice: 28.0 },
    { sku: "HAL-CHOC-014", supplierId: supplierMY.id, name: "Halal Dark Chocolate Couverture 1kg", category: "Confectionery", unit: "block", unitPrice: 15.3 },
    { sku: "HAL-NOOD-015", supplierId: supplierTH.id, name: "Halal Instant Rice Noodles 200g", category: "Noodles & Pasta", unit: "pack", unitPrice: 2.8 },
    { sku: "HAL-CANN-016", supplierId: supplierSG.id, name: "Canned Halal Chicken Luncheon 340g", category: "Canned Foods", unit: "can", unitPrice: 4.5 },
    { sku: "HAL-CHEE-017", supplierId: supplierAU.id, name: "Australian Halal Cheddar Block 2kg", category: "Dairy", unit: "block", unitPrice: 22.0 },
    { sku: "HAL-FLOU-018", supplierId: supplierIN.id, name: "Organic Whole Wheat Atta 5kg", category: "Grains & Flours", unit: "bag", unitPrice: 8.0 },
    { sku: "HAL-SAUS-019", supplierId: supplierTR.id, name: "Halal Beef Sausage Frankfurt 500g", category: "Processed Meat", unit: "pack", unitPrice: 6.9 },
    { sku: "HAL-SNAC-020", supplierId: supplierPK.id, name: "Halal Fruit & Nut Mix 300g", category: "Snacks & Dried Fruit", unit: "pack", unitPrice: 7.4 },
  ];

  const products: Record<string, Awaited<ReturnType<typeof prisma.product.upsert>>> = {};
  for (const p of productsData) {
    products[p.sku] = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 6. INVENTORY (35 records — varied stock levels)
  // ═══════════════════════════════════════════════════════════
  const invRecs = [
    // HCM Hub — main distribution center
    { p: "HAL-COCO-001", w: whHCM, qty: 420, ro: 100 },
    { p: "HAL-BEEF-002", w: whHCM, qty: 310, ro: 80 },
    { p: "HAL-CHKN-004", w: whHCM, qty: 55, ro: 100 },     // ⚠ LOW STOCK
    { p: "HAL-DATE-006", w: whHCM, qty: 88, ro: 40 },
    { p: "HAL-LAMB-008", w: whHCM, qty: 145, ro: 50 },
    { p: "HAL-BASM-011", w: whHCM, qty: 200, ro: 60 },
    { p: "HAL-CHOC-014", w: whHCM, qty: 75, ro: 30 },
    { p: "HAL-SNAC-020", w: whHCM, qty: 180, ro: 50 },

    // Hanoi — northern market
    { p: "HAL-RICE-003", w: whHN, qty: 155, ro: 50 },
    { p: "HAL-SOY-005", w: whHN, qty: 230, ro: 60 },
    { p: "HAL-COCO-001", w: whHN, qty: 8, ro: 80 },         // ⚠ CRITICALLY LOW
    { p: "HAL-CURR-007", w: whHN, qty: 95, ro: 30 },
    { p: "HAL-NOOD-015", w: whHN, qty: 420, ro: 100 },
    { p: "HAL-FLOU-018", w: whHN, qty: 60, ro: 40 },
    { p: "HAL-SPIC-010", w: whHN, qty: 33, ro: 50 },        // ⚠ LOW STOCK

    // Da Nang — central transit
    { p: "HAL-CHKN-004", w: whDN, qty: 120, ro: 60 },
    { p: "HAL-CURR-007", w: whDN, qty: 140, ro: 30 },
    { p: "HAL-RICE-003", w: whDN, qty: 185, ro: 50 },
    { p: "HAL-FISH-012", w: whDN, qty: 210, ro: 80 },
    { p: "HAL-OLIV-009", w: whDN, qty: 40, ro: 25 },
    { p: "HAL-CANN-016", w: whDN, qty: 560, ro: 150 },

    // Can Tho — Mekong cold storage
    { p: "HAL-FISH-012", w: whCT, qty: 350, ro: 100 },
    { p: "HAL-CHKN-004", w: whCT, qty: 280, ro: 80 },
    { p: "HAL-LAMB-008", w: whCT, qty: 90, ro: 40 },
    { p: "HAL-SAUS-019", w: whCT, qty: 15, ro: 60 },        // ⚠ CRITICALLY LOW
    { p: "HAL-CHEE-017", w: whCT, qty: 55, ro: 30 },
    { p: "HAL-CHOC-014", w: whCT, qty: 40, ro: 25 },

    // Hai Phong — port warehouse
    { p: "HAL-BASM-011", w: whHP, qty: 320, ro: 80 },
    { p: "HAL-HONE-013", w: whHP, qty: 65, ro: 30 },
    { p: "HAL-OLIV-009", w: whHP, qty: 78, ro: 30 },
    { p: "HAL-SOY-005", w: whHP, qty: 145, ro: 50 },
    { p: "HAL-DATE-006", w: whHP, qty: 110, ro: 40 },
    { p: "HAL-BEEF-002", w: whHP, qty: 200, ro: 60 },
    { p: "HAL-NOOD-015", w: whHP, qty: 310, ro: 100 },
    { p: "HAL-SNAC-020", w: whHP, qty: 90, ro: 40 },
    { p: "HAL-FLOU-018", w: whHP, qty: 125, ro: 50 },
  ];

  for (const inv of invRecs) {
    await prisma.inventory.upsert({
      where: { productId_warehouseId: { productId: products[inv.p].id, warehouseId: inv.w.id } },
      update: { quantity: inv.qty },
      create: {
        productId: products[inv.p].id,
        warehouseId: inv.w.id,
        quantity: inv.qty,
        reorderLevel: inv.ro,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 7. PURCHASE ORDERS (20 — all statuses)
  // ═══════════════════════════════════════════════════════════
  const poDefs = [
    { poNumber: "PO-2025-0001", supplierId: supplierMY.id, status: PurchaseOrderStatus.SHIPPING, totalAmount: 15600, createdAt: new Date("2025-04-12") },
    { poNumber: "PO-2025-0002", supplierId: supplierID.id, status: PurchaseOrderStatus.APPROVED, totalAmount: 8400, createdAt: new Date("2025-05-03") },
    { poNumber: "PO-2025-0003", supplierId: supplierTH.id, status: PurchaseOrderStatus.RECEIVED, totalAmount: 11200, createdAt: new Date("2025-03-18") },
    { poNumber: "PO-2025-0004", supplierId: supplierSG.id, status: PurchaseOrderStatus.DRAFT, totalAmount: 5320, createdAt: new Date("2025-05-20") },
    { poNumber: "PO-2025-0005", supplierId: supplierMY.id, status: PurchaseOrderStatus.RECEIVED, totalAmount: 9870, createdAt: new Date("2025-02-10") },
    { poNumber: "PO-2025-0006", supplierId: supplierID.id, status: PurchaseOrderStatus.CANCELLED, totalAmount: 3200, createdAt: new Date("2025-01-25") },
    { poNumber: "PO-2025-0007", supplierId: supplierAU.id, status: PurchaseOrderStatus.RECEIVED, totalAmount: 18400, createdAt: new Date("2025-06-01") },
    { poNumber: "PO-2025-0008", supplierId: supplierTR.id, status: PurchaseOrderStatus.SHIPPING, totalAmount: 9200, createdAt: new Date("2025-07-15") },
    { poNumber: "PO-2025-0009", supplierId: supplierAE.id, status: PurchaseOrderStatus.RECEIVED, totalAmount: 14300, createdAt: new Date("2025-08-20") },
    { poNumber: "PO-2026-0010", supplierId: supplierPK.id, status: PurchaseOrderStatus.RECEIVED, totalAmount: 6700, createdAt: new Date("2026-01-05") },
    { poNumber: "PO-2026-0011", supplierId: supplierIN.id, status: PurchaseOrderStatus.APPROVED, totalAmount: 22500, createdAt: new Date("2026-02-18") },
    { poNumber: "PO-2026-0012", supplierId: supplierVN.id, status: PurchaseOrderStatus.RECEIVED, totalAmount: 8900, createdAt: new Date("2026-03-10") },
    { poNumber: "PO-2026-0013", supplierId: supplierMY.id, status: PurchaseOrderStatus.SHIPPING, totalAmount: 13200, createdAt: new Date("2026-04-22") },
    { poNumber: "PO-2026-0014", supplierId: supplierTH.id, status: PurchaseOrderStatus.PARTIAL, totalAmount: 14800, createdAt: new Date("2026-05-01") },
    { poNumber: "PO-2026-0015", supplierId: supplierSG.id, status: PurchaseOrderStatus.APPROVED, totalAmount: 7600, createdAt: new Date("2026-05-15") },
    { poNumber: "PO-2026-0016", supplierId: supplierAU.id, status: PurchaseOrderStatus.DRAFT, totalAmount: 19500, createdAt: new Date("2026-06-01") },
    { poNumber: "PO-2026-0017", supplierId: supplierAE.id, status: PurchaseOrderStatus.SHIPPING, totalAmount: 11000, createdAt: new Date("2026-06-10") },
    { poNumber: "PO-2026-0018", supplierId: supplierID.id, status: PurchaseOrderStatus.DRAFT, totalAmount: 5100, createdAt: daysAgo(3) },
    { poNumber: "PO-2026-0019", supplierId: supplierTR.id, status: PurchaseOrderStatus.APPROVED, totalAmount: 16300, createdAt: daysAgo(1) },
    { poNumber: "PO-2026-0020", supplierId: supplierVN.id, status: PurchaseOrderStatus.CANCELLED, totalAmount: 4200, createdAt: new Date("2026-05-28") },
  ];

  const pos: Record<string, Awaited<ReturnType<typeof prisma.purchaseOrder.upsert>>> = {};
  for (const po of poDefs) {
    pos[po.poNumber] = await prisma.purchaseOrder.upsert({
      where: { poNumber: po.poNumber },
      update: {},
      create: po,
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 8. PURCHASE ORDER ITEMS (30+ line items)
  // ═══════════════════════════════════════════════════════════
  const poiDefs = [
    { po: "PO-2025-0001", sku: "HAL-COCO-001", qty: 600, up: 12.5 },
    { po: "PO-2025-0001", sku: "HAL-CHKN-004", qty: 400, up: 6.3 },
    { po: "PO-2025-0002", sku: "HAL-BEEF-002", qty: 480, up: 8.75 },
    { po: "PO-2025-0002", sku: "HAL-DATE-006", qty: 200, up: 18.5 },
    { po: "PO-2025-0003", sku: "HAL-RICE-003", qty: 350, up: 22.0 },
    { po: "PO-2025-0003", sku: "HAL-CURR-007", qty: 300, up: 5.5 },
    { po: "PO-2025-0004", sku: "HAL-SOY-005", qty: 200, up: 14.0 },
    { po: "PO-2025-0005", sku: "HAL-COCO-001", qty: 300, up: 12.5 },
    { po: "PO-2025-0005", sku: "HAL-CHKN-004", qty: 200, up: 6.3 },
    { po: "PO-2025-0006", sku: "HAL-DATE-006", qty: 100, up: 18.5 },
    { po: "PO-2025-0007", sku: "HAL-LAMB-008", qty: 500, up: 16.8 },
    { po: "PO-2025-0007", sku: "HAL-CHEE-017", qty: 200, up: 22.0 },
    { po: "PO-2025-0008", sku: "HAL-OLIV-009", qty: 300, up: 19.9 },
    { po: "PO-2025-0009", sku: "HAL-HONE-013", qty: 350, up: 28.0 },
    { po: "PO-2026-0010", sku: "HAL-SPIC-010", qty: 400, up: 9.2 },
    { po: "PO-2026-0010", sku: "HAL-SNAC-020", qty: 250, up: 7.4 },
    { po: "PO-2026-0011", sku: "HAL-BASM-011", qty: 500, up: 25.0 },
    { po: "PO-2026-0011", sku: "HAL-FLOU-018", qty: 400, up: 8.0 },
    { po: "PO-2026-0012", sku: "HAL-FISH-012", qty: 600, up: 7.5 },
    { po: "PO-2026-0013", sku: "HAL-CHOC-014", qty: 350, up: 15.3 },
    { po: "PO-2026-0013", sku: "HAL-NOOD-015", qty: 500, up: 2.8 },
    { po: "PO-2026-0014", sku: "HAL-NOOD-015", qty: 800, up: 2.8 },
    { po: "PO-2026-0014", sku: "HAL-CURR-007", qty: 400, up: 5.5 },
    { po: "PO-2026-0015", sku: "HAL-SOY-005", qty: 250, up: 14.0 },
    { po: "PO-2026-0015", sku: "HAL-CANN-016", qty: 600, up: 4.5 },
    { po: "PO-2026-0016", sku: "HAL-LAMB-008", qty: 450, up: 16.8 },
    { po: "PO-2026-0017", sku: "HAL-HONE-013", qty: 200, up: 28.0 },
    { po: "PO-2026-0017", sku: "HAL-CHOC-014", qty: 150, up: 15.3 },
    { po: "PO-2026-0018", sku: "HAL-DATE-006", qty: 120, up: 18.5 },
    { po: "PO-2026-0019", sku: "HAL-SAUS-019", qty: 500, up: 6.9 },
    { po: "PO-2026-0019", sku: "HAL-OLIV-009", qty: 200, up: 19.9 },
    { po: "PO-2026-0020", sku: "HAL-FISH-012", qty: 200, up: 7.5 },
  ];

  for (const poi of poiDefs) {
    await prisma.purchaseOrderItem.create({
      data: {
        purchaseOrderId: pos[poi.po].id,
        productId: products[poi.sku].id,
        quantity: poi.qty,
        unitPrice: poi.up,
        subtotal: Math.round(poi.qty * poi.up * 100) / 100,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 9. SHIPMENTS (16 — all statuses, some delayed)
  // ═══════════════════════════════════════════════════════════
  const shipmentDefs = [
    // DELAYED / past estimated arrival → Rule 4 triggers
    { id: "00000000-0000-4000-8000-000000000301", po: "PO-2025-0001", tracking: "MY-HAL-784521", origin: "Port Klang, Malaysia", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.IN_TRANSIT, estArrival: new Date("2025-06-20"), shippedAt: new Date("2025-06-01") },
    { id: "00000000-0000-4000-8000-000000000302", po: "PO-2025-0002", tracking: "ID-HAL-992103", origin: "Tanjung Priok, Jakarta", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.PENDING, estArrival: new Date("2025-06-28") },
    { id: "00000000-0000-4000-8000-000000000304", po: "PO-2025-0004", tracking: "SG-HAL-110456", origin: "Singapore PSA Port", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.PENDING, estArrival: new Date("2025-07-05") },
    // DELAYED status
    { id: "00000000-0000-4000-8000-000000000306", po: "PO-2025-0008", tracking: "TR-HAL-555321", origin: "Istanbul, Turkey", dest: "Hai Phong Port, Vietnam", status: ShipmentStatus.DELAYED, estArrival: new Date("2025-09-01"), shippedAt: new Date("2025-07-25") },
    { id: "00000000-0000-4000-8000-000000000307", po: "PO-2026-0014", tracking: "TH-HAL-992880", origin: "Laem Chabang, Thailand", dest: "Da Nang Port, Vietnam", status: ShipmentStatus.DELAYED, estArrival: new Date("2026-05-20"), shippedAt: new Date("2026-05-08") },

    // DELIVERED
    { id: "00000000-0000-4000-8000-000000000303", po: "PO-2025-0003", tracking: "TH-HAL-441002", origin: "Laem Chabang, Thailand", dest: "Hai Phong Port, Vietnam", status: ShipmentStatus.DELIVERED, estArrival: new Date("2025-04-05"), shippedAt: new Date("2025-03-20") },
    { id: "00000000-0000-4000-8000-000000000305", po: "PO-2025-0005", tracking: "MY-HAL-603217", origin: "Port Klang, Malaysia", dest: "Hai Phong Port, Vietnam", status: ShipmentStatus.DELIVERED, estArrival: new Date("2025-03-01"), shippedAt: new Date("2025-02-14") },
    { id: "00000000-0000-4000-8000-000000000308", po: "PO-2025-0007", tracking: "AU-HAL-770122", origin: "Melbourne, Australia", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.DELIVERED, estArrival: new Date("2025-07-01"), shippedAt: new Date("2025-06-10") },
    { id: "00000000-0000-4000-8000-000000000309", po: "PO-2025-0009", tracking: "AE-HAL-443211", origin: "Jebel Ali, UAE", dest: "Hai Phong Port, Vietnam", status: ShipmentStatus.DELIVERED, estArrival: new Date("2025-09-15"), shippedAt: new Date("2025-08-28") },
    { id: "00000000-0000-4000-8000-000000000310", po: "PO-2026-0010", tracking: "PK-HAL-881234", origin: "Karachi, Pakistan", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.DELIVERED, estArrival: new Date("2026-02-01"), shippedAt: new Date("2026-01-15") },
    { id: "00000000-0000-4000-8000-000000000311", po: "PO-2026-0012", tracking: "VN-HAL-100992", origin: "Saigon, Vietnam", dest: "Da Nang Transit Depot", status: ShipmentStatus.DELIVERED, estArrival: new Date("2026-03-20"), shippedAt: new Date("2026-03-14") },

    // IN_TRANSIT (on time)
    { id: "00000000-0000-4000-8000-000000000312", po: "PO-2026-0013", tracking: "MY-HAL-921045", origin: "Port Klang, Malaysia", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.IN_TRANSIT, estArrival: daysFromNow(5), shippedAt: daysAgo(7) },
    { id: "00000000-0000-4000-8000-000000000313", po: "PO-2026-0017", tracking: "AE-HAL-773344", origin: "Jebel Ali, UAE", dest: "Hai Phong Port, Vietnam", status: ShipmentStatus.IN_TRANSIT, estArrival: daysFromNow(12), shippedAt: daysAgo(3) },

    // PENDING
    { id: "00000000-0000-4000-8000-000000000314", po: "PO-2026-0011", tracking: "IN-HAL-663211", origin: "Mumbai, India", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.PENDING, estArrival: daysFromNow(30) },
    { id: "00000000-0000-4000-8000-000000000315", po: "PO-2026-0015", tracking: "SG-HAL-888331", origin: "Singapore PSA Port", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.PENDING, estArrival: daysFromNow(20) },
    { id: "00000000-0000-4000-8000-000000000316", po: "PO-2026-0019", tracking: "TR-HAL-220987", origin: "Istanbul, Turkey", dest: "Hai Phong Port, Vietnam", status: ShipmentStatus.PENDING, estArrival: daysFromNow(35) },
  ];

  for (const s of shipmentDefs) {
    await prisma.shipment.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        purchaseOrderId: pos[s.po].id,
        trackingNumber: s.tracking,
        origin: s.origin,
        destination: s.dest,
        status: s.status,
        estimatedArrival: s.estArrival,
        shippedAt: s.shippedAt,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 10. INVENTORY MOVEMENTS (50+ — rich operational history)
  // ═══════════════════════════════════════════════════════════
  interface MovementDef {
    sku: string;
    warehouse: typeof whHCM;
    type: InventoryMovementType;
    qty: number;
    note: string;
    daysOffset: number; // days ago from NOW
    user: typeof staffHCM;
  }

  const movementDefs: MovementDef[] = [
    // ── 2025 Q3-Q4: Initial stocking ──
    { sku: "HAL-COCO-001", warehouse: whHCM, type: InventoryMovementType.INBOUND, qty: 800, note: "PO-2025-0001 receipt — initial stock", daysOffset: 380, user: staffHCM },
    { sku: "HAL-CHKN-004", warehouse: whHCM, type: InventoryMovementType.INBOUND, qty: 500, note: "PO-2025-0001 receipt — initial stock", daysOffset: 380, user: staffHCM },
    { sku: "HAL-BEEF-002", warehouse: whHCM, type: InventoryMovementType.INBOUND, qty: 480, note: "PO-2025-0002 receipt — initial stock", daysOffset: 350, user: staffHCM },
    { sku: "HAL-DATE-006", warehouse: whHCM, type: InventoryMovementType.INBOUND, qty: 250, note: "PO-2025-0002 receipt", daysOffset: 350, user: staffHCM },
    { sku: "HAL-RICE-003", warehouse: whHN, type: InventoryMovementType.INBOUND, qty: 350, note: "PO-2025-0003 receipt", daysOffset: 340, user: staffHN },
    { sku: "HAL-CURR-007", warehouse: whHN, type: InventoryMovementType.INBOUND, qty: 300, note: "PO-2025-0003 receipt", daysOffset: 340, user: staffHN },
    { sku: "HAL-SOY-005", warehouse: whHN, type: InventoryMovementType.INBOUND, qty: 250, note: "PO-2025-0004 receipt", daysOffset: 320, user: staffHN },
    { sku: "HAL-LAMB-008", warehouse: whHCM, type: InventoryMovementType.INBOUND, qty: 500, note: "PO-2025-0007 receipt — new supplier setup", daysOffset: 280, user: staffHCM },
    { sku: "HAL-CHEE-017", warehouse: whCT, type: InventoryMovementType.INBOUND, qty: 200, note: "PO-2025-0007 receipt — cold chain", daysOffset: 275, user: staffDN },
    { sku: "HAL-OLIV-009", warehouse: whHP, type: InventoryMovementType.INBOUND, qty: 300, note: "PO-2025-0008 receipt", daysOffset: 240, user: staffHN },
    { sku: "HAL-HONE-013", warehouse: whHP, type: InventoryMovementType.INBOUND, qty: 350, note: "PO-2025-0009 receipt — premium product", daysOffset: 210, user: staffHN },
    { sku: "HAL-SPIC-010", warehouse: whHN, type: InventoryMovementType.INBOUND, qty: 400, note: "PO-2026-0010 receipt", daysOffset: 150, user: staffHN },
    { sku: "HAL-SNAC-020", warehouse: whHCM, type: InventoryMovementType.INBOUND, qty: 250, note: "PO-2026-0010 receipt", daysOffset: 150, user: staffHCM },
    { sku: "HAL-BASM-011", warehouse: whHP, type: InventoryMovementType.INBOUND, qty: 500, note: "PO-2026-0011 receipt", daysOffset: 110, user: staffQuality },
    { sku: "HAL-FLOU-018", warehouse: whHP, type: InventoryMovementType.INBOUND, qty: 400, note: "PO-2026-0011 receipt", daysOffset: 110, user: staffQuality },
    { sku: "HAL-FISH-012", warehouse: whCT, type: InventoryMovementType.INBOUND, qty: 600, note: "PO-2026-0012 receipt — cold chain", daysOffset: 90, user: staffDN },
    { sku: "HAL-CHOC-014", warehouse: whHCM, type: InventoryMovementType.INBOUND, qty: 350, note: "PO-2026-0013 receipt", daysOffset: 50, user: staffHCM },
    { sku: "HAL-NOOD-015", warehouse: whHP, type: InventoryMovementType.INBOUND, qty: 500, note: "PO-2026-0013 receipt", daysOffset: 50, user: staffHN },
    // Partial PO-2026-0014
    { sku: "HAL-NOOD-015", warehouse: whHN, type: InventoryMovementType.INBOUND, qty: 400, note: "PO-2026-0014 partial receipt (50%)", daysOffset: 30, user: staffHN },

    // ── OUTBOUND movements ──
    { sku: "HAL-COCO-001", warehouse: whHCM, type: InventoryMovementType.OUTBOUND, qty: 200, note: "Retail distribution — Mega Market chain", daysOffset: 300, user: staffHCM },
    { sku: "HAL-COCO-001", warehouse: whHCM, type: InventoryMovementType.OUTBOUND, qty: 100, note: "Online order fulfillment — Lazada", daysOffset: 250, user: staffHCM },
    { sku: "HAL-CHKN-004", warehouse: whHCM, type: InventoryMovementType.OUTBOUND, qty: 300, note: "Hotel chain order — Vinpearl Nha Trang", daysOffset: 230, user: staffHCM },
    { sku: "HAL-BEEF-002", warehouse: whHCM, type: InventoryMovementType.OUTBOUND, qty: 100, note: "Export dispatch — Cambodia", daysOffset: 210, user: staffHCM },
    { sku: "HAL-BEEF-002", warehouse: whHP, type: InventoryMovementType.OUTBOUND, qty: 50, note: "Northern retail distribution", daysOffset: 190, user: staffHN },
    { sku: "HAL-RICE-003", warehouse: whHN, type: InventoryMovementType.OUTBOUND, qty: 100, note: "Supermarket chain — Big C Hanoi", daysOffset: 270, user: staffHN },
    { sku: "HAL-RICE-003", warehouse: whDN, type: InventoryMovementType.OUTBOUND, qty: 50, note: "Central region distribution", daysOffset: 200, user: staffDN },
    { sku: "HAL-CURR-007", warehouse: whDN, type: InventoryMovementType.OUTBOUND, qty: 60, note: "Restaurant chain — Central Vietnam", daysOffset: 180, user: staffDN },
    { sku: "HAL-SOY-005", warehouse: whHN, type: InventoryMovementType.OUTBOUND, qty: 80, note: "Retail — WinMart Hanoi", daysOffset: 170, user: staffHN },
    { sku: "HAL-SOY-005", warehouse: whHP, type: InventoryMovementType.OUTBOUND, qty: 40, note: "Export dispatch — Laos", daysOffset: 140, user: staffHN },
    { sku: "HAL-DATE-006", warehouse: whHCM, type: InventoryMovementType.OUTBOUND, qty: 60, note: "Online order fulfillment", daysOffset: 190, user: staffHCM },
    { sku: "HAL-LAMB-008", warehouse: whHCM, type: InventoryMovementType.OUTBOUND, qty: 200, note: "Restaurant chain — 5-star hotels HCMC", daysOffset: 160, user: staffHCM },
    { sku: "HAL-LAMB-008", warehouse: whCT, type: InventoryMovementType.OUTBOUND, qty: 40, note: "Mekong Delta distribution", daysOffset: 130, user: staffDN },
    { sku: "HAL-OLIV-009", warehouse: whDN, type: InventoryMovementType.OUTBOUND, qty: 30, note: "Gourmet retail — Da Nang", daysOffset: 120, user: staffDN },
    { sku: "HAL-HONE-013", warehouse: whHP, type: InventoryMovementType.OUTBOUND, qty: 45, note: "Premium gift pack — corporate order", daysOffset: 100, user: staffHN },
    { sku: "HAL-SPIC-010", warehouse: whHN, type: InventoryMovementType.OUTBOUND, qty: 70, note: "Wholesale — spice distributors", daysOffset: 90, user: staffHN },
    { sku: "HAL-FISH-012", warehouse: whDN, type: InventoryMovementType.OUTBOUND, qty: 100, note: "Export — Philippines", daysOffset: 70, user: staffDN },
    { sku: "HAL-CHOC-014", warehouse: whHCM, type: InventoryMovementType.OUTBOUND, qty: 60, note: "Confectionery chain — HCMC", daysOffset: 40, user: staffHCM },
    { sku: "HAL-CHOC-014", warehouse: whCT, type: InventoryMovementType.OUTBOUND, qty: 25, note: "Retail — Can Tho", daysOffset: 35, user: staffDN },
    { sku: "HAL-NOOD-015", warehouse: whHP, type: InventoryMovementType.OUTBOUND, qty: 150, note: "Export — Myanmar", daysOffset: 20, user: staffQuality },
    { sku: "HAL-CHKN-004", warehouse: whDN, type: InventoryMovementType.OUTBOUND, qty: 80, note: "Airline catering — Vietjet", daysOffset: 60, user: staffDN },
    { sku: "HAL-BASM-011", warehouse: whHP, type: InventoryMovementType.OUTBOUND, qty: 120, note: "Premium rice export — Japan", daysOffset: 55, user: staffQuality },
    { sku: "HAL-SNAC-020", warehouse: whHCM, type: InventoryMovementType.OUTBOUND, qty: 40, note: "Convenience store chain — Circle K", daysOffset: 80, user: staffHCM },
    { sku: "HAL-CANN-016", warehouse: whDN, type: InventoryMovementType.OUTBOUND, qty: 200, note: "Disaster relief shipment — Central Vietnam", daysOffset: 65, user: staffDN },

    // ── INTERNAL TRANSFERS ──
    { sku: "HAL-COCO-001", warehouse: whHN, type: InventoryMovementType.INBOUND, qty: 50, note: "Internal transfer from HCM to Hanoi", daysOffset: 180, user: staffHN },
    { sku: "HAL-COCO-001", warehouse: whHN, type: InventoryMovementType.OUTBOUND, qty: 42, note: "Northern retail orders", daysOffset: 130, user: staffHN },
    { sku: "HAL-FISH-012", warehouse: whCT, type: InventoryMovementType.INBOUND, qty: 150, note: "Transfer from Can Tho to Da Nang for export", daysOffset: 75, user: staffDN },
    { sku: "HAL-FISH-012", warehouse: whDN, type: InventoryMovementType.INBOUND, qty: 150, note: "Received from Can Tho cold storage", daysOffset: 73, user: staffDN },
    { sku: "HAL-FLOU-018", warehouse: whHN, type: InventoryMovementType.INBOUND, qty: 80, note: "Transfer from Hai Phong to Hanoi", daysOffset: 45, user: staffHN },
    { sku: "HAL-FLOU-018", warehouse: whHP, type: InventoryMovementType.OUTBOUND, qty: 80, note: "Transfer to Hanoi distribution center", daysOffset: 45, user: staffQuality },

    // ── ADJUSTMENTS ──
    { sku: "HAL-RICE-003", warehouse: whHN, type: InventoryMovementType.ADJUSTMENT, qty: 10, note: "Stock count adjustment — found extra", daysOffset: 100, user: staffHN },
    { sku: "HAL-SPIC-010", warehouse: whHN, type: InventoryMovementType.ADJUSTMENT, qty: -5, note: "Damaged stock write-off — packaging issue", daysOffset: 40, user: staffQuality },
    { sku: "HAL-CHEE-017", warehouse: whCT, type: InventoryMovementType.ADJUSTMENT, qty: -3, note: "Spoilage — cold chain interruption", daysOffset: 25, user: staffDN },
    { sku: "HAL-SAUS-019", warehouse: whCT, type: InventoryMovementType.ADJUSTMENT, qty: -8, note: "Quality check rejection — near expiry", daysOffset: 10, user: staffDN },
  ];

  for (const m of movementDefs) {
    await prisma.inventoryMovement.create({
      data: {
        productId: products[m.sku].id,
        warehouseId: m.warehouse.id,
        type: m.type,
        quantity: m.qty,
        note: m.note,
        performedBy: m.user.id,
        createdAt: daysAgo(m.daysOffset),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 11. NOTIFICATIONS (20+ — demo alerts)
  // ═══════════════════════════════════════════════════════════
  const notificationDefs = [
    { title: "Certificate Expiring Soon", message: "Certificate HMC-IND-2025-3344 (Hyderabad Grain & Rice Mills) expires in 7 days. Take action immediately.", type: NotificationType.CERTIFICATE_EXPIRING, userId: admin.id, daysOffset: 0 },
    { title: "Certificate Expiring Soon", message: "Certificate MUIS-SG-2026-003 (Muis Certified Foods) expires in 12 days.", type: NotificationType.CERTIFICATE_EXPIRING, userId: admin.id, daysOffset: 1 },
    { title: "Certificate Expiring Soon", message: "Certificate ESMA-UAE-2025-0721 (Emirates Halal Food Ind.) expires in 25 days.", type: NotificationType.CERTIFICATE_EXPIRING, userId: manager.id, daysOffset: 2 },
    { title: "Certificate Expired", message: "Certificate JAKIM-2024-00123 (Halal Foods Malaysia) expired on 2026-01-14. Renewal required.", type: NotificationType.CERTIFICATE_EXPIRED, userId: admin.id, daysOffset: 5 },
    { title: "Certificate Expired", message: "Certificate MUI-LPPOM-45678 (Nusantara Halal) expired on 2025-12-31. Supplier suspended from new orders.", type: NotificationType.CERTIFICATE_EXPIRED, userId: manager.id, daysOffset: 6 },
    { title: "Certificate Expired", message: "Certificate CICOT-TH-2024-889 (Siam Halal Trading) expired on 2026-03-09.", type: NotificationType.CERTIFICATE_EXPIRED, userId: auditor.id, daysOffset: 7 },
    { title: "Low Stock Alert", message: "Frozen Halal Whole Chicken at HCM Logistics Hub is at 55 units (reorder: 100).", type: NotificationType.LOW_STOCK, userId: staffHCM.id, daysOffset: 0 },
    { title: "Low Stock Alert", message: "Organic Coconut Milk at Northern Distribution Center is at 8 units (reorder: 80) — CRITICAL.", type: NotificationType.LOW_STOCK, userId: staffHN.id, daysOffset: 0 },
    { title: "Low Stock Alert", message: "Halal Garam Masala Blend at Northern Distribution Center is at 33 units (reorder: 50).", type: NotificationType.LOW_STOCK, userId: staffHN.id, daysOffset: 3 },
    { title: "Low Stock Alert", message: "Halal Beef Sausage at Mekong Cold Storage is at 15 units (reorder: 60) — URGENT.", type: NotificationType.LOW_STOCK, userId: staffDN.id, daysOffset: 1 },
    { title: "Shipment Delayed", message: "Shipment TR-HAL-555321 (Istanbul → Hai Phong) is delayed. Was due 2025-09-01.", type: NotificationType.SHIPMENT_DELAYED, userId: manager.id, daysOffset: 15 },
    { title: "Shipment Delayed", message: "Shipment TH-HAL-992880 (Laem Chabang → Da Nang) is delayed. Was due 2026-05-20.", type: NotificationType.SHIPMENT_DELAYED, userId: manager.id, daysOffset: 4 },
    { title: "Shipment In Transit", message: "Shipment MY-HAL-921045 (Port Klang → Cat Lai) is in transit — ETA 2026-06-23.", type: NotificationType.SHIPMENT_DELAYED, userId: staffHCM.id, daysOffset: 0 },
    { title: "Compliance Issue", message: "3 suppliers have expired halal certificates. Compliance score impacted.", type: NotificationType.COMPLIANCE_ISSUE, userId: auditor.id, daysOffset: 2 },
    { title: "Compliance Issue", message: "4 inventory items below reorder level across network.", type: NotificationType.COMPLIANCE_ISSUE, userId: auditor.id, daysOffset: 1 },
    { title: "System Alert", message: "New supplier onboarded: Saigon Halal Processors JSC — certificate verified.", type: NotificationType.SYSTEM, userId: admin.id, daysOffset: 90 },
    { title: "System Alert", message: "Audit log retention policy updated. Logs older than 2 years will be archived.", type: NotificationType.SYSTEM, userId: admin.id, daysOffset: 30 },
    { title: "System Alert", message: "Welcome! HalalChain v2.0 — traceability engine deployment complete.", type: NotificationType.SYSTEM, userId: admin.id, daysOffset: 180 },
    { title: "Shipment Delayed", message: "Shipment MY-HAL-784521 (Port Klang → Cat Lai) still pending — overdue since 2025-06-20.", type: NotificationType.SHIPMENT_DELAYED, userId: admin.id, daysOffset: 10 },
    { title: "Shipment Delayed", message: "Shipment ID-HAL-992103 (Jakarta → Cat Lai) still pending — overdue since 2025-06-28.", type: NotificationType.SHIPMENT_DELAYED, userId: manager.id, daysOffset: 8 },
  ];

  for (const n of notificationDefs) {
    await prisma.notification.create({
      data: {
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.daysOffset > 7,
        createdAt: daysAgo(n.daysOffset),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 12. AUDIT LOGS (25+ — compliance trail)
  // ═══════════════════════════════════════════════════════════
  const auditDefs = [
    { action: AuditAction.CREATE, entityType: "product", entityId: "HAL-COCO-001", userId: admin.id, daysOffset: 400, newData: { name: "Organic Coconut Milk", sku: "HAL-COCO-001" } },
    { action: AuditAction.CREATE, entityType: "product", entityId: "HAL-LAMB-008", userId: admin.id, daysOffset: 350, newData: { name: "Australian Halal Lamb Shoulder", sku: "HAL-LAMB-008" } },
    { action: AuditAction.CREATE, entityType: "supplier", entityId: supplierAU.id, userId: admin.id, daysOffset: 360, newData: { name: "Australian Halal Meats Pty Ltd", country: "Australia" } },
    { action: AuditAction.CREATE, entityType: "supplier", entityId: supplierTR.id, userId: admin.id, daysOffset: 340, newData: { name: "Anatolia Halal Exporters Ltd", country: "Turkey" } },
    { action: AuditAction.STATUS_CHANGE, entityType: "purchase_order", entityId: "PO-2025-0001", userId: manager.id, daysOffset: 380, oldData: { status: "DRAFT" }, newData: { status: "APPROVED" } },
    { action: AuditAction.STATUS_CHANGE, entityType: "purchase_order", entityId: "PO-2025-0001", userId: manager.id, daysOffset: 375, oldData: { status: "APPROVED" }, newData: { status: "SHIPPING" } },
    { action: AuditAction.STATUS_CHANGE, entityType: "purchase_order", entityId: "PO-2025-0003", userId: manager.id, daysOffset: 340, oldData: { status: "SHIPPING" }, newData: { status: "RECEIVED" } },
    { action: AuditAction.STATUS_CHANGE, entityType: "purchase_order", entityId: "PO-2025-0006", userId: manager.id, daysOffset: 330, oldData: { status: "DRAFT" }, newData: { status: "CANCELLED" } },
    { action: AuditAction.STATUS_CHANGE, entityType: "shipment", entityId: "MY-HAL-603217", userId: staffHCM.id, daysOffset: 290, oldData: { status: "IN_TRANSIT" }, newData: { status: "DELIVERED" } },
    { action: AuditAction.STATUS_CHANGE, entityType: "shipment", entityId: "TH-HAL-441002", userId: staffHN.id, daysOffset: 310, oldData: { status: "IN_TRANSIT" }, newData: { status: "DELIVERED" } },
    { action: AuditAction.UPDATE, entityType: "inventory", entityId: "HAL-CHKN-004-HCM", userId: staffHCM.id, daysOffset: 230, oldData: { quantity: 355 }, newData: { quantity: 55 } },
    { action: AuditAction.UPDATE, entityType: "inventory", entityId: "HAL-COCO-001-HN", userId: staffHN.id, daysOffset: 130, oldData: { quantity: 50 }, newData: { quantity: 8 } },
    { action: AuditAction.CREATE, entityType: "certificate", entityId: "JAKIM-2026-00891", userId: admin.id, daysOffset: 120, newData: { certificateNumber: "JAKIM-2026-00891", supplier: "Halal Foods Malaysia" } },
    { action: AuditAction.CREATE, entityType: "certificate", entityId: "HCV-VN-2026-0088", userId: admin.id, daysOffset: 100, newData: { certificateNumber: "HCV-VN-2026-0088", supplier: "Saigon Halal Processors" } },
    { action: AuditAction.STATUS_CHANGE, entityType: "user", entityId: "intern@halalchain.com", userId: admin.id, daysOffset: 60, oldData: { status: "ACTIVE" }, newData: { status: "SUSPENDED" } },
    { action: AuditAction.UPDATE, entityType: "product", entityId: "HAL-FISH-012", userId: manager.id, daysOffset: 95, oldData: { unitPrice: 6.8 }, newData: { unitPrice: 7.5 } },
    { action: AuditAction.STATUS_CHANGE, entityType: "purchase_order", entityId: "PO-2026-0014", userId: manager.id, daysOffset: 30, oldData: { status: "SHIPPING" }, newData: { status: "PARTIAL" } },
    { action: AuditAction.STATUS_CHANGE, entityType: "purchase_order", entityId: "PO-2026-0020", userId: manager.id, daysOffset: 20, oldData: { status: "APPROVED" }, newData: { status: "CANCELLED" } },
    { action: AuditAction.CREATE, entityType: "warehouse", entityId: whCT.id, userId: admin.id, daysOffset: 200, newData: { name: "Mekong Cold Storage", location: "Binh Thuy, Can Tho" } },
    { action: AuditAction.CREATE, entityType: "warehouse", entityId: whHP.id, userId: admin.id, daysOffset: 190, newData: { name: "Hai Phong Port Warehouse", location: "Dinh Vu, Hai Phong" } },
    { action: AuditAction.STATUS_CHANGE, entityType: "shipment", entityId: "AU-HAL-770122", userId: staffHCM.id, daysOffset: 280, oldData: { status: "IN_TRANSIT" }, newData: { status: "DELIVERED" } },
    { action: AuditAction.STATUS_CHANGE, entityType: "shipment", entityId: "AE-HAL-443211", userId: staffHN.id, daysOffset: 200, oldData: { status: "IN_TRANSIT" }, newData: { status: "DELIVERED" } },
    { action: AuditAction.CREATE, entityType: "purchase_order", entityId: "PO-2026-0019", userId: manager.id, daysOffset: 1, newData: { poNumber: "PO-2026-0019", supplier: "Anatolia Halal Exporters" } },
    { action: AuditAction.UPDATE, entityType: "notification_preference", entityId: admin.id, userId: admin.id, daysOffset: 180, oldData: {}, newData: { certificateAlerts: true, inventoryAlerts: true, shipmentAlerts: true } },
    { action: AuditAction.CREATE, entityType: "user", entityId: "quality@halalchain.com", userId: admin.id, daysOffset: 150, newData: { name: "Pham Thanh Binh", role: "STAFF" } },
  ];

  for (const a of auditDefs) {
    await prisma.auditLog.create({
      data: {
        userId: a.userId,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        oldData: a.oldData || undefined,
        newData: a.newData || undefined,
        createdAt: daysAgo(a.daysOffset),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 13. VERIFICATION SUMMARY
  // ═══════════════════════════════════════════════════════════
  const userList = [admin, manager, auditor, staffHCM, staffHN, staffDN, staffQuality, suspendedUser];
  const supplierList = [supplierMY, supplierID, supplierTH, supplierSG, supplierAE, supplierAU, supplierTR, supplierPK, supplierIN, supplierVN];
  const warehouseList = [whHCM, whHN, whDN, whCT, whHP];

  console.log("=".repeat(65));
  console.log("🌟  HalalChain Showcase Seed Completed");
  console.log("=".repeat(65));
  console.log(`  📅  Reference date:       ${NOW.toISOString().split("T")[0]}`);
  console.log(`  👥  Users:                ${userList.length} (${userList.filter(u => u.status === "ACTIVE").length} active, 1 suspended)`);
  console.log(`  🏭  Suppliers:            ${supplierList.length} (${supplierList.filter(s => s.status === "ACTIVE").length} active)`);
  console.log(`  📜  Certificates:         16 (10 valid, 3 expiring, 3 expired)`);
  console.log(`  🏬  Warehouses:           ${warehouseList.length}`);
  console.log(`  📦  Products:             20`);
  console.log(`  📋  Inventory Records:    35`);
  console.log(`  🛒  Purchase Orders:      20`);
  console.log(`  📝  PO Line Items:        32`);
  console.log(`  🚢  Shipments:            16`);
  console.log(`  🔄  Inventory Movements:  ${movementDefs.length}`);
  console.log(`  🔔  Notifications:        ${notificationDefs.length}`);
  console.log(`  📊  Audit Logs:           ${auditDefs.length}`);
  console.log("-".repeat(65));
  console.log("🔍  AUTOMATION TRIGGERS ACTIVE:");
  console.log("  Rule 1 (Cert Expiring):   3 certificates expiring within 30 days");
  console.log("  Rule 2 (Cert Expired):    3 expired certificates");
  console.log("  Rule 3 (Low Stock):       4 items below reorder level");
  console.log("  Rule 4 (Shipment Delay):  5 shipments past estimated arrival");
  console.log("-".repeat(65));
  console.log("🔑  LOGIN CREDENTIALS:");
  console.log("  Email:    admin@halalchain.com");
  console.log("  Password: Admin@123");
  console.log("  (All seeded users use the same password)");
  console.log("=".repeat(65));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });