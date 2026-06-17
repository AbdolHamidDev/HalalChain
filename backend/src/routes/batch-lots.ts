import { Router, Response } from "express";
import { z } from "zod";
import { BatchLotStatus, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseBody, sendNotFound, sendValidationError } from "../lib/validate";
import { paramId } from "../lib/params";
import { AuthRequest, authenticate, authorize } from "../middleware/auth";
import { parsePaginationParams, buildPaginatedResponse } from "../lib/paginate";
import { logAudit } from "../lib/auditLog";

const router = Router();

const createSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  zoneId: z.string().uuid().optional().nullable(),
  lotNumber: z.string().min(2).max(100),
  quantity: z.coerce.number().int().min(0),
  manufacturedAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  purchaseOrderId: z.string().uuid().optional().nullable(),
  status: z.nativeEnum(BatchLotStatus).optional(),
});

const updateSchema = z.object({
  zoneId: z.string().uuid().optional().nullable(),
  quantity: z.coerce.number().int().min(0).optional(),
  status: z.nativeEnum(BatchLotStatus).optional(),
});

// GET /api/batch-lots — list all batch lots
router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (req, res: Response) => {
    const params = parsePaginationParams(req.query as Record<string, unknown>);
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (typeof req.query.productId === "string") where.productId = req.query.productId;
    if (typeof req.query.warehouseId === "string") where.warehouseId = req.query.warehouseId;
    if (typeof req.query.status === "string") where.status = req.query.status;
    if (typeof req.query.lotNumber === "string") where.lotNumber = { contains: req.query.lotNumber, mode: "insensitive" };

    const [total, batches] = await Promise.all([
      prisma.batchLot.count({ where: where as any }),
      prisma.batchLot.findMany({
        where: where as any,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
          zone: { select: { id: true, name: true, zoneType: true } },
          purchaseOrder: { select: { poNumber: true } },
        },
      }),
    ]);

    res.json(buildPaginatedResponse(batches, total, params));
  }
);

// GET /api/batch-lots/expiring — batches expiring within N days
router.get(
  "/expiring",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (req, res: Response) => {
    const days = Number(req.query.days) || 30;
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);

    const batches = await prisma.batchLot.findMany({
      where: {
        expiresAt: { lte: threshold, gte: new Date() },
        status: BatchLotStatus.AVAILABLE,
        quantity: { gt: 0 },
      },
      orderBy: { expiresAt: "asc" },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
        zone: { select: { id: true, name: true } },
      },
    });

    res.json({ batches });
  }
);

// GET /api/batch-lots/:id
router.get(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (req, res: Response) => {
    const batch = await prisma.batchLot.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        product: true,
        warehouse: true,
        zone: true,
        purchaseOrder: { select: { poNumber: true } },
        movements: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { user: { select: { name: true } } },
        },
      },
    });
    if (!batch) {
      sendNotFound(res, "Batch lot");
      return;
    }
    res.json({ batchLot: batch });
  }
);

// POST /api/batch-lots
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req: AuthRequest, res: Response) => {
    const parsed = parseBody(createSchema, req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.message);
      return;
    }

    const { lotNumber, productId, warehouseId } = parsed.data;
    const existing = await prisma.batchLot.findFirst({
      where: { lotNumber, productId, warehouseId },
    });
    if (existing) {
      res.status(409).json({ error: "Batch lot already exists for this product/warehouse" });
      return;
    }

    const userId = req.user?.sub ?? null;
    const batch = await prisma.$transaction(async (tx) => {
      const created = await tx.batchLot.create({
        data: {
          ...parsed.data,
          status: parsed.data.status ?? BatchLotStatus.AVAILABLE,
        },
        include: {
          product: { select: { name: true, sku: true } },
          warehouse: { select: { name: true } },
        },
      });
      await logAudit(tx, {
        userId,
        action: "CREATE",
        entityType: "BatchLot",
        entityId: created.id,
        newData: created as unknown as Record<string, unknown>,
      });
      return created;
    });

    res.status(201).json({ batchLot: batch });
  }
);

// PATCH /api/batch-lots/:id
router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req: AuthRequest, res: Response) => {
    const parsed = parseBody(updateSchema, req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.message);
      return;
    }

    const existing = await prisma.batchLot.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Batch lot");
      return;
    }

    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    const batch = await prisma.$transaction(async (tx) => {
      const updated = await tx.batchLot.update({
        where: { id },
        data: parsed.data,
        include: {
          product: { select: { name: true, sku: true } },
          warehouse: { select: { name: true } },
        },
      });
      await logAudit(tx, {
        userId,
        action: "UPDATE",
        entityType: "BatchLot",
        entityId: id,
        oldData: existing as unknown as Record<string, unknown>,
        newData: updated as unknown as Record<string, unknown>,
      });
      return updated;
    });

    res.json({ batchLot: batch });
  }
);

export default router;