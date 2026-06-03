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

redisClient.on("error", () => {
  redisAvailable = false;
});

export { redisAvailable };
export default redisClient;