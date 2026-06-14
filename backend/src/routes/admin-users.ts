import { Request, Response, Router } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import multer from "multer";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { buildUserResponse } from "../lib/userResponse";
import { validateName } from "../lib/validateName";
import { validatePassword } from "../lib/passwordValidator";
import { logAudit } from "../lib/auditLog";
import { avatarUpload } from "../lib/avatarUpload";

const router = Router();

// Apply authentication and ADMIN authorization to all routes in this router
router.use(authenticate, authorize(UserRole.ADMIN));

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
        // Multer-level error (e.g. file size exceeded)
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

      // Check target user exists
      const currentUser = await prisma.user.findUnique({ where: { id: targetId } });
      if (!currentUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const oldAvatarUrl = currentUser.avatarUrl;
      const newAvatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Update avatarUrl + audit log in a single atomic transaction (Requirements 8.6, 12.3)
      const updatedUser = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: targetId },
          data: { avatarUrl: newAvatarUrl },
        });

        await logAudit(tx, {
          userId: adminId,
          action: "UPDATE",
          entityType: "User",
          entityId: targetId,
          oldData: { avatarUrl: oldAvatarUrl },
          newData: { avatarUrl: newAvatarUrl },
        });

        return updated;
      });

      res.json({ user: buildUserResponse(updatedUser) });
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  });
});

// GET /api/admin/users — list all users (admin only)
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ users: users.map(buildUserResponse) });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
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
        data: { passwordHash: newHash },
      });

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

export default router;
