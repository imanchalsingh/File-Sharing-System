import { uploadApi } from "./api";
import { computeIncrementalSha256 } from "../utils/incrementalHash";
import {
  removeStoredSession,
  saveStoredSession,
} from "../utils/uploadSessionStorage";
import {
  calculateTotalChunks,
  DEFAULT_CHUNK_SIZE,
  getMissingChunkIndices,
  MAX_CHUNK_RETRIES,
  sleep,
  formatFileSize,
  type ResumableUploadOptions,
  type UploadProgressState,
  type UploadSessionInfo,
} from "./uploadTypes";

export type { UploadProgressState, UploadSessionInfo, ResumableUploadOptions };

export interface UploadResult {
  fileUrl: string;
  sessionId: string;
  checksum: string;
}

async function uploadChunkWithRetry(
  sessionId: string,
  chunkIndex: number,
  chunk: Blob,
  signal?: AbortSignal,
) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_CHUNK_RETRIES; attempt++) {
    if (signal?.aborted) {
      throw new DOMException("Upload aborted", "AbortError");
    }

    try {
      return await uploadApi.uploadChunk(sessionId, chunkIndex, chunk, signal);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_CHUNK_RETRIES) {
        await sleep(Math.min(1000 * 2 ** (attempt - 1), 8000));
      }
    }
  }

  throw lastError || new Error("Chunk upload failed");
}

function persistSession(session: UploadSessionInfo, file: File) {
  saveStoredSession({
    sessionId: session.sessionId,
    fileName: file.name,
    fileSizeBytes: file.size,
    mimeType: file.type,
    totalChunks: session.totalChunks,
    chunkSizeBytes: session.chunkSizeBytes,
    receivedChunks: session.receivedChunks,
    uploadedBytes: session.uploadedBytes,
    status: session.status,
    lastUpdated: new Date().toISOString(),
  });
}

export async function uploadFileResumable(
  options: ResumableUploadOptions,
): Promise<UploadResult> {
  const {
    file,
    chunkSize = DEFAULT_CHUNK_SIZE,
    sessionId: existingSessionId,
    onProgress,
    shouldPause,
    signal,
  } = options;

  const totalChunks = calculateTotalChunks(file.size, chunkSize);

  const report = (partial: Partial<UploadProgressState>) => {
    onProgress?.({
      fileName: file.name,
      fileSizeBytes: file.size,
      uploadedBytes: 0,
      progressPercent: 0,
      currentChunk: 0,
      totalChunks,
      status: "uploading",
      ...partial,
    });
  };

  report({ status: "hashing", progressPercent: 0 });

  const checksum = await computeIncrementalSha256(file, chunkSize, (processed) => {
    report({
      status: "hashing",
      uploadedBytes: processed,
      progressPercent: Math.round((processed / file.size) * 10),
    });
  });

  if (signal?.aborted) {
    throw new DOMException("Upload aborted", "AbortError");
  }

  let session: UploadSessionInfo;

  if (existingSessionId) {
    const resumed = await uploadApi.initUpload({
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type,
      expectedChecksum: checksum,
      sessionId: existingSessionId,
    });
    session = resumed.session;
  } else {
    const created = await uploadApi.initUpload({
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type,
      expectedChecksum: checksum,
    });
    session = created.session;
  }

  if (session.status === "completed" && session.fileUrl) {
    removeStoredSession(session.sessionId);
    report({
      status: "completed",
      uploadedBytes: file.size,
      progressPercent: 100,
      currentChunk: totalChunks,
      sessionId: session.sessionId,
    });
    return {
      fileUrl: session.fileUrl,
      sessionId: session.sessionId,
      checksum,
    };
  }

  const chunksToUpload = getMissingChunkIndices(
    session.totalChunks,
    session.receivedChunks,
  );

  for (const chunkIndex of chunksToUpload) {
    while (shouldPause?.()) {
      report({
        status: "paused",
        sessionId: session.sessionId,
        uploadedBytes: session.uploadedBytes,
        progressPercent: session.progressPercent,
        currentChunk: chunkIndex + 1,
      });
      await sleep(300);
      if (signal?.aborted) {
        throw new DOMException("Upload aborted", "AbortError");
      }
    }

    if (signal?.aborted) {
      throw new DOMException("Upload aborted", "AbortError");
    }

    const start = chunkIndex * session.chunkSizeBytes;
    const end = Math.min(start + session.chunkSizeBytes, file.size);
    const chunkBlob = file.slice(start, end);

    report({
      status: "uploading",
      sessionId: session.sessionId,
      uploadedBytes: session.uploadedBytes,
      progressPercent: Math.max(
        10,
        Math.round((session.uploadedBytes / file.size) * 90) + 10,
      ),
      currentChunk: chunkIndex + 1,
    });

    const chunkResult = await uploadChunkWithRetry(
      session.sessionId,
      chunkIndex,
      chunkBlob,
      signal,
    );

    session = chunkResult.session;

    if (chunkResult.fileUrl) {
      session.fileUrl = chunkResult.fileUrl;
      session.status = "completed";
      session.uploadedBytes = file.size;
    }

    persistSession(session, file);

    report({
      status: session.status === "completed" ? "completed" : "uploading",
      sessionId: session.sessionId,
      uploadedBytes: session.uploadedBytes,
      progressPercent:
        session.status === "completed"
          ? 100
          : Math.max(10, Math.round((session.uploadedBytes / file.size) * 90) + 10),
      currentChunk: chunkIndex + 1,
    });

    if (session.status === "completed" && session.fileUrl) {
      removeStoredSession(session.sessionId);
      return {
        fileUrl: session.fileUrl,
        sessionId: session.sessionId,
        checksum,
      };
    }
  }

  const finalStatus = await uploadApi.getUploadStatus(session.sessionId);
  if (finalStatus.session.status === "completed" && finalStatus.session.fileUrl) {
    removeStoredSession(session.sessionId);
    report({
      status: "completed",
      sessionId: session.sessionId,
      uploadedBytes: file.size,
      progressPercent: 100,
      currentChunk: totalChunks,
    });
    return {
      fileUrl: finalStatus.session.fileUrl,
      sessionId: session.sessionId,
      checksum,
    };
  }

  throw new Error(finalStatus.session.errorMessage || "Upload did not complete");
}
