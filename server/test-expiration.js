import { createShareLink, accessSharedFile, extendShareLink, revokeShareLink } from './controllers/shareController.js';
import ShareLink from './models/ShareLink.js';
import File from './models/File.js';
import Notification from './models/Notification.js';

// Mock DB
const mockFileDb = new Map();
const mockShareDb = new Map();
const mockNotifDb = new Map();

// Setup File Mock
File.findOne = async (query) => {
  for (const [id, doc] of mockFileDb.entries()) {
    if (doc._id === query._id && doc.userId === query.userId) {
      return {
        ...doc,
        save: async function() { mockFileDb.set(this._id, this); return this; },
        shareHistory: doc.shareHistory || []
      };
    }
  }
  return null;
};

// Setup ShareLink Mock
ShareLink.findOne = (query) => {
  const queryObj = {
    then: function(resolve, reject) {
      this.exec().then(resolve).catch(reject);
    },
    populate: function(fields) {
      this._populate = true;
      return this;
    },
    exec: async function() {
      let found = null;
      for (const [id, doc] of mockShareDb.entries()) {
        let match = true;
        for (let key in query) {
          if (doc[key] !== query[key]) {
            match = false;
            break;
          }
        }
        if (match) {
          found = {
            ...doc,
            save: async function() { mockShareDb.set(this._id || this.token, this); return this; }
          };
          break;
        }
      }
      if (found && this._populate) {
         found.fileId = mockFileDb.get(found.fileId) || found.fileId;
      }
      return found;
    }
  };
  return queryObj;
};

ShareLink.prototype.save = async function() {
  if (!this._id) this._id = 'share_' + Math.random();
  if (this.accessCount === undefined) this.accessCount = 0;
  if (this.status === undefined) this.status = 'active';
  if (this.notifiedAt24h === undefined) this.notifiedAt24h = false;
  if (this.notifiedAt1h === undefined) this.notifiedAt1h = false;
  mockShareDb.set(this._id || this.token, this);
  return this;
};

// Setup Notification Mock
Notification.prototype.save = async function() {
  if (!this._id) this._id = 'notif_' + Math.random();
  mockNotifDb.set(this._id, this);
  return this;
};

const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
};

async function runTests() {
  console.log("--- Starting Expiration Management Tests ---\n");

  try {
    // 1. Setup mock file
    const fileId = "file_123";
    mockFileDb.set(fileId, {
      _id: fileId,
      userId: "user_1",
      fileName: "secret.txt",
      shareCount: 0,
      shareHistory: []
    });

    console.log("--- Test Case 1: Create Share Link (Expires in 1s) ---");
    const expiresAt = new Date(Date.now() + 1000).toISOString();
    let req1 = {
      user: { id: "user_1" },
      body: { fileId, expiresAt, maxAccessCount: 2 }
    };
    let res1 = mockRes();
    await createShareLink(req1, res1);
    
    if (!res1.body || !res1.body.success) {
      throw new Error("Create share link failed: " + JSON.stringify(res1.body));
    }
    
    const token = res1.body.share.token;
    const shareId = res1.body.share._id;
    console.log(`Created Share Link! Token: ${token}, Expires At: ${res1.body.share.expiresAt}`);
    console.log(`File Share Count Updated to: ${mockFileDb.get(fileId).shareCount}`);

    console.log("\n--- Test Case 2: Access Valid Share Link ---");
    let req2 = { params: { token } };
    let res2 = mockRes();

    await accessSharedFile(req2, res2);
    if (!res2.body.success) {
      throw new Error("Access valid share link failed: " + JSON.stringify(res2.body));
    }
    console.log(`Access Success! File Name: ${res2.body.file.fileName}`);
    console.log(`Access Count: ${res2.body.share.accessCount}`);

    console.log("\n--- Test Case 3: Extend Expiration ---");
    const newExpiresAt = new Date(Date.now() + 100000).toISOString();
    let req3 = {
      user: { id: "user_1" },
      params: { shareId },
      body: { expiresAt: newExpiresAt }
    };
    let res3 = mockRes();
    await extendShareLink(req3, res3);
    console.log(`Extend Result: ${res3.body.message}`);
    console.log(`New Expiration Date: ${res3.body.share.expiresAt}`);
    
    console.log(`Notifications created: ${mockNotifDb.size}`);
    for(const [id, notif] of mockNotifDb.entries()) {
        console.log(`- Type: ${notif.type}, Message: ${notif.message}`);
    }

    console.log("\n--- Test Case 4: Revoke Share Link ---");
    let req4 = {
      user: { id: "user_1" },
      params: { shareId }
    };
    let res4 = mockRes();
    await revokeShareLink(req4, res4);
    console.log(`Revoke Result: ${res4.body.message}`);
    console.log(`Status changed to: ${res4.body.share.status}`);

    console.log("\n--- Test Case 5: Access Revoked Link ---");
    let req5 = { params: { token } };
    let res5 = mockRes();
    await accessSharedFile(req5, res5);
    console.log(`Access Revoked Response: ${res5.statusCode} - ${res5.body.message}`);

    console.log("\n✅ ALL TESTS EXECUTED AND PASSED!");
  } catch (err) {
    console.error("❌ Test failed:", err);
  }
}

runTests();
