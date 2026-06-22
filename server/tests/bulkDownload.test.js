import express from "express";
import { bulkDownloadFiles } from "../controllers/fileController.js";
import File from "../models/File.js";

const app = express();
app.use(express.json());

// Mock authenticateUser
app.use((req, res, next) => {
  req.user = { id: "user123" };
  next();
});

// Mount the route
app.post("/bulk-download", bulkDownloadFiles);

// Global error handler
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ error: err.message });
});

// Backup originals
const originalFind = File.find;
const originalFetch = global.fetch;

const BASE = "http://localhost:5557";

function mockFetch() {
  global.fetch = async (...args) => {
    const url = args[0];
    if (typeof url === "string" && url.includes("localhost:5557")) {
      return originalFetch(...args);
    }
    if (typeof url === "string" && url.includes("fail-url")) {
      return { ok: false, statusText: "Not Found" };
    }
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("content-of-" + url));
        controller.close();
      },
    });
    return { ok: true, body: stream };
  };
}

function restore() {
  File.find = originalFind;
  global.fetch = originalFetch;
}

async function runTests() {
  const PORT = 5557;
  const server = app.listen(PORT, async () => {
    console.log("\n=============================================");
    console.log("   Bulk Download Test Suite");
    console.log("=============================================\n");

    let passed = 0;
    let failed = 0;

    function check(name, condition) {
      if (condition) {
        console.log(`  ✅ ${name}`);
        passed++;
      } else {
        console.log(`  ❌ ${name}`);
        failed++;
      }
    }

    try {
      // ======================================================
      // 1. Validation Edge Cases
      // ======================================================
      console.log("--- Validation Edge Cases ---");

      // 1a. Missing body entirely
      const r1a = await fetch(`${BASE}/bulk-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      check("1a. Missing fileIds returns 400", r1a.status === 400);

      // 1b. Empty array
      const r1b = await fetch(`${BASE}/bulk-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: [] }),
      });
      check("1b. Empty fileIds array returns 400", r1b.status === 400);

      // 1c. fileIds is not an array (string)
      const r1c = await fetch(`${BASE}/bulk-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: "not-an-array" }),
      });
      check("1c. fileIds as string returns 400", r1c.status === 400);

      // 1d. fileIds is null
      const r1d = await fetch(`${BASE}/bulk-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: null }),
      });
      check("1d. fileIds as null returns 400", r1d.status === 400);

      // 1e. Exceeds 50-file limit
      const r1e = await fetch(`${BASE}/bulk-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: Array(51).fill("id") }),
      });
      const r1eBody = await r1e.json();
      check("1e. >50 files returns 400", r1e.status === 400);
      check(
        "1e. Error message mentions limit",
        r1eBody.error.includes("Maximum")
      );

      // 1f. Exactly 50 files (should NOT fail validation — mock 0 results to get 404 instead)
      File.find = async () => [];
      const r1f = await fetch(`${BASE}/bulk-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: Array(50).fill("id") }),
      });
      check(
        "1f. Exactly 50 files passes limit check (404 from empty DB mock)",
        r1f.status === 404
      );

      // ======================================================
      // 2. Ownership / Authorization
      // ======================================================
      console.log("\n--- Ownership / Authorization ---");

      // 2a. No files belong to user (File.find returns empty)
      File.find = async () => [];
      const r2a = await fetch(`${BASE}/bulk-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: ["fake1", "fake2"] }),
      });
      check("2a. No owned files returns 404", r2a.status === 404);
      const r2aBody = await r2a.json();
      check(
        "2a. Error message says no valid files",
        r2aBody.error.includes("No valid files")
      );

      // ======================================================
      // 3. Successful ZIP Generation
      // ======================================================
      console.log("\n--- Successful ZIP Generation ---");

      // 3a. Single file
      File.find = async () => [
        { _id: "f1", fileName: "report.pdf", fileUrl: "http://cdn.com/report.pdf" },
      ];
      mockFetch();
      const r3a = await fetch(`${BASE}/bulk-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: ["f1"] }),
      });
      check("3a. Single file returns 200", r3a.status === 200);
      check(
        "3a. Content-Type is application/zip",
        r3a.headers.get("content-type") === "application/zip"
      );
      const buf3a = await r3a.arrayBuffer();
      check("3a. ZIP body is non-empty", buf3a.byteLength > 0);
      // Check for PK magic bytes (ZIP signature)
      const sig3a = new Uint8Array(buf3a.slice(0, 2));
      check("3a. ZIP starts with PK signature", sig3a[0] === 0x50 && sig3a[1] === 0x4b);

      // 3b. Multiple files
      File.find = async () => [
        { _id: "f1", fileName: "a.txt", fileUrl: "http://cdn.com/a.txt" },
        { _id: "f2", fileName: "b.txt", fileUrl: "http://cdn.com/b.txt" },
        { _id: "f3", fileName: "c.txt", fileUrl: "http://cdn.com/c.txt" },
      ];
      const r3b = await fetch(`${BASE}/bulk-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: ["f1", "f2", "f3"] }),
      });
      check("3b. Three files returns 200", r3b.status === 200);
      const buf3b = await r3b.arrayBuffer();
      check("3b. ZIP body is larger than single file", buf3b.byteLength > buf3a.byteLength);

      // 3c. Content-Disposition header includes attachment
      const disp = r3b.headers.get("content-disposition");
      check("3c. Content-Disposition is attachment", disp && disp.startsWith("attachment"));
      check("3c. Filename ends with .zip", disp && disp.includes(".zip"));

      // ======================================================
      // 4. Duplicate Filename Handling
      // ======================================================
      console.log("\n--- Duplicate Filename Handling ---");

      // 4a. Two files with the same name
      File.find = async () => [
        { _id: "f1", fileName: "photo.jpg", fileUrl: "http://cdn.com/1.jpg" },
        { _id: "f2", fileName: "photo.jpg", fileUrl: "http://cdn.com/2.jpg" },
      ];
      const r4a = await fetch(`${BASE}/bulk-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: ["f1", "f2"] }),
      });
      check("4a. Duplicate names returns 200 (deduplicated)", r4a.status === 200);
      const buf4a = await r4a.arrayBuffer();
      check("4a. ZIP body is non-empty", buf4a.byteLength > 0);

      // 4b. Three files with the same name
      File.find = async () => [
        { _id: "f1", fileName: "doc.pdf", fileUrl: "http://cdn.com/1.pdf" },
        { _id: "f2", fileName: "doc.pdf", fileUrl: "http://cdn.com/2.pdf" },
        { _id: "f3", fileName: "doc.pdf", fileUrl: "http://cdn.com/3.pdf" },
      ];
      const r4b = await fetch(`${BASE}/bulk-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: ["f1", "f2", "f3"] }),
      });
      check("4b. Triple duplicates returns 200", r4b.status === 200);

      // ======================================================
      // 5. Partial Failure / Resilience
      // ======================================================
      console.log("\n--- Partial Failure / Resilience ---");

      // 5a. Mix of good and bad URLs — one file fails to fetch
      File.find = async () => [
        { _id: "f1", fileName: "good.txt", fileUrl: "http://cdn.com/good.txt" },
        { _id: "f2", fileName: "bad.txt", fileUrl: "http://fail-url/bad.txt" },
        { _id: "f3", fileName: "also-good.txt", fileUrl: "http://cdn.com/also-good.txt" },
      ];
      const r5a = await fetch(`${BASE}/bulk-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: ["f1", "f2", "f3"] }),
      });
      check(
        "5a. Partial fetch failure still returns 200 (skips bad files)",
        r5a.status === 200
      );
      const buf5a = await r5a.arrayBuffer();
      check("5a. ZIP body is non-empty", buf5a.byteLength > 0);

      // 5b. File with no fileUrl
      File.find = async () => [
        { _id: "f1", fileName: "no-url.txt", fileUrl: null },
        { _id: "f2", fileName: "has-url.txt", fileUrl: "http://cdn.com/has-url.txt" },
      ];
      const r5b = await fetch(`${BASE}/bulk-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: ["f1", "f2"] }),
      });
      check("5b. File with null URL is skipped gracefully", r5b.status === 200);

      // 5c. File with empty string fileUrl
      File.find = async () => [
        { _id: "f1", fileName: "empty-url.txt", fileUrl: "" },
        { _id: "f2", fileName: "ok.txt", fileUrl: "http://cdn.com/ok.txt" },
      ];
      const r5c = await fetch(`${BASE}/bulk-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: ["f1", "f2"] }),
      });
      check("5c. File with empty string URL is skipped gracefully", r5c.status === 200);

      // ======================================================
      // 6. Edge: File without extension
      // ======================================================
      console.log("\n--- Files without Extensions ---");

      File.find = async () => [
        { _id: "f1", fileName: "Makefile", fileUrl: "http://cdn.com/makefile" },
        { _id: "f2", fileName: "Makefile", fileUrl: "http://cdn.com/makefile2" },
      ];
      const r6 = await fetch(`${BASE}/bulk-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: ["f1", "f2"] }),
      });
      check("6. Duplicate extensionless files handled", r6.status === 200);

    } catch (err) {
      console.error("\n💥 Unexpected error during tests:", err);
      failed++;
    } finally {
      restore();
    }

    console.log("\n=============================================");
    console.log(`   Results: ${passed} Passed, ${failed} Failed`);
    if (failed === 0) {
      console.log("   🎉 All tests passed!");
    }
    console.log("=============================================\n");

    server.close(() => process.exit(failed === 0 ? 0 : 1));
  });
}

runTests();
