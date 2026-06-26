import { getFileStats, saveFileInfo, updateShareCount, deleteFile } from "./controllers/fileController.js";
import redisClient, { connectRedis } from "./config/redis.js";
import File from "./models/File.js";

async function runTests() {
  console.log("Starting Mock Tests for Dashboard Stats Cache...");

  // Mock res
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

  const next = (err) => {
    console.error("Next called with error:", err);
    throw err;
  };

  // Mock express app for socket.io
  const reqBase = {
    app: {
      get: (key) => {
        if (key === "io") return { to: () => ({ emit: () => {} }) };
      }
    }
  };

  // 1. Mock Redis Client
  const mockCache = {};
  redisClient.connect = async () => { return true; }; 
  redisClient.get = async (key) => mockCache[key] || null;
  redisClient.setEx = async (key, ttl, val) => { mockCache[key] = val; };
  redisClient.del = async (key) => { delete mockCache[key]; };

  // Trigger connect to set redisAvailable = true
  await connectRedis();

  // 2. Mock MongoDB File queries
  const customData = {
    totalFiles: 2,
    aggregations: [{
      totalShares: 5,
      totalDownloads: 2,
      totalViews: 30,
      totalStorageUsed: 300
    }]
  };

  File.countDocuments = async (query) => {
    if (query.userId === "user1") return customData.totalFiles;
    return 0;
  };

  File.aggregate = async (pipeline) => {
    const matchStage = pipeline.find(stage => stage.$match);
    if (matchStage && matchStage.$match.userId === "user1") {
      return customData.aggregations;
    }
    return [];
  };

  // Mocks for saveFileInfo and updateShareCount
  File.findOne = async (query) => null; // Simulate new file
  const mockFileInstance = {
    _id: "file1",
    userId: "user1",
    fileName: "test.txt",
    shareCount: 0,
    shareHistory: [],
    save: async function() { return this; }
  };
  File.prototype.save = async function() { return this; }; // For new File()
  File.findById = async (id) => mockFileInstance;
  File.findOneAndDelete = async (query) => mockFileInstance;

  try {
    console.log("\n--- Test 1: Fetch Stats (Cache Miss) ---");
    let req = { ...reqBase, user: { id: "user1" } };
    let res = createRes();
    
    await getFileStats(req, res, next);
    console.log("Response:", res.data);
    
    if (res.data.cached === true) throw new Error("Test 1 Failed: Should not be cached");
    if (res.data.stats.totalStorageUsed !== 300) throw new Error("Test 1 Failed: Storage calculation incorrect");
    if (res.data.stats.totalShares !== 5) throw new Error("Test 1 Failed: Shares incorrect");
    if (!mockCache["dashboard:stats:user1"]) throw new Error("Test 1 Failed: Cache not populated");

    console.log("\n--- Test 2: Fetch Stats (Cache Hit) ---");
    res = createRes();
    
    // Modify db data to prove it fetches from cache
    customData.aggregations[0].totalStorageUsed = 9999; 
    
    await getFileStats(req, res, next);
    console.log("Response:", res.data);
    
    if (res.data.cached === false) throw new Error("Test 2 Failed: Should be cached");
    if (res.data.stats.totalStorageUsed !== 300) throw new Error("Test 2 Failed: Did not fetch from cache");

    console.log("\n--- Test 3: Cache Invalidation on saveFileInfo ---");
    req = { ...reqBase, user: { id: "user1" }, body: { fileName: "newfile", fileUrl: "http://url", fileSizeBytes: 100 } };
    res = createRes();
    await saveFileInfo(req, res, next);
    console.log("saveFileInfo called.");
    
    if (mockCache["dashboard:stats:user1"]) throw new Error("Test 3 Failed: Cache was not invalidated by saveFileInfo");

    console.log("\n--- Test 4: Cache Repopulation ---");
    // Reset DB data
    customData.aggregations[0].totalStorageUsed = 400; 
    req = { ...reqBase, user: { id: "user1" } };
    res = createRes();
    await getFileStats(req, res, next);
    if (res.data.stats.totalStorageUsed !== 400) throw new Error("Test 4 Failed: Did not fetch fresh data after invalidation");
    if (!mockCache["dashboard:stats:user1"]) throw new Error("Test 4 Failed: Cache not repopulated");

    console.log("\n--- Test 5: Cache Invalidation on updateShareCount ---");
    req = { ...reqBase, params: { id: "file1" }, body: {} };
    res = createRes();
    await updateShareCount(req, res, next);
    console.log("updateShareCount called.");
    if (mockCache["dashboard:stats:user1"]) throw new Error("Test 5 Failed: Cache was not invalidated by updateShareCount");

    console.log("\nAll tests passed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Test execution error:", error.message || error);
    process.exit(1);
  }
}

runTests();
