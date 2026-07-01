process.env.ENABLE_DOCUMENT_INDEXING = "false";
process.env.ENABLE_MALWARE_SCANNING = "false";

import mongoose from "mongoose";
import File from "./models/File.js";
import UploadSession from "./models/UploadSession.js";
import { initUpload } from "./controllers/uploadController.js";
import { saveFileInfo } from "./controllers/fileController.js";
import { initUploadCleanupWorker } from "./jobs/uploadCleanupWorker.js";

// Mock database storage
const filesDb = new Map();
const sessionsDb = new Map();
let cronCallback = null;

// Monkey patch ObjectId validation for testing
mongoose.Types.ObjectId.isValid = () => true;

// Mock node-cron
import cron from "node-cron";
cron.schedule = (pattern, callback) => {
  cronCallback = callback;
  console.log(`[Mock Cron] Scheduled pattern: ${pattern}`);
  return { start: () => {} };
};

const createMockQuery = (result) => {
  const queryObj = {
    select: function() { return queryObj; },
    populate: function() { return queryObj; },
    sort: function() { return queryObj; },
    then: function(onFulfilled, onRejected) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
    catch: function(onRejected) {
      return Promise.resolve(result).catch(onRejected);
    }
  };
  return queryObj;
};

// Setup Mocking for File model
File.findOne = (query) => {
  console.log("[Mock DB File.findOne] Query:", query);
  for (const [id, doc] of filesDb.entries()) {
    let match = true;
    for (let key in query) {
      if (key === "status" && typeof query[key] === "object") {
        if (query[key].$ne && doc.status === query[key].$ne) match = false;
      } else {
        const docVal = doc[key] && typeof doc[key] === 'object' && doc[key].toString ? doc[key].toString() : doc[key];
        const queryVal = query[key] && typeof query[key] === 'object' && query[key].toString ? query[key].toString() : query[key];
        if (docVal !== queryVal) {
          match = false;
        }
      }
    }
    console.log(`- Comparing with doc ${id} (name: ${doc.fileName}, status: ${doc.status}, userId: ${doc.userId}) -> match: ${match}`);
    if (match) {
      doc.save = async function() {
        filesDb.set(this._id.toString(), this);
        return this;
      };
      return createMockQuery(doc);
    }
  }
  return createMockQuery(null);
};

File.find = async (query) => {
  const matched = [];
  for (const [id, doc] of filesDb.entries()) {
    let match = true;
    for (let key in query) {
      if (key === "updatedAt" && query[key].$lt) {
        if (new Date(doc.updatedAt) >= new Date(query[key].$lt)) match = false;
      } else if (key === "status" && typeof query[key] === "object") {
        if (query[key].$ne && doc.status === query[key].$ne) match = false;
      } else {
        const docVal = doc[key] && typeof doc[key] === 'object' && doc[key].toString ? doc[key].toString() : doc[key];
        const queryVal = query[key] && typeof query[key] === 'object' && query[key].toString ? query[key].toString() : query[key];
        if (docVal !== queryVal) {
          match = false;
        }
      }
    }
    if (match) matched.push(doc);
  }
  return matched;
};

File.findByIdAndDelete = async (id) => {
  console.log(`[Mock DB] Deleting File ID: ${id}`);
  filesDb.delete(id.toString());
  return true;
};

// We mock the constructor and save methods on File prototype
File.prototype.save = async function() {
  if (!this._id) {
    this._id = new mongoose.Types.ObjectId().toString();
  }
  this.createdAt = this.createdAt || new Date();
  this.updatedAt = new Date();
  filesDb.set(this._id.toString(), this);
  return this;
};

// Setup Mocking for UploadSession model
UploadSession.create = async (data) => {
  const session = {
    _id: new mongoose.Types.ObjectId().toString(),
    ...data,
    receivedChunks: [],
    uploadedBytes: 0,
    expiresAt: new Date(Date.now() + 3600000),
    save: async function() {
      sessionsDb.set(this._id, this);
      return this;
    }
  };
  sessionsDb.set(session._id, session);
  return session;
};

UploadSession.findOne = (query) => {
  for (const [id, doc] of sessionsDb.entries()) {
    let match = true;
    for (let key in query) {
      if (key === "status" && typeof query[key] === "object") {
        if (query[key].$in && !query[key].$in.includes(doc.status)) match = false;
      } else if (doc[key] && doc[key].toString() !== query[key].toString()) {
        match = false;
      }
    }
    if (match) return createMockQuery(doc);
  }
  return createMockQuery(null);
};

UploadSession.findByIdAndDelete = async (id) => {
  console.log(`[Mock DB] Deleting UploadSession ID: ${id}`);
  sessionsDb.delete(id.toString());
  return true;
};

