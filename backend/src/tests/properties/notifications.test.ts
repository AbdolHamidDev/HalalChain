/**
 * Property tests for Notification Center (Phase 5)
 *
 * Property 16: LOW_STOCK notification triggered at threshold
 *   Validates: Requirements 9.2
 *
 * Property 17: LOW_STOCK notification deduplication
 *   Validates: Requirements 9.2
 *
 * Property 18: Certificate expiry notification idempotency
 *   Validates: Requirements 9.3, 9.4
 */

import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import { NotificationType } from "@prisma/client";
import {
  notifyLowStock,
  notifyCertificateExpiring,
} from "../../lib/notificationService";

// ---------------------------------------------------------------------------
// TxClient mock factory
// ---------------------------------------------------------------------------
type CreateManyCall = { data: Array<{ userId: string; type: string; message: string; title: string }> };

interface MockNotification {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: Date;
}

function makeTxClient(opts: {
  existingNotification?: MockNotification | null;
  userIds?: string[];
}) {
  const createdNotifications: CreateManyCall[] = [];

  return {
    _created: createdNotifications,
    notification: {
      findFirst: vi.fn().mockResolvedValue(opts.existingNotification ?? null),
      createMany: vi.fn().mockImplementation((args: CreateManyCall) => {
        createdNotifications.push(args);
        return Promise.resolve({ count: args.data.length });
      }),
    },
    user: {
      findMany: vi.fn().mockResolvedValue(
        (opts.userIds ?? ["admin-1", "manager-1"]).map((id) => ({ id }))
      ),
    },
  } as unknown as ReturnType<typeof makeTxClient>;
}

