import mongoose from "mongoose";
import dotenv from "dotenv";
import { getFileStats } from "./controllers/fileController.js";
import redisClient, { connectRedis } from "./config/redis.js";

dotenv.config();

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");
    await connectRedis();

    // Pick a user to test
    const User = (await import("./models/UserSchema.js")).default;
    let user = await User.findOne();
    if (!user) {
       console.log("No user found.");
       process.exit(0);
    }
    console.log("Testing with user:", user.email, user._id);

    // clear redis first
    await redisClient.del(`dashboard:stats:${user._id}`);

    // Mock req and res
    const req = { user: { id: user._id } };
    let jsonResponse = null;
    const res = {
      json: (data) => {
        jsonResponse = data;
      },
      status: (code) => res,
    };
    const next = (err) => console.error("Error from controller:", err);

    console.log("\n--- Fetching stats (Cache Miss) ---");
    await getFileStats(req, res, next);
    console.log("Response:", jsonResponse);

    console.log("\n--- Fetching stats (Cache Hit) ---");
    jsonResponse = null;
    await getFileStats(req, res, next);
    console.log("Response:", jsonResponse);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runTests();
