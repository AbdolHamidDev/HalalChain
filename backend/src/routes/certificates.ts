import { Router, Response } from "express";
import { z } from "zod";
import { Prisma, UserRole } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "../lib/prisma";
import { parseBody, sendNotFound, sendValidationError } from "../lib/validate";
import { paramId } from "../lib/params";
import { AuthRequest, authenticate, authorize } from "../middleware/auth";
import { parsePaginationParams, buildPaginatedResponse } from "../lib/paginate";
import { logAudit } from "../lib/auditLog";
import { computeCertificateStatus } from "../lib/certificateUtils";
import { certUpload, uploadCertToCloudinary } from "../lib/certificateUpload";

const router = Router();

const createSchema = z.object({
  supplierId: z.string().uuid(),
  certificateNumber: z.string().min(3).max(100),
  issuedBy: z.string().min(2).max(100),
  issueDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  fileUrl: z.string().url().optional().or(z.literal("")),
});

const updateSchema = createSchema.partial().omit({ supplierId: true });

const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res: Response) => {
    const params = parsePaginationParams(req.query as Record<string, unknown>);
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.HalalCertificateWhereInput = {};

    if (req.query.certificateNumber) {
      where.certificateNumber = {
        contains: String(req.query.certificateNumber),
        mode: "insensitive",
      };
    }

    if (req.query.expiryBefore) {
      const val = String(req.query.expiryBefore);
      if (!YYYY_MM_DD.test(val) || isNaN(Date.parse(val))) {
        res.status(400).json({ error: "Invalid date format. Expected YYYY-MM-DD." });
        return;
      }
      where.expiryDate = { ...(where.expiryDate as object), lte: new Date(val) };
    }

    if (req.query.expiryAfter) {
      const val = String(req.query.expiryAfter);
      if (!YYYY_MM_DD.test(val) || isNaN(Date.parse(val))) {
        res.status(400).json({ error: "Invalid date format. Expected YYYY-MM-DD." });
        return;
      }
      where.expiryDate = { ...(where.expiryDate as object), gte: new Date(val) };
    }

    const [total, certificates] = await Promise.all([
      prisma.halalCertificate.count({ where }),
      prisma.halalCertificate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expiryDate: "asc" },
        include: {
          supplier: { select: { id: true, name: true, country: true } },
        },
      }),
    ]);

    const certificatesWithStatus = certificates.map((cert) => ({
      ...cert,
      status: computeCertificateStatus(cert.expiryDate),
    }));

    res.json(buildPaginatedResponse(certificatesWithStatus, total, params));
  }
);

router.get(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res: Response) => {
    const certificate = await prisma.halalCertificate.findUnique({
      where: { id: paramId(req.params.id) },
      include: { supplier: true },
    });
    if (!certificate) {
      sendNotFound(res, "Certificate");
      return;
    }
    res.json({ certificate: { ...certificate, status: computeCertificateStatus(certificate.expiryDate) } });
  }
);

router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const parsed = parseBody(createSchema, req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.message);
      return;
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: parsed.data.supplierId },
    });
    if (!supplier) {
      sendNotFound(res, "Supplier");
      return;
    }

    if (parsed.data.expiryDate <= parsed.data.issueDate) {
      sendValidationError(res, "Expiry date must be after issue date");
      return;
    }

    const { fileUrl, ...rest } = parsed.data;
    const userId = req.user?.sub ?? null;

    const certificate = await prisma.$transaction(async (tx) => {
      const created = await tx.halalCertificate.create({
        data: { ...rest, fileUrl: fileUrl || null },
      });
      await logAudit(tx, {
        userId,
        action: "CREATE",
        entityType: "HalalCertificate",
        entityId: created.id,
        newData: created as unknown as Record<string, unknown>,
      });
      return created;
    });

    res.status(201).json({ certificate });
  }
);

