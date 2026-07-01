import { describe, it, expect, beforeAll } from "vitest";
import { prepareE2EEncryption, encryptChunk } from "../resumableUpload";
import { webcrypto } from "crypto";

// Polyfill window.crypto and base64 encoders for Node-based Vitest environment
beforeAll(() => {
  if (typeof window === "undefined") {
    (global as any).window = {};
  }
  (global as any).window.crypto = webcrypto;
  (global as any).window.btoa = (str: string) => Buffer.from(str, "binary").toString("base64");
  (global as any).window.atob = (str: string) => Buffer.from(str, "base64").toString("binary");
});

describe("Client-Side E2EE WebCrypto Unit Tests", () => {
  const testPassword = "secure-passphrase-123";
  const testData = new TextEncoder().encode("Hello, this is a secret chunk payload to encrypt!");

  it("should derive key salt and wrapped DEK correctly", async () => {
    const result = await prepareE2EEncryption(testPassword);
    
    expect(result.dek).toBeDefined();
    expect(result.rawDekBytes).toBeDefined();
    expect(result.rawDekBytes.length).toBe(32); // 256-bit AES DEK
    expect(result.wrappedKeyBase64).toBeDefined();
    expect(result.keySaltBase64).toBeDefined();

    // Verify key salt is 16 bytes base64 decoded
    const saltBytes = Buffer.from(result.keySaltBase64, "base64");
    expect(saltBytes.length).toBe(16);

    // Verify wrapped key base64 decoded is 12 bytes IV + 32 bytes DEK + 16 bytes Tag = 60 bytes
    const wrappedBytes = Buffer.from(result.wrappedKeyBase64, "base64");
    expect(wrappedBytes.length).toBe(60);
  });

  it("should encrypt and decrypt a chunk slice matching original data", async () => {
    const { dek, rawDekBytes } = await prepareE2EEncryption(testPassword);

    const chunkBlob = new Blob([testData], { type: "text/plain" });
    const chunkIndex = 0;

    // Encrypt
    const encryptedChunkBlob = await encryptChunk(chunkBlob, chunkIndex, dek, rawDekBytes);
    expect(encryptedChunkBlob.size).toBe(testData.length + 28); // 12B IV + 16B GCM tag + original data length

    // Decrypt (simulate SharePage.tsx decoding flow)
    const encryptedBuffer = await encryptedChunkBlob.arrayBuffer();
    const encryptedCombined = new Uint8Array(encryptedBuffer);

    // Extract IV (first 12 bytes) and ciphertext (rest)
    const iv = encryptedCombined.slice(0, 12);
    const ciphertext = encryptedCombined.slice(12);

    expect(iv.length).toBe(12);
    expect(ciphertext.length).toBe(testData.length + 16); // ciphertext + 16B GCM tag

    // Decrypt using WebCrypto AES-GCM
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      dek,
      ciphertext
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    expect(decryptedText).toBe("Hello, this is a secret chunk payload to encrypt!");
  });
});
