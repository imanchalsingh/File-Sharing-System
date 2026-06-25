import { Queue } from "bullmq";
import dotenv from "dotenv";

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const scanQueue = new Queue("malware-scan", { connection });

export const enqueueScan = async (fileId) => {
  if (process.env.ENABLE_MALWARE_SCANNING === "false") {
    console.log("Malware scanning is disabled. Skipping for file:", fileId);
    return;
  }
  
  await scanQueue.add("scan-file", { fileId }, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  });
};
