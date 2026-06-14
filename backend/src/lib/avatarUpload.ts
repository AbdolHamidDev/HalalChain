import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage — file never hits disk, goes straight to Cloudinary
export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

/**
 * Upload a buffer to Cloudinary under the "avatars" folder.
 * Returns the secure URL and public_id of the uploaded image.
 */
export async function uploadAvatarToCloudinary(
  buffer: Buffer,
  mimeType: string
): Promise<{ secureUrl: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "avatars",
        resource_type: "image",
        format: "webp",          // auto-convert to WebP for smaller size
        transformation: [
          { width: 256, height: 256, crop: "fill", gravity: "face" }, // square crop, face-aware
        ],
      },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Cloudinary upload failed"));
        }
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );

    // Pipe the in-memory buffer into the upload stream
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

/**
 * Delete a previously-uploaded avatar from Cloudinary by its public_id.
 * Silently ignores errors (e.g. file already deleted).
 */
export async function deleteAvatarFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch {
    // Non-fatal — continue even if the old file can't be deleted
  }
}