// ---------------------------------------------------------------------------
// Property 16: LOW_STOCK notification triggered at threshold
// **Validates: Requirements 9.2**
//
// For any INBOUND/OUTBOUND/ADJUSTMENT movement that results in
// inventory.quantity <= reorderLevel, at least one LOW_STOCK notification
// SHALL be created per manager/admin. If quantity > reorderLevel, no
// LOW_STOCK notification is created (this is enforced in inventory.ts, not
// the service itself — so here we test: when called, the service creates
// notifications for each user).
// ---------------------------------------------------------------------------
describe("Property 16: LOW_STOCK notification triggered at threshold", () => {
  it("creates exactly one notification per admin/manager user when no duplicate exists", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 1-5 admin/manager user IDs
        fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        // quantity <= reorderLevel
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        async (userIds, qty, reorder) => {
          const quantity = Math.min(qty, reorder);
          const reorderLevel = Math.max(qty, reorder);

          const tx = makeTxClient({ existingNotification: null, userIds });

          await notifyLowStock(tx, {
            inventoryId: "inv-test",
            productName: "Test Product",
            sku: "SKU-TEST",
            warehouseName: "Test Warehouse",
            quantity,
            reorderLevel,
          });

          expect(tx.notification.createMany).toHaveBeenCalledTimes(1);
          const callArgs = (tx.notification.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0] as CreateManyCall;
          // One notification per user
          expect(callArgs.data).toHaveLength(userIds.length);
          // All have LOW_STOCK type
          expect(callArgs.data.every((n) => n.type === NotificationType.LOW_STOCK)).toBe(true);
          // All notifications belong to different users (all user IDs covered)
          const createdUserIds = callArgs.data.map((n) => n.userId).sort();
          expect(createdUserIds).toEqual([...userIds].sort());
        }
      )
    );
  });

  it("message always contains product name, SKU, warehouse, quantity and reorder level", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        async (productName, sku, warehouseName, quantity, reorderLevel) => {
          const tx = makeTxClient({ existingNotification: null, userIds: ["u1"] });

          await notifyLowStock(tx, {
            inventoryId: "inv-msg-test",
            productName,
            sku,
            warehouseName,
            quantity,
            reorderLevel,
          });

          const callArgs = (tx.notification.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0] as CreateManyCall;
          const message = callArgs.data[0].message;
          expect(message).toContain(productName);
          expect(message).toContain(sku);
          expect(message).toContain(warehouseName);
          expect(message).toContain(String(quantity));
          expect(message).toContain(String(reorderLevel));
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Property 17: LOW_STOCK notification deduplication
// **Validates: Requirements 9.2**
//
// For any inventory record, no more than one LOW_STOCK notification SHALL
// be created for that inventory record within the same calendar day,
// regardless of how many threshold-crossing movements occur.
// ---------------------------------------------------------------------------
describe("Property 17: LOW_STOCK notification deduplication", () => {
  it("never creates notifications when a duplicate already exists today", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),    // inventoryId
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        async (inventoryId, productName, sku, warehouseName, quantity, reorderLevel) => {
          // There's already a notification with this inventoryId in its message today
          const existingNotification: MockNotification = {
            id: "existing-notif-id",
            type: NotificationType.LOW_STOCK,
            message: `some message containing ${inventoryId}`,
            createdAt: new Date(),
          };

          const tx = makeTxClient({ existingNotification, userIds: ["u1", "u2"] });

          await notifyLowStock(tx, {
            inventoryId,
            productName,
            sku,
            warehouseName,
            quantity,
            reorderLevel,
          });

          // No createMany should be called because duplicate exists
          expect(tx.notification.createMany).not.toHaveBeenCalled();
        }
      )
    );
  });

  it("second call on same day (simulated) creates no additional notifications", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (inventoryId) => {
          // First call — no duplicate yet
          const tx1 = makeTxClient({ existingNotification: null, userIds: ["u1"] });
          await notifyLowStock(tx1, {
            inventoryId,
            productName: "P",
            sku: "S",
            warehouseName: "W",
            quantity: 0,
            reorderLevel: 5,
          });
          expect(tx1.notification.createMany).toHaveBeenCalledTimes(1);

          // Second call — duplicate exists now (simulate same-day duplication check returning found)
          const existingAfterFirst: MockNotification = {
            id: "created-by-first-call",
            type: NotificationType.LOW_STOCK,
            message: `message containing ${inventoryId}`,
            createdAt: new Date(),
          };
          const tx2 = makeTxClient({
            existingNotification: existingAfterFirst,
            userIds: ["u1"],
          });
          await notifyLowStock(tx2, {
            inventoryId,
            productName: "P",
            sku: "S",
            warehouseName: "W",
            quantity: 0,
            reorderLevel: 5,
          });
          // Second call should NOT create any new notifications
          expect(tx2.notification.createMany).not.toHaveBeenCalled();
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Property 18: Certificate expiry notification idempotency
// **Validates: Requirements 9.3, 9.4**
//
// For any HalalCertificate expiring within 30 days, running the daily
// notification job N times within the same calendar day SHALL create
// notifications for that certificate at most once per day.
// ---------------------------------------------------------------------------
describe("Property 18: Certificate expiry notification idempotency", () => {
  it("never creates notifications when a duplicate certificate notification exists today", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 30 }).filter((s) => /^[A-Z0-9-]+$/.test(s)),
        fc.string({ minLength: 2, maxLength: 50 }),
        fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
        async (certificateNumber, supplierName, expiryDate) => {
          // Simulate duplicate already exists for this certificate today
          const existingNotification: MockNotification = {
            id: "existing-cert-notif",
            type: NotificationType.CERTIFICATE_EXPIRING,
            message: `Certificate ${certificateNumber} for ${supplierName} expires ...`,
            createdAt: new Date(),
          };

          const tx = makeTxClient({ existingNotification, userIds: ["u1", "u2"] });

          await notifyCertificateExpiring(tx, {
            certificateNumber,
            supplierName,
            expiryDate,
          });

          expect(tx.notification.createMany).not.toHaveBeenCalled();
        }
      )
    );
  });

  it("creates notifications first time, skips on subsequent same-day calls (idempotency)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 20 }).filter((s) => s.length > 0),
        fc.string({ minLength: 2, maxLength: 30 }),
        fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
        async (certificateNumber, supplierName, expiryDate) => {
          // First run — no duplicate
          const tx1 = makeTxClient({ existingNotification: null, userIds: ["u1"] });
          await notifyCertificateExpiring(tx1, { certificateNumber, supplierName, expiryDate });
          expect(tx1.notification.createMany).toHaveBeenCalledTimes(1);

          // Second run same day — duplicate found
          const existing: MockNotification = {
            id: "cert-notif-1",
            type: NotificationType.CERTIFICATE_EXPIRING,
            message: `Certificate ${certificateNumber} for ...`,
            createdAt: new Date(),
          };
          const tx2 = makeTxClient({ existingNotification: existing, userIds: ["u1"] });
          await notifyCertificateExpiring(tx2, { certificateNumber, supplierName, expiryDate });
          expect(tx2.notification.createMany).not.toHaveBeenCalled();

          // Third run same day — still has duplicate
          const tx3 = makeTxClient({ existingNotification: existing, userIds: ["u1"] });
          await notifyCertificateExpiring(tx3, { certificateNumber, supplierName, expiryDate });
          expect(tx3.notification.createMany).not.toHaveBeenCalled();
        }
      )
    );
  });

  it("certificate expiry message always includes certificateNumber, supplierName, and date", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2, maxLength: 30 }),
        fc.string({ minLength: 2, maxLength: 50 }),
        fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") }),
        async (certificateNumber, supplierName, expiryDate) => {
          const tx = makeTxClient({ existingNotification: null, userIds: ["u1"] });

          await notifyCertificateExpiring(tx, {
            certificateNumber,
            supplierName,
            expiryDate,
          });

          const callArgs = (tx.notification.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0] as CreateManyCall;
          const message = callArgs.data[0].message;

          // Message must include all three required pieces of info
          expect(message).toContain(certificateNumber);
          expect(message).toContain(supplierName);
          // Date in YYYY-MM-DD format
          expect(message).toMatch(/\d{4}-\d{2}-\d{2}/);
        }
      )
    );
  });

  it("duplicate check always uses CERTIFICATE_EXPIRING type and the certificate number", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2, maxLength: 30 }),
        fc.string({ minLength: 2, maxLength: 50 }),
        async (certificateNumber, supplierName) => {
          const tx = makeTxClient({ existingNotification: null, userIds: [] });

          await notifyCertificateExpiring(tx, {
            certificateNumber,
            supplierName,
            expiryDate: new Date(),
          });

          const findFirstCall = (tx.notification.findFirst as ReturnType<typeof vi.fn>).mock.calls[0][0];
          expect(findFirstCall.where.type).toBe(NotificationType.CERTIFICATE_EXPIRING);
          expect(findFirstCall.where.message.contains).toBe(certificateNumber);
          expect(findFirstCall.where.createdAt.gte).toBeInstanceOf(Date);
        }
      )
    );
  });
});
