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
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";

export type { UploadProgressState, UploadSessionInfo, ResumableUploadOptions };

export interface EncryptionResult {
  dek: CryptoKey;
  rawDekBytes: Uint8Array;
  wrappedKeyBase64: string;
  keySaltBase64: string;
}

/**
 * Generates a unique DEK, derives a KEK using PBKDF2, and wraps the DEK with AES-GCM.
 */
export async function prepareE2EEncryption(password: string): Promise<EncryptionResult> {
  const dek = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const rawDekBytes = new Uint8Array(await window.crypto.subtle.exportKey("raw", dek));
  const keySaltBytes = window.crypto.getRandomValues(new Uint8Array(16));

  const passwordBytes = new TextEncoder().encode(password);
  const baseKey = await window.crypto.subtle.importKey("raw", passwordBytes, "PBKDF2", false, ["deriveKey"]);
  const kek = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: keySaltBytes,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  const wrapIv = window.crypto.getRandomValues(new Uint8Array(12));
  const wrappedDekCiphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: wrapIv }, kek, rawDekBytes);
  
  const wrappedKeyCombined = new Uint8Array(12 + wrappedDekCiphertext.byteLength);
  wrappedKeyCombined.set(wrapIv, 0);
  wrappedKeyCombined.set(new Uint8Array(wrappedDekCiphertext), 12);

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const wrappedKeyBase64 = arrayBufferToBase64(wrappedKeyCombined.buffer);
  const keySaltBase64 = arrayBufferToBase64(keySaltBytes.buffer);

  return {
    dek,
    rawDekBytes,
    wrappedKeyBase64,
    keySaltBase64,
  };
}

/**
 * Encrypts a single slice of file using the DEK with AES-GCM and prepends the 12-byte IV.
 */
export async function encryptChunk(
  chunk: Blob,
  chunkIndex: number,
  dek: CryptoKey,
  rawDekBytes: Uint8Array,
): Promise<Blob> {
  const chunkBuffer = await chunk.arrayBuffer();

  const indexBytes = new TextEncoder().encode(String(chunkIndex));
  const combined = new Uint8Array(rawDekBytes.length + indexBytes.length);
  combined.set(rawDekBytes, 0);
  combined.set(indexBytes, rawDekBytes.length);

  const hashBuffer = await window.crypto.subtle.digest("SHA-256", combined);
  const iv = new Uint8Array(hashBuffer).slice(0, 12);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    dek,
    chunkBuffer
  );

  const result = new Uint8Array(12 + ciphertextBuffer.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertextBuffer), 12);

  return new Blob([result], { type: chunk.type });
}

export interface UploadResult {
  fileUrl: string;
  sessionId: string;
  checksum: string;
  wrappedKey?: string;
  keySalt?: string;
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
    encryptionPassword,
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

  let checksum = "";
  let dek: CryptoKey | null = null;
  let rawDekBytes = new Uint8Array(0);
  let wrappedKeyBase64 = "";
  let keySaltBase64 = "";

  const fileSizeBytesToUpload = encryptionPassword
    ? file.size + (totalChunks * 28)
    : file.size;

  if (encryptionPassword) {
    report({ status: "hashing", progressPercent: 0 });
    try {
      const cryptoResult = await prepareE2EEncryption(encryptionPassword);
      dek = cryptoResult.dek;
      rawDekBytes = cryptoResult.rawDekBytes;
      wrappedKeyBase64 = cryptoResult.wrappedKeyBase64;
      keySaltBase64 = cryptoResult.keySaltBase64;

      // Compute checksum on encrypted chunks
      const hasher = sha256.create();
      let offset = 0;
      let chunkIndex = 0;
      while (offset < file.size) {
        const chunk = file.slice(offset, offset + chunkSize);
        const encryptedChunkBlob = await encryptChunk(chunk, chunkIndex, dek, rawDekBytes);
        const buffer = await encryptedChunkBlob.arrayBuffer();
        hasher.update(new Uint8Array(buffer));
        
        offset += chunkSize;
        chunkIndex++;
        report({
          status: "hashing",
          uploadedBytes: Math.min(offset, file.size),
          progressPercent: Math.round((Math.min(offset, file.size) / file.size) * 10),
        });
      }
      checksum = bytesToHex(hasher.digest());
    } catch (err: any) {
      console.error("Encryption initialization failed:", err);
      throw new Error("Failed to initialize client-side encryption: " + err.message);
    }
  } else {
    report({ status: "hashing", progressPercent: 0 });
    checksum = await computeIncrementalSha256(file, chunkSize, (processed) => {
      report({
        status: "hashing",
        uploadedBytes: processed,
        progressPercent: Math.round((processed / file.size) * 10),
      });
    });
  }

  if (signal?.aborted) {
    throw new DOMException("Upload aborted", "AbortError");
  }

  let session: UploadSessionInfo;

  const initData = {
    fileName: file.name,
    fileSizeBytes: fileSizeBytesToUpload,
    mimeType: file.type,
    expectedChecksum: checksum,
    isEncrypted: !!encryptionPassword,
    wrappedKey: wrappedKeyBase64 || undefined,
    keySalt: keySaltBase64 || undefined,
  };

  if (existingSessionId) {
    const resumed = await uploadApi.initUpload({
      ...initData,
      sessionId: existingSessionId,
    });
    session = resumed.session!;
  } else {
    const created = await uploadApi.initUpload(initData);

    if (created.duplicateExists && created.existingFileUrl) {
      if (options.onDuplicateDetected) {
        const choice = await options.onDuplicateDetected();
        if (choice === "link") {
          report({
            status: "completed",
            uploadedBytes: file.size,
            progressPercent: 100,
            currentChunk: totalChunks,
          });
          return {
            fileUrl: created.existingFileUrl,
            sessionId: "", // No session needed for linked file
            checksum,
            wrappedKey: wrappedKeyBase64 || undefined,
            keySalt: keySaltBase64 || undefined,
          };
        }
      }
      
      // If no callback, or choice was 'upload', force upload
      const forced = await uploadApi.initUpload({
        ...initData,
        forceUpload: true,
      });
      session = forced.session!;
    } else {
      session = created.session!;
    }
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
    let chunkBlob = file.slice(start, end);

    if (encryptionPassword && dek) {
      chunkBlob = await encryptChunk(chunkBlob, chunkIndex, dek, rawDekBytes);
    }

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
        wrappedKey: wrappedKeyBase64 || undefined,
        keySalt: keySaltBase64 || undefined,
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
      wrappedKey: wrappedKeyBase64 || undefined,
      keySalt: keySaltBase64 || undefined,
    };
  }

  throw new Error(finalStatus.session.errorMessage || "Upload did not complete");
}
