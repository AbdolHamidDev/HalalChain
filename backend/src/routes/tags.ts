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
  name: z.string().min(2).max(100),
  color: z.string().max(20).optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  color: z.string().max(20).optional().nullable(),
});

// GET /api/tags
router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (_req, res: Response) => {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { productTags: true } },
      },
    });
    res.json({ tags });
  }
);

// GET /api/tags/:id
router.get(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (req, res: Response) => {
    const tag = await prisma.tag.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        productTags: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
    });
    if (!tag) {
      sendNotFound(res, "Tag");
      return;
    }
    res.json({ tag });
  }
);

// POST /api/tags
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

    const tag = await prisma.$transaction(async (tx) => {
      const created = await tx.tag.create({ data: parsed.data });
      await logAudit(tx, {
        userId,
        action: "CREATE",
        entityType: "Tag",
        entityId: created.id,
        newData: created as unknown as Record<string, unknown>,
      });
      return created;
    });

    res.status(201).json({ tag });
  }
);

// PATCH /api/tags/:id
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

    const existing = await prisma.tag.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Tag");
      return;
    }

    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    const tag = await prisma.$transaction(async (tx) => {
      const updated = await tx.tag.update({ where: { id }, data: parsed.data });
      await logAudit(tx, {
        userId,
        action: "UPDATE",
        entityType: "Tag",
        entityId: id,
        oldData: existing as unknown as Record<string, unknown>,
        newData: updated as unknown as Record<string, unknown>,
      });
      return updated;
    });

    res.json({ tag });
  }
);

// DELETE /api/tags/:id
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const existing = await prisma.tag.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Tag");
      return;
    }

    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    await prisma.$transaction(async (tx) => {
      await tx.tag.delete({ where: { id } });
      await logAudit(tx, {
        userId,
        action: "DELETE",
        entityType: "Tag",
        entityId: id,
        oldData: existing as unknown as Record<string, unknown>,
      });
    });

    res.json({ message: "Tag deleted" });
  }
);

// POST /api/tags/:tagId/products/:productId — attach tag to product
router.post(
  "/:tagId/products/:productId",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req: AuthRequest, res: Response) => {
    const tagId = String(req.params.tagId);
    const productId = String(req.params.productId);
    try {
      const pt = await prisma.productTag.create({
        data: { tagId, productId },
        include: { tag: true },
      });
      res.status(201).json({ productTag: pt });
    } catch {
      res.status(409).json({ error: "Tag already attached to product" });
    }
  }
);

// DELETE /api/tags/:tagId/products/:productId — detach tag from product
router.delete(
  "/:tagId/products/:productId",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req: AuthRequest, res: Response) => {
    const tagId = String(req.params.tagId);
    const productId = String(req.params.productId);
    try {
      await prisma.productTag.delete({
        where: { productId_tagId: { productId, tagId } },
      });
      res.json({ message: "Tag detached from product" });
    } catch {
      sendNotFound(res, "Product tag association");
    }
  }
);

export default router;