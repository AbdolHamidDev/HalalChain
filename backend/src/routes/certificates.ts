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
  certificateNumber: z.string().min(3).max(100),
  issuedBy: z.string().min(2).max(100),
  issueDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  fileUrl: z.string().url().optional().or(z.literal("")),
});

const updateSchema = createSchema.partial().omit({ supplierId: true });

router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (_req, res: Response) => {
    const certificates = await prisma.halalCertificate.findMany({
      orderBy: { expiryDate: "asc" },
      include: {
        supplier: { select: { id: true, name: true, country: true } },
      },
    });
    res.json({ certificates });
  }
);

router.get(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res: Response) => {
    const certificate = await prisma.halalCertificate.findUnique({
      where: { id: paramId(req.params.id) },
      include: { supplier: true },
    });
    if (!certificate) {
      sendNotFound(res, "Certificate");
      return;
    }
    res.json({ certificate });
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

    if (parsed.data.expiryDate <= parsed.data.issueDate) {
      sendValidationError(res, "Expiry date must be after issue date");
      return;
    }

    const { fileUrl, ...rest } = parsed.data;
    const certificate = await prisma.halalCertificate.create({
      data: { ...rest, fileUrl: fileUrl || null },
    });
    res.status(201).json({ certificate });
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

    const existing = await prisma.halalCertificate.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Certificate");
      return;
    }

    const { fileUrl, ...rest } = parsed.data;
    const certificate = await prisma.halalCertificate.update({
      where: { id: paramId(req.params.id) },
      data: {
        ...rest,
        ...(fileUrl !== undefined ? { fileUrl: fileUrl || null } : {}),
      },
    });
    res.json({ certificate });
  }
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req, res: Response) => {
    const existing = await prisma.halalCertificate.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Certificate");
      return;
    }

    await prisma.halalCertificate.delete({ where: { id: paramId(req.params.id) } });
    res.json({ message: "Certificate deleted" });
  }
);

export default router;
