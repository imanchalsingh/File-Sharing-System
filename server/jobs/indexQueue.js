import { Queue } from "bullmq";
import dotenv from "dotenv";

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const indexQueue = new Queue("document-indexing", { connection });

export const enqueueIndex = async (fileId) => {
  if (process.env.ENABLE_DOCUMENT_INDEXING === "false") {
    console.log("Document indexing is disabled. Skipping for file:", fileId);
    return;
  }
  console.log(`[Queue] Enqueuing document indexing job for file: ${fileId}`);
  await indexQueue.add("index-file", { fileId }, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  });
};
