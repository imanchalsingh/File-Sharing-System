import { Queue } from "bullmq";
import dotenv from "dotenv";

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const webhookQueue = new Queue("webhook-events", { connection });

export const dispatchWebhookEvent = async (userId, eventType, payload) => {
  await webhookQueue.add("dispatch", { userId, eventType, payload }, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  });
};
