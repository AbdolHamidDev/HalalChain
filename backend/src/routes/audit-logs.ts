import { Response, Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { buildPaginatedResponse } from "../lib/paginate";

const router = Router();

// GET /api/audit-logs
// Admin only. Pagination (default 50, max 100), filter by entityType/entityId, ordered by createdAt desc.
router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response): Promise<void> => {
    // Parse pagination with default 50, max 100
    const rawPage = Number(req.query.page);
    const rawLimit = Number(req.query.limit);

    const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
    const limitRaw = Number.isInteger(rawLimit) ? rawLimit : 50;
    const limit = Math.min(Math.max(limitRaw <= 0 ? 1 : limitRaw, 1), 100);

    // Build filter
    const where: {
      entityType?: string;
      entityId?: string;
    } = {};

    if (req.query.entityType) {
      where.entityType = String(req.query.entityType);
    }
    if (req.query.entityId) {
      where.entityId = String(req.query.entityId);
    }

    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true },
          },
        },
      }),
    ]);

    res.json(buildPaginatedResponse(data, total, { page, limit }));
  }
);

export default router;
