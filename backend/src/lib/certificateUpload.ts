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
 * PDFs are stored as resource_type "raw" with the original filename preserved.
 * Images are stored as resource_type "image".
 * Returns the secure URL and public_id of the uploaded resource.
 */
export async function uploadCertToCloudinary(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<{ secureUrl: string; publicId: string }> {
  const isPdf = mimeType === "application/pdf";
  const resourceType = isPdf ? "raw" : "image";

  // Strip extension from original name to use as the public_id display name
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "certificates",
        resource_type: resourceType,
        // Preserve original filename so the URL ends with the correct name+extension
        public_id: baseName,
        use_filename: true,
        unique_filename: true,
        // For PDFs: tell Cloudinary the format so the URL includes .pdf extension
        ...(isPdf ? { format: "pdf" } : {}),
      },
      (err, result) => {
        if (err || !result) {
          return reject(err ?? new Error("Upload failed"));
        }
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

// ---------------------------------------------------------------------------
// NOTE for task 3.1: add computeCertificateStatus and CertificateStatus below
// ---------------------------------------------------------------------------
