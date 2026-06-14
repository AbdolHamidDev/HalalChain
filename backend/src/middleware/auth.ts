import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { AUTH_COOKIE_NAME, JwtPayload, verifyToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  let payload: JwtPayload;
  try {
    payload = verifyToken(token);
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  // Validate tokenVersion and account status against DB (prevents use of
  // tokens issued before a suspend or password reset).
  prisma.user
    .findUnique({
      where: { id: payload.sub },
      select: { tokenVersion: true, status: true },
    })
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }
      if (user.status === "SUSPENDED") {
        res.status(403).json({ error: "Your account has been suspended." });
        return;
      }
      if (user.tokenVersion !== payload.tv) {
        res.status(401).json({ error: "Session expired. Please log in again." });
        return;
      }
      req.user = payload;
      next();
    })
    .catch(() => {
      res.status(500).json({ error: "Internal server error" });
    });
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}
