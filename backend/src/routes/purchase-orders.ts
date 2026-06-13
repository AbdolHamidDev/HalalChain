import { Router, Response } from "express";
import { z } from "zod";
import { Prisma, PurchaseOrderStatus, ShipmentStatus, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseBody, sendNotFound, sendValidationError } from "../lib/validate";
import { paramId } from "../lib/params";
import { AuthRequest, authenticate, authorize } from "../middleware/auth";
import { parsePaginationParams, buildPaginatedResponse } from "../lib/paginate";
import { logAudit } from "../lib/auditLog";

const router = Router();

const VALID_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  DRAFT: [PurchaseOrderStatus.APPROVED],
  APPROVED: [PurchaseOrderStatus.SHIPPING],
  SHIPPING: [PurchaseOrderStatus.RECEIVED],
  RECEIVED: [],
  CANCELLED: [],
  PARTIAL: [],
};

const createSchema = z.object({
  supplierId: z.string().uuid(),
  poNumber: z.string().min(3).max(50).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0.01),
  })).min(1),
});

const updateSchema = z.object({
  totalAmount: z.coerce.number().min(0).optional(),
});

const statusSchema = z.object({
  status: z.nativeEnum(PurchaseOrderStatus),
});

async function generatePoNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.purchaseOrder.count({
    where: {
      createdAt: { gte: new Date(`${year}-01-01`) },
    },
  });
  return `PO-${year}-${String(count + 1).padStart(4, "0")}`;
}

router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res: Response) => {
    const params = parsePaginationParams(req.query as Record<string, unknown>);
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const VALID_PO_STATUSES = ["DRAFT", "APPROVED", "SHIPPING", "RECEIVED", "CANCELLED", "PARTIAL"];
    const where: Prisma.PurchaseOrderWhereInput = {};

    if (req.query.status) {
      const statusVal = String(req.query.status);
      if (!VALID_PO_STATUSES.includes(statusVal)) {
        res.status(400).json({ error: "Invalid status value." });
        return;
      }
      where.status = statusVal as PurchaseOrderStatus;
    }

    if (req.query.supplierId) {
      const supplierIdVal = String(req.query.supplierId);
      const supplierExists = await prisma.supplier.findUnique({
        where: { id: supplierIdVal },
        select: { id: true },
      });
      if (!supplierExists) {
        res.json(buildPaginatedResponse([], 0, params));
        return;
      }
      where.supplierId = supplierIdVal;
    }

    const [total, purchaseOrders] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          supplier: { select: { id: true, name: true, country: true } },
          shipments: { select: { id: true, status: true, trackingNumber: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);

    const mapped = purchaseOrders.map(({ _count, ...po }) => ({
      ...po,
      itemCount: _count.items,
    }));

    res.json(buildPaginatedResponse(mapped, total, params));
  }
);

router.get(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res: Response) => {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        supplier: true,
        shipments: true,
        items: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });
    if (!purchaseOrder) {
      sendNotFound(res, "Purchase order");
      return;
    }

    const { items, ...rest } = purchaseOrder;
    const mappedItems = items.map(({ product, ...item }) => ({
      id: item.id,
      productId: item.productId,
      productName: product.name,
      productSku: product.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    }));

    res.json({ purchaseOrder: { ...rest, items: mappedItems } });
  }
);

