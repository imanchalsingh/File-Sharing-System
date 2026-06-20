import fs from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { UPLOAD_TEMP_DIR } from "../config/uploadConfig.js";

export async function ensureUploadTempRoot() {
  await fs.mkdir(UPLOAD_TEMP_DIR, { recursive: true });
}

export async function createSessionTempDir(uploadId) {
  await ensureUploadTempRoot();
  const tempDir = path.join(UPLOAD_TEMP_DIR, uploadId);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

export function getChunkPath(tempDir, chunkIndex) {
  return path.join(tempDir, `chunk-${chunkIndex}`);
}

export async function chunkExists(tempDir, chunkIndex) {
  try {
    await fs.access(getChunkPath(tempDir, chunkIndex));
    return true;
  } catch {
    return false;
  }
}

export async function writeChunk(tempDir, chunkIndex, sourcePath) {
  const destPath = getChunkPath(tempDir, chunkIndex);
  await fs.rename(sourcePath, destPath);
  const stat = await fs.stat(destPath);
  return stat.size;
}

export async function removeSessionTempDir(tempDir) {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error("Failed to remove temp dir:", tempDir, error.message);
  }
}

export async function assembleChunks(tempDir, totalChunks, outputPath) {
  const writeStream = createWriteStream(outputPath, { flags: "w" });

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = getChunkPath(tempDir, i);
    await pipeline(createReadStream(chunkPath), writeStream, { end: false });
  }

  await new Promise((resolve, reject) => {
    writeStream.end((error) => (error ? reject(error) : resolve()));
  });
}

export async function computeFileSha256(filePath) {
  const { createHash } = await import("crypto");
  const hash = createHash("sha256");

  await new Promise((resolve, reject) => {
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolve);
  });

  return hash.digest("hex");
}