router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const parsed = parseBody(updateSchema, req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.message);
      return;
    }

    const existing = await prisma.halalCertificate.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Certificate");
      return;
    }

    const { fileUrl, ...rest } = parsed.data;
    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    const certificate = await prisma.$transaction(async (tx) => {
      const updated = await tx.halalCertificate.update({
        where: { id },
        data: {
          ...rest,
          ...(fileUrl !== undefined ? { fileUrl: fileUrl || null } : {}),
        },
      });
      await logAudit(tx, {
        userId,
        action: "UPDATE",
        entityType: "HalalCertificate",
        entityId: updated.id,
        oldData: existing as unknown as Record<string, unknown>,
        newData: updated as unknown as Record<string, unknown>,
      });
      return updated;
    });

    res.json({ certificate });
  }
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const existing = await prisma.halalCertificate.findUnique({
      where: { id: paramId(req.params.id) },
    });
    if (!existing) {
      sendNotFound(res, "Certificate");
      return;
    }

    const userId = req.user?.sub ?? null;
    const id = paramId(req.params.id);

    await prisma.$transaction(async (tx) => {
      await tx.halalCertificate.delete({ where: { id } });
      await logAudit(tx, {
        userId,
        action: "DELETE",
        entityType: "HalalCertificate",
        entityId: existing.id,
        oldData: existing as unknown as Record<string, unknown>,
      });
    });

    res.json({ message: "Certificate deleted" });
  }
);

// ---------------------------------------------------------------------------
// POST /api/certificates/:id/upload — upload a certificate file (Req 4.1–4.7, 11.1, 11.2)
// ---------------------------------------------------------------------------

router.post(
  "/:id/upload",
  authenticate,
  authorize(UserRole.ADMIN),
  // Wrap certUpload.single so we can catch multer errors and return 400 ourselves
  (req, res, next) => {
    certUpload.single("file")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File exceeds 10 MB limit" });
        }
        // MIME type rejection or any other multer error
        return res.status(400).json({ error: err.message ?? "File upload error" });
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const id = paramId(req.params.id);

    // Look up the existing certificate (Req 4.4 — 404 if not found)
    const existing = await prisma.halalCertificate.findUnique({ where: { id } });
    if (!existing) {
      sendNotFound(res, "Certificate");
      return;
    }

    // Upload to Cloudinary first — if this fails we must not write to DB (Req 4.5)
    let secureUrl: string;
    let publicId: string;
    try {
      const result = await uploadCertToCloudinary(req.file.buffer, req.file.mimetype);
      secureUrl = result.secureUrl;
      publicId = result.publicId;
    } catch {
      res.status(500).json({ error: "Failed to upload file to storage" });
      return;
    }

    // Capture old publicId for later clean-up (Req 4.6)
    const oldPublicId = existing.filePublicId ?? null;

    const userId = req.user?.sub ?? null;

    // Wrap DB update + audit log in a transaction (Req 11.1)
    const updated = await prisma.$transaction(async (tx) => {
      const cert = await tx.halalCertificate.update({
        where: { id },
        data: { fileUrl: secureUrl, filePublicId: publicId },
      });
      await logAudit(tx, {
        userId,
        action: "UPDATE",
        entityType: "HalalCertificate",
        entityId: cert.id,
        oldData: existing as unknown as Record<string, unknown>,
        newData: cert as unknown as Record<string, unknown>,
      });
      return cert;
    });

    // Non-blocking deletion of old Cloudinary resource (Req 4.6 — fire-and-forget)
    if (oldPublicId) {
      const oldMimeType = existing.fileUrl ?? "";
      // Determine resource_type from the old public_id prefix or fall back to "raw"
      const oldResourceType =
        oldPublicId.startsWith("certificates/") && !oldMimeType.includes("pdf")
          ? "image"
          : "raw";
      cloudinary.uploader.destroy(oldPublicId, { resource_type: oldResourceType }).catch(() => {
        // Silently swallow — same pattern as deleteAvatarFromCloudinary
      });
    }

    // Return updated certificate with computed status (Req 4.7, 5.4)
    res.json({
      certificate: {
        ...updated,
        status: computeCertificateStatus(updated.expiryDate),
      },
    });
  }
);

export default router;
