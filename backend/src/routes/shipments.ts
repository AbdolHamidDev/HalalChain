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

const createSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  trackingNumber: z.string().min(3).max(100),
  origin: z.string().min(2).max(200),
  destination: z.string().min(2).max(200),
  estimatedArrival: z.coerce.date().optional().nullable(),
});

const updateSchema = z.object({
  trackingNumber: z.string().min(3).max(100).optional(),
  origin: z.string().min(2).max(200).optional(),
  destination: z.string().min(2).max(200).optional(),
  status: z.nativeEnum(ShipmentStatus).optional(),
  estimatedArrival: z.coerce.date().optional().nullable(),
});

// POST /api/shipments — create a new shipment for an existing purchase order (ADMIN only)
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

    const { purchaseOrderId, trackingNumber, origin, destination, estimatedArrival } = parsed.data;
    const userId = req.user?.sub ?? null;

    // Validate PO exists
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
    });
    if (!po) {
      sendNotFound(res, "Purchase order");
      return;
    }

    // Prevent duplicate tracking numbers
    const existingTracking = await prisma.shipment.findFirst({
      where: { trackingNumber },
    });
    if (existingTracking) {
      res.status(409).json({ error: "Tracking number already exists" });
      return;
    }

    const shipment = await prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          purchaseOrderId,
          trackingNumber,
          origin,
          destination,
          status: ShipmentStatus.PENDING,
          estimatedArrival: estimatedArrival ?? null,
        },
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

      await logAudit(tx, {
        userId,
        action: "CREATE",
        entityType: "Shipment",
        entityId: created.id,
        newData: {
          id: created.id,
          purchaseOrderId,
          trackingNumber,
          origin,
          destination,
          status: created.status,
          estimatedArrival: created.estimatedArrival,
        },
      });

      return created;
    });

    res.status(201).json({ shipment });
  }
);

// GET /api/shipments — list shipments with pagination
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

// GET /api/shipments/:id — fetch single shipment
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

// PATCH /api/shipments/:id — update shipment status and details (ADMIN only)
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
