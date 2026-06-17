import { Router, Response } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseBody, sendNotFound, sendValidationError } from "../lib/validate";
import { paramId } from "../lib/params";
import { AuthRequest, authenticate, authorize } from "../middleware/auth";
import { logAudit } from "../lib/auditLog";

const router = Router();

const createSchema = z.object({
  supplierId: z.string().uuid(),
  name: z.string().min(2).max(200),
  role: z.string().max(100).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(30).optional().nullable(),
  isPrimary: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  role: z.string().max(100).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(30).optional().nullable(),
  isPrimary: z.boolean().optional(),
});

// GET /api/supplier-contacts — list contacts, filtered by supplier
router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (req, res: Response) => {
    const where: Record<string, unknown> = {};
    if (typeof req.query.supplierId === "string") where.supplierId = req.query.supplierId;

    const contacts = await prisma.supplierContact.findMany({
      where: where as any,
      orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
      include: {
        supplier: { select: { id: true, name: true, country: true } },
      },
    });

    res.json({ contacts });
  }
);

// GET /api/supplier-contacts/:id
router.get(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (req, res: Response) => {
    const contact = await prisma.supplierContact.findUnique({
      where: { id: paramId(req.params.id) },
      include: { supplier: true },
    });
    if (!contact) {
      sendNotFound(res, "Supplier contact");
      return;
    }
    res.json({ contact });
  }
);

// POST /api/supplier-contacts
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

    const userId = req.user?.sub ?? null;

    // If setting as primary, unset any existing primary for this supplier
    if (parsed.data.isPrimary) {
      await prisma.supplierContact.updateMany({
        where: { supplierId: parsed.data.supplierId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.$transaction(async (tx) => {
      const { email, ...rest } = parsed.data;
      const created = await tx.supplierContact.create({
        data: { ...rest, email: email || null },
        include: {
          supplier: { select: { name: true } },
        },
      });
      await logAudit(tx, {
        userId,
        action: "CREATE",
        entityType: "SupplierContact",
        entityId: created.id,
        newData: created as unknown as Record<string, unknown>,
      });
      return created;
    });

    res.status(201).json({ contact });
  }
);

// PATCH /api/supplier-contacts/:id
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

    const existing = await prisma.supplierContact.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Supplier contact");
      return;
    }

    // If setting as primary, unset any existing primary for this supplier
    if (parsed.data.isPrimary) {
      await prisma.supplierContact.updateMany({
        where: { supplierId: existing.supplierId, isPrimary: true, id: { not: existing.id } },
        data: { isPrimary: false },
      });
    }

    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    const contact = await prisma.$transaction(async (tx) => {
      const { email, ...rest } = parsed.data;
      const updated = await tx.supplierContact.update({
        where: { id },
        data: {
          ...rest,
          ...(email !== undefined ? { email: email || null } : {}),
        },
        include: { supplier: { select: { name: true } } },
      });
      await logAudit(tx, {
        userId,
        action: "UPDATE",
        entityType: "SupplierContact",
        entityId: id,
        oldData: existing as unknown as Record<string, unknown>,
        newData: updated as unknown as Record<string, unknown>,
      });
      return updated;
    });

    res.json({ contact });
  }
);

// DELETE /api/supplier-contacts/:id
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const existing = await prisma.supplierContact.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Supplier contact");
      return;
    }

    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    await prisma.$transaction(async (tx) => {
      await tx.supplierContact.delete({ where: { id } });
      await logAudit(tx, {
        userId,
        action: "DELETE",
        entityType: "SupplierContact",
        entityId: id,
        oldData: existing as unknown as Record<string, unknown>,
      });
    });

    res.json({ message: "Supplier contact deleted" });
  }
);

export default router;