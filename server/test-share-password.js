import { createShareLink, accessSharedFile, verifyShareLinkPassword } from "./controllers/shareController.js";
import ShareLink from "./models/ShareLink.js";
import File from "./models/File.js";
import bcrypt from "bcryptjs";

async function runTests() {
  console.log("Starting Mock Tests for Share Link Password...");

  const createRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.data = data;
      return res;
    };
    return res;
  };
  const next = (err) => { throw err; };

  // Mocks
  const sharesDB = [];
  const filesDB = [{ _id: "file123", userId: "user1", fileName: "test.txt", fileUrl: "http://test", fileSizeBytes: 100, shareCount: 0, shareHistory: [], save: async function() { return this; } }];

  File.findOne = async (query) => filesDB.find(f => f._id === query._id && f.userId === query.userId);
  File.findById = async (id) => filesDB.find(f => f._id === id);

  ShareLink.prototype.save = async function() {
    this._id = "share_id_" + Math.random();
    this.createdAt = new Date();
    sharesDB.push(this);
    return this;
  };

  ShareLink.findOne = (query) => {
    let found = null;
    if (query.$or) {
      const token = query.$or[0].token;
      found = sharesDB.find(s => s.token === token || s.slug === token);
    } else {
      found = sharesDB.find(s => Object.keys(query).every(k => s[k] === query[k]));
    }
    if (!found) return { populate: () => Promise.resolve(null), then: (resolve) => resolve(null) };
    const resultObj = typeof found.toObject === 'function' ? found.toObject() : { ...found };
    resultObj.fileId = filesDB.find(f => f._id === "file123");
    resultObj.save = async function() {
      Object.assign(found, this);
      return found;
    };
    return {
      populate: () => Promise.resolve(resultObj),
      then: (resolve) => resolve(resultObj)
    };
  };

  try {
    console.log("\n--- Test 1: Create Share Link with Password ---");
    let req = { 
      user: { id: "user1" }, 
      body: { fileId: "file123", password: "mypassword123" } 
    };
    let res = createRes();
    
    await createShareLink(req, res, next);
    console.log("Response:", res.statusCode, res.data);
    if (!res.data.success || !res.data.share.token) throw new Error("Test 1 Failed");
    const token = res.data.share.token;

    console.log("\n--- Test 2: Access Share Link ---");
    req = { params: { token } };
    res = createRes();
    
    await accessSharedFile(req, res, next);
    console.log("Response:", res.statusCode, res.data);
    if (!res.data.isPasswordProtected) throw new Error("Test 2 Failed: Should be password protected");
    if (res.data.file) throw new Error("Test 2 Failed: File data should not be exposed");

    console.log("\n--- Test 3: Verify Password (Incorrect) ---");
    req = { params: { token }, body: { password: "wrong" } };
    res = createRes();
    await verifyShareLinkPassword(req, res, next);
    console.log("Response:", res.statusCode, res.data);
    if (res.statusCode !== 401) throw new Error("Test 3 Failed: Should return 401");

    console.log("\n--- Test 4: Verify Password (Correct) ---");
    req = { params: { token }, body: { password: "mypassword123" } };
    res = createRes();
    await verifyShareLinkPassword(req, res, next);
    console.log("Response:", res.statusCode, res.data);
    if (!res.data.success || !res.data.file.fileUrl) throw new Error("Test 4 Failed: Should return file details");

    console.log("\n--- Test 5: Standard Share Link (No Password) ---");
    req = { user: { id: "user1" }, body: { fileId: "file123" } };
    res = createRes();
    await createShareLink(req, res, next);
    const tokenNoPass = res.data.share.token;
    req = { params: { token: tokenNoPass } };
    res = createRes();
    await accessSharedFile(req, res, next);
    console.log("Response:", res.statusCode, res.data);
    if (res.data.isPasswordProtected) throw new Error("Test 5 Failed: Should NOT be password protected");
    if (!res.data.file) throw new Error("Test 5 Failed: Should return file directly");

    console.log("\n--- Test 6: Expired Link ---");
    req = { user: { id: "user1" }, body: { fileId: "file123", expiresAt: new Date(Date.now() - 10000).toISOString() } };
    res = createRes();
    await createShareLink(req, res, next);
    const tokenExpired = res.data.share.token;
    req = { params: { token: tokenExpired } };
    res = createRes();
    await accessSharedFile(req, res, next);
    console.log("Response:", res.statusCode, res.data);
    if (res.statusCode !== 410) throw new Error("Test 6 Failed: Should return 410 Expired");

    console.log("\n--- Test 7: Missing File ---");
    req = { user: { id: "user1" }, body: { fileId: "file123", password: "123" } };
    res = createRes();
    await createShareLink(req, res, next);
    const tokenMissing = res.data.share.token;
    // mock missing file by removing it temporarily
    const originalFileId = filesDB[0]._id;
    filesDB[0]._id = "deleted_file";
    req = { params: { token: tokenMissing } };
    res = createRes();
    await accessSharedFile(req, res, next);
    console.log("Response:", res.statusCode, res.data);
    if (res.statusCode !== 404) throw new Error("Test 7 Failed: Should return 404 Not Found");
    filesDB[0]._id = originalFileId; // restore

    console.log("\nAll tests passed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Test execution error:", error.message || error);
    process.exit(1);
  }
}

runTests();
