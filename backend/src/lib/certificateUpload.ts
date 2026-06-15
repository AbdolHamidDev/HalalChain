import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// ---------------------------------------------------------------------------
// Certificate upload constants
// ---------------------------------------------------------------------------

export const CERT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

const MAX_CERT_SIZE = 10 * 1024 * 1024; // 10 MB

// ---------------------------------------------------------------------------
// Multer instance — memory storage, 10 MB limit, MIME filter
// ---------------------------------------------------------------------------

export const certUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CERT_SIZE },
  fileFilter: (_req, file, cb) => {
    if (CERT_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Allowed: PDF, JPEG, PNG"));
    }
  },
});

// ---------------------------------------------------------------------------
// Cloudinary upload helper
// ---------------------------------------------------------------------------

/**
 * Upload a certificate buffer to Cloudinary under the "certificates" folder.
 * PDFs are stored as resource_type "raw"; images as "image".
 * Returns the secure URL and public_id of the uploaded resource.
 */
export async function uploadCertToCloudinary(
  buffer: Buffer,
  mimeType: string
): Promise<{ secureUrl: string; publicId: string }> {
  const resourceType = mimeType === "application/pdf" ? "raw" : "image";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "certificates", resource_type: resourceType },
      (err, result) => {
        if (err || !result) {
          return reject(err ?? new Error("Upload failed"));
        }
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );

    // Pipe the in-memory buffer into the upload stream (mirrors avatarUpload.ts)
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

// ---------------------------------------------------------------------------
// NOTE for task 3.1: add computeCertificateStatus and CertificateStatus below
// ---------------------------------------------------------------------------
