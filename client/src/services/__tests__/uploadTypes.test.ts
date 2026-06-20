import { describe, expect, it } from "vitest";
import {
  calculateTotalChunks,
  DEFAULT_CHUNK_SIZE,
  getMissingChunkIndices,
} from "../uploadTypes";

describe("uploadTypes", () => {
  it("calculates chunk count", () => {
    expect(calculateTotalChunks(DEFAULT_CHUNK_SIZE * 2, DEFAULT_CHUNK_SIZE)).toBe(2);
    expect(calculateTotalChunks(DEFAULT_CHUNK_SIZE + 1, DEFAULT_CHUNK_SIZE)).toBe(2);
    expect(calculateTotalChunks(100, DEFAULT_CHUNK_SIZE)).toBe(1);
  });

  it("detects missing chunks for resume", () => {
    expect(getMissingChunkIndices(4, [0, 3])).toEqual([1, 2]);
    expect(getMissingChunkIndices(2, [0, 1])).toEqual([]);
  });
});
