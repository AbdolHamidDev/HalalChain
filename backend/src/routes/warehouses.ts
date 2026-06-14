import { Router, Response } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseBody, sendNotFound, sendValidationError } from "../lib/validate";
import { paramId } from "../lib/params";
import { AuthRequest, authenticate, authorize } from "../middleware/auth";
import { parsePaginationParams, buildPaginatedResponse } from "../lib/paginate";
import { logAudit } from "../lib/auditLog";

const router = Router();

const createSchema = z.object({
  name: z.string().min(2).max(200),
  location: z.string().min(2).max(500),
});

const updateSchema = createSchema.partial();

// GET /api/warehouses — list all warehouses with pagination
router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (req, res: Response) => {
    const params = parsePaginationParams(req.query as Record<string, unknown>);
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [total, warehouses] = await Promise.all([
      prisma.warehouse.count(),
      prisma.warehouse.findMany({
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          _count: { select: { inventory: true } },
        },
      }),
    ]);

    res.json(buildPaginatedResponse(warehouses, total, params));
  }
);

// GET /api/warehouses/:id — fetch single warehouse with stock summary
router.get(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (req, res: Response) => {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        inventory: {
          orderBy: { updatedAt: "desc" },
          include: {
            product: {
              select: { id: true, name: true, sku: true, unit: true, unitPrice: true },
            },
          },
        },
        _count: { select: { inventory: true, inventoryMovements: true } },
      },
    });

    if (!warehouse) {
      sendNotFound(res, "Warehouse");
      return;
    }

    res.json({ warehouse });
  }
);

// POST /api/warehouses — create warehouse (ADMIN only)
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

    const warehouse = await prisma.$transaction(async (tx) => {
      const created = await tx.warehouse.create({ data: parsed.data });
      await logAudit(tx, {
        userId,
        action: "CREATE",
        entityType: "Warehouse",
        entityId: created.id,
        newData: created as unknown as Record<string, unknown>,
      });
      return created;
    });

    res.status(201).json({ warehouse });
  }
);

// PATCH /api/warehouses/:id — update warehouse (ADMIN only)
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

    const existing = await prisma.warehouse.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Warehouse");
      return;
    }

    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    const warehouse = await prisma.$transaction(async (tx) => {
      const updated = await tx.warehouse.update({
        where: { id },
        data: parsed.data,
      });
      await logAudit(tx, {
        userId,
        action: "UPDATE",
        entityType: "Warehouse",
        entityId: updated.id,
        oldData: existing as unknown as Record<string, unknown>,
        newData: updated as unknown as Record<string, unknown>,
      });
      return updated;
    });

    res.json({ warehouse });
  }
);

// DELETE /api/warehouses/:id — delete warehouse if no active inventory (ADMIN only)
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const existing = await prisma.warehouse.findUnique({
      where: { id: paramId(req.params.id) },
      include: { _count: { select: { inventory: true } } },
    });
    if (!existing) {
      sendNotFound(res, "Warehouse");
      return;
    }

    // Prevent deletion if warehouse has active inventory
    if (existing._count.inventory > 0) {
      res.status(409).json({
        error: `Cannot delete warehouse with ${existing._count.inventory} active inventory record(s). Transfer or clear stock first.`,
      });
      return;
    }

    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    await prisma.$transaction(async (tx) => {
      await tx.warehouse.delete({ where: { id } });
      await logAudit(tx, {
        userId,
        action: "DELETE",
        entityType: "Warehouse",
        entityId: existing.id,
        oldData: existing as unknown as Record<string, unknown>,
      });
    });

    res.json({ message: "Warehouse deleted" });
  }
);

export default router;
