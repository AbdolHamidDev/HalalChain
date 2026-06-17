import { Router, Response } from "express";
import { z } from "zod";
import { UserRole, ZoneType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseBody, sendNotFound, sendValidationError } from "../lib/validate";
import { paramId } from "../lib/params";
import { AuthRequest, authenticate, authorize } from "../middleware/auth";
import { logAudit } from "../lib/auditLog";

const router = Router();

const createSchema = z.object({
  warehouseId: z.string().uuid(),
  name: z.string().min(2).max(100),
  zoneType: z.nativeEnum(ZoneType).optional(),
  capacity: z.coerce.number().int().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  zoneType: z.nativeEnum(ZoneType).optional(),
  capacity: z.coerce.number().int().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET /api/warehouse-zones — list zones, optionally filtered by warehouse
router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (req, res: Response) => {
    const where: Record<string, unknown> = {};
    if (typeof req.query.warehouseId === "string") where.warehouseId = req.query.warehouseId;
    if (typeof req.query.zoneType === "string") where.zoneType = req.query.zoneType;

    const zones = await prisma.warehouseZone.findMany({
      where: where as any,
      orderBy: { warehouseId: "asc" },
      include: {
        warehouse: { select: { id: true, name: true, location: true } },
        _count: { select: { inventory: true, batchLots: true } },
      },
    });

    res.json({ zones });
  }
);

// GET /api/warehouse-zones/:id
router.get(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (req, res: Response) => {
    const zone = await prisma.warehouseZone.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        warehouse: true,
        inventory: { include: { product: { select: { name: true, sku: true } } } },
        batchLots: {
          where: { quantity: { gt: 0 } },
          include: { product: { select: { name: true, sku: true } } },
        },
      },
    });
    if (!zone) {
      sendNotFound(res, "Warehouse zone");
      return;
    }
    res.json({ zone });
  }
);

// POST /api/warehouse-zones
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

    const userId = req.user?.sub ?? null;
    const zone = await prisma.$transaction(async (tx) => {
      const created = await tx.warehouseZone.create({
        data: { ...parsed.data, zoneType: parsed.data.zoneType ?? ZoneType.GENERAL },
      });
      await logAudit(tx, {
        userId,
        action: "CREATE",
        entityType: "WarehouseZone",
        entityId: created.id,
        newData: created as unknown as Record<string, unknown>,
      });
      return created;
    });

    res.status(201).json({ zone });
  }
);

// PATCH /api/warehouse-zones/:id
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

    const existing = await prisma.warehouseZone.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Warehouse zone");
      return;
    }

    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    const zone = await prisma.$transaction(async (tx) => {
      const updated = await tx.warehouseZone.update({
        where: { id },
        data: parsed.data,
      });
      await logAudit(tx, {
        userId,
        action: "UPDATE",
        entityType: "WarehouseZone",
        entityId: id,
        oldData: existing as unknown as Record<string, unknown>,
        newData: updated as unknown as Record<string, unknown>,
      });
      return updated;
    });

    res.json({ zone });
  }
);

export default router;