import { Request, Response, Router } from "express";
import { z } from "zod";
import { UserRole, UserStatus } from "@prisma/client";
import multer from "multer";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { buildUserResponse } from "../lib/userResponse";
import { validateName } from "../lib/validateName";
import { validatePassword } from "../lib/passwordValidator";
import { logAudit } from "../lib/auditLog";
import { avatarUpload, uploadAvatarToCloudinary, deleteAvatarFromCloudinary } from "../lib/avatarUpload";
import { parsePaginationParams } from "../lib/paginate";

const router = Router();

// Apply authentication and ADMIN authorization to all routes in this router
router.use(authenticate, authorize(UserRole.ADMIN));

// GET /api/admin/users/stats — aggregate counts for the stats header
// NOTE: must be declared BEFORE /:id to avoid route shadowing
router.get("/stats", async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, active, suspended, unverified, admins, managers, staff] =
      await prisma.$transaction([
        prisma.user.count(),
        prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
        prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
        prisma.user.count({ where: { isVerified: false } }),
        prisma.user.count({ where: { role: UserRole.ADMIN } }),
        prisma.user.count({ where: { role: UserRole.MANAGER } }),
        prisma.user.count({ where: { role: UserRole.STAFF } }),
      ]);

    res.json({ stats: { total, active, suspended, unverified, byRole: { admins, managers, staff } } });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/users — list all users (admin only) with pagination + filters
// NOTE: must be declared BEFORE /:id to avoid route shadowing
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit } = parsePaginationParams(req.query as Record<string, unknown>);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
    const role =
      typeof req.query.role === "string" && Object.values(UserRole).includes(req.query.role as UserRole)
        ? (req.query.role as UserRole)
        : undefined;
    const status =
      typeof req.query.status === "string" && Object.values(UserStatus).includes(req.query.status as UserStatus)
        ? (req.query.status as UserStatus)
        : undefined;

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    res.json({
      users: users.map(buildUserResponse),
      page,
      limit,
      total,
      totalPages,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/users/:id — fetch target user profile
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetId = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user: buildUserResponse(user) });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/users/:id — update target user's display name
const patchUserSchema = z.object({
  name: z.string(),
});

router.patch("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.sub;
    const targetId = req.params.id as string;

    // Zod validation
    const parsed = patchUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    // Name business-rule validation
    const nameResult = validateName(parsed.data.name);
    if (!nameResult.valid) {
      res.status(400).json({ error: nameResult.error });
      return;
    }

    const trimmedName = parsed.data.name.trim();

    // Check target user exists before writing
    const currentUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!currentUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Update + audit log in a single atomic transaction (Requirements 11.4, 11.6)
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: targetId },
        data: { name: trimmedName },
      });

      await logAudit(tx, {
        userId: adminId,
        action: "UPDATE",
        entityType: "User",
        entityId: targetId,
        oldData: { name: currentUser.name },
        newData: { name: trimmedName },
      });

      return updated;
    });

    res.json({ user: buildUserResponse(updatedUser) });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/users/:id/avatar — upload avatar for a target user (admin only)
router.post("/:id/avatar", (req: AuthRequest, res: Response): void => {
  avatarUpload.single("avatar")(req as Request, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        res.status(400).json({ error: "File too large. Maximum size is 5 MB" });
      } else if (err instanceof Error && err.message === "Unsupported file type") {
        res.status(400).json({ error: "Unsupported file type. Accepted: JPEG, PNG, GIF, WebP" });
      } else {
        res.status(400).json({ error: "File upload failed" });
      }
      return;
    }

    try {
      const adminId = req.user!.sub;
      const targetId = req.params.id as string;

      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const currentUser = await prisma.user.findUnique({ where: { id: targetId } });
      if (!currentUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const oldAvatarUrl = currentUser.avatarUrl;
      const oldPublicId = currentUser.avatarPublicId;

      // Upload new image to Cloudinary (in-memory buffer, never touches disk)
      const { secureUrl, publicId } = await uploadAvatarToCloudinary(
        req.file.buffer,
        req.file.mimetype
      );

      const updatedUser = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: targetId },
          data: { avatarUrl: secureUrl, avatarPublicId: publicId },
        });

        await logAudit(tx, {
          userId: adminId,
          action: "UPDATE",
          entityType: "User",
          entityId: targetId,
          oldData: { avatarUrl: oldAvatarUrl },
          newData: { avatarUrl: secureUrl },
        });

        return updated;
      });

      // Delete old Cloudinary asset after DB commit (non-blocking)
      if (oldPublicId) {
        deleteAvatarFromCloudinary(oldPublicId);
      }

      res.json({ user: buildUserResponse(updatedUser) });
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  });
});

