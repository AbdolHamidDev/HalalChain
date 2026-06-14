import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AUTH_COOKIE_NAME, signToken } from "../lib/jwt";
import { authenticate, AuthRequest } from "../middleware/auth";
import { buildUserResponse } from "../lib/userResponse";
import { validateName } from "../lib/validateName";
import { validatePassword } from "../lib/passwordValidator";
import { logAudit } from "../lib/auditLog";
import { avatarUpload, uploadAvatarToCloudinary, deleteAvatarFromCloudinary } from "../lib/avatarUpload";

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const patchProfileSchema = z.object({
  name: z.string(),
});

// GET / — return authenticated user's profile
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.sub;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: buildUserResponse(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH / — update authenticated user's display name
router.patch("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.sub;

    // Zod schema validation
    const parsed = patchProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { name } = parsed.data;

    // validateName check
    const nameResult = validateName(name);
    if (!nameResult.valid) {
      res.status(400).json({ error: nameResult.error });
      return;
    }

    const trimmedName = name.trim();

    // Fetch current user to capture oldData for audit log
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        avatarUrl: true,
      },
    });

    if (!existingUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Wrap update + audit in a transaction (requirement 11.1, 12.4)
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { name: trimmedName },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          avatarUrl: true,
        },
      });

      await logAudit(tx, {
        userId,
        action: "UPDATE",
        entityType: "User",
        entityId: userId,
        oldData: { name: existingUser.name },
        newData: { name: updated.name },
      });

      return updated;
    });

    // Re-issue JWT cookie so in-memory session reflects new name (requirement 4.4)
    const token = signToken({
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
    });

    res.cookie(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);
    res.json({ user: buildUserResponse(updatedUser) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /avatar — upload or replace avatar (stored on Cloudinary)
router.post("/avatar", authenticate, (req: AuthRequest, res: Response) => {
  avatarUpload.single("avatar")(req as any, res as any, async (err) => {
    if (err) {
      const message =
        err.message === "Unsupported file type"
          ? "Unsupported file type. Accepted: JPEG, PNG, GIF, WebP"
          : "File too large. Maximum size is 5 MB";
      return res.status(400).json({ error: message });
    }
    try {
      const userId = req.user!.sub;
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Fetch current user to capture old avatar for cleanup + audit
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true, avatarPublicId: true },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Upload new image to Cloudinary (in-memory buffer, never touches disk)
      const { secureUrl, publicId } = await uploadAvatarToCloudinary(
        req.file.buffer,
        req.file.mimetype
      );

      const oldAvatarUrl = existingUser.avatarUrl;
      const oldPublicId = existingUser.avatarPublicId;

      const updatedUser = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: userId },
          data: { avatarUrl: secureUrl, avatarPublicId: publicId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            avatarUrl: true,
          },
        });

        await logAudit(tx, {
          userId,
          action: "UPDATE",
          entityType: "User",
          entityId: userId,
          oldData: { avatarUrl: oldAvatarUrl },
          newData: { avatarUrl: secureUrl },
        });

        return updated;
      });

      // Delete old Cloudinary asset after DB commit (non-blocking)
      if (oldPublicId) {
        deleteAvatarFromCloudinary(oldPublicId);
      }

      return res.json({ user: buildUserResponse(updatedUser) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});

// DELETE /avatar — remove avatar
router.delete("/avatar", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.sub;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, avatarPublicId: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const oldAvatarUrl = currentUser.avatarUrl;
    const oldPublicId = currentUser.avatarPublicId;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { avatarUrl: null, avatarPublicId: null },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          avatarUrl: true,
        },
      });

      await logAudit(tx, {
        userId,
        action: "UPDATE",
        entityType: "User",
        entityId: userId,
        oldData: { avatarUrl: oldAvatarUrl },
        newData: { avatarUrl: null },
      });

      return updated;
    });

    // Delete from Cloudinary after DB commit (non-blocking)
    if (oldPublicId) {
      deleteAvatarFromCloudinary(oldPublicId);
    }

    return res.json({ user: buildUserResponse(updatedUser) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /password — change own password
router.post("/password", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.sub;

    const passwordSchema = z.object({
      currentPassword: z.string(),
      newPassword: z.string(),
      confirmPassword: z.string(),
    });

    const parsed = passwordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { currentPassword, newPassword, confirmPassword } = parsed.data;

    // Get the user's stored hash (req 6.3)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify current password (req 6.3, 6.4)
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Confirm passwords match (req 6.5)
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Enforce complexity on new password (req 6.6, 6.7)
    const { valid, errors } = validatePassword(newPassword);
    if (!valid) {
      return res.status(400).json({ error: errors[0], errors });
    }

    // Ensure new != current (req 6.12)
    const isSame = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSame) {
      return res.status(400).json({ error: "New password must differ from current password" });
    }

    // Hash new password with cost 12 (req 6.8)
    const newHash = await bcrypt.hash(newPassword, 12);

    // Persist in transaction with audit log (req 6.9, 11.2, 11.6, 12.4)
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
      await logAudit(tx, {
        userId,
        action: "UPDATE",
        entityType: "User",
        entityId: userId,
        oldData: null,
        newData: { event: "password_changed" },
      });
    });

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
