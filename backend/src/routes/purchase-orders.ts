import { Router, Response } from "express";
import { z } from "zod";
import { PurchaseOrderStatus, ShipmentStatus, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseBody, sendNotFound, sendValidationError } from "../lib/validate";
import { paramId } from "../lib/params";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

const VALID_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  DRAFT: [PurchaseOrderStatus.APPROVED],
  APPROVED: [PurchaseOrderStatus.SHIPPING],
  SHIPPING: [PurchaseOrderStatus.RECEIVED],
  RECEIVED: [],
};

const createSchema = z.object({
  supplierId: z.string().uuid(),
  poNumber: z.string().min(3).max(50).optional(),
  totalAmount: z.coerce.number().min(0),
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
  async (_req, res: Response) => {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        supplier: { select: { id: true, name: true, country: true } },
        shipments: { select: { id: true, status: true, trackingNumber: true } },
      },
    });
    res.json({ purchaseOrders });
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
      },
    });
    if (!purchaseOrder) {
      sendNotFound(res, "Purchase order");
      return;
    }
    res.json({ purchaseOrder });
  }
);

router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req, res: Response) => {
    const parsed = parseBody(createSchema, req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.message);
      return;
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: parsed.data.supplierId },
    });
    if (!supplier) {
      sendNotFound(res, "Supplier");
      return;
    }

    const poNumber = parsed.data.poNumber ?? (await generatePoNumber());

    try {
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          supplierId: parsed.data.supplierId,
          poNumber,
          totalAmount: parsed.data.totalAmount,
          status: PurchaseOrderStatus.DRAFT,
        },
        include: { supplier: { select: { name: true, country: true } } },
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
  async (req, res: Response) => {
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

    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id: paramId(req.params.id) },
      data: parsed.data,
    });
    res.json({ purchaseOrder });
  }
);

router.patch(
  "/:id/status",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req, res: Response) => {
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

    const purchaseOrder = await prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id },
        data: { status: parsed.data.status },
      });

      const current = await tx.purchaseOrder.findUniqueOrThrow({
        where: { id },
        include: { supplier: true, shipments: true },
      });

      if (parsed.data.status === PurchaseOrderStatus.SHIPPING) {
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
  async (req, res: Response) => {
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

    await prisma.purchaseOrder.delete({ where: { id: paramId(req.params.id) } });
    res.json({ message: "Purchase order deleted" });
  }
);

export default router;
