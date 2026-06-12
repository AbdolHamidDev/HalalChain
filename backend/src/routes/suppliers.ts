import { Router, Response } from "express";
import { z } from "zod";
import { SupplierStatus, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseBody, sendNotFound, sendValidationError } from "../lib/validate";
import { paramId } from "../lib/params";
import { AuthRequest, authenticate, authorize } from "../middleware/auth";

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
  async (_req, res: Response) => {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { products: true, halalCertificates: true } },
      },
    });
    res.json({ suppliers });
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
    const supplier = await prisma.supplier.create({
      data: { ...rest, email: email || null },
    });
    res.status(201).json({ supplier });
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

    const existing = await prisma.supplier.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Supplier");
      return;
    }

    const { email, ...rest } = parsed.data;
    const supplier = await prisma.supplier.update({
      where: { id: paramId(req.params.id) },
      data: {
        ...rest,
        ...(email !== undefined ? { email: email || null } : {}),
      },
    });
    res.json({ supplier });
  }
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req, res: Response) => {
    const existing = await prisma.supplier.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Supplier");
      return;
    }

    await prisma.supplier.delete({ where: { id: paramId(req.params.id) } });
    res.json({ message: "Supplier deleted" });
  }
);

export default router;
