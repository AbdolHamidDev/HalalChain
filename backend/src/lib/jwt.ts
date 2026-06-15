import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserRole } from "@prisma/client";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
  /** Incremented on suspend/password-reset to invalidate existing tokens */
  tv: number;
}

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "15m";

/**
 * Signs a short-lived access token (15 min TTL by default).
 */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Backward-compatible alias for signAccessToken.
 * @deprecated Use signAccessToken instead.
 */
export const signToken = signAccessToken;

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Generates a raw refresh token structured as `${userId}.${randomHex}`.
 * The userId prefix enables targeted DB lookups without a full-table scan.
 * The raw value is stored in the cookie; a bcrypt hash is stored in the DB.
 */
export function signRefreshToken(userId: string): string {
  const random = crypto.randomBytes(48).toString("hex");
  return `${userId}.${random}`;
}

export const AUTH_COOKIE_NAME = "halalchain_token";
export const REFRESH_COOKIE_NAME = "halalchain_refresh";

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 15 * 60 * 1000, // 15 minutes in ms
  path: "/",
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: "/api/auth/refresh",
};
