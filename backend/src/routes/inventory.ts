import { Router, Response } from "express";
import { z } from "zod";
import { InventoryMovementType, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseBody, sendNotFound, sendValidationError } from "../lib/validate";
import { AuthRequest, authenticate, authorize } from "../middleware/auth";

const router = Router();

const movementSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  note: z.string().max(500).optional(),
});

router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (_req, res: Response) => {
    const inventory = await prisma.inventory.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true,
            unitPrice: true,
            supplier: { select: { name: true, country: true } },
          },
        },
        warehouse: { select: { id: true, name: true, location: true } },
      },
    });
    res.json({ inventory });
  }
);

router.get(
  "/movements",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (req, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const movements = await prisma.inventoryMovement.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } },
        user: { select: { name: true } },
      },
    });
    res.json({ movements });
  }
);

router.get(
  "/warehouses",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (_req, res: Response) => {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ warehouses });
  }
);

async function executeMovement(
  type: InventoryMovementType,
  data: z.infer<typeof movementSchema>,
  userId: string
) {
  const [product, warehouse] = await Promise.all([
    prisma.product.findUnique({ where: { id: data.productId } }),
    prisma.warehouse.findUnique({ where: { id: data.warehouseId } }),
  ]);

  if (!product) throw new Error("PRODUCT_NOT_FOUND");
  if (!warehouse) throw new Error("WAREHOUSE_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.inventory.findUnique({
      where: {
        productId_warehouseId: {
          productId: data.productId,
          warehouseId: data.warehouseId,
        },
      },
    });

    if (type === InventoryMovementType.OUTBOUND) {
      const currentQty = existing?.quantity ?? 0;
      if (currentQty < data.quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }
    }

    const inventory = existing
      ? await tx.inventory.update({
          where: { id: existing.id },
          data: {
            quantity:
              type === InventoryMovementType.INBOUND
                ? existing.quantity + data.quantity
                : existing.quantity - data.quantity,
          },
        })
      : await tx.inventory.create({
          data: {
            productId: data.productId,
            warehouseId: data.warehouseId,
            quantity:
              type === InventoryMovementType.INBOUND ? data.quantity : 0,
          },
        });

    if (
      type === InventoryMovementType.OUTBOUND &&
      !existing &&
      inventory.quantity < 0
    ) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const movement = await tx.inventoryMovement.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        type,
        quantity: data.quantity,
        note: data.note,
        performedBy: userId,
      },
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } },
      },
    });

    return { inventory, movement };
  });
}

router.post(
  "/inbound",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  async (req: AuthRequest, res: Response) => {
    const parsed = parseBody(movementSchema, req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.message);
      return;
    }

    try {
      const result = await executeMovement(
        InventoryMovementType.INBOUND,
        parsed.data,
        req.user!.sub
      );
      res.status(201).json(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "PRODUCT_NOT_FOUND") sendNotFound(res, "Product");
      else if (msg === "WAREHOUSE_NOT_FOUND") sendNotFound(res, "Warehouse");
      else sendValidationError(res, "Movement failed");
    }
  }
);

router.post(
  "/outbound",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  async (req: AuthRequest, res: Response) => {
    const parsed = parseBody(movementSchema, req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.message);
      return;
    }

    try {
      const result = await executeMovement(
        InventoryMovementType.OUTBOUND,
        parsed.data,
        req.user!.sub
      );
      res.status(201).json(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "INSUFFICIENT_STOCK") {
        res.status(400).json({ error: "Insufficient stock for outbound" });
      } else if (msg === "PRODUCT_NOT_FOUND") sendNotFound(res, "Product");
      else if (msg === "WAREHOUSE_NOT_FOUND") sendNotFound(res, "Warehouse");
      else sendValidationError(res, "Movement failed");
    }
  }
);

export default router;