router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const parsed = parseBody(createSchema, req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.message);
      return;
    }

    const { supplierId, poNumber: requestedPoNumber, items } = parsed.data;

    // Validate supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) {
      sendNotFound(res, "Supplier");
      return;
    }

    // Validate all productIds exist
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true },
      });
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
    }

    const poNumber = requestedPoNumber ?? (await generatePoNumber());
    const userId = req.user?.sub ?? null;

    try {
      const purchaseOrder = await prisma.$transaction(async (tx) => {
        // Compute subtotals and totalAmount server-side
        const itemsWithSubtotals = items.map((item) => ({
          ...item,
          subtotal: item.quantity * item.unitPrice,
        }));
        const totalAmount = itemsWithSubtotals.reduce((sum, item) => sum + item.subtotal, 0);

        // Create PurchaseOrder
        const po = await tx.purchaseOrder.create({
          data: {
            supplierId,
            poNumber,
            totalAmount,
            status: PurchaseOrderStatus.DRAFT,
          },
        });

        // Create all PurchaseOrderItems
        await tx.purchaseOrderItem.createMany({
          data: itemsWithSubtotals.map((item) => ({
            purchaseOrderId: po.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        });

        await logAudit(tx, {
          userId,
          action: "CREATE",
          entityType: "PurchaseOrder",
          entityId: po.id,
          newData: po as unknown as Record<string, unknown>,
        });

        return tx.purchaseOrder.findUnique({
          where: { id: po.id },
          include: {
            supplier: { select: { name: true, country: true } },
            items: {
              include: {
                product: { select: { name: true, sku: true } },
              },
            },
          },
        });
      });

      res.status(201).json({ purchaseOrder });
    } catch {
      res.status(409).json({ error: "PO number already exists" });
    }
  }
);

router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const parsed = parseBody(updateSchema, req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.message);
      return;
    }

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Purchase order");
      return;
    }
    if (existing.status !== PurchaseOrderStatus.DRAFT) {
      sendValidationError(res, "Only DRAFT orders can be edited");
      return;
    }

    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    const purchaseOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: parsed.data,
      });
      await logAudit(tx, {
        userId,
        action: "UPDATE",
        entityType: "PurchaseOrder",
        entityId: updated.id,
        oldData: existing as unknown as Record<string, unknown>,
        newData: updated as unknown as Record<string, unknown>,
      });
      return updated;
    });

    res.json({ purchaseOrder });
  }
);

router.patch(
  "/:id/status",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const parsed = parseBody(statusSchema, req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.message);
      return;
    }

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id: paramId(req.params.id) },
      include: { supplier: true },
    });
    if (!existing) {
      sendNotFound(res, "Purchase order");
      return;
    }

    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed.includes(parsed.data.status)) {
      sendValidationError(
        res,
        `Cannot transition from ${existing.status} to ${parsed.data.status}`
      );
      return;
    }

    const id = paramId(req.params.id);
    const userId = req.user?.sub ?? null;
    const previousStatus = existing.status;
    const newStatus = parsed.data.status;

    const purchaseOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: { status: newStatus },
      });

      const current = await tx.purchaseOrder.findUniqueOrThrow({
        where: { id },
        include: { supplier: true, shipments: true },
      });

      if (newStatus === PurchaseOrderStatus.SHIPPING) {
        const hasShipment = current.shipments.length > 0;
        if (!hasShipment) {
          await tx.shipment.create({
            data: {
              purchaseOrderId: current.id,
              trackingNumber: `SHP-${current.poNumber}`,
              origin: `${current.supplier.country} Export Hub`,
              destination: "Ho Chi Minh City, Vietnam",
              status: ShipmentStatus.PENDING,
              estimatedArrival: new Date(Date.now() + 14 * 86400000),
            },
          });
        }
      }

      // UPDATE audit log
      await logAudit(tx, {
        userId,
        action: "UPDATE",
        entityType: "PurchaseOrder",
        entityId: id,
        oldData: existing as unknown as Record<string, unknown>,
        newData: updated as unknown as Record<string, unknown>,
      });

      // STATUS_CHANGE audit log
      await logAudit(tx, {
        userId,
        action: "STATUS_CHANGE",
        entityType: "PurchaseOrder",
        entityId: id,
        oldData: { status: previousStatus },
        newData: { status: newStatus },
      });

      return tx.purchaseOrder.findUnique({
        where: { id },
        include: {
          supplier: true,
          shipments: true,
        },
      });
    });

    res.json({ purchaseOrder });
  }
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const existing = await prisma.purchaseOrder.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Purchase order");
      return;
    }
    if (existing.status !== PurchaseOrderStatus.DRAFT) {
      sendValidationError(res, "Only DRAFT orders can be deleted");
      return;
    }

    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.delete({ where: { id } });
      await logAudit(tx, {
        userId,
        action: "DELETE",
        entityType: "PurchaseOrder",
        entityId: existing.id,
        oldData: existing as unknown as Record<string, unknown>,
      });
    });

    res.json({ message: "Purchase order deleted" });
  }
);

export default router;
