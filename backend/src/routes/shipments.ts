import { Router, Response } from "express";
import { z } from "zod";
import { ShipmentStatus, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseBody, sendNotFound, sendValidationError } from "../lib/validate";
import { paramId } from "../lib/params";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

const updateSchema = z.object({
  trackingNumber: z.string().min(3).max(100).optional(),
  origin: z.string().min(2).max(200).optional(),
  destination: z.string().min(2).max(200).optional(),
  status: z.nativeEnum(ShipmentStatus).optional(),
  estimatedArrival: z.coerce.date().optional().nullable(),
});

router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (_req, res: Response) => {
    const shipments = await prisma.shipment.findMany({
      orderBy: { estimatedArrival: "asc" },
      include: {
        purchaseOrder: {
          select: {
            poNumber: true,
            status: true,
            supplier: { select: { name: true, country: true } },
          },
        },
      },
    });
    res.json({ shipments });
  }
);

router.get(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res: Response) => {
    const shipment = await prisma.shipment.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        purchaseOrder: { include: { supplier: true } },
      },
    });
    if (!shipment) {
      sendNotFound(res, "Shipment");
      return;
    }
    res.json({ shipment });
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

    const existing = await prisma.shipment.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Shipment");
      return;
    }

    const shipment = await prisma.shipment.update({
      where: { id: paramId(req.params.id) },
      data: parsed.data,
      include: {
        purchaseOrder: {
          select: {
            poNumber: true,
            supplier: { select: { name: true, country: true } },
          },
        },
      },
    });
    res.json({ shipment });
  }
);

export default router;
