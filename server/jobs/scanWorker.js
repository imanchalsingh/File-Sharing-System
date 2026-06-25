import { Worker } from "bullmq";
import mongoose from "mongoose";
import File from "../models/File.js";
import dotenv from "dotenv";

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// Mock scan function (Replace with real ClamAV or API integration)
const performScan = async (fileUrl) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 5% chance of mock infection for testing purposes
      const isMockInfected = Math.random() < 0.05;
      resolve(isMockInfected ? "infected" : "safe");
    }, 3000);
  });
};

export const startScanWorker = () => {
  if (process.env.ENABLE_MALWARE_SCANNING === "false") {
    console.log("Malware scanning is disabled. Worker not starting.");
    return;
  }

  const worker = new Worker(
    "malware-scan",
    async (job) => {
      const { fileId } = job.data;
      
      try {
        const file = await File.findById(fileId);
        if (!file) {
          console.warn(`File ${fileId} not found during scan.`);
          return;
        }

        file.scanStatus = "scanning";
        await file.save();

        console.log(`Scanning file: ${file.fileName} (${fileId})`);
        
        // Simulating actual scan process...
        const resultStatus = await performScan(file.fileUrl);

        file.scanStatus = resultStatus;
        await file.save();

        console.log(`Scan completed for ${file.fileName}: ${resultStatus}`);
        
        // TODO: Notification system integration can go here
        
      } catch (error) {
        console.error(`Error scanning file ${fileId}:`, error);
        await File.findByIdAndUpdate(fileId, { scanStatus: "error" });
        throw error; // Let BullMQ handle retries
      }
    },
    { connection }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} has completed!`);
  });

  worker.on("failed", (job, err) => {
    console.log(`Job ${job.id} has failed with ${err.message}`);
  });

  console.log("Malware scanning worker started.");
  return worker;
};
