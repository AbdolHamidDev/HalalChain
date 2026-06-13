import { Router, Response } from "express";
import { z } from "zod";
import { Prisma, SupplierStatus, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseBody, sendNotFound, sendValidationError } from "../lib/validate";
import { paramId } from "../lib/params";
import { AuthRequest, authenticate, authorize } from "../middleware/auth";
import { parsePaginationParams, buildPaginatedResponse } from "../lib/paginate";
import { logAudit } from "../lib/auditLog";

const router = Router();

const createSchema = z.object({
  name: z.string().min(2).max(200),
  country: z.string().min(2).max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  status: z.nativeEnum(SupplierStatus).optional(),
});

const updateSchema = createSchema.partial();

router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res: Response) => {
    const params = parsePaginationParams(req.query as Record<string, unknown>);
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = {};
    if (req.query.name) {
      where.name = { contains: String(req.query.name), mode: "insensitive" };
    }
    if (req.query.country) {
      where.country = { equals: String(req.query.country), mode: "insensitive" };
    }
    if (
      req.query.status &&
      ["ACTIVE", "INACTIVE"].includes(String(req.query.status))
    ) {
      where.status = req.query.status as SupplierStatus;
    }

    const [total, suppliers] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { products: true, halalCertificates: true } },
        },
      }),
    ]);

    res.json(buildPaginatedResponse(suppliers, total, params));
  }
);

router.get(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res: Response) => {
    const supplier = await prisma.supplier.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        products: { select: { id: true, name: true, sku: true } },
        halalCertificates: true,
      },
    });
    if (!supplier) {
      sendNotFound(res, "Supplier");
      return;
    }
    res.json({ supplier });
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

    const { email, ...rest } = parsed.data;
    const userId = req.user?.sub ?? null;

    const supplier = await prisma.$transaction(async (tx) => {
      const created = await tx.supplier.create({
        data: { ...rest, email: email || null },
      });
      await logAudit(tx, {
        userId,
        action: "CREATE",
        entityType: "Supplier",
        entityId: created.id,
        newData: created as unknown as Record<string, unknown>,
      });
      return created;
    });

    res.status(201).json({ supplier });
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

    const existing = await prisma.supplier.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Supplier");
      return;
    }

    const { email, ...rest } = parsed.data;
    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    const supplier = await prisma.$transaction(async (tx) => {
      const updated = await tx.supplier.update({
        where: { id },
        data: {
          ...rest,
          ...(email !== undefined ? { email: email || null } : {}),
        },
      });
      await logAudit(tx, {
        userId,
        action: "UPDATE",
        entityType: "Supplier",
        entityId: updated.id,
        oldData: existing as unknown as Record<string, unknown>,
        newData: updated as unknown as Record<string, unknown>,
      });
      return updated;
    });

    res.json({ supplier });
  }
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const existing = await prisma.supplier.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Supplier");
      return;
    }

    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    await prisma.$transaction(async (tx) => {
      await tx.supplier.delete({ where: { id } });
      await logAudit(tx, {
        userId,
        action: "DELETE",
        entityType: "Supplier",
        entityId: existing.id,
        oldData: existing as unknown as Record<string, unknown>,
      });
    });

    res.json({ message: "Supplier deleted" });
  }
);

export default router;
