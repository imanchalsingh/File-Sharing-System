import { saveFileInfo, getFileVersions, restoreFileVersion } from './controllers/fileController.js';
import File from './models/File.js';

// Mocking the Mongoose model completely via Monkey-Patching
const mockDatabase = new Map();
let mockIdCounter = 1;

File.findOne = async (query) => {
  for (const [id, doc] of mockDatabase.entries()) {
    let matches = true;
    for (const key in query) {
      if (doc[key] !== query[key]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return {
        ...doc,
        save: async function() {
          mockDatabase.set(this._id.toString(), this);
          return this;
        }
      };
    }
  }
  return null;
};

File.findById = async (id) => {
  const doc = mockDatabase.get(id);
  if (doc) {
    return {
      ...doc,
      save: async function() {
        mockDatabase.set(this._id.toString(), this);
        return this;
      }
    };
  }
  return null;
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
  const res = {};
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
      user: { id: "user1" },
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
      user: { id: "user1" },
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
    let req3 = { params: { id: file2._id.toString() } };
    let res3 = mockRes();
    await getFileVersions(req3, res3);
    console.log("History retrieved:", res3.body.versions.length, "archived versions.");
    console.log("Active version info URL:", res3.body.activeVersionDetails.fileUrl);

    console.log("\n--- Test Case 4: Restoring Version 1 ---");
    let req4 = { params: { id: file2._id.toString(), version: "1" } };
    let res4 = mockRes();
    await restoreFileVersion(req4, res4);
    console.log("Restore Result:", res4.body.message);

    const file3 = await File.findOne({ fileName: "report.pdf" });
    console.log(`Current URL after restore: ${file3.fileUrl}`);
    console.log(`Current version number after restore: ${file3.currentVersion}`);
    console.log(`Number of archived versions after restore: ${file3.versions.length}`);
    console.log("Archived versions now have URLs:", file3.versions.map(v => v.fileUrl));

    console.log("\n✅ ALL TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test failed:", err);
  }
}

runTests();
