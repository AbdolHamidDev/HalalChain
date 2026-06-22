import { Router, Response } from "express";
import { z } from "zod";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseBody, sendNotFound, sendValidationError } from "../lib/validate";
import { paramId } from "../lib/params";
import { AuthRequest, authenticate, authorize } from "../middleware/auth";
import { blockDemoWrites } from "../middleware/demo-mode";
import { parsePaginationParams, buildPaginatedResponse } from "../lib/paginate";
import { logAudit } from "../lib/auditLog";
import { buildTraceabilityTimeline } from "../lib/traceabilityEngine";
import { generateProductQrCode } from "../lib/qrService";

const router = Router();

const createSchema = z.object({
  supplierId: z.string().uuid(),
  name: z.string().min(2).max(200),
  sku: z.string().min(2).max(50),
  category: z.string().min(2).max(100),
  unit: z.string().min(1).max(30),
  unitPrice: z.coerce.number().min(0).optional(),
});

const updateSchema = createSchema.partial().omit({ supplierId: true });

router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res: Response) => {
    const params = parsePaginationParams(req.query as Record<string, unknown>);
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
    if (req.query.name) where.name = { contains: String(req.query.name), mode: "insensitive" };
    if (req.query.sku) where.sku = { contains: String(req.query.sku), mode: "insensitive" };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          supplier: { select: { id: true, name: true, country: true } },
          inventory: { select: { quantity: true } },
        },
      }),
    ]);

    res.json(buildPaginatedResponse(products, total, params));
  }
);

router.get(
  "/:id/traceability",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res: Response) => {
    try {
      const result = await buildTraceabilityTimeline(String(req.params.id));
      res.json(result);
    } catch (err) {
      if (err instanceof Error && err.message === "PRODUCT_NOT_FOUND") {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      throw err;
    }
  }
);

router.get(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res: Response) => {
    const product = await prisma.product.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        supplier: true,
        inventory: { include: { warehouse: true } },
      },
    });
    if (!product) {
      sendNotFound(res, "Product");
      return;
    }
    const qrCodeUrl = await generateProductQrCode(
      product.id,
      process.env.FRONTEND_URL ?? "http://localhost:3000"
    );
    res.json({ product, qrCodeUrl });
  }
);

router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  blockDemoWrites,
  async (req: AuthRequest, res: Response) => {
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

    const userId = req.user?.sub ?? null;

    try {
      const product = await prisma.$transaction(async (tx) => {
        const created = await tx.product.create({ data: parsed.data });
        await logAudit(tx, {
          userId,
          action: "CREATE",
          entityType: "Product",
          entityId: created.id,
          newData: created as unknown as Record<string, unknown>,
        });
        return created;
      });
      res.status(201).json({ product });
    } catch {
      res.status(409).json({ error: "SKU already exists" });
    }
  }
);

router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  blockDemoWrites,
  async (req: AuthRequest, res: Response) => {
    const parsed = parseBody(updateSchema, req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.message);
      return;
    }

    const existing = await prisma.product.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Product");
      return;
    }

    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    try {
      const product = await prisma.$transaction(async (tx) => {
        const updated = await tx.product.update({
          where: { id },
          data: parsed.data,
        });
        await logAudit(tx, {
          userId,
          action: "UPDATE",
          entityType: "Product",
          entityId: updated.id,
          oldData: existing as unknown as Record<string, unknown>,
          newData: updated as unknown as Record<string, unknown>,
        });
        return updated;
      });
      res.json({ product });
    } catch {
      res.status(409).json({ error: "SKU already exists" });
    }
  }
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  blockDemoWrites,
  async (req: AuthRequest, res: Response) => {
    const existing = await prisma.product.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Product");
      return;
    }

    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    await prisma.$transaction(async (tx) => {
      await tx.product.delete({ where: { id } });
      await logAudit(tx, {
        userId,
        action: "DELETE",
        entityType: "Product",
        entityId: existing.id,
        oldData: existing as unknown as Record<string, unknown>,
      });
    });

    res.json({ message: "Product deleted" });
  }
);

export default router;
