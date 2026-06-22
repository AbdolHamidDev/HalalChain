import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { signAccessToken, AUTH_COOKIE_NAME, ACCESS_COOKIE_OPTIONS } from "../lib/jwt";

const router = Router();

/**
 * Demo admin credentials (hardcoded, not stored in DB)
 */
const DEMO_ADMIN = {
  email: "demo-admin@halalchain.local",
  password: "demo-admin-2024",
  name: "Demo Admin",
  role: UserRole.ADMIN as UserRole,
};

/**
 * POST /api/demo-admin/login
 * Creates a demo admin JWT token without DB validation.
 * The token has isDemo=true flag so middleware can bypass DB checks.
 */
router.post("/login", (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (email !== DEMO_ADMIN.email || password !== DEMO_ADMIN.password) {
    res.status(401).json({ error: "Invalid demo admin credentials" });
    return;
  }

  // Generate a demo token with isDemo flag
  const payload = {
    sub: "demo-admin-0000-0000-0000-000000000000",
    email: DEMO_ADMIN.email,
    role: DEMO_ADMIN.role,
    name: DEMO_ADMIN.name,
    tv: 1,
    isDemo: true,
  };

  // Demo tokens expire in 24 hours (sufficient for demo session)
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || "dev-secret-change-me", {
    expiresIn: "24h",
  });

  res.cookie(AUTH_COOKIE_NAME, accessToken, ACCESS_COOKIE_OPTIONS);
  res.json({
    user: {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      createdAt: new Date().toISOString(),
      avatarUrl: null,
      isVerified: true,
      status: "ACTIVE",
    },
    isDemo: true,
  });
});

/**
 * POST /api/demo-admin/logout
 * Clears demo admin cookies
 */
router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
  res.json({ message: "Demo admin logged out" });
});

export default router;