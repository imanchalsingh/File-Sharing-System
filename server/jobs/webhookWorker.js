import { Worker } from "bullmq";
import crypto from "crypto";
import Webhook from "../models/Webhook.js";
import dotenv from "dotenv";

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

const sendWebhook = async (webhook, eventType, payload, attempt = 1) => {
  const timestamp = Date.now().toString();
  const dataToSign = `${timestamp}.${JSON.stringify(payload)}`;
  
  const signature = crypto
    .createHmac("sha256", webhook.secretKey)
    .update(dataToSign)
    .digest("hex");

  try {
    const response = await fetch(webhook.targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Timestamp": timestamp,
        "X-Webhook-Event": eventType,
      },
      body: JSON.stringify(payload),
    });

    const status = response.ok ? "success" : "failed";
    
    // Log the delivery attempt
    webhook.deliveryLogs.push({
      event: eventType,
      payload,
      status,
      statusCode: response.status,
      attempt,
    });
    
    // Keep only last 100 logs
    if (webhook.deliveryLogs.length > 100) {
      webhook.deliveryLogs.shift();
    }
    
    await webhook.save();

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`);
    }
  } catch (error) {
    webhook.deliveryLogs.push({
      event: eventType,
      payload,
      status: "failed",
      error: error.message,
      attempt,
    });
    
    if (webhook.deliveryLogs.length > 100) {
      webhook.deliveryLogs.shift();
    }
    
    await webhook.save();
    throw error; // Will be caught by BullMQ and retried
  }
};

export const startWebhookWorker = () => {
  const worker = new Worker(
    "webhook-events",
    async (job) => {
      const { userId, eventType, payload } = job.data;
      
      try {
        const activeWebhooks = await Webhook.find({
          userId,
          isActive: true,
          events: eventType,
        });

        const dispatchPromises = activeWebhooks.map(webhook => 
          sendWebhook(webhook, eventType, payload, job.attemptsMade + 1)
        );

        await Promise.all(dispatchPromises);
        
      } catch (error) {
        console.error(`Error processing webhook event ${eventType} for user ${userId}:`, error);
        throw error; // Let BullMQ handle retries
      }
    },
    { connection }
  );

  worker.on("completed", (job) => {
    // console.log(`Webhook job ${job.id} has completed!`);
  });

  worker.on("failed", (job, err) => {
    console.log(`Webhook job ${job.id} has failed with ${err.message}`);
  });

  console.log("Webhook worker started.");
  return worker;
};
