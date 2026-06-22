import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  signAccessToken,
  signRefreshToken,
} from "../lib/jwt";
import { AuthRequest, authenticate, authorize } from "../middleware/auth";
import { logAudit } from "../lib/auditLog";
import { authRateLimiter } from "../lib/rateLimiter";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const updateRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});


function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  avatarUrl?: string | null;
  isVerified?: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    avatarUrl: user.avatarUrl ?? null,
    isVerified: user.isVerified ?? false,
  };
}

router.post("/register", async (req: AuthRequest, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: UserRole.STAFF,
    },
  });

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    tv: user.tokenVersion,
  });

  const rawRefresh = signRefreshToken(user.id);
  const hashRefresh = await bcrypt.hash(rawRefresh, 10);
  await prisma.refreshToken.create({
    data: {
      token: hashRefresh,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.cookie(AUTH_COOKIE_NAME, accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie(REFRESH_COOKIE_NAME, rawRefresh, REFRESH_COOKIE_OPTIONS);
  res.status(201).json({ user: sanitizeUser(user) });
});

router.post("/login", async (req, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  // Reject suspended accounts
  if (user.status === "SUSPENDED") {
    res.status(403).json({ error: "Your account has been suspended. Please contact an administrator." });
    return;
  }

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    tv: user.tokenVersion,
  });

  // Track last login time (non-blocking)
  prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});

  const rawRefresh = signRefreshToken(user.id);
  const hashRefresh = await bcrypt.hash(rawRefresh, 10);
  await prisma.refreshToken.create({
    data: {
      token: hashRefresh,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.cookie(AUTH_COOKIE_NAME, accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie(REFRESH_COOKIE_NAME, rawRefresh, REFRESH_COOKIE_OPTIONS);
  res.json({ user: sanitizeUser(user) });
});

router.post("/refresh", authRateLimiter, async (req, res: Response) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!rawToken) {
    res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth/refresh" });
    return res.status(401).json({ error: "No refresh token" });
  }

  // Extract userId from the structured token: "${userId}.${randomHex}"
  const userId = rawToken.split(".")[0];
  if (!userId) {
    res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth/refresh" });
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const records = await prisma.refreshToken.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
  });

  let matched = null;
  for (const record of records) {
    if (await bcrypt.compare(rawToken, record.token)) {
      matched = record;
      break;
    }
  }

  if (!matched) {
    res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth/refresh" });
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }

  // Rotation: delete old token
  await prisma.refreshToken.delete({ where: { id: matched.id } });

  // Look up user to build access token payload
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth/refresh" });
    return res.status(401).json({ error: "User not found" });
  }

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    tv: user.tokenVersion,
  });
  const rawRefresh = signRefreshToken(user.id);
  const hashRefresh = await bcrypt.hash(rawRefresh, 10);
  await prisma.refreshToken.create({
    data: {
      token: hashRefresh,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.cookie(AUTH_COOKIE_NAME, accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie(REFRESH_COOKIE_NAME, rawRefresh, REFRESH_COOKIE_OPTIONS);
  res.json({ message: "Refreshed" });
});

router.post("/logout", async (req, res: Response) => {
  const rawRefresh = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

  // Extract userId from the `${userId}.${random}` cookie structure for targeted DB cleanup
  if (rawRefresh) {
    const userId = rawRefresh.split(".")[0];
    if (userId) {
      // Delete all refresh tokens for this user (graceful — don't fail logout if DB errors)
      await prisma.refreshToken.deleteMany({ where: { userId } }).catch(() => {});
    }
  }

  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth/refresh" });
  res.json({ message: "Logged out" });
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  // Demo tokens bypass DB lookup - return user info from JWT payload
  if (req.user!.isDemo) {
    res.json({
      user: {
        id: req.user!.sub,
        name: req.user!.name,
        email: req.user!.email,
        role: req.user!.role,
        createdAt: new Date().toISOString(),
        avatarUrl: null,
        isVerified: true,
        status: "ACTIVE",
      },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      avatarUrl: true,
      isVerified: true,
      tokenVersion: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user });
});

router.patch(
  "/users/:id/role",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const id = req.params.id as string;
    const { role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      await logAudit(tx, {
        userId: req.user!.sub,
        action: "UPDATE",
        entityType: "User",
        entityId: id,
        oldData: { role: existing.role },
        newData: { role },
      });

      return updated;
    });

    res.json({ user: updatedUser });
  }
);

export default router;
