import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

let redisAvailable = false;

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    redisAvailable = true;
    console.log("Redis Connected Successfully!");
  } catch (error) {
    redisAvailable = false;
    console.log("Redis not available. Continuing without Redis.");
  }
};

// Mark Redis as unavailable on any connection error
redisClient.on("error", (err) => {
  if (redisAvailable) {
    console.warn("⚠️  Redis connection error — falling back to primary DB:", err.message);
  }
  redisAvailable = false;
});

// Restore availability when the connection is re-established
redisClient.on("ready", () => {
  if (!redisAvailable) {
    console.log("✅ Redis reconnected — cache is active again.");
  }
  redisAvailable = true;
});

// Log reconnection attempts without toggling the flag (still unavailable during this phase)
redisClient.on("reconnecting", () => {
  console.log("🔄 Redis is reconnecting...");
});

export { redisAvailable };
export default redisClient;