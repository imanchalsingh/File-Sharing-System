import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOAD_CHUNK_SIZE_BYTES = parseInt(
  process.env.UPLOAD_CHUNK_SIZE_BYTES || String(5 * 1024 * 1024),
  10,
);

export const MAX_FILE_SIZE_BYTES = parseInt(
  process.env.MAX_FILE_SIZE_BYTES || String(5 * 1024 * 1024 * 1024),
  10,
);

export const UPLOAD_SESSION_TTL_HOURS = parseInt(
  process.env.UPLOAD_SESSION_TTL_HOURS || "24",
  10,
);

export const UPLOAD_TEMP_DIR = path.resolve(
  process.env.UPLOAD_TEMP_DIR || path.join(__dirname, "..", "uploads", "temp"),
);

export const MAX_CHUNK_RETRIES = 3;
export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER || "myfiles";

export function calculateTotalChunks(fileSizeBytes) {
  return Math.max(1, Math.ceil(fileSizeBytes / UPLOAD_CHUNK_SIZE_BYTES));
}

export function validateFileSize(fileSizeBytes) {
  if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) {
    return "Invalid file size";
  }
  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES} bytes`;
  }
  return null;
}
