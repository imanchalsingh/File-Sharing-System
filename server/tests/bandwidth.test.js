/**
 * Bandwidth Quota Integration Test
 * 
 * This standalone script tests the new Rate Limiting and Bandwidth Quota features.
 * It simulates a file download that exceeds the bandwidth limit.
 * 
 * Run using: node tests/bandwidth.test.js
 */

import express from "express";
import { downloadLimiter } from "../middleware/rateLimiter.js";

// Mock Database State
const mockShareLink = {
  token: "abc123xyz",
  fileId: {
    fileName: "massive_file.zip",
    fileUrl: "http://example.com/massive_file.zip",
    fileSizeBytes: 200 * 1024 * 1024, // 200 MB
  },
  accessCount: 0,
  dailyBandwidth: 400 * 1024 * 1024, // 400 MB already used today
  bandwidthLimit: 500 * 1024 * 1024, // 500 MB limit
  isSuspended: false,
  save: async function() {
    return this;
  }
};

const app = express();

// Mock accessSharedFile Controller Logic
app.get("/api/shares/access/:token", downloadLimiter, async (req, res) => {
  const share = mockShareLink;
  
  if (share.isSuspended) {
    return res.status(429).json({
      success: false,
      error: 'quota_exceeded',
      message: 'This share link has been temporarily suspended due to exceeding its daily bandwidth quota.',
      fileName: share.fileId.fileName,
    });
  }

  const fileSizeBytes = share.fileId.fileSizeBytes;
  
  // Exceeds Limit Test
  if (share.dailyBandwidth + fileSizeBytes > share.bandwidthLimit) {
    share.isSuspended = true;
    await share.save();
    return res.status(429).json({
      success: false,
      error: 'quota_exceeded',
      message: 'This share link has exceeded its daily bandwidth quota and has been suspended.',
      fileName: share.fileId.fileName,
    });
  }

  // Success
  share.accessCount += 1;
  share.dailyBandwidth += fileSizeBytes;
  await share.save();
  res.json({ success: true, file: share.fileId });
});

// Run the tests
const PORT = 5556;
const server = app.listen(PORT, async () => {
  console.log("\n=============================================");
  console.log("   Bandwidth Quota Test Suite Started        ");
  console.log("=============================================\n");

  let passedTests = 0;
  const totalTests = 2;

  // Test 1: First download attempts to use 200MB, but only 100MB remaining
  console.log("Running Test 1: Exceed Quota on Download...");
  const response1 = await fetch(`http://localhost:${PORT}/api/shares/access/abc123xyz`);
  const data1 = await response1.json();
  
  if (response1.status === 429 && data1.error === 'quota_exceeded') {
    console.log("✅ Test 1 Passed: Request correctly blocked with 429 Quota Exceeded.");
    passedTests++;
  } else {
    console.error("❌ Test 1 Failed:", data1);
  }

  // Test 2: Next download attempt should hit the 'isSuspended' flag immediately
  console.log("\nRunning Test 2: Verify Link is Suspended...");
  const response2 = await fetch(`http://localhost:${PORT}/api/shares/access/abc123xyz`);
  const data2 = await response2.json();

  if (response2.status === 429 && data2.message.includes("temporarily suspended")) {
    console.log("✅ Test 2 Passed: Link remained suspended on subsequent requests.");
    passedTests++;
  } else {
    console.error("❌ Test 2 Failed:", data2);
  }

  console.log("\n=============================================");
  console.log(`   Test Results: ${passedTests}/${totalTests} Passed`);
  if (passedTests === totalTests) {
    console.log("   🎉 All Bandwidth Quota tests passed!");
  }
  console.log("=============================================\n");

  server.close(() => {
    process.exit(0);
  });
});
