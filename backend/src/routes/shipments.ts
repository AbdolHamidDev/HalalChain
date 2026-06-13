import { Router, Response } from "express";
import { z } from "zod";
import { ShipmentStatus, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseBody, sendNotFound, sendValidationError } from "../lib/validate";
import { paramId } from "../lib/params";
import { AuthRequest, authenticate, authorize } from "../middleware/auth";
import { parsePaginationParams, buildPaginatedResponse } from "../lib/paginate";
import { logAudit } from "../lib/auditLog";
import { notifyShipmentDelayed } from "../lib/notificationService";

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
  async (req, res: Response) => {
    const params = parsePaginationParams(req.query as Record<string, unknown>);
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [total, shipments] = await Promise.all([
      prisma.shipment.count(),
      prisma.shipment.findMany({
        skip,
        take: limit,
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
      }),
    ]);

    res.json(buildPaginatedResponse(shipments, total, params));
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
  async (req: AuthRequest, res: Response) => {
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

    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);
    const previousStatus = existing.status;
    const newStatus = parsed.data.status;
    const statusChanged = newStatus !== undefined && newStatus !== previousStatus;

    const shipment = await prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: { id },
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

      // UPDATE audit log
      await logAudit(tx, {
        userId,
        action: "UPDATE",
        entityType: "Shipment",
        entityId: id,
        oldData: existing as unknown as Record<string, unknown>,
        newData: {
          id: updated.id,
          purchaseOrderId: updated.purchaseOrderId,
          trackingNumber: updated.trackingNumber,
          origin: updated.origin,
          destination: updated.destination,
          status: updated.status,
          estimatedArrival: updated.estimatedArrival,
          shippedAt: updated.shippedAt,
        },
      });

      // STATUS_CHANGE audit log (only when status actually changes)
      if (statusChanged) {
        await logAudit(tx, {
          userId,
          action: "STATUS_CHANGE",
          entityType: "Shipment",
          entityId: id,
          oldData: { status: previousStatus },
          newData: { status: newStatus },
        });

        if (newStatus === ShipmentStatus.DELAYED) {
          await notifyShipmentDelayed(tx, {
            trackingNumber: updated.trackingNumber,
            poNumber: updated.purchaseOrder.poNumber,
          });
        }
      }

      return updated;
    });

    res.json({ shipment });
  }
);

export default router;
