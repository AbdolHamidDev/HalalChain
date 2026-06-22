import {
  PrismaClient,
  PurchaseOrderStatus,
  ShipmentStatus,
  UserRole,
  InventoryMovementType,
  NotificationType,
  AuditAction,
  ZoneType,
  BatchLotStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

// Declare process for TypeScript compatibility in seed script
declare const process: {
  env: {
    SEED_PASSWORD?: string;
  };
  exit(code: number): never;
};

const prisma = new PrismaClient();

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

async function main() {
  // Require SEED_PASSWORD environment variable
  const seedPassword = process.env.SEED_PASSWORD;
  
  if (!seedPassword) {
    throw new Error(
      "SEED_PASSWORD environment variable is required. " +
      "Set it in backend/.env or pass it when running: " +
      "SEED_PASSWORD=your-secure-password npm run db:seed"
    );
  }
  
  const passwordHash = await bcrypt.hash(seedPassword, 12);

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
      address: "Lot 12, Jalan Halal, Shah Alam, Selangor",
      website: "https://halalfoods.my",
      taxId: "MY-198765-X",
      status: "ACTIVE",
      complianceScore: 92,
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
      address: "Jl. Halal No. 45, Jakarta Pusat",
      website: "https://nusantaraindonesia.id",
      taxId: "ID-8854331-0",
      status: "ACTIVE",
      complianceScore: 78,
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
      address: "888/99 Rama IV Road, Bangkok 10110",
      website: "https://siamhalal.co.th",
      taxId: "TH-0105558123456",
      status: "ACTIVE",
      complianceScore: 85,
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
      address: "12 Halal Crescent, Singapore 409876",
      website: "https://muisfoods.sg",
      taxId: "SG-202000123Z",
      status: "ACTIVE",
      complianceScore: 95,
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
      address: "Plot 56, Jebel Ali Industrial Area, Dubai",
      website: "https://emirateshalal.ae",
      taxId: "AE-1234567",
      status: "ACTIVE",
      complianceScore: 88,
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
      address: "77 Meat Processing Way, Sunshine, VIC 3020",
      website: "https://aushalalmeats.com.au",
      taxId: "ABN-98765432101",
      status: "ACTIVE",
      complianceScore: 96,
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
      address: "Organize Sanayi Bölgesi, Konya",
      website: "https://anatoliahalal.com.tr",
      taxId: "TR-1234567890",
      status: "ACTIVE",
      complianceScore: 91,
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
      address: "Block 7, Saddar, Karachi 74400",
      website: "https://karachihalal.pk",
      taxId: "PK-1234567-8",
      status: "ACTIVE",
      complianceScore: 82,
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
      address: "Plot 88, Industrial Area, Hyderabad 500032",
      website: "https://hyderabadorganic.in",
      taxId: "IN-36AABCU9603R1ZL",
      status: "ACTIVE",
      complianceScore: 70,
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
      address: "123 Nguyen Van Linh, District 7, HCMC",
      website: "https://saigonhalal.vn",
      taxId: "VN-0312345678",
      status: "ACTIVE",
      complianceScore: 90,
    },
  });

  // ─── Supplier Contacts ────────────────────────────────────
  const contactDefs = [
    { supplierId: supplierMY.id, name: "Ahmad bin Ismail", role: "Sales Director", email: "ahmad@halalfoods.my", phone: "+60-12-345-6789", isPrimary: true },
    { supplierId: supplierMY.id, name: "Siti Nurhaliza", role: "QA Manager", email: "siti@halalfoods.my", phone: "+60-12-345-6790", isPrimary: false },
    { supplierId: supplierID.id, name: "Budi Santoso", role: "Export Manager", email: "budi@nusantara.id", phone: "+62-811-222-3333", isPrimary: true },
    { supplierId: supplierID.id, name: "Dewi Lestari", role: "Halal Auditor", email: "dewi@nusantara.id", phone: "+62-811-222-3334", isPrimary: false },
    { supplierId: supplierTH.id, name: "Somchai Wong", role: "Operations Head", email: "somchai@siamhalal.co.th", phone: "+66-81-888-7766", isPrimary: true },
    { supplierId: supplierSG.id, name: "Lim Keng Soon", role: "Trade Director", email: "lim@muisfoods.sg", phone: "+65-9123-4567", isPrimary: true },
    { supplierId: supplierAE.id, name: "Khalid Al-Mansoori", role: "Export Director", email: "khalid@emirateshalal.ae", phone: "+971-50-123-4567", isPrimary: true },
    { supplierId: supplierAU.id, name: "John Patterson", role: "Sales & Logistics", email: "john@aushalalmeats.com.au", phone: "+61-4-1111-2233", isPrimary: true },
    { supplierId: supplierAU.id, name: "Sarah Mitchell", role: "Quality Assurance", email: "sarah@aushalalmeats.com.au", phone: "+61-4-1111-2244", isPrimary: false },
    { supplierId: supplierTR.id, name: "Mehmet Yilmaz", role: "Export Coordinator", email: "mehmet@anatoliahalal.com.tr", phone: "+90-532-111-2233", isPrimary: true },
    { supplierId: supplierPK.id, name: "Ali Raza", role: "Managing Director", email: "ali@karachihalal.pk", phone: "+92-300-222-3344", isPrimary: true },
    { supplierId: supplierIN.id, name: "Rajesh Kumar", role: "Export Manager", email: "rajesh@hyderabadorganic.in", phone: "+91-984-802-2334", isPrimary: true },
    { supplierId: supplierVN.id, name: "Tran Van An", role: "CEO", email: "tranvanan@saigonhalal.vn", phone: "+84-90-399-1111", isPrimary: true },
  ];
  for (const c of contactDefs) {
    await prisma.supplierContact.create({ data: c });
  }

  // ═══════════════════════════════════════════════════════════
  // 3. HALAL CERTIFICATES (16 — valid, expiring soon, expired)
  // ═══════════════════════════════════════════════════════════
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

  const certExpiring1 = await prisma.halalCertificate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000104" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000104",
      supplierId: supplierSG.id,
      certificateNumber: "MUIS-SG-2026-003",
      issuedBy: "MUIS",
      issueDate: new Date("2025-09-01"),
      expiryDate: daysFromNow(12),
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
      expiryDate: daysFromNow(25),
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
      expiryDate: daysFromNow(7),
    },
  });

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
  // 4. WAREHOUSES (5 across Vietnam) + ZONES
  // ═══════════════════════════════════════════════════════════
  const whHCM = await prisma.warehouse.upsert({
    where: { id: "00000000-0000-4000-8000-000000000201" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000201",
      name: "HCM Logistics Hub",
      location: "District 9, Ho Chi Minh City",
      address: "789 Nguyen Duy Trinh, District 9, HCMC",
      capacity: 50000,
    },
  });

  const whHN = await prisma.warehouse.upsert({
    where: { id: "00000000-0000-4000-8000-000000000202" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000202",
      name: "Northern Distribution Center",
      location: "Gia Lam, Hanoi",
      address: "Lot D3, Gia Lam Industrial Park, Hanoi",
      capacity: 35000,
    },
  });

  const whDN = await prisma.warehouse.upsert({
    where: { id: "00000000-0000-4000-8000-000000000203" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000203",
      name: "Da Nang Transit Depot",
      location: "Lien Chieu, Da Nang",
      address: "55 Nguyen Tat Thanh, Lien Chieu, Da Nang",
      capacity: 20000,
    },
  });

  const whCT = await prisma.warehouse.upsert({
    where: { id: "00000000-0000-4000-8000-000000000204" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000204",
      name: "Mekong Cold Storage",
      location: "Binh Thuy, Can Tho",
      address: "220 Vo Van Kiet, Binh Thuy, Can Tho",
      capacity: 15000,
    },
  });

  const whHP = await prisma.warehouse.upsert({
    where: { id: "00000000-0000-4000-8000-000000000205" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000205",
      name: "Hai Phong Port Warehouse",
      location: "Dinh Vu, Hai Phong",
      address: "Zone B, Dinh Vu Industrial Park, Hai Phong",
      capacity: 40000,
    },
  });

  // ─── Warehouse Zones ──────────────────────────────────────
  const zoneDefs = [
    { warehouseId: whHCM.id, name: "Dry Goods A", zoneType: "GENERAL" as ZoneType, capacity: 20000 },
    { warehouseId: whHCM.id, name: "Cold Storage B", zoneType: "COLD_STORAGE" as ZoneType, capacity: 8000 },
    { warehouseId: whHCM.id, name: "Quarantine Zone", zoneType: "QUARANTINE" as ZoneType, capacity: 2000 },
    { warehouseId: whHN.id, name: "General Storage A", zoneType: "GENERAL" as ZoneType, capacity: 15000 },
    { warehouseId: whHN.id, name: "Cold Storage B", zoneType: "COLD_STORAGE" as ZoneType, capacity: 5000 },
    { warehouseId: whDN.id, name: "Transit Zone", zoneType: "GENERAL" as ZoneType, capacity: 10000 },
    { warehouseId: whDN.id, name: "Returns Section", zoneType: "RETURNS" as ZoneType, capacity: 2000 },
    { warehouseId: whCT.id, name: "Main Cold Room 1", zoneType: "COLD_STORAGE" as ZoneType, capacity: 8000 },
    { warehouseId: whCT.id, name: "Hazmat Storage", zoneType: "HAZMAT" as ZoneType, capacity: 1000 },
    { warehouseId: whHP.id, name: "Import Zone A", zoneType: "GENERAL" as ZoneType, capacity: 20000 },
    { warehouseId: whHP.id, name: "Export Zone B", zoneType: "GENERAL" as ZoneType, capacity: 15000 },
  ];
  const zones: Record<string, any> = {};
  for (const z of zoneDefs) {
    const created = await prisma.warehouseZone.create({ data: z });
    zones[`${z.warehouseId}-${z.name}`] = created;
  }

  // ═══════════════════════════════════════════════════════════
  // 5. TAGS (product taxonomy)
  // ═══════════════════════════════════════════════════════════
  const tagDefs = [
    { name: "Organic", color: "#10B981" },
    { name: "Premium", color: "#F59E0B" },
    { name: "Cold Chain", color: "#3B82F6" },
    { name: "Export", color: "#8B5CF6" },
    { name: "Local", color: "#EC4899" },
    { name: "Bulk", color: "#6366F1" },
    { name: "Retail", color: "#14B8A6" },
    { name: "Certified", color: "#22C55E" },
  ];
  const tags: Record<string, any> = {};
  for (const t of tagDefs) {
    tags[t.name] = await prisma.tag.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 6. PRODUCTS (20 — diverse categories)
  // ═══════════════════════════════════════════════════════════
  const productsData = [
    { sku: "HAL-COCO-001", supplierId: supplierMY.id, name: "Organic Coconut Milk", category: "Beverages", unit: "carton", unitPrice: 12.5, description: "Premium organic coconut milk, 12x400ml cartons", weightKg: 4.8, barcode: "8991234567890" },
    { sku: "HAL-BEEF-002", supplierId: supplierID.id, name: "Premium Halal Beef Rendang Paste", category: "Condiments", unit: "jar", unitPrice: 8.75, description: "Authentic rendang paste, 500g jar", weightKg: 0.5, barcode: "8991234567891" },
    { sku: "HAL-RICE-003", supplierId: supplierTH.id, name: "Jasmine Halal Rice 25kg", category: "Grains", unit: "bag", unitPrice: 22.0, description: "Premium Thai jasmine halal-certified rice", weightKg: 25.0, barcode: "8991234567892" },
    { sku: "HAL-CHKN-004", supplierId: supplierMY.id, name: "Frozen Halal Whole Chicken", category: "Meat & Poultry", unit: "kg", unitPrice: 6.3, description: "Whole chicken, halal slaughtered, frozen", weightKg: 1.5, barcode: "8991234567893" },
    { sku: "HAL-SOY-005", supplierId: supplierSG.id, name: "Halal Soy Sauce 5L", category: "Condiments", unit: "bottle", unitPrice: 14.0, description: "Premium soy sauce, 5L foodservice bottle", weightKg: 5.2, barcode: "8991234567894" },
    { sku: "HAL-DATE-006", supplierId: supplierID.id, name: "Medjool Dates 1kg Box", category: "Snacks & Dried Fruit", unit: "box", unitPrice: 18.5, description: "Premium Medjool dates, 1kg gift box", weightKg: 1.0, barcode: "8991234567895" },
    { sku: "HAL-CURR-007", supplierId: supplierTH.id, name: "Halal Green Curry Paste", category: "Condiments", unit: "tub", unitPrice: 5.5, description: "Authentic Thai green curry paste, 400g tub", weightKg: 0.4, barcode: "8991234567896" },
    { sku: "HAL-LAMB-008", supplierId: supplierAU.id, name: "Australian Halal Lamb Shoulder", category: "Meat & Poultry", unit: "kg", unitPrice: 16.8, description: "Premium grass-fed lamb shoulder, halal", weightKg: 2.0, barcode: "8991234567897" },
    { sku: "HAL-OLIV-009", supplierId: supplierTR.id, name: "Extra Virgin Olive Oil 2L", category: "Oils & Fats", unit: "bottle", unitPrice: 19.9, description: "Cold-pressed extra virgin olive oil, 2L tin", weightKg: 1.8, barcode: "8991234567898" },
    { sku: "HAL-SPIC-010", supplierId: supplierPK.id, name: "Halal Garam Masala Blend 500g", category: "Spices & Seasoning", unit: "pack", unitPrice: 9.2, description: "Premium garam masala spice blend, 500g pack", weightKg: 0.5, barcode: "8991234567899" },
    { sku: "HAL-BASM-011", supplierId: supplierIN.id, name: "Premium Basmati Rice 10kg", category: "Grains", unit: "bag", unitPrice: 25.0, description: "Aged premium basmati rice, 10kg bag", weightKg: 10.0, barcode: "8991234567900" },
    { sku: "HAL-FISH-012", supplierId: supplierVN.id, name: "Halal Certified Frozen Pangasius Fillet", category: "Seafood", unit: "kg", unitPrice: 7.5, description: "Pangasius fillet, halal certified, IQF frozen", weightKg: 1.0, barcode: "8991234567901" },
    { sku: "HAL-HONE-013", supplierId: supplierAE.id, name: "Sidr Honey 500g Jar", category: "Sweeteners & Spreads", unit: "jar", unitPrice: 28.0, description: "Premium Yemeni Sidr honey, 500g glass jar", weightKg: 0.5, barcode: "8991234567902" },
    { sku: "HAL-CHOC-014", supplierId: supplierMY.id, name: "Halal Dark Chocolate Couverture 1kg", category: "Confectionery", unit: "block", unitPrice: 15.3, description: "Belgian-style dark chocolate, halal certified, 1kg block", weightKg: 1.0, barcode: "8991234567903" },
    { sku: "HAL-NOOD-015", supplierId: supplierTH.id, name: "Halal Instant Rice Noodles 200g", category: "Noodles & Pasta", unit: "pack", unitPrice: 2.8, description: "Instant rice noodles, 200g pack, halal", weightKg: 0.2, barcode: "8991234567904" },
    { sku: "HAL-CANN-016", supplierId: supplierSG.id, name: "Canned Halal Chicken Luncheon 340g", category: "Canned Foods", unit: "can", unitPrice: 4.5, description: "Chicken luncheon meat, halal certified, 340g can", weightKg: 0.34, barcode: "8991234567905" },
    { sku: "HAL-CHEE-017", supplierId: supplierAU.id, name: "Australian Halal Cheddar Block 2kg", category: "Dairy", unit: "block", unitPrice: 22.0, description: "Mature cheddar, halal certified, 2kg block", weightKg: 2.0, barcode: "8991234567906" },
    { sku: "HAL-FLOU-018", supplierId: supplierIN.id, name: "Organic Whole Wheat Atta 5kg", category: "Grains & Flours", unit: "bag", unitPrice: 8.0, description: "Stone-ground whole wheat flour, organic, 5kg", weightKg: 5.0, barcode: "8991234567907" },
    { sku: "HAL-SAUS-019", supplierId: supplierTR.id, name: "Halal Beef Sausage Frankfurt 500g", category: "Processed Meat", unit: "pack", unitPrice: 6.9, description: "Beef frankfurt sausages, halal, 500g pack", weightKg: 0.5, barcode: "8991234567908" },
    { sku: "HAL-SNAC-020", supplierId: supplierPK.id, name: "Halal Fruit & Nut Mix 300g", category: "Snacks & Dried Fruit", unit: "pack", unitPrice: 7.4, description: "Premium fruit & nut mix, halal, 300g pack", weightKg: 0.3, barcode: "8991234567909" },
  ];

  const products: Record<string, Awaited<ReturnType<typeof prisma.product.upsert>>> = {};
  for (const p of productsData) {
    products[p.sku] = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  // ─── Product Versions ─────────────────────────────────────
  for (const [sku, product] of Object.entries(products)) {
    await prisma.productVersion.create({
      data: {
        productId: product.id,
        version: 1,
        name: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit,
        unitPrice: product.unitPrice,
        description: productsData.find(p => p.sku === sku)?.description ?? null,
        changedBy: admin.id,
        changeNote: "Initial product creation",
        createdAt: daysAgo(400),
      },
    });
  }

  // ─── Product Tags ─────────────────────────────────────────
  const productTagDefs = [
    { sku: "HAL-COCO-001", tagName: "Organic" },
    { sku: "HAL-COCO-001", tagName: "Certified" },
    { sku: "HAL-BEEF-002", tagName: "Premium" },
    { sku: "HAL-RICE-003", tagName: "Bulk" },
    { sku: "HAL-CHKN-004", tagName: "Cold Chain" },
    { sku: "HAL-SOY-005", tagName: "Retail" },
    { sku: "HAL-DATE-006", tagName: "Premium" },
    { sku: "HAL-LAMB-008", tagName: "Premium" },
    { sku: "HAL-LAMB-008", tagName: "Cold Chain" },
    { sku: "HAL-OLIV-009", tagName: "Premium" },
    { sku: "HAL-SPIC-010", tagName: "Export" },
    { sku: "HAL-BASM-011", tagName: "Premium" },
    { sku: "HAL-BASM-011", tagName: "Export" },
    { sku: "HAL-FISH-012", tagName: "Export" },
    { sku: "HAL-HONE-013", tagName: "Premium" },
    { sku: "HAL-CHOC-014", tagName: "Retail" },
    { sku: "HAL-CHEE-017", tagName: "Cold Chain" },
    { sku: "HAL-FLOU-018", tagName: "Organic" },
    { sku: "HAL-FLOU-018", tagName: "Bulk" },
    { sku: "HAL-SAUS-019", tagName: "Cold Chain" },
    { sku: "HAL-SAUS-019", tagName: "Local" },
  ];
  for (const pt of productTagDefs) {
    await prisma.productTag.create({
      data: {
        productId: products[pt.sku].id,
        tagId: tags[pt.tagName].id,
      },
    });
  }

  // ─── Supplier Products (M:N multi-sourcing) ───────────────
  const spDefs = [
    { supplierId: supplierMY.id, sku: "HAL-COCO-001", supplierSku: "MY-COCO-001", unitCost: 9.5, leadTimeDays: 7, moq: 200, isPreferred: true },
    { supplierId: supplierID.id, sku: "HAL-COCO-001", supplierSku: "ID-COCO-001", unitCost: 8.8, leadTimeDays: 10, moq: 300, isPreferred: false },
    { supplierId: supplierID.id, sku: "HAL-BEEF-002", supplierSku: "ID-BEEF-002", unitCost: 6.2, leadTimeDays: 5, moq: 100, isPreferred: true },
    { supplierId: supplierTH.id, sku: "HAL-RICE-003", supplierSku: "TH-RICE-003", unitCost: 16.5, leadTimeDays: 14, moq: 100, isPreferred: true },
    { supplierId: supplierVN.id, sku: "HAL-RICE-003", supplierSku: "VN-RICE-003", unitCost: 15.8, leadTimeDays: 3, moq: 200, isPreferred: false },
    { supplierId: supplierAU.id, sku: "HAL-LAMB-008", supplierSku: "AU-LAMB-008", unitCost: 11.5, leadTimeDays: 21, moq: 500, isPreferred: true },
    { supplierId: supplierPK.id, sku: "HAL-SPIC-010", supplierSku: "PK-SPIC-010", unitCost: 6.0, leadTimeDays: 12, moq: 200, isPreferred: true },
    { supplierId: supplierIN.id, sku: "HAL-BASM-011", supplierSku: "IN-BASM-011", unitCost: 18.0, leadTimeDays: 10, moq: 200, isPreferred: true },
    { supplierId: supplierTR.id, sku: "HAL-OLIV-009", supplierSku: "TR-OLIV-009", unitCost: 14.5, leadTimeDays: 16, moq: 150, isPreferred: true },
    { supplierId: supplierAE.id, sku: "HAL-HONE-013", supplierSku: "AE-HONE-013", unitCost: 19.0, leadTimeDays: 12, moq: 100, isPreferred: true },
  ];
  for (const sp of spDefs) {
    const created = await prisma.supplierProduct.create({
      data: {
        supplierId: sp.supplierId,
        productId: products[sp.sku].id,
        supplierSku: sp.supplierSku,
        unitCost: sp.unitCost,
        leadTimeDays: sp.leadTimeDays,
        moq: sp.moq,
        isPreferred: sp.isPreferred,
      },
    });
    // Create initial price history entry
    await prisma.supplierProductPriceHistory.create({
      data: {
        supplierProductId: created.id,
        unitCost: sp.unitCost,
        effectiveFrom: daysAgo(365),
        changedBy: admin.id,
      },
    });
  }

  // ─── Product Certifications (M:N certificate ↔ product) ──
  const productCertDefs = [
    { sku: "HAL-CHKN-004", certId: "00000000-0000-4000-8000-000000000101", scope: "slaughtering" },
    { sku: "HAL-CHKN-004", certId: "00000000-0000-4000-8000-000000000108", scope: "processing" },
    { sku: "HAL-COCO-001", certId: "00000000-0000-4000-8000-000000000108", scope: "manufacturing" },
    { sku: "HAL-BEEF-002", certId: "00000000-0000-4000-8000-000000000102", scope: "manufacturing" },
    { sku: "HAL-RICE-003", certId: "00000000-0000-4000-8000-000000000103", scope: "packaging" },
    { sku: "HAL-LAMB-008", certId: "00000000-0000-4000-8000-000000000109", scope: "slaughtering" },
    { sku: "HAL-LAMB-008", certId: "00000000-0000-4000-8000-000000000108", scope: "processing" },
    { sku: "HAL-FISH-012", certId: "00000000-0000-4000-8000-000000000115", scope: "processing" },
    { sku: "HAL-HONE-013", certId: "00000000-0000-4000-8000-000000000106", scope: "processing" },
    { sku: "HAL-HONE-013", certId: "00000000-0000-4000-8000-000000000114", scope: "packaging" },
  ];
  for (const pc of productCertDefs) {
    await prisma.productCertification.create({
      data: {
        productId: products[pc.sku].id,
        halalCertificateId: pc.certId,
        scope: pc.scope,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 7. INVENTORY (35 records — with zone assignments)
  // ═══════════════════════════════════════════════════════════
  const invRecs = [
    { p: "HAL-COCO-001", w: whHCM, zoneKey: `${whHCM.id}-Dry Goods A`, qty: 420, ro: 100, ml: 800 },
    { p: "HAL-BEEF-002", w: whHCM, zoneKey: `${whHCM.id}-Dry Goods A`, qty: 310, ro: 80, ml: 600 },
    { p: "HAL-CHKN-004", w: whHCM, zoneKey: `${whHCM.id}-Cold Storage B`, qty: 55, ro: 100, ml: 400 },
    { p: "HAL-DATE-006", w: whHCM, zoneKey: `${whHCM.id}-Dry Goods A`, qty: 88, ro: 40, ml: 300 },
    { p: "HAL-LAMB-008", w: whHCM, zoneKey: `${whHCM.id}-Cold Storage B`, qty: 145, ro: 50, ml: 400 },
    { p: "HAL-BASM-011", w: whHCM, zoneKey: `${whHCM.id}-Dry Goods A`, qty: 200, ro: 60, ml: 500 },
    { p: "HAL-CHOC-014", w: whHCM, zoneKey: `${whHCM.id}-Dry Goods A`, qty: 75, ro: 30, ml: 200 },
    { p: "HAL-SNAC-020", w: whHCM, zoneKey: `${whHCM.id}-Dry Goods A`, qty: 180, ro: 50, ml: 400 },
    { p: "HAL-RICE-003", w: whHN, zoneKey: `${whHN.id}-General Storage A`, qty: 155, ro: 50, ml: 400 },
    { p: "HAL-SOY-005", w: whHN, zoneKey: `${whHN.id}-General Storage A`, qty: 230, ro: 60, ml: 500 },
    { p: "HAL-COCO-001", w: whHN, zoneKey: `${whHN.id}-General Storage A`, qty: 8, ro: 80, ml: 300 },
    { p: "HAL-CURR-007", w: whHN, zoneKey: `${whHN.id}-General Storage A`, qty: 95, ro: 30, ml: 200 },
    { p: "HAL-NOOD-015", w: whHN, zoneKey: `${whHN.id}-General Storage A`, qty: 420, ro: 100, ml: 800 },
    { p: "HAL-FLOU-018", w: whHN, zoneKey: `${whHN.id}-General Storage A`, qty: 60, ro: 40, ml: 300 },
    { p: "HAL-SPIC-010", w: whHN, zoneKey: `${whHN.id}-General Storage A`, qty: 33, ro: 50, ml: 200 },
    { p: "HAL-CHKN-004", w: whDN, zoneKey: `${whDN.id}-Transit Zone`, qty: 120, ro: 60, ml: 300 },
    { p: "HAL-CURR-007", w: whDN, zoneKey: `${whDN.id}-Transit Zone`, qty: 140, ro: 30, ml: 200 },
    { p: "HAL-RICE-003", w: whDN, zoneKey: `${whDN.id}-Transit Zone`, qty: 185, ro: 50, ml: 400 },
    { p: "HAL-FISH-012", w: whDN, zoneKey: `${whDN.id}-Transit Zone`, qty: 210, ro: 80, ml: 500 },
    { p: "HAL-OLIV-009", w: whDN, zoneKey: `${whDN.id}-Transit Zone`, qty: 40, ro: 25, ml: 100 },
    { p: "HAL-CANN-016", w: whDN, zoneKey: `${whDN.id}-Transit Zone`, qty: 560, ro: 150, ml: 1000 },
    { p: "HAL-FISH-012", w: whCT, zoneKey: `${whCT.id}-Main Cold Room 1`, qty: 350, ro: 100, ml: 600 },
    { p: "HAL-CHKN-004", w: whCT, zoneKey: `${whCT.id}-Main Cold Room 1`, qty: 280, ro: 80, ml: 500 },
    { p: "HAL-LAMB-008", w: whCT, zoneKey: `${whCT.id}-Main Cold Room 1`, qty: 90, ro: 40, ml: 300 },
    { p: "HAL-SAUS-019", w: whCT, zoneKey: `${whCT.id}-Main Cold Room 1`, qty: 15, ro: 60, ml: 200 },
    { p: "HAL-CHEE-017", w: whCT, zoneKey: `${whCT.id}-Main Cold Room 1`, qty: 55, ro: 30, ml: 150 },
    { p: "HAL-CHOC-014", w: whCT, zoneKey: `${whCT.id}-Main Cold Room 1`, qty: 40, ro: 25, ml: 150 },
    { p: "HAL-BASM-011", w: whHP, zoneKey: `${whHP.id}-Import Zone A`, qty: 320, ro: 80, ml: 600 },
    { p: "HAL-HONE-013", w: whHP, zoneKey: `${whHP.id}-Import Zone A`, qty: 65, ro: 30, ml: 150 },
    { p: "HAL-OLIV-009", w: whHP, zoneKey: `${whHP.id}-Import Zone A`, qty: 78, ro: 30, ml: 200 },
    { p: "HAL-SOY-005", w: whHP, zoneKey: `${whHP.id}-Import Zone A`, qty: 145, ro: 50, ml: 300 },
    { p: "HAL-DATE-006", w: whHP, zoneKey: `${whHP.id}-Import Zone A`, qty: 110, ro: 40, ml: 250 },
    { p: "HAL-BEEF-002", w: whHP, zoneKey: `${whHP.id}-Import Zone A`, qty: 200, ro: 60, ml: 400 },
    { p: "HAL-NOOD-015", w: whHP, zoneKey: `${whHP.id}-Export Zone B`, qty: 310, ro: 100, ml: 600 },
    { p: "HAL-SNAC-020", w: whHP, zoneKey: `${whHP.id}-Export Zone B`, qty: 90, ro: 40, ml: 200 },
    { p: "HAL-FLOU-018", w: whHP, zoneKey: `${whHP.id}-Export Zone B`, qty: 125, ro: 50, ml: 250 },
  ];

  const inventoryRecords: Record<string, any> = {};
  for (const inv of invRecs) {
    const key = `${inv.p}-${inv.w.id}`;
    inventoryRecords[key] = await prisma.inventory.upsert({
      where: { productId_warehouseId: { productId: products[inv.p].id, warehouseId: inv.w.id } },
      update: { quantity: inv.qty, zoneId: zones[inv.zoneKey]?.id ?? null, maxLevel: inv.ml },
      create: {
        productId: products[inv.p].id,
        warehouseId: inv.w.id,
        zoneId: zones[inv.zoneKey]?.id ?? null,
        quantity: inv.qty,
        reorderLevel: inv.ro,
        maxLevel: inv.ml,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 8. PURCHASE ORDERS (20 — all statuses)
  // ═══════════════════════════════════════════════════════════
  const poDefs = [
    { poNumber: "PO-2025-0001", supplierId: supplierMY.id, status: PurchaseOrderStatus.SHIPPING, totalAmount: 15600, currency: "USD", createdAt: new Date("2025-04-12"), version: 3 },
    { poNumber: "PO-2025-0002", supplierId: supplierID.id, status: PurchaseOrderStatus.APPROVED, totalAmount: 8400, currency: "USD", createdAt: new Date("2025-05-03"), version: 2 },
    { poNumber: "PO-2025-0003", supplierId: supplierTH.id, status: PurchaseOrderStatus.RECEIVED, totalAmount: 11200, currency: "USD", createdAt: new Date("2025-03-18"), version: 2 },
    { poNumber: "PO-2025-0004", supplierId: supplierSG.id, status: PurchaseOrderStatus.DRAFT, totalAmount: 5320, currency: "USD", createdAt: new Date("2025-05-20"), version: 1 },
    { poNumber: "PO-2025-0005", supplierId: supplierMY.id, status: PurchaseOrderStatus.RECEIVED, totalAmount: 9870, currency: "USD", createdAt: new Date("2025-02-10"), version: 2 },
    { poNumber: "PO-2025-0006", supplierId: supplierID.id, status: PurchaseOrderStatus.CANCELLED, totalAmount: 3200, currency: "USD", createdAt: new Date("2025-01-25"), version: 1 },
    { poNumber: "PO-2025-0007", supplierId: supplierAU.id, status: PurchaseOrderStatus.RECEIVED, totalAmount: 18400, currency: "USD", createdAt: new Date("2025-06-01"), version: 2 },
    { poNumber: "PO-2025-0008", supplierId: supplierTR.id, status: PurchaseOrderStatus.SHIPPING, totalAmount: 9200, currency: "USD", createdAt: new Date("2025-07-15"), version: 2 },
    { poNumber: "PO-2025-0009", supplierId: supplierAE.id, status: PurchaseOrderStatus.RECEIVED, totalAmount: 14300, currency: "USD", createdAt: new Date("2025-08-20"), version: 2 },
    { poNumber: "PO-2026-0010", supplierId: supplierPK.id, status: PurchaseOrderStatus.RECEIVED, totalAmount: 6700, currency: "USD", createdAt: new Date("2026-01-05"), version: 2 },
    { poNumber: "PO-2026-0011", supplierId: supplierIN.id, status: PurchaseOrderStatus.APPROVED, totalAmount: 22500, currency: "USD", createdAt: new Date("2026-02-18"), version: 1 },
    { poNumber: "PO-2026-0012", supplierId: supplierVN.id, status: PurchaseOrderStatus.RECEIVED, totalAmount: 8900, currency: "USD", createdAt: new Date("2026-03-10"), version: 2 },
    { poNumber: "PO-2026-0013", supplierId: supplierMY.id, status: PurchaseOrderStatus.SHIPPING, totalAmount: 13200, currency: "USD", createdAt: new Date("2026-04-22"), version: 2 },
    { poNumber: "PO-2026-0014", supplierId: supplierTH.id, status: PurchaseOrderStatus.PARTIAL, totalAmount: 14800, currency: "USD", createdAt: new Date("2026-05-01"), version: 2 },
    { poNumber: "PO-2026-0015", supplierId: supplierSG.id, status: PurchaseOrderStatus.APPROVED, totalAmount: 7600, currency: "USD", createdAt: new Date("2026-05-15"), version: 1 },
    { poNumber: "PO-2026-0016", supplierId: supplierAU.id, status: PurchaseOrderStatus.DRAFT, totalAmount: 19500, currency: "USD", createdAt: new Date("2026-06-01"), version: 1 },
    { poNumber: "PO-2026-0017", supplierId: supplierAE.id, status: PurchaseOrderStatus.SHIPPING, totalAmount: 11000, currency: "USD", createdAt: new Date("2026-06-10"), version: 1 },
    { poNumber: "PO-2026-0018", supplierId: supplierID.id, status: PurchaseOrderStatus.DRAFT, totalAmount: 5100, currency: "USD", createdAt: daysAgo(3), version: 1 },
    { poNumber: "PO-2026-0019", supplierId: supplierTR.id, status: PurchaseOrderStatus.APPROVED, totalAmount: 16300, currency: "USD", createdAt: daysAgo(1), version: 1 },
    { poNumber: "PO-2026-0020", supplierId: supplierVN.id, status: PurchaseOrderStatus.CANCELLED, totalAmount: 4200, currency: "USD", createdAt: new Date("2026-05-28"), version: 2 },
  ];

  const pos: Record<string, Awaited<ReturnType<typeof prisma.purchaseOrder.upsert>>> = {};
  for (const po of poDefs) {
    pos[po.poNumber] = await prisma.purchaseOrder.upsert({
      where: { poNumber: po.poNumber },
      update: {},
      create: po,
    });
  }

  // ─── Purchase Order Approvals ─────────────────────────────
  const poApprovalDefs = [
    { poNum: "PO-2025-0001", approver: manager, fromStatus: PurchaseOrderStatus.DRAFT, toStatus: PurchaseOrderStatus.APPROVED, comment: "Approved — standard terms", daysOffset: 380 },
    { poNum: "PO-2025-0001", approver: manager, fromStatus: PurchaseOrderStatus.APPROVED, toStatus: PurchaseOrderStatus.SHIPPING, comment: "Confirmed shipment from supplier", daysOffset: 375 },
    { poNum: "PO-2025-0002", approver: manager, fromStatus: PurchaseOrderStatus.DRAFT, toStatus: PurchaseOrderStatus.APPROVED, comment: "Approved — quality check passed", daysOffset: 350 },
    { poNum: "PO-2025-0003", approver: manager, fromStatus: PurchaseOrderStatus.DRAFT, toStatus: PurchaseOrderStatus.APPROVED, comment: "Approved", daysOffset: 345 },
    { poNum: "PO-2025-0003", approver: admin, fromStatus: PurchaseOrderStatus.APPROVED, toStatus: PurchaseOrderStatus.SHIPPING, comment: "In transit", daysOffset: 342 },
    { poNum: "PO-2025-0003", approver: admin, fromStatus: PurchaseOrderStatus.SHIPPING, toStatus: PurchaseOrderStatus.RECEIVED, comment: "All items received and inspected", daysOffset: 340 },
    { poNum: "PO-2025-0007", approver: manager, fromStatus: PurchaseOrderStatus.DRAFT, toStatus: PurchaseOrderStatus.APPROVED, comment: "New supplier — due diligence completed", daysOffset: 285 },
    { poNum: "PO-2026-0014", approver: manager, fromStatus: PurchaseOrderStatus.SHIPPING, toStatus: PurchaseOrderStatus.PARTIAL, comment: "Partial delivery received (50%)", daysOffset: 30 },
  ];
  for (const appr of poApprovalDefs) {
    await prisma.purchaseOrderApproval.create({
      data: {
        purchaseOrderId: pos[appr.poNum].id,
        approverId: appr.approver.id,
        fromStatus: appr.fromStatus,
        toStatus: appr.toStatus,
        comment: appr.comment,
        createdAt: daysAgo(appr.daysOffset),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 9. PURCHASE ORDER ITEMS (32 line items)
  // ═══════════════════════════════════════════════════════════
  const poiDefs = [
    { po: "PO-2025-0001", sku: "HAL-COCO-001", qty: 600, up: 12.5, rcv: 600 },
    { po: "PO-2025-0001", sku: "HAL-CHKN-004", qty: 400, up: 6.3, rcv: 400 },
    { po: "PO-2025-0002", sku: "HAL-BEEF-002", qty: 480, up: 8.75, rcv: 480 },
    { po: "PO-2025-0002", sku: "HAL-DATE-006", qty: 200, up: 18.5, rcv: 200 },
    { po: "PO-2025-0003", sku: "HAL-RICE-003", qty: 350, up: 22.0, rcv: 350 },
    { po: "PO-2025-0003", sku: "HAL-CURR-007", qty: 300, up: 5.5, rcv: 300 },
    { po: "PO-2025-0004", sku: "HAL-SOY-005", qty: 200, up: 14.0, rcv: 0 },
    { po: "PO-2025-0005", sku: "HAL-COCO-001", qty: 300, up: 12.5, rcv: 300 },
    { po: "PO-2025-0005", sku: "HAL-CHKN-004", qty: 200, up: 6.3, rcv: 200 },
    { po: "PO-2025-0006", sku: "HAL-DATE-006", qty: 100, up: 18.5, rcv: 0 },
    { po: "PO-2025-0007", sku: "HAL-LAMB-008", qty: 500, up: 16.8, rcv: 500 },
    { po: "PO-2025-0007", sku: "HAL-CHEE-017", qty: 200, up: 22.0, rcv: 200 },
    { po: "PO-2025-0008", sku: "HAL-OLIV-009", qty: 300, up: 19.9, rcv: 300 },
    { po: "PO-2025-0009", sku: "HAL-HONE-013", qty: 350, up: 28.0, rcv: 350 },
    { po: "PO-2026-0010", sku: "HAL-SPIC-010", qty: 400, up: 9.2, rcv: 400 },
    { po: "PO-2026-0010", sku: "HAL-SNAC-020", qty: 250, up: 7.4, rcv: 250 },
    { po: "PO-2026-0011", sku: "HAL-BASM-011", qty: 500, up: 25.0, rcv: 0 },
    { po: "PO-2026-0011", sku: "HAL-FLOU-018", qty: 400, up: 8.0, rcv: 0 },
    { po: "PO-2026-0012", sku: "HAL-FISH-012", qty: 600, up: 7.5, rcv: 600 },
    { po: "PO-2026-0013", sku: "HAL-CHOC-014", qty: 350, up: 15.3, rcv: 350 },
    { po: "PO-2026-0013", sku: "HAL-NOOD-015", qty: 500, up: 2.8, rcv: 500 },
    { po: "PO-2026-0014", sku: "HAL-NOOD-015", qty: 800, up: 2.8, rcv: 400 },
    { po: "PO-2026-0014", sku: "HAL-CURR-007", qty: 400, up: 5.5, rcv: 0 },
    { po: "PO-2026-0015", sku: "HAL-SOY-005", qty: 250, up: 14.0, rcv: 0 },
    { po: "PO-2026-0015", sku: "HAL-CANN-016", qty: 600, up: 4.5, rcv: 0 },
    { po: "PO-2026-0016", sku: "HAL-LAMB-008", qty: 450, up: 16.8, rcv: 0 },
    { po: "PO-2026-0017", sku: "HAL-HONE-013", qty: 200, up: 28.0, rcv: 0 },
    { po: "PO-2026-0017", sku: "HAL-CHOC-014", qty: 150, up: 15.3, rcv: 0 },
    { po: "PO-2026-0018", sku: "HAL-DATE-006", qty: 120, up: 18.5, rcv: 0 },
    { po: "PO-2026-0019", sku: "HAL-SAUS-019", qty: 500, up: 6.9, rcv: 0 },
    { po: "PO-2026-0019", sku: "HAL-OLIV-009", qty: 200, up: 19.9, rcv: 0 },
    { po: "PO-2026-0020", sku: "HAL-FISH-012", qty: 200, up: 7.5, rcv: 0 },
  ];

  const poiRecords: Record<string, any> = {};
  for (const poi of poiDefs) {
    poiRecords[`${poi.po}-${poi.sku}`] = await prisma.purchaseOrderItem.create({
      data: {
        purchaseOrderId: pos[poi.po].id,
        productId: products[poi.sku].id,
        quantity: poi.qty,
        unitPrice: poi.up,
        subtotal: Math.round(poi.qty * poi.up * 100) / 100,
        receivedQty: poi.rcv,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 10. SHIPMENTS (16 — all statuses, some delayed)
  // ═══════════════════════════════════════════════════════════
  const shipmentDefs = [
    { id: "00000000-0000-4000-8000-000000000301", po: "PO-2025-0001", tracking: "MY-HAL-784521", carrier: "Maersk", origin: "Port Klang, Malaysia", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.IN_TRANSIT, estArrival: new Date("2025-06-20"), shippedAt: new Date("2025-06-01") },
    { id: "00000000-0000-4000-8000-000000000302", po: "PO-2025-0002", tracking: "ID-HAL-992103", carrier: "CMA CGM", origin: "Tanjung Priok, Jakarta", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.PENDING, estArrival: new Date("2025-06-28") },
    { id: "00000000-0000-4000-8000-000000000304", po: "PO-2025-0004", tracking: "SG-HAL-110456", carrier: "MSC", origin: "Singapore PSA Port", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.PENDING, estArrival: new Date("2025-07-05") },
    { id: "00000000-0000-4000-8000-000000000306", po: "PO-2025-0008", tracking: "TR-HAL-555321", carrier: "Evergreen", origin: "Istanbul, Turkey", dest: "Hai Phong Port, Vietnam", status: ShipmentStatus.DELAYED, estArrival: new Date("2025-09-01"), shippedAt: new Date("2025-07-25") },
    { id: "00000000-0000-4000-8000-000000000307", po: "PO-2026-0014", tracking: "TH-HAL-992880", carrier: "Yang Ming", origin: "Laem Chabang, Thailand", dest: "Da Nang Port, Vietnam", status: ShipmentStatus.DELAYED, estArrival: new Date("2026-05-20"), shippedAt: new Date("2026-05-08") },
    { id: "00000000-0000-4000-8000-000000000303", po: "PO-2025-0003", tracking: "TH-HAL-441002", carrier: "Maersk", origin: "Laem Chabang, Thailand", dest: "Hai Phong Port, Vietnam", status: ShipmentStatus.DELIVERED, estArrival: new Date("2025-04-05"), shippedAt: new Date("2025-03-20") },
    { id: "00000000-0000-4000-8000-000000000305", po: "PO-2025-0005", tracking: "MY-HAL-603217", carrier: "CMA CGM", origin: "Port Klang, Malaysia", dest: "Hai Phong Port, Vietnam", status: ShipmentStatus.DELIVERED, estArrival: new Date("2025-03-01"), shippedAt: new Date("2025-02-14") },
    { id: "00000000-0000-4000-8000-000000000308", po: "PO-2025-0007", tracking: "AU-HAL-770122", carrier: "Hapag-Lloyd", origin: "Melbourne, Australia", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.DELIVERED, estArrival: new Date("2025-07-01"), shippedAt: new Date("2025-06-10") },
    { id: "00000000-0000-4000-8000-000000000309", po: "PO-2025-0009", tracking: "AE-HAL-443211", carrier: "MSC", origin: "Jebel Ali, UAE", dest: "Hai Phong Port, Vietnam", status: ShipmentStatus.DELIVERED, estArrival: new Date("2025-09-15"), shippedAt: new Date("2025-08-28") },
    { id: "00000000-0000-4000-8000-000000000310", po: "PO-2026-0010", tracking: "PK-HAL-881234", carrier: "COSCO", origin: "Karachi, Pakistan", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.DELIVERED, estArrival: new Date("2026-02-01"), shippedAt: new Date("2026-01-15") },
    { id: "00000000-0000-4000-8000-000000000311", po: "PO-2026-0012", tracking: "VN-HAL-100992", carrier: "Gemalink", origin: "Saigon, Vietnam", dest: "Da Nang Transit Depot", status: ShipmentStatus.DELIVERED, estArrival: new Date("2026-03-20"), shippedAt: new Date("2026-03-14"), deliveredAt: new Date("2026-03-19") },
    { id: "00000000-0000-4000-8000-000000000312", po: "PO-2026-0013", tracking: "MY-HAL-921045", carrier: "Maersk", origin: "Port Klang, Malaysia", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.IN_TRANSIT, estArrival: daysFromNow(5), shippedAt: daysAgo(7) },
    { id: "00000000-0000-4000-8000-000000000313", po: "PO-2026-0017", tracking: "AE-HAL-773344", carrier: "MSC", origin: "Jebel Ali, UAE", dest: "Hai Phong Port, Vietnam", status: ShipmentStatus.IN_TRANSIT, estArrival: daysFromNow(12), shippedAt: daysAgo(3) },
    { id: "00000000-0000-4000-8000-000000000314", po: "PO-2026-0011", tracking: "IN-HAL-663211", carrier: "CMA CGM", origin: "Mumbai, India", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.PENDING, estArrival: daysFromNow(30) },
    { id: "00000000-0000-4000-8000-000000000315", po: "PO-2026-0015", tracking: "SG-HAL-888331", origin: "Singapore PSA Port", dest: "Cat Lai Port, HCMC", status: ShipmentStatus.PENDING, estArrival: daysFromNow(20) },
    { id: "00000000-0000-4000-8000-000000000316", po: "PO-2026-0019", tracking: "TR-HAL-220987", carrier: "Evergreen", origin: "Istanbul, Turkey", dest: "Hai Phong Port, Vietnam", status: ShipmentStatus.PENDING, estArrival: daysFromNow(35) },
  ];

  for (const s of shipmentDefs) {
    await prisma.shipment.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        purchaseOrderId: pos[s.po].id,
        trackingNumber: s.tracking,
        carrier: s.carrier ?? null,
        origin: s.origin,
        destination: s.dest,
        status: s.status,
        estimatedArrival: s.estArrival,
        shippedAt: s.shippedAt,
        deliveredAt: (s as any).deliveredAt ?? null,
      },
    });
  }

  // ─── Shipment Events ──────────────────────────────────────
  const shipmentEventDefs = [
    { shipmentId: "00000000-0000-4000-8000-000000000303", status: ShipmentStatus.IN_TRANSIT, location: "Laem Chabang, Thailand", note: "Container loaded on vessel", occurredAt: new Date("2025-03-22") },
    { shipmentId: "00000000-0000-4000-8000-000000000303", status: ShipmentStatus.DELIVERED, location: "Hai Phong Port, Vietnam", note: "Delivered and customs cleared", occurredAt: new Date("2025-04-03") },
    { shipmentId: "00000000-0000-4000-8000-000000000305", status: ShipmentStatus.IN_TRANSIT, location: "Port Klang, Malaysia", note: "Departed from origin port", occurredAt: new Date("2025-02-16") },
    { shipmentId: "00000000-0000-4000-8000-000000000305", status: ShipmentStatus.DELIVERED, location: "Hai Phong, Vietnam", note: "Received at warehouse", occurredAt: new Date("2025-02-28") },
    { shipmentId: "00000000-0000-4000-8000-000000000306", status: ShipmentStatus.IN_TRANSIT, location: "Istanbul, Turkey", note: "Departed from Ambarli Port", occurredAt: new Date("2025-07-28") },
    { shipmentId: "00000000-0000-4000-8000-000000000306", status: ShipmentStatus.DELAYED, location: "Colombo, Sri Lanka", note: "Vessel delayed due to weather — rescheduled", occurredAt: new Date("2025-08-15") },
    { shipmentId: "00000000-0000-4000-8000-000000000307", status: ShipmentStatus.IN_TRANSIT, location: "Laem Chabang, Thailand", note: "Container on board", occurredAt: new Date("2026-05-10") },
    { shipmentId: "00000000-0000-4000-8000-000000000307", status: ShipmentStatus.DELAYED, location: "Singapore", note: "Missed connecting vessel — re-routing", occurredAt: new Date("2026-05-22") },
    { shipmentId: "00000000-0000-4000-8000-000000000312", status: ShipmentStatus.IN_TRANSIT, location: "Port Klang, Malaysia", note: "En route to Vietnam", occurredAt: daysAgo(5) },
    { shipmentId: "00000000-0000-4000-8000-000000000313", status: ShipmentStatus.IN_TRANSIT, location: "Jebel Ali, UAE", note: "Departed from Dubai", occurredAt: daysAgo(1) },
  ];
  for (const se of shipmentEventDefs) {
    await prisma.shipmentEvent.create({ data: se });
  }

  // ═══════════════════════════════════════════════════════════
  // 11. BATCH LOTS (per inventory record with PO links)
  // ═══════════════════════════════════════════════════════════
  const batchDefs = [
    { sku: "HAL-COCO-001", warehouseId: whHCM.id, zoneKey: `${whHCM.id}-Dry Goods A`, lotNumber: "MY-LOT-2025-001", qty: 600, manufacturedAt: new Date("2025-03-15"), expiresAt: new Date("2027-03-15"), poNum: "PO-2025-0001", status: "AVAILABLE" as BatchLotStatus },
    { sku: "HAL-CHKN-004", warehouseId: whHCM.id, zoneKey: `${whHCM.id}-Cold Storage B`, lotNumber: "MY-LOT-2025-002", qty: 400, manufacturedAt: new Date("2025-03-20"), expiresAt: new Date("2026-09-20"), poNum: "PO-2025-0001", status: "AVAILABLE" as BatchLotStatus },
    { sku: "HAL-CHKN-004", warehouseId: whCT.id, zoneKey: `${whCT.id}-Main Cold Room 1`, lotNumber: "MY-LOT-2026-010", qty: 200, manufacturedAt: new Date("2026-01-10"), expiresAt: new Date("2026-07-10"), poNum: "PO-2025-0005", status: "AVAILABLE" as BatchLotStatus },
    { sku: "HAL-BEEF-002", warehouseId: whHCM.id, zoneKey: `${whHCM.id}-Dry Goods A`, lotNumber: "ID-LOT-2025-003", qty: 480, manufacturedAt: new Date("2025-04-01"), expiresAt: new Date("2027-04-01"), poNum: "PO-2025-0002", status: "AVAILABLE" as BatchLotStatus },
    { sku: "HAL-RICE-003", warehouseId: whDN.id, zoneKey: `${whDN.id}-Transit Zone`, lotNumber: "TH-LOT-2025-004", qty: 350, manufacturedAt: new Date("2025-02-15"), expiresAt: new Date("2027-02-15"), poNum: "PO-2025-0003", status: "AVAILABLE" as BatchLotStatus },
    { sku: "HAL-LAMB-008", warehouseId: whHCM.id, zoneKey: `${whHCM.id}-Cold Storage B`, lotNumber: "AU-LOT-2025-005", qty: 500, manufacturedAt: new Date("2025-05-01"), expiresAt: new Date("2026-12-01"), poNum: "PO-2025-0007", status: "AVAILABLE" as BatchLotStatus },
    { sku: "HAL-FISH-012", warehouseId: whCT.id, zoneKey: `${whCT.id}-Main Cold Room 1`, lotNumber: "VN-LOT-2026-006", qty: 600, manufacturedAt: new Date("2026-02-01"), expiresAt: new Date("2026-09-01"), poNum: "PO-2026-0012", status: "AVAILABLE" as BatchLotStatus },
    { sku: "HAL-HONE-013", warehouseId: whHP.id, zoneKey: `${whHP.id}-Import Zone A`, lotNumber: "AE-LOT-2025-007", qty: 350, manufacturedAt: new Date("2025-07-01"), expiresAt: new Date("2027-07-01"), poNum: "PO-2025-0009", status: "AVAILABLE" as BatchLotStatus },
    { sku: "HAL-CHEE-017", warehouseId: whCT.id, zoneKey: `${whCT.id}-Main Cold Room 1`, lotNumber: "AU-LOT-2025-008", qty: 200, manufacturedAt: new Date("2025-05-15"), expiresAt: new Date("2026-08-15"), poNum: "PO-2025-0007", status: "AVAILABLE" as BatchLotStatus },
    { sku: "HAL-SAUS-019", warehouseId: whCT.id, zoneKey: `${whCT.id}-Main Cold Room 1`, lotNumber: "TR-LOT-2026-009", qty: 200, manufacturedAt: new Date("2026-05-01"), expiresAt: new Date("2026-11-01"), poNum: "PO-2026-0019", status: "AVAILABLE" as BatchLotStatus },
    { sku: "HAL-BASM-011", warehouseId: whHP.id, zoneKey: `${whHP.id}-Import Zone A`, lotNumber: "IN-LOT-2026-011", qty: 500, manufacturedAt: new Date("2026-02-01"), expiresAt: new Date("2027-08-01"), poNum: "PO-2026-0011", status: "AVAILABLE" as BatchLotStatus },
    { sku: "HAL-CHOC-014", warehouseId: whHCM.id, zoneKey: `${whHCM.id}-Dry Goods A`, lotNumber: "MY-LOT-2026-012", qty: 350, manufacturedAt: new Date("2026-03-01"), expiresAt: new Date("2027-06-01"), poNum: "PO-2026-0013", status: "AVAILABLE" as BatchLotStatus },
    { sku: "HAL-SPIC-010", warehouseId: whHN.id, zoneKey: `${whHN.id}-General Storage A`, lotNumber: "PK-LOT-2026-013", qty: 400, manufacturedAt: new Date("2025-12-01"), expiresAt: new Date("2027-06-01"), poNum: "PO-2026-0010", status: "AVAILABLE" as BatchLotStatus },
    { sku: "HAL-CHEE-017", warehouseId: whCT.id, zoneKey: `${whCT.id}-Main Cold Room 1`, lotNumber: "AU-LOT-2025-008b", qty: 5, manufacturedAt: new Date("2025-05-15"), expiresAt: new Date("2026-08-15"), status: "QUARANTINE" as BatchLotStatus, note: "Spoilage detected — pending quality review" },
    { sku: "HAL-LAMB-008", warehouseId: whCT.id, zoneKey: `${whCT.id}-Main Cold Room 1`, lotNumber: "AU-LOT-2025-005b", qty: 45, manufacturedAt: new Date("2025-05-01"), expiresAt: daysAgo(10), status: "EXPIRED" as BatchLotStatus, note: "Past expiry date — awaiting disposal" },
  ];
  const batchLots: Record<string, any> = {};
  for (const b of batchDefs) {
    batchLots[b.lotNumber] = await prisma.batchLot.create({
      data: {
        productId: products[b.sku].id,
        warehouseId: b.warehouseId,
        zoneId: zones[b.zoneKey]?.id ?? null,
        lotNumber: b.lotNumber,
        quantity: b.qty,
        manufacturedAt: b.manufacturedAt,
        expiresAt: b.expiresAt,
        status: b.status,
        purchaseOrderId: b.poNum ? pos[b.poNum]?.id ?? null : null,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 12. INVENTORY MOVEMENTS (50+ — linked to batch lots & PO items)
  // ═══════════════════════════════════════════════════════════
  interface MovementDef {
    sku: string;
    warehouse: typeof whHCM;
    type: InventoryMovementType;
    qty: number;
    unitCost?: number;
    note: string;
    daysOffset: number;
    user: typeof staffHCM;
    batchLot?: string;
    poiKey?: string;
  }

  const movementDefs: MovementDef[] = [
    { sku: "HAL-COCO-001", warehouse: whHCM, type: InventoryMovementType.INBOUND, qty: 600, unitCost: 9.5, note: "PO-2025-0001 receipt — Lot MY-LOT-2025-001", daysOffset: 380, user: staffHCM, batchLot: "MY-LOT-2025-001", poiKey: "PO-2025-0001-HAL-COCO-001" },
    { sku: "HAL-CHKN-004", warehouse: whHCM, type: InventoryMovementType.INBOUND, qty: 400, unitCost: 6.3, note: "PO-2025-0001 receipt — Lot MY-LOT-2025-002", daysOffset: 380, user: staffHCM, batchLot: "MY-LOT-2025-002", poiKey: "PO-2025-0001-HAL-CHKN-004" },
    { sku: "HAL-BEEF-002", warehouse: whHCM, type: InventoryMovementType.INBOUND, qty: 480, unitCost: 8.75, note: "PO-2025-0002 receipt — Lot ID-LOT-2025-003", daysOffset: 350, user: staffHCM, batchLot: "ID-LOT-2025-003", poiKey: "PO-2025-0002-HAL-BEEF-002" },
    { sku: "HAL-DATE-006", warehouse: whHCM, type: InventoryMovementType.INBOUND, qty: 250, unitCost: 18.5, note: "PO-2025-0002 receipt", daysOffset: 350, user: staffHCM, poiKey: "PO-2025-0002-HAL-DATE-006" },
    { sku: "HAL-RICE-003", warehouse: whHN, type: InventoryMovementType.INBOUND, qty: 350, unitCost: 22.0, note: "PO-2025-0003 receipt", daysOffset: 340, user: staffHN, poiKey: "PO-2025-0003-HAL-RICE-003" },
    { sku: "HAL-CURR-007", warehouse: whHN, type: InventoryMovementType.INBOUND, qty: 300, unitCost: 5.5, note: "PO-2025-0003 receipt", daysOffset: 340, user: staffHN, poiKey: "PO-2025-0003-HAL-CURR-007" },
    { sku: "HAL-LAMB-008", warehouse: whHCM, type: InventoryMovementType.INBOUND, qty: 500, unitCost: 16.8, note: "PO-2025-0007 receipt — Lot AU-LOT-2025-005", daysOffset: 280, user: staffHCM, batchLot: "AU-LOT-2025-005", poiKey: "PO-2025-0007-HAL-LAMB-008" },
    { sku: "HAL-CHEE-017", warehouse: whCT, type: InventoryMovementType.INBOUND, qty: 200, unitCost: 22.0, note: "PO-2025-0007 receipt — cold chain", daysOffset: 275, user: staffDN, batchLot: "AU-LOT-2025-008", poiKey: "PO-2025-0007-HAL-CHEE-017" },
    { sku: "HAL-OLIV-009", warehouse: whHP, type: InventoryMovementType.INBOUND, qty: 300, unitCost: 19.9, note: "PO-2025-0008 receipt", daysOffset: 240, user: staffHN, poiKey: "PO-2025-0008-HAL-OLIV-009" },
    { sku: "HAL-HONE-013", warehouse: whHP, type: InventoryMovementType.INBOUND, qty: 350, unitCost: 28.0, note: "PO-2025-0009 receipt — Lot AE-LOT-2025-007", daysOffset: 210, user: staffHN, batchLot: "AE-LOT-2025-007", poiKey: "PO-2025-0009-HAL-HONE-013" },
    { sku: "HAL-SPIC-010", warehouse: whHN, type: InventoryMovementType.INBOUND, qty: 400, unitCost: 9.2, note: "PO-2026-0010 receipt — Lot PK-LOT-2026-013", daysOffset: 150, user: staffHN, batchLot: "PK-LOT-2026-013", poiKey: "PO-2026-0010-HAL-SPIC-010" },
    { sku: "HAL-SNAC-020", warehouse: whHCM, type: InventoryMovementType.INBOUND, qty: 250, unitCost: 7.4, note: "PO-2026-0010 receipt", daysOffset: 150, user: staffHCM, poiKey: "PO-2026-0010-HAL-SNAC-020" },
    { sku: "HAL-BASM-011", warehouse: whHP, type: InventoryMovementType.INBOUND, qty: 500, unitCost: 25.0, note: "PO-2026-0011 receipt — Lot IN-LOT-2026-011", daysOffset: 110, user: staffQuality, batchLot: "IN-LOT-2026-011", poiKey: "PO-2026-0011-HAL-BASM-011" },
    { sku: "HAL-FLOU-018", warehouse: whHP, type: InventoryMovementType.INBOUND, qty: 400, unitCost: 8.0, note: "PO-2026-0011 receipt", daysOffset: 110, user: staffQuality, poiKey: "PO-2026-0011-HAL-FLOU-018" },
    { sku: "HAL-FISH-012", warehouse: whCT, type: InventoryMovementType.INBOUND, qty: 600, unitCost: 7.5, note: "PO-2026-0012 receipt — Lot VN-LOT-2026-006", daysOffset: 90, user: staffDN, batchLot: "VN-LOT-2026-006", poiKey: "PO-2026-0012-HAL-FISH-012" },
    { sku: "HAL-CHOC-014", warehouse: whHCM, type: InventoryMovementType.INBOUND, qty: 350, unitCost: 15.3, note: "PO-2026-0013 receipt — Lot MY-LOT-2026-012", daysOffset: 50, user: staffHCM, batchLot: "MY-LOT-2026-012", poiKey: "PO-2026-0013-HAL-CHOC-014" },
    { sku: "HAL-NOOD-015", warehouse: whHP, type: InventoryMovementType.INBOUND, qty: 500, unitCost: 2.8, note: "PO-2026-0013 receipt", daysOffset: 50, user: staffHN, poiKey: "PO-2026-0013-HAL-NOOD-015" },
    { sku: "HAL-NOOD-015", warehouse: whHN, type: InventoryMovementType.INBOUND, qty: 400, unitCost: 2.8, note: "PO-2026-0014 partial receipt (50%)", daysOffset: 30, user: staffHN, poiKey: "PO-2026-0014-HAL-NOOD-015" },
    { sku: "HAL-COCO-001", warehouse: whHCM, type: InventoryMovementType.OUTBOUND, qty: 200, note: "Retail distribution — Mega Market chain", daysOffset: 300, user: staffHCM },
    { sku: "HAL-CHKN-004", warehouse: whHCM, type: InventoryMovementType.OUTBOUND, qty: 300, note: "Hotel chain order — Vinpearl Nha Trang", daysOffset: 230, user: staffHCM },
    { sku: "HAL-BEEF-002", warehouse: whHCM, type: InventoryMovementType.OUTBOUND, qty: 100, note: "Export dispatch — Cambodia", daysOffset: 210, user: staffHCM },
    { sku: "HAL-BEEF-002", warehouse: whHP, type: InventoryMovementType.OUTBOUND, qty: 50, note: "Northern retail distribution", daysOffset: 190, user: staffHN },
    { sku: "HAL-RICE-003", warehouse: whHN, type: InventoryMovementType.OUTBOUND, qty: 100, note: "Supermarket chain — Big C Hanoi", daysOffset: 270, user: staffHN },
    { sku: "HAL-FISH-012", warehouse: whDN, type: InventoryMovementType.OUTBOUND, qty: 100, note: "Export — Philippines", daysOffset: 70, user: staffDN },
    { sku: "HAL-CHOC-014", warehouse: whHCM, type: InventoryMovementType.OUTBOUND, qty: 60, note: "Confectionery chain — HCMC", daysOffset: 40, user: staffHCM },
    { sku: "HAL-CHOC-014", warehouse: whCT, type: InventoryMovementType.OUTBOUND, qty: 25, note: "Retail — Can Tho", daysOffset: 35, user: staffDN },
    { sku: "HAL-HONE-013", warehouse: whHP, type: InventoryMovementType.OUTBOUND, qty: 45, note: "Premium gift pack — corporate order", daysOffset: 100, user: staffHN },
    { sku: "HAL-BASM-011", warehouse: whHP, type: InventoryMovementType.OUTBOUND, qty: 120, note: "Premium rice export — Japan", daysOffset: 55, user: staffQuality },
    { sku: "HAL-LAMB-008", warehouse: whHCM, type: InventoryMovementType.OUTBOUND, qty: 200, note: "Restaurant chain — 5-star hotels HCMC", daysOffset: 160, user: staffHCM },
    { sku: "HAL-LAMB-008", warehouse: whCT, type: InventoryMovementType.OUTBOUND, qty: 40, note: "Mekong Delta distribution", daysOffset: 130, user: staffDN },
    { sku: "HAL-COCO-001", warehouse: whHN, type: InventoryMovementType.INBOUND, qty: 50, note: "Internal transfer from HCM to Hanoi", daysOffset: 180, user: staffHN },
    { sku: "HAL-FISH-012", warehouse: whCT, type: InventoryMovementType.INBOUND, qty: 150, note: "Transfer from Can Tho to Da Nang for export", daysOffset: 75, user: staffDN },
    { sku: "HAL-FISH-012", warehouse: whDN, type: InventoryMovementType.INBOUND, qty: 150, note: "Received from Can Tho cold storage", daysOffset: 73, user: staffDN },
    { sku: "HAL-FLOU-018", warehouse: whHN, type: InventoryMovementType.INBOUND, qty: 80, note: "Transfer from Hai Phong to Hanoi", daysOffset: 45, user: staffHN },
    { sku: "HAL-FLOU-018", warehouse: whHP, type: InventoryMovementType.OUTBOUND, qty: 80, note: "Transfer to Hanoi distribution center", daysOffset: 45, user: staffQuality },
    { sku: "HAL-RICE-003", warehouse: whHN, type: InventoryMovementType.ADJUSTMENT, qty: 10, note: "Stock count adjustment — found extra", daysOffset: 100, user: staffHN },
    { sku: "HAL-SPIC-010", warehouse: whHN, type: InventoryMovementType.ADJUSTMENT, qty: 5, note: "Damaged stock write-off — packaging issue", daysOffset: 40, user: staffQuality },
    { sku: "HAL-CHEE-017", warehouse: whCT, type: InventoryMovementType.ADJUSTMENT, qty: 5, note: "Spoilage — cold chain interruption", daysOffset: 25, user: staffDN },
    { sku: "HAL-SAUS-019", warehouse: whCT, type: InventoryMovementType.ADJUSTMENT, qty: 8, note: "Quality check rejection — near expiry", daysOffset: 10, user: staffDN },
    { sku: "HAL-LAMB-008", warehouse: whCT, type: InventoryMovementType.RETURN, qty: 15, note: "Return to supplier — quality issue detected", daysOffset: 5, user: staffQuality },
  ];

  for (const m of movementDefs) {
    await prisma.inventoryMovement.create({
      data: {
        productId: products[m.sku].id,
        warehouseId: m.warehouse.id,
        batchLotId: m.batchLot ? batchLots[m.batchLot]?.id ?? null : null,
        type: m.type,
        quantity: m.qty,
        unitCost: m.unitCost ?? null,
        note: m.note,
        purchaseOrderItemId: m.poiKey ? poiRecords[m.poiKey]?.id ?? null : null,
        performedBy: m.user.id,
        createdAt: daysAgo(m.daysOffset),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 13. NOTIFICATIONS (20+ — demo alerts)
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
    { title: "Batch Expiring", message: "Lot AU-LOT-2025-005b (Australian Lamb Shoulder) at Mekong Cold Storage has expired. Awaiting disposal.", type: NotificationType.BATCH_EXPIRING, userId: staffDN.id, daysOffset: 0 },
    { title: "Batch Expiring", message: "Lot AU-LOT-2025-008 (Australian Cheddar) at Mekong Cold Storage expires in 58 days.", type: NotificationType.BATCH_EXPIRING, userId: staffDN.id, daysOffset: 5 },
    { title: "Shipment Delayed", message: "Shipment TR-HAL-555321 (Istanbul → Hai Phong) is delayed. Was due 2025-09-01.", type: NotificationType.SHIPMENT_DELAYED, userId: manager.id, daysOffset: 15 },
    { title: "Shipment Delayed", message: "Shipment TH-HAL-992880 (Laem Chabang → Da Nang) is delayed. Was due 2026-05-20.", type: NotificationType.SHIPMENT_DELAYED, userId: manager.id, daysOffset: 4 },
    { title: "Shipment In Transit", message: "Shipment MY-HAL-921045 (Port Klang → Cat Lai) is in transit — ETA 2026-06-23.", type: NotificationType.SYSTEM, userId: staffHCM.id, daysOffset: 0 },
    { title: "Compliance Issue", message: "3 suppliers have expired halal certificates. Compliance score impacted.", type: NotificationType.COMPLIANCE_ISSUE, userId: auditor.id, daysOffset: 2 },
    { title: "Compliance Issue", message: "4 inventory items below reorder level across network.", type: NotificationType.COMPLIANCE_ISSUE, userId: auditor.id, daysOffset: 1 },
    { title: "System Alert", message: "New supplier onboarded: Saigon Halal Processors JSC — certificate verified.", type: NotificationType.SYSTEM, userId: admin.id, daysOffset: 90 },
    { title: "System Alert", message: "Lot AU-LOT-2025-008b (Cheddar, Mekong Cold Storage) moved to QUARANTINE — spoilage detected.", type: NotificationType.SYSTEM, userId: staffQuality.id, daysOffset: 2 },
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
  // 14. AUDIT LOGS
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
    { action: AuditAction.CREATE, entityType: "batch_lot", entityId: "MY-LOT-2025-001", userId: staffHCM.id, daysOffset: 380, newData: { lotNumber: "MY-LOT-2025-001", product: "HAL-COCO-001" } },
    { action: AuditAction.UPDATE, entityType: "batch_lot", entityId: "AU-LOT-2025-008b", userId: staffQuality.id, daysOffset: 2, oldData: { status: "AVAILABLE" }, newData: { status: "QUARANTINE" } },
    { action: AuditAction.CREATE, entityType: "supplier_contact", entityId: "Ahmad bin Ismail", userId: admin.id, daysOffset: 395, newData: { name: "Ahmad bin Ismail", supplier: "Halal Foods Malaysia" } },
    { action: AuditAction.CREATE, entityType: "warehouse_zone", entityId: "Cold Storage B", userId: admin.id, daysOffset: 390, newData: { name: "Cold Storage B", warehouse: "HCM Logistics Hub" } },
    { action: AuditAction.STATUS_CHANGE, entityType: "purchase_order", entityId: "PO-2026-0014", userId: manager.id, daysOffset: 30, oldData: { status: "SHIPPING" }, newData: { status: "PARTIAL" } },
    { action: AuditAction.STATUS_CHANGE, entityType: "purchase_order", entityId: "PO-2026-0020", userId: manager.id, daysOffset: 20, oldData: { status: "APPROVED" }, newData: { status: "CANCELLED" } },
  ];

  for (const a of auditDefs) {
    await prisma.auditLog.create({
      data: {
        userId: a.userId,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        oldData: (a as any).oldData || undefined,
        newData: (a as any).newData || undefined,
        createdAt: daysAgo(a.daysOffset),
      },
    });
  }

  console.log("✅ Seeding complete!");
  console.log("  Users:", users.length + 1);
  console.log("  Suppliers: 10  |  Contacts: 13");
  console.log("  Certificates: 16");
  console.log("  Tags:", Object.keys(tags).length);
  console.log("  Warehouses: 5  |  Zones:", zoneDefs.length);
  console.log("  Products:", Object.keys(products).length);
  console.log("  Product Versions:", Object.keys(products).length);
  console.log("  Product Tags:", productTagDefs.length);
  console.log("  Supplier-Product links:", spDefs.length);
  console.log("  Product-Certification links:", productCertDefs.length);
  console.log("  Inventory records:", Object.keys(inventoryRecords).length);
  console.log("  Batch Lots:", Object.keys(batchLots).length);
  console.log("  Purchase Orders:", Object.keys(pos).length);
  console.log("  PO Approvals:", poApprovalDefs.length);
  console.log("  PO Items:", poiDefs.length);
  console.log("  Shipments:", shipmentDefs.length, " | Events:", shipmentEventDefs.length);
  console.log("  Inventory Movements:", movementDefs.length);
  console.log("  Notifications:", notificationDefs.length);
  console.log("  Audit Logs:", auditDefs.length);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });