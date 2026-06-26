import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";

export async function computeIncrementalSha256(
  file: File,
  chunkSize: number,
  onChunkProcessed?: (processedBytes: number) => void,
): Promise<string> {
  const hasher = sha256.create();
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    const buffer = await chunk.arrayBuffer();
    hasher.update(new Uint8Array(buffer));
    offset += chunkSize;
    onChunkProcessed?.(Math.min(offset, file.size));
  }

  return bytesToHex(hasher.digest());
}

export async function computeSha256FromBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  return bytesToHex(sha256(new Uint8Array(buffer)));
}
