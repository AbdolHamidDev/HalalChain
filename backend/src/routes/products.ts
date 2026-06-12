import { Router, Response } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseBody, sendNotFound, sendValidationError } from "../lib/validate";
import { paramId } from "../lib/params";
import { authenticate, authorize } from "../middleware/auth";

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
  async (_req, res: Response) => {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        supplier: { select: { id: true, name: true, country: true } },
        inventory: { select: { quantity: true } },
      },
    });
    res.json({ products });
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
    res.json({ product });
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

    try {
      const product = await prisma.product.create({ data: parsed.data });
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
  async (req, res: Response) => {
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

    try {
      const product = await prisma.product.update({
        where: { id: paramId(req.params.id) },
        data: parsed.data,
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
  async (req, res: Response) => {
    const existing = await prisma.product.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Product");
      return;
    }

    await prisma.product.delete({ where: { id: paramId(req.params.id) } });
    res.json({ message: "Product deleted" });
  }
);

export default router;
