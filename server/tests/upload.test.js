import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateTotalChunks,
  validateFileSize,
  UPLOAD_CHUNK_SIZE_BYTES,
  MAX_FILE_SIZE_BYTES,
} from "../config/uploadConfig.js";

describe("uploadConfig", () => {
  it("calculates total chunks for exact multiples", () => {
    assert.equal(calculateTotalChunks(UPLOAD_CHUNK_SIZE_BYTES * 3), 3);
  });

  it("calculates total chunks with remainder", () => {
    assert.equal(calculateTotalChunks(UPLOAD_CHUNK_SIZE_BYTES + 1), 2);
  });

  it("returns at least one chunk for small files", () => {
    assert.equal(calculateTotalChunks(1024), 1);
  });

  it("rejects invalid file sizes", () => {
    assert.equal(validateFileSize(0), "Invalid file size");
    assert.equal(validateFileSize(-10), "Invalid file size");
  });

  it("rejects files above max size", () => {
    assert.match(validateFileSize(MAX_FILE_SIZE_BYTES + 1), /exceeds maximum size/);
  });

  it("accepts valid file sizes", () => {
    assert.equal(validateFileSize(1024), null);
  });
});

function getMissingChunkIndices(totalChunks, receivedChunks) {
  const received = new Set(receivedChunks);
  const missing = [];
  for (let i = 0; i < totalChunks; i++) {
    if (!received.has(i)) missing.push(i);
  }
  return missing;
}

describe("chunk resume helpers", () => {
  it("finds missing chunk indices", () => {
    assert.deepEqual(getMissingChunkIndices(5, [0, 2, 4]), [1, 3]);
  });

  it("returns empty array when all chunks received", () => {
    assert.deepEqual(getMissingChunkIndices(3, [0, 1, 2]), []);
  });
});
