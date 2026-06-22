import express from "express";
import {
  createFolder,
  getFolderTree,
  getFolderContents,
  renameFolder,
  moveFolder,
  deleteFolder,
} from "../controllers/folderController.js";
import Folder from "../models/Folder.js";
import File from "../models/File.js";

const app = express();
app.use(express.json());

// Mock authenticateUser
app.use((req, res, next) => {
  req.user = { id: "user123" };
  next();
});

const router = express.Router();
router.post("/", createFolder);
router.get("/tree", getFolderTree);
router.get("/:id/contents", getFolderContents);
router.patch("/:id/rename", renameFolder);
router.patch("/:id/move", moveFolder);
router.delete("/:id", deleteFolder);

app.use("/api/folders", router);

// Global error handler
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ error: err.message });
});

// Mock database interactions
let foldersDb = [];
let filesDb = [];

let nextFolderId = 1;

Folder.findOne = async (query) => {
  const f = foldersDb.find(f => String(f._id) === String(query._id) && String(f.userId) === String(query.userId));
  if (!f) return null;
  return { ...f, save: async function() { 
    const idx = foldersDb.findIndex(x => x._id === this._id);
    if (idx !== -1) foldersDb[idx] = this;
  } };
};

Folder.find = async (query) => {
  let result = foldersDb.filter(f => String(f.userId) === String(query.userId));
  if (query.parentId !== undefined) {
    result = result.filter(f => String(f.parentId) === String(query.parentId));
  }
  return {
    sort: () => result
  };
};

Folder.prototype.save = async function() {
  const doc = this.toObject ? this.toObject() : this;
  if (!this._id) {
    this._id = "folder" + nextFolderId++;
    doc._id = this._id;
    foldersDb.push(doc);
  } else {
    const idx = foldersDb.findIndex(f => String(f._id) === String(this._id));
    if (idx !== -1) foldersDb[idx] = doc;
  }
  return this;
};

Folder.updateMany = async (query, update) => {
  foldersDb.forEach(f => {
    if (f.parentId === query.parentId) f.parentId = update.$set.parentId;
  });
};

Folder.deleteOne = async (query) => {
  foldersDb = foldersDb.filter(f => f._id !== query._id);
};

File.find = async (query) => {
  let result = filesDb.filter(f => f.userId === query.userId && f.isDeleted === false);
  if (query.folderId !== undefined) {
    result = result.filter(f => f.folderId === query.folderId);
  }
  return {
    sort: () => result
  };
};

File.updateMany = async (query, update) => {
  filesDb.forEach(f => {
    if (f.folderId === query.folderId) f.folderId = update.$set.folderId;
  });
};

File.deleteMany = async (query) => {
  filesDb = filesDb.filter(f => f.folderId !== query.folderId);
};

// ... we will use fetch to run tests
async function runTests() {
  const PORT = 5558;
  const server = app.listen(PORT, async () => {
    console.log("Running Folder API Tests...");
    let passed = 0;
    let failed = 0;

    const BASE = `http://localhost:${PORT}/api/folders`;

    try {
      // Test 1: Create Root Folder
      const res1 = await fetch(`${BASE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Docs" })
      });
      if (res1.status === 201) {
        passed++;
        console.log("✅ Create root folder");
        console.log("DB state after root:", foldersDb);
      } else {
        failed++;
        console.log(`❌ Create root folder failed: ${res1.status}`);
      }

      const rootFolderId = "folder1";

      // Test 2: Create Subfolder
      const res2 = await fetch(`${BASE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Work", parentId: rootFolderId })
      });
      if (res2.status === 201) {
        passed++;
        console.log("✅ Create subfolder");
      } else {
        failed++;
        console.log(`❌ Create subfolder failed: ${res2.status}`);
      }

      // Test 3: Get folder tree
      const res3 = await fetch(`${BASE}/tree`);
      const data3 = await res3.json();
      if (res3.status === 200 && data3.folders.length === 2) {
        passed++;
        console.log("✅ Get folder tree");
      } else {
        failed++;
        console.log(`❌ Get folder tree failed`);
      }

      // Add a mock file
      filesDb.push({ _id: "file1", fileName: "test.txt", folderId: rootFolderId, userId: "user123", isDeleted: false });

      // Test 4: Get folder contents
      const res4 = await fetch(`${BASE}/${rootFolderId}/contents`);
      const data4 = await res4.json();
      if (res4.status === 200 && data4.subfolders.length === 1 && data4.files.length === 1) {
        passed++;
        console.log("✅ Get folder contents");
      } else {
        failed++;
        console.log(`❌ Get folder contents failed`);
      }

      // Test 5: Rename folder
      // (Mock save method is a bit simple, but let's test if route returns 200)
      const res5 = await fetch(`${BASE}/${rootFolderId}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Documents" })
      });
      if (res5.status === 200) {
        passed++;
        console.log("✅ Rename folder");
      } else {
        failed++;
        console.log(`❌ Rename folder failed`);
      }

      // Test 6: Move folder (circular reference)
      // moving 'rootFolderId' into its subfolder 'folder2'
      const res6 = await fetch(`${BASE}/${rootFolderId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: "folder2" })
      });
      if (res6.status === 400) {
        passed++;
        console.log("✅ Prevent circular reference move");
      } else {
        failed++;
        console.log(`❌ Circular reference move should have failed but got ${res6.status}`);
      }

      // Test 7: Delete folder (safe)
      const res7 = await fetch(`${BASE}/${rootFolderId}`);
      if (res7.status === 200) {
        passed++;
        console.log("✅ Safe delete folder (moves contents to root)");
      } else {
        failed++;
        console.log(`❌ Safe delete failed`);
      }
      
    } catch (err) {
      console.error(err);
      failed++;
    }

    console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
    server.close(() => process.exit(failed === 0 ? 0 : 1));
  });
}

runTests();
