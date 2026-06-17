import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationType, UserRole } from "@prisma/client";

// ---------------------------------------------------------------------------
// Minimal TxClient mock factory
// ---------------------------------------------------------------------------
function makeTxClient(overrides: Record<string, unknown> = {}) {
  return {
    notification: {
      findFirst: vi.fn(),
      createMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    ...overrides,
  } as unknown as Parameters<typeof import("../../lib/notificationService").notifyLowStock>[0];
}

describe("notifyLowStock", () => {
  it("creates notifications when no duplicate exists today", async () => {
    const { notifyLowStock } = await import("../../lib/notificationService");

    const tx = makeTxClient();
    (tx.notification.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (tx.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "user-admin-1" },
      { id: "user-manager-1" },
    ]);
    (tx.notification.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 2 });

    await notifyLowStock(tx, {
      inventoryId: "inv-001",
      productName: "Product A",
      sku: "SKU-001",
      warehouseName: "Warehouse 1",
      quantity: 5,
      reorderLevel: 10,
    });

    expect(tx.notification.createMany).toHaveBeenCalledTimes(1);
    const firstCallData = (tx.notification.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0].data[0];
    expect(firstCallData.type).toBe(NotificationType.LOW_STOCK);
    // The message does NOT contain the inventoryId — that's only used in duplicate detection
    expect(firstCallData.message).toContain("Product A");
    expect(firstCallData.message).toContain("SKU-001");
    expect(firstCallData.message).toContain("Warehouse 1");
    expect(firstCallData.message).toContain("5");
    expect(firstCallData.message).toContain("10");
  });

  it("skips creation when a duplicate notification exists today", async () => {
    const { notifyLowStock } = await import("../../lib/notificationService");

    const tx = makeTxClient();
    (tx.notification.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "existing-notif",
      type: NotificationType.LOW_STOCK,
      message: "Product X (SKU: SKU-X) in W1 ... inv-001 ...",
      createdAt: new Date(),
    });

    await notifyLowStock(tx, {
      inventoryId: "inv-001",
      productName: "Product A",
      sku: "SKU-001",
      warehouseName: "Warehouse 1",
      quantity: 3,
      reorderLevel: 10,
    });

    expect(tx.notification.createMany).not.toHaveBeenCalled();
  });

  it("duplicate check queries for LOW_STOCK type and inventoryId in message", async () => {
    const { notifyLowStock } = await import("../../lib/notificationService");

    const tx = makeTxClient();
    (tx.notification.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (tx.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (tx.notification.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });

    await notifyLowStock(tx, {
      inventoryId: "test-inv-id-abc",
      productName: "P",
      sku: "S",
      warehouseName: "W",
      quantity: 1,
      reorderLevel: 5,
    });

    const findFirstCall = (tx.notification.findFirst as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findFirstCall.where.type).toBe(NotificationType.LOW_STOCK);
    expect(findFirstCall.where.message.contains).toBe("test-inv-id-abc");
    expect(findFirstCall.where.createdAt.gte).toBeInstanceOf(Date);
  });

  it("creates one notification per manager/admin user", async () => {
    const { notifyLowStock } = await import("../../lib/notificationService");

    const tx = makeTxClient();
    (tx.notification.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (tx.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "uid-1" },
      { id: "uid-2" },
      { id: "uid-3" },
    ]);
    (tx.notification.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 3 });

    await notifyLowStock(tx, {
      inventoryId: "inv-xyz",
      productName: "X",
      sku: "X-SKU",
      warehouseName: "WH",
      quantity: 0,
      reorderLevel: 5,
    });

    expect(tx.notification.createMany).toHaveBeenCalledTimes(1);
    const callData = (tx.notification.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const userIds = callData.data.map((d: { userId: string }) => d.userId);
    expect(userIds).toContain("uid-1");
    expect(userIds).toContain("uid-2");
    expect(userIds).toContain("uid-3");
  });

  it("creates no notifications when no managers or admins exist", async () => {
    const { notifyLowStock } = await import("../../lib/notificationService");

    const tx = makeTxClient();
    (tx.notification.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (tx.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (tx.notification.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });

    await notifyLowStock(tx, {
      inventoryId: "inv-empty",
      productName: "P",
      sku: "S",
      warehouseName: "W",
      quantity: 0,
      reorderLevel: 1,
    });

    expect(tx.notification.createMany).not.toHaveBeenCalled();
  });
});

describe("notifyCertificateExpiring", () => {
  it("creates notifications when no duplicate exists today", async () => {
    const { notifyCertificateExpiring } = await import(
      "../../lib/notificationService"
    );

    const tx = makeTxClient();
    (tx.notification.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (tx.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "admin-1" },
    ]);
    (tx.notification.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });

    const expiryDate = new Date("2025-07-15");
    await notifyCertificateExpiring(tx, {
      certificateNumber: "CERT-2025-001",
      supplierName: "Supplier ABC",
      expiryDate,
    });

    expect(tx.notification.createMany).toHaveBeenCalledTimes(1);
    const callData = (tx.notification.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0].data[0];
    expect(callData.type).toBe(NotificationType.CERTIFICATE_EXPIRING);
    expect(callData.message).toContain("CERT-2025-001");
    expect(callData.message).toContain("Supplier ABC");
    expect(callData.message).toContain("2025-07-15");
  });

  it("skips creation when a duplicate exists today for same certificate", async () => {
    const { notifyCertificateExpiring } = await import(
      "../../lib/notificationService"
    );

    const tx = makeTxClient();
    (tx.notification.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "existing",
      type: NotificationType.CERTIFICATE_EXPIRING,
      message: "Certificate CERT-2025-001 for Supplier ABC expires ...",
      createdAt: new Date(),
    });

    await notifyCertificateExpiring(tx, {
      certificateNumber: "CERT-2025-001",
      supplierName: "Supplier ABC",
      expiryDate: new Date("2025-07-15"),
    });

    expect(tx.notification.createMany).not.toHaveBeenCalled();
  });

  it("duplicate check queries for CERTIFICATE_EXPIRING type and certificateNumber in message", async () => {
    const { notifyCertificateExpiring } = await import(
      "../../lib/notificationService"
    );

    const tx = makeTxClient();
    (tx.notification.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (tx.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (tx.notification.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });

    await notifyCertificateExpiring(tx, {
      certificateNumber: "CERT-UNIQUE-XYZ",
      supplierName: "S",
      expiryDate: new Date(),
    });

    const findFirstCall = (tx.notification.findFirst as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findFirstCall.where.type).toBe(NotificationType.CERTIFICATE_EXPIRING);
    expect(findFirstCall.where.message.contains).toBe("CERT-UNIQUE-XYZ");
    expect(findFirstCall.where.createdAt.gte).toBeInstanceOf(Date);
  });

  it("message format includes expiryDate as ISO date string (YYYY-MM-DD)", async () => {
    const { notifyCertificateExpiring } = await import(
      "../../lib/notificationService"
    );

    const tx = makeTxClient();
    (tx.notification.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (tx.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "u1" }]);
    (tx.notification.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });

    await notifyCertificateExpiring(tx, {
      certificateNumber: "CERT-123",
      supplierName: "Halal Corp",
      expiryDate: new Date("2026-03-01T00:00:00.000Z"),
    });

    const callData = (tx.notification.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0].data[0];
    const message: string = callData.message;
    // Should contain the date in YYYY-MM-DD format
    expect(message).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});