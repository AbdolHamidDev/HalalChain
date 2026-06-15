/**
 * Email Service — HalalChain Sprint 2
 *
 * Provider selection is resolved once at module-load time:
 *   - If RESEND_API_KEY is set: use Resend SDK
 *   - Otherwise: use Nodemailer SMTP transport
 *
 * All delivery is fire-and-forget: sendEmail() returns Promise.resolve()
 * immediately and the actual delivery runs in the background.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 9.2, 9.6, 9.7, 9.8
 */

import { Resend } from "resend";
import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import {
  certExpiringTemplate,
  certExpiredTemplate,
  lowStockTemplate,
  shipmentDelayedTemplate,
} from "./emailTemplates";

// ---------------------------------------------------------------------------
// Provider selection (module-load time)
// ---------------------------------------------------------------------------

const USE_RESEND = !!process.env.RESEND_API_KEY;

const resend = USE_RESEND ? new Resend(process.env.RESEND_API_KEY!) : null;

const smtpTransport = !USE_RESEND
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface NotificationPreferenceFlags {
  certificateAlerts: boolean;
  inventoryAlerts: boolean;
  shipmentAlerts: boolean;
  invitationEmails: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attempt to send an email, retrying up to 3 times with exponential back-off.
 * Back-off delays: attempt 1 → 200 ms, attempt 2 → 400 ms.
 * On final failure the error is logged and swallowed (Requirements 1.4, 1.5).
 */
async function sendWithRetry(params: SendEmailParams, attempt = 1): Promise<void> {
  try {
    if (USE_RESEND) {
      await resend!.emails.send({
        from: process.env.EMAIL_FROM!,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
    } else {
      await smtpTransport!.sendMail({
        from: process.env.EMAIL_FROM!,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
    }
  } catch (err) {
    if (attempt < 3) {
      await sleep(200 * Math.pow(2, attempt - 1)); // 200 ms → 400 ms
      return sendWithRetry(params, attempt + 1);
    }
    // Final failure: log and swallow — never reject to caller
    console.error("[emailService] Delivery failed after 3 attempts:", err);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fire-and-forget email send.
 * Returns Promise.resolve() immediately; actual delivery happens in the background.
 * Requirement 1.3: email delivery must not block HTTP responses.
 */
export function sendEmail(params: SendEmailParams): Promise<void> {
  sendWithRetry(params).catch(() => {
    // Already handled inside sendWithRetry; this catch prevents unhandled rejection
  });
  return Promise.resolve();
}

/**
 * Retrieve the notification preference flags for a user.
 * Returns all-true defaults when no DB record exists (Requirement 9.2).
 */
export async function getPreference(userId: string): Promise<NotificationPreferenceFlags> {
  const pref = await prisma.notificationPreference.findUnique({ where: { userId } });
  return (
    pref ?? {
      certificateAlerts: true,
      inventoryAlerts: true,
      shipmentAlerts: true,
      invitationEmails: true,
    }
  );
}

// ---------------------------------------------------------------------------
// Dispatch helpers
// ---------------------------------------------------------------------------

/**
 * Send certificate-expiring emails to all active users who have
 * certificateAlerts enabled (Requirement 9.6).
 */
export async function dispatchCertExpiringEmails(params: {
  certificateNumber: string;
  supplierName: string;
  expiryDate: Date;
}): Promise<void> {
  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, email: true },
  });

  for (const user of users) {
    const pref = await getPreference(user.id);
    if (!pref.certificateAlerts) continue;
    const { html, text } = certExpiringTemplate(params);
    sendEmail({
      to: user.email,
      subject: "Certificate Expiring Soon — Action Required",
      html,
      text,
    });
  }
}

/**
 * Send certificate-expired emails to all active users who have
 * certificateAlerts enabled (Requirement 9.6).
 */
export async function dispatchCertExpiredEmails(params: {
  certificateNumber: string;
  supplierName: string;
  expiryDate: Date;
}): Promise<void> {
  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, email: true },
  });

  for (const user of users) {
    const pref = await getPreference(user.id);
    if (!pref.certificateAlerts) continue;
    const { html, text } = certExpiredTemplate(params);
    sendEmail({
      to: user.email,
      subject: "Certificate Expired — Immediate Action Required",
      html,
      text,
    });
  }
}

/**
 * Send low-stock emails to all active users who have
 * inventoryAlerts enabled (Requirement 9.7).
 */
export async function dispatchLowStockEmails(params: {
  productName: string;
  sku: string;
  warehouseName: string;
  quantity: number;
  reorderLevel: number;
}): Promise<void> {
  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, email: true },
  });

  for (const user of users) {
    const pref = await getPreference(user.id);
    if (!pref.inventoryAlerts) continue;
    const { html, text } = lowStockTemplate(params);
    sendEmail({ to: user.email, subject: "Low Stock Alert", html, text });
  }
}

/**
 * Send shipment-delayed emails to all active users who have
 * shipmentAlerts enabled (Requirement 9.8).
 */
export async function dispatchShipmentDelayedEmails(params: {
  trackingNumber: string;
  poNumber: string;
}): Promise<void> {
  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, email: true },
  });

  for (const user of users) {
    const pref = await getPreference(user.id);
    if (!pref.shipmentAlerts) continue;
    const { html, text } = shipmentDelayedTemplate(params);
    sendEmail({ to: user.email, subject: "Shipment Delayed", html, text });
  }
}
