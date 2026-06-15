import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { parsePaginationParams, buildPaginatedResponse } from "../lib/paginate";
import { addNotificationClient, publishNotificationEvent } from "../lib/notificationStream";

const router = Router();

router.get("/stream", authenticate, async (req: AuthRequest, res: Response) => {
  const cleanup = addNotificationClient(req.user!.sub, res);

  req.on("close", cleanup);
  req.on("error", cleanup);
});

// GET / — list notifications for the authenticated user (paginated)
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const params = parsePaginationParams(req.query as Record<string, unknown>);
    const skip = (params.page - 1) * params.limit;

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: params.limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    res.json(buildPaginatedResponse(data, total, params));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /read-all — mark all unread notifications as read for the caller
// MUST be declared BEFORE /:id/read to avoid route collision
router.patch(
  "/read-all",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;

      const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      publishNotificationEvent([userId], "notification_read", {
        scope: "all",
        updated: result.count,
      });

      res.json({ updated: result.count });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /:id/read — mark a single notification as read (ownership verified)
router.patch(
  "/:id/read",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const id = req.params.id as string;

      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification || notification.userId !== userId) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      publishNotificationEvent([userId], "notification_read", updated);

      res.status(200).json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