// PATCH /api/admin/users/:id/verify — toggle isVerified for a user (admin only)
const verifyUserSchema = z.object({
  isVerified: z.boolean(),
});

router.patch("/:id/verify", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.sub;
    const targetId = req.params.id as string;

    const parsed = verifyUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { isVerified } = parsed.data;

    const currentUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!currentUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: targetId },
        data: { isVerified },
      });

      await logAudit(tx, {
        userId: adminId,
        action: "UPDATE",
        entityType: "User",
        entityId: targetId,
        oldData: { isVerified: currentUser.isVerified },
        newData: { isVerified },
      });

      return updated;
    });

    res.json({ user: buildUserResponse(updatedUser) });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/users/:id/reset-password — admin resets a user's password (no current password required)
const resetPasswordSchema = z.object({
  newPassword: z.string(),
});

router.post("/:id/reset-password", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.sub;
    const targetId = req.params.id as string;

    // 1. Zod schema validation (req 9.3)
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { newPassword } = parsed.data;

    // 2. Fetch target user — 404 if not found (req 9.6)
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // 3. Enforce password complexity rules (req 9.2, 9.3)
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      res.status(400).json({ error: passwordCheck.errors[0], errors: passwordCheck.errors });
      return;
    }

    // 4. Hash the new password with bcrypt cost 12 (req 9.4)
    const newHash = await bcrypt.hash(newPassword, 12);

    // 5. Wrap update + audit log in a single atomic transaction (req 9.5, 11.3, 11.6)
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetId },
        data: {
          passwordHash: newHash,
          tokenVersion: { increment: 1 }, // invalidate all existing sessions
        },
      });

      // Delete all refresh tokens so active refresh cookies are immediately invalidated (req 7.7)
      await tx.refreshToken.deleteMany({ where: { userId: targetId } });

      await logAudit(tx, {
        userId: adminId,
        action: "UPDATE",
        entityType: "User",
        entityId: targetId,
        oldData: null,
        newData: { event: "password_reset_by_admin", adminId: adminId },
      });
    });

    // 6. Return success (req 9.5)
    res.status(200).json({ message: "Password reset successfully" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/users/:id/status — suspend or activate a user (admin only)
const updateStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

router.patch("/:id/status", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.sub;
    const targetId = req.params.id as string;

    // Prevent admin from suspending themselves
    if (targetId === adminId) {
      res.status(400).json({ error: "You cannot suspend your own account." });
      return;
    }

    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { status } = parsed.data;

    const currentUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!currentUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: targetId },
        data: {
          status,
          // Increment tokenVersion when suspending so existing sessions are immediately invalidated
          ...(status === UserStatus.SUSPENDED ? { tokenVersion: { increment: 1 } } : {}),
        },
      });

      // Delete all refresh tokens when suspending so active refresh cookies are immediately invalidated (req 7.8)
      if (status === UserStatus.SUSPENDED) {
        await tx.refreshToken.deleteMany({ where: { userId: targetId } });
      }

      await logAudit(tx, {
        userId: adminId,
        action: "STATUS_CHANGE",
        entityType: "User",
        entityId: targetId,
        oldData: { status: currentUser.status },
        newData: { status },
      });

      return updated;
    });

    res.json({ user: buildUserResponse(updatedUser) });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
