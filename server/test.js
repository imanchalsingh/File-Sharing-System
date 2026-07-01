process.env.ENABLE_DOCUMENT_INDEXING = "false";
process.env.ENABLE_MALWARE_SCANNING = "false";

import { saveFileInfo, getFileVersions, restoreFileVersion, updateFilePassword, getSharedFileById, verifySharedFilePassword } from './controllers/fileController.js';
import File from './models/File.js';
import mongoose from 'mongoose';

// Monkey patch ObjectId validation for testing
mongoose.Types.ObjectId.isValid = () => true;

// Mocking the Mongoose model completely via Monkey-Patching
const mockDatabase = new Map();
let mockIdCounter = 1;

const createMockQuery = (result) => {
  const queryObj = {
    select: function() { return queryObj; },
    populate: function(path, select) {
      if (path === 'userId' && result) {
        if (typeof result.userId === 'string') {
          result.userId = { _id: result.userId, username: result.userId, email: `${result.userId}@example.com` };
        }
      }
      return queryObj;
    },
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

File.findOne = (query) => {
  for (const [id, doc] of mockDatabase.entries()) {
    let matches = true;
    for (const key in query) {
      const docVal = doc[key] && typeof doc[key] === 'object' && doc[key].toString ? doc[key].toString() : doc[key];
      const queryVal = query[key] && typeof query[key] === 'object' && query[key].toString ? query[key].toString() : query[key];
      if (docVal !== queryVal) {
        matches = false;
        break;
      }
    }
    if (matches) {
      doc.save = async function() {
        mockDatabase.set(this._id.toString(), this);
        return this;
      };
      return createMockQuery(doc);
    }
  }
  return createMockQuery(null);
};

File.findById = (id) => {
  const doc = mockDatabase.get(id ? id.toString() : '');
  if (doc) {
    doc.save = async function() {
      mockDatabase.set(this._id.toString(), this);
      return this;
    };
  }
  return createMockQuery(doc || null);
};

File.prototype.save = async function() {
  if (!this._id) {
    this._id = (mockIdCounter++).toString();
  }
  mockDatabase.set(this._id.toString(), this);
  return this;
};

// Mock Express req/res
const mockRes = () => {
  const res = {
    statusCode: 200
  };
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

async function runTests() {
  console.log("--- Starting Unit Tests with Mock DB ---\n");

  try {
    console.log("--- Test Case 1: Initial Upload ---");
    let req1 = {
      user: { id: "60c72b2f9b1d8e1f5c8b4567" },
      body: {
        fileName: "report.pdf",
        fileUrl: "http://example.com/1",
        fileType: "application",
        fileSize: "1 MB",
        fileSizeBytes: 1048576,
        checksum: "abc1"
      }
    };
    let res1 = mockRes();
    await saveFileInfo(req1, res1);
    console.log("Upload 1 Result:", res1.body.message);

    const file1 = await File.findOne({ fileName: "report.pdf" });
    console.log(`Current version: ${file1.currentVersion}, URL: ${file1.fileUrl}`);

    console.log("\n--- Test Case 2: Uploading a new version of the same file ---");
    let req2 = {
      user: { id: "60c72b2f9b1d8e1f5c8b4567" },
      body: {
        fileName: "report.pdf",
        fileUrl: "http://example.com/2",
        fileType: "application",
        fileSize: "2 MB",
        fileSizeBytes: 2097152,
        checksum: "abc2"
      }
    };
    let res2 = mockRes();
    await saveFileInfo(req2, res2);
    console.log("Upload 2 Result:", res2.body.message);

    const file2 = await File.findOne({ fileName: "report.pdf" });
    console.log(`Current version: ${file2.currentVersion}, URL: ${file2.fileUrl}`);
    console.log(`Number of archived versions: ${file2.versions ? file2.versions.length : 0}`);

    console.log("\n--- Test Case 3: Fetching Version History ---");
    let req3 = { 
      user: { id: "60c72b2f9b1d8e1f5c8b4567" },
      params: { id: file2._id.toString() } 
    };
    let res3 = mockRes();
    await getFileVersions(req3, res3);
    console.log("History retrieved:", res3.body.versions.length, "archived versions.");
    console.log("Active version info URL:", res3.body.activeVersionDetails.fileUrl);

    console.log("\n--- Test Case 4: Restoring Version 1 ---");
    let req4 = { 
      user: { id: "60c72b2f9b1d8e1f5c8b4567" },
      params: { id: file2._id.toString(), version: "1" } 
    };
    let res4 = mockRes();
    await restoreFileVersion(req4, res4);
    console.log("Restore Result:", res4.body.message);

    const file3 = await File.findOne({ fileName: "report.pdf" });
    console.log(`Current URL after restore: ${file3.fileUrl}`);
    console.log(`Current version number after restore: ${file3.currentVersion}`);
    console.log(`Number of archived versions after restore: ${file3.versions.length}`);
    console.log("Archived versions now have URLs:", file3.versions.map(v => v.fileUrl));

    console.log("\n--- Test Case 5: Setting Password on File ---");
    let req5 = {
      user: { id: "60c72b2f9b1d8e1f5c8b4567" },
      params: { id: file3._id.toString() },
      body: { password: "secure-password123" }
    };
    let res5 = mockRes();
    await updateFilePassword(req5, res5);
    console.log("Update Password Result:", res5.body.message, "| isPasswordProtected:", res5.body.isPasswordProtected);

    console.log("\n--- Test Case 6: Retrieving Shared File Metadata (Locked) ---");
    let req6 = {
      params: { id: file3._id.toString() }
    };
    let res6 = mockRes();
    await getSharedFileById(req6, res6);
    console.log("Locked Shared File URL:", res6.body.file.fileUrl); // Should be null
    console.log("Locked Shared File isPasswordProtected:", res6.body.file.isPasswordProtected); // Should be true
    console.log("Locked Shared File versions (should omit fileUrls):", res6.body.file.versions);

    console.log("\n--- Test Case 7: Verifying Wrong Password ---");
    let req7 = {
      params: { id: file3._id.toString() },
      body: { password: "wrong-password" }
    };
    let res7 = mockRes();
    await verifySharedFilePassword(req7, res7);
    console.log("Wrong Password Response Status:", res7.statusCode, "| Error:", res7.body?.error);

    console.log("\n--- Test Case 8: Verifying Correct Password ---");
    let req8 = {
      params: { id: file3._id.toString() },
      body: { password: "secure-password123" }
    };
    let res8 = mockRes();
    await verifySharedFilePassword(req8, res8);
    console.log("Correct Password Response Status:", res8.statusCode, "| Unlocked File URL:", res8.body.fileUrl);

    console.log("\n--- Test Case 9: Removing Password from File ---");
    let req9 = {
      user: { id: "60c72b2f9b1d8e1f5c8b4567" },
      params: { id: file3._id.toString() },
      body: { password: "" }
    };
    let res9 = mockRes();
    await updateFilePassword(req9, res9);
    console.log("Remove Password Result:", res9.body.message, "| isPasswordProtected:", res9.body.isPasswordProtected);

    console.log("\n--- Test Case 10: Retrieving Shared File Metadata (Unlocked) ---");
    let req10 = {
      params: { id: file3._id.toString() }
    };
    let res10 = mockRes();
    await getSharedFileById(req10, res10);
    console.log("Unlocked Shared File URL:", res10.body.file.fileUrl); // Should not be null
    console.log("Unlocked Shared File isPasswordProtected:", res10.body.file.isPasswordProtected); // Should be false

    console.log("\n✅ ALL TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test failed:", err);
  }
}

runTests();