// Mock Express req/res
const mockRes = () => {
  const res = { statusCode: 200 };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

const mockNext = (err) => {
  if (err) throw err;
};

async function runTests() {
  console.log("--- Starting Mock Tests for Stale Upload Cleanup ---");

  try {
    // Enable cleanup worker registration (registers mock cron)
    initUploadCleanupWorker();

    console.log("\n--- Test Case 1: Initialize Upload ---");
    let req1 = {
      user: { id: "60c72b2f9b1d8e1f5c8b4567" },
      get: (header) => "localhost",
      body: {
        fileName: "large_movie.mp4",
        fileSizeBytes: 104857600, // 100 MB
        mimeType: "video/mp4"
      }
    };
    let res1 = mockRes();
    await initUpload(req1, res1, mockNext);

    console.log("initUpload Response status:", res1.statusCode);
    console.log("initUpload Response session ID:", res1.body.session.sessionId);

    // Verify a PENDING File document was created
    const pendingFile = Array.from(filesDb.values()).find(f => f.status === "PENDING");
    if (!pendingFile) throw new Error("Test 1 Failed: No PENDING file was created!");
    console.log(`✅ PENDING File document created successfully. ID: ${pendingFile._id}`);

    // Verify session references the pending file
    const activeSession = sessionsDb.get(res1.body.session.sessionId);
    if (!activeSession || activeSession.fileId.toString() !== pendingFile._id.toString()) {
      throw new Error("Test 1 Failed: UploadSession does not reference the PENDING file ID.");
    }
    console.log(`✅ UploadSession successfully linked to PENDING File ID.`);

    console.log("\n--- Test Case 2: Save File Info (Transitions to COMPLETED) ---");
    let req2 = {
      user: { id: "60c72b2f9b1d8e1f5c8b4567" },
      body: {
        fileName: "large_movie.mp4",
        fileUrl: "https://cloudinary.com/secureshare/large_movie.mp4",
        fileType: "video",
        fileSize: "100 MB",
        fileSizeBytes: 104857600,
        checksum: "sha256checksumvalue"
      },
      app: {
        get: () => ({ to: () => ({ emit: () => {} }) }) // mock socket.io
      }
    };
    let res2 = mockRes();
    await saveFileInfo(req2, res2, mockNext);

    console.log("saveFileInfo Response status:", res2.statusCode);
    const completedFile = filesDb.get(pendingFile._id.toString());
    if (!completedFile || completedFile.status !== "COMPLETED") {
      throw new Error("Test 2 Failed: File status did not transition to COMPLETED!");
    }
    if (completedFile.fileUrl !== req2.body.fileUrl) {
      throw new Error("Test 2 Failed: File URL was not updated correctly!");
    }
    console.log("✅ File status transitioned to COMPLETED and data updated successfully.");

    console.log("\n--- Test Case 3: Sweep Stale PENDING Uploads via Cron Worker ---");
    // Clear DB and create one stale pending file and one recent pending file
    filesDb.clear();
    sessionsDb.clear();

    // Stale upload (25 hours ago)
    const staleFileId = new mongoose.Types.ObjectId().toString();
    const staleFile = {
      _id: staleFileId,
      fileName: "abandoned.txt",
      fileUrl: "http://temp/abandoned",
      fileType: "text",
      fileSize: "5 KB",
      fileSizeBytes: 5120,
      userId: "60c72b2f9b1d8e1f5c8b4567",
      status: "PENDING",
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000)
    };
    filesDb.set(staleFileId, staleFile);

    const staleSessionId = new mongoose.Types.ObjectId().toString();
    const staleSession = {
      _id: staleSessionId,
      userId: "60c72b2f9b1d8e1f5c8b4567",
      fileName: "abandoned.txt",
      tempDir: "/tmp/upload-stale-dir",
      fileId: staleFileId,
      status: "uploading"
    };
    sessionsDb.set(staleSessionId, staleSession);

    // Recent upload (1 hour ago)
    const recentFileId = new mongoose.Types.ObjectId().toString();
    const recentFile = {
      _id: recentFileId,
      fileName: "active.txt",
      fileUrl: "http://temp/active",
      fileType: "text",
      fileSize: "2 KB",
      fileSizeBytes: 2048,
      userId: "60c72b2f9b1d8e1f5c8b4567",
      status: "PENDING",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    };
    filesDb.set(recentFileId, recentFile);

    const recentSessionId = new mongoose.Types.ObjectId().toString();
    const recentSession = {
      _id: recentSessionId,
      userId: "60c72b2f9b1d8e1f5c8b4567",
      fileName: "active.txt",
      tempDir: "/tmp/upload-active-dir",
      fileId: recentFileId,
      status: "uploading"
    };
    sessionsDb.set(recentSessionId, recentSession);

    console.log(`Initial DB state: ${filesDb.size} files, ${sessionsDb.size} sessions.`);

    // Trigger cron sweep callback
    if (!cronCallback) throw new Error("Test 3 Failed: Cron callback not captured!");
    await cronCallback();

    console.log(`Post-sweep DB state: ${filesDb.size} files, ${sessionsDb.size} sessions.`);
    
    // Check if stale upload is gone
    if (filesDb.has(staleFileId) || sessionsDb.has(staleSessionId)) {
      throw new Error("Test 3 Failed: Stale file or session was not deleted!");
    }
    
    // Check if recent upload is kept
    if (!filesDb.has(recentFileId) || !sessionsDb.has(recentSessionId)) {
      throw new Error("Test 3 Failed: Recent pending file or session was deleted!");
    }

    console.log("✅ Cron sweep cleared stale uploads, keeping active ones.");
    console.log("\n🎉 ALL CLEANUP WORKER TESTS PASSED SUCCESSFULLY!");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Test Case Failed:", error.message || error);
    process.exit(1);
  }
}

runTests();
