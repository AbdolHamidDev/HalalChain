import { Router, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";
import {
  defaultAnalyticsRange,
  getCertificateAnalytics,
  getInventoryAnalytics,
  getPurchaseOrderAnalytics,
  getShipmentAnalytics,
  type DateRange,
} from "../lib/analyticsService";

const router = Router();

const rangeSchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: "from must be before to",
  });

function parseRange(query: unknown): { success: true; range: DateRange } | { success: false; error: string } {
  const parsed = rangeSchema.safeParse(query);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid date range" };

  const fallback = defaultAnalyticsRange(6);
  return {
    success: true,
    range: {
      from: parsed.data.from ?? fallback.from,
      to: parsed.data.to ?? fallback.to,
    },
  };
}

function analyticsHandler<T>(compute: (range: DateRange) => Promise<T>) {
  return async (req: Request, res: Response) => {
    const parsed = parseRange(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    try {
      res.json(await compute(parsed.range));
    } catch (err) {
      console.error("Analytics query failed:", err);
      res.status(500).json({ error: "Failed to compute analytics" });
    }
  };
}

router.get(
  "/inventory",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  analyticsHandler((range) => getInventoryAnalytics(prisma, range))
);

router.get(
  "/purchase-orders",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  analyticsHandler((range) => getPurchaseOrderAnalytics(prisma, range))
);

router.get(
  "/shipments",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  analyticsHandler((range) => getShipmentAnalytics(prisma, range))
);

router.get(
  "/certificates",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  analyticsHandler((range) => getCertificateAnalytics(prisma, range))
);

export default router;
