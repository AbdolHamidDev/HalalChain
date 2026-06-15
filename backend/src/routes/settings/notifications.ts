import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate, AuthRequest } from "../../middleware/auth";
import { getPreference } from "../../lib/emailService";
import { logAudit } from "../../lib/auditLog";

const router = Router();

const patchPrefsSchema = z.object({
  certificateAlerts: z.boolean().optional(),
  inventoryAlerts: z.boolean().optional(),
  shipmentAlerts: z.boolean().optional(),
  invitationEmails: z.boolean().optional(),
});

// GET /api/settings/notifications
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.sub;
  const preferences = await getPreference(userId);
  res.json({ preferences });
});

// PATCH /api/settings/notifications
router.patch("/", authenticate, async (req: AuthRequest, res: Response) => {
  const parsed = patchPrefsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const userId = req.user!.sub;
  const data = parsed.data;

  const preferences = await prisma.$transaction(async (tx) => {
    const defaults = {
      certificateAlerts: true,
      inventoryAlerts: true,
      shipmentAlerts: true,
      invitationEmails: true,
    };

    const updated = await tx.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...defaults, ...data },
      update: data,
    });

    await logAudit(tx, {
      userId,
      action: "UPDATE",
      entityType: "NotificationPreference",
      entityId: updated.id,
      oldData: null,
      newData: data as Record<string, unknown>,
    });

    return updated;
  });

  res.json({ preferences });
});

export default router;
