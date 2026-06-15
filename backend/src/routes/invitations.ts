import { Router, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { AUTH_COOKIE_NAME, signAccessToken, ACCESS_COOKIE_OPTIONS } from "../lib/jwt";
import { buildUserResponse } from "../lib/userResponse";
import { validatePassword } from "../lib/passwordValidator";
import { logAudit } from "../lib/auditLog";
import { sendEmail } from "../lib/emailService";
import { invitationTemplate } from "../lib/emailTemplates";

const router = Router();

const INVITE_TTL_HOURS = 48;

// ---------------------------------------------------------------------------
// POST /api/invitations — admin sends an invitation
// ---------------------------------------------------------------------------

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole).default(UserRole.STAFF),
});

router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = createInviteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { email, role } = parsed.data;
    const adminId = req.user!.sub;

    // Check if email is already registered
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "A user with this email already exists." });
      return;
    }

    // Cancel any pending invites for the same email
    await prisma.userInvitation.deleteMany({
      where: { email, acceptedAt: null },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

    const invitation = await prisma.userInvitation.create({
      data: { email, role, token, invitedBy: adminId, expiresAt },
    });

    await logAudit(prisma, {
      userId: adminId,
      action: "CREATE",
      entityType: "UserInvitation",
      entityId: invitation.id,
      oldData: null,
      newData: { email, role },
    });

    // In a real SaaS you'd send an email here. We return the invite link
    // so the frontend can display / copy it for the admin.
    const inviteUrl = `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/accept-invite?token=${token}`;

    // Fetch the inviting admin's name for the email
    const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true } });

    // Send invitation email — fire-and-forget (Requirements 3.4, 3.6)
    const { html, text } = invitationTemplate({
      inviterName: admin?.name ?? "HalalChain Admin",
      role: role,
      acceptanceUrl: inviteUrl,
    });
    sendEmail({ to: email, subject: "You've been invited to HalalChain", html, text });

    res.status(201).json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        inviteUrl,
      },
    });
  }
);

// ---------------------------------------------------------------------------
// GET /api/invitations — list pending invitations (admin only)
// ---------------------------------------------------------------------------

router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const invitations = await prisma.userInvitation.findMany({
      where: { acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        inviter: { select: { name: true } },
      },
    });

    res.json({ invitations });
  }
);

// ---------------------------------------------------------------------------
// DELETE /api/invitations/:id — revoke a pending invitation (admin only)
// ---------------------------------------------------------------------------

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const adminId = req.user!.sub;

    const invite = await prisma.userInvitation.findUnique({ where: { id } });
    if (!invite || invite.acceptedAt) {
      res.status(404).json({ error: "Invitation not found or already accepted." });
      return;
    }

    await prisma.userInvitation.delete({ where: { id } });

    await logAudit(prisma, {
      userId: adminId,
      action: "DELETE",
      entityType: "UserInvitation",
      entityId: id,
      oldData: { email: invite.email },
      newData: null,
    });

    res.json({ message: "Invitation revoked." });
  }
);

// ---------------------------------------------------------------------------
// GET /api/invitations/validate?token=… — check if token is valid (public)
// ---------------------------------------------------------------------------

router.get("/validate", async (req, res: Response): Promise<void> => {
  const token = typeof req.query.token === "string" ? req.query.token : "";

  const invite = await prisma.userInvitation.findUnique({ where: { token } });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    res.status(404).json({ error: "Invitation is invalid or has expired." });
    return;
  }

  res.json({ email: invite.email, role: invite.role });
});

// ---------------------------------------------------------------------------
// POST /api/invitations/accept — user sets their password and creates account
// ---------------------------------------------------------------------------

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2).max(100),
  password: z.string(),
});

router.post("/accept", async (req, res: Response): Promise<void> => {
  const parsed = acceptInviteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { token, name, password } = parsed.data;

  const invite = await prisma.userInvitation.findUnique({ where: { token } });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    res.status(400).json({ error: "Invitation is invalid or has expired." });
    return;
  }

  // Check email not already taken (race condition guard)
  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  // Validate password complexity
  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) {
    res.status(400).json({ error: pwCheck.errors[0], errors: pwCheck.errors });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: name.trim(),
        email: invite.email,
        passwordHash,
        role: invite.role,
      },
    });

    await tx.userInvitation.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    await logAudit(tx, {
      userId: created.id,
      action: "CREATE",
      entityType: "User",
      entityId: created.id,
      oldData: null,
      newData: { email: created.email, role: created.role, via: "invitation" },
    });

    return created;
  });

  const jwtToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    tv: user.tokenVersion,
  });

  res.cookie(AUTH_COOKIE_NAME, jwtToken, ACCESS_COOKIE_OPTIONS);
  res.status(201).json({ user: buildUserResponse(user) });
});

export default router;
