export const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;
export const MAX_CHUNK_RETRIES = 3;
export const MAX_CONCURRENT_UPLOADS = 2;

export interface UploadSessionInfo {
  sessionId: string;
  uploadId: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  totalChunks: number;
  chunkSizeBytes: number;
  receivedChunks: number[];
  uploadedBytes: number;
  status: string;
  fileUrl?: string | null;
  errorMessage?: string | null;
  expiresAt?: string;
  progressPercent: number;
}

export interface UploadProgressState {
  fileName: string;
  fileSizeBytes: number;
  uploadedBytes: number;
  progressPercent: number;
  currentChunk: number;
  totalChunks: number;
  status: "idle" | "hashing" | "uploading" | "paused" | "completed" | "error";
  errorMessage?: string;
  sessionId?: string;
}

export interface ResumableUploadOptions {
  file: File;
  chunkSize?: number;
  sessionId?: string;
  onProgress?: (state: UploadProgressState) => void;
  shouldPause?: () => boolean;
  signal?: AbortSignal;
  onDuplicateDetected?: () => Promise<'link' | 'upload'>;
}

export function calculateTotalChunks(fileSizeBytes: number, chunkSize: number) {
  return Math.max(1, Math.ceil(fileSizeBytes / chunkSize));
}

export function getMissingChunkIndices(
  totalChunks: number,
  receivedChunks: number[],
): number[] {
  const received = new Set(receivedChunks);
  const missing: number[] = [];
  for (let i = 0; i < totalChunks; i++) {
    if (!received.has(i)) missing.push(i);
  }
  return missing;
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i] || "Bytes"}`;
}
