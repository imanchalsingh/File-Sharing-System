import { Worker } from "bullmq";
import mammoth from "mammoth";
import File from "../models/File.js";
import dotenv from "dotenv";

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// Extract text from PDF buffer
const extractTextFromPDF = async (buffer) => {
  try {
    const pdfParse = (await import("pdf-parse")).default || (await import("pdf-parse"));
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw error;
  }
};

// Extract text from DOCX buffer
const extractTextFromDOCX = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw error;
  }
};

export const startIndexWorker = () => {
  const worker = new Worker(
    "document-indexing",
    async (job) => {
      const { fileId } = job.data;
      console.log(`[Worker] Started indexing job for file ID: ${fileId}`);

      try {
        const file = await File.findById(fileId);
        if (!file) {
          console.warn(`[Worker] File ${fileId} not found during indexing.`);
          return;
        }

        // Determine if file is PDF or DOCX
        const extension = file.fileName.split(".").pop()?.toLowerCase();
        const isPDF = extension === "pdf" || file.fileType === "pdf";
        const isDOCX = extension === "docx" || file.fileType === "docx";

        if (!isPDF && !isDOCX) {
          console.log(`[Worker] File ${file.fileName} is neither PDF nor DOCX. Skipping text extraction.`);
          file.indexingStatus = "skipped";
          await file.save();
          return;
        }

        file.indexingStatus = "processing";
        await file.save();

        console.log(`[Worker] Downloading file for extraction: ${file.fileName} (${file.fileUrl})`);
        
        // Download the file content
        const response = await fetch(file.fileUrl, {
          signal: AbortSignal.timeout(30000), // 30 seconds timeout
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        let extractedText = "";
        if (isPDF) {
          extractedText = await extractTextFromPDF(fileBuffer);
        } else if (isDOCX) {
          extractedText = await extractTextFromDOCX(fileBuffer);
        }

        // Clean extracted text (remove excessive whitespace)
        extractedText = extractedText.replace(/\s+/g, " ").trim();

        if (!extractedText) {
          console.log(`[Worker] No text extracted from ${file.fileName} (possibly scanned image/empty).`);
          file.indexingStatus = "skipped";
          file.extractedText = "";
        } else {
          console.log(`[Worker] Successfully extracted ${extractedText.length} characters from ${file.fileName}.`);
          file.indexingStatus = "completed";
          file.extractedText = extractedText;
        }

        await file.save();
      } catch (error) {
        console.error(`[Worker] Error indexing file ${fileId}:`, error);
        try {
          await File.findByIdAndUpdate(fileId, { indexingStatus: "failed" });
        } catch (dbErr) {
          console.error("Failed to update index status to failed:", dbErr);
        }
        throw error; // Let BullMQ handle retry/backoff
      }
    },
    { connection }
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] Indexing job ${job.id} completed successfully.`);
  });

  worker.on("failed", (job, err) => {
    console.warn(`[Worker] Indexing job ${job.id} failed: ${err.message}`);
  });

  console.log("Document indexing worker started.");
  return worker;
};
