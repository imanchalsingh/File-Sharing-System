import mongoose from "mongoose";

const uploadSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    uploadId: {
      type: String,
      required: true,
      unique: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: "application/octet-stream",
    },
    fileSizeBytes: {
      type: Number,
      required: true,
    },
    totalChunks: {
      type: Number,
      required: true,
    },
    chunkSizeBytes: {
      type: Number,
      required: true,
    },
    receivedChunks: {
      type: [Number],
      default: [],
    },
    uploadedBytes: {
      type: Number,
      default: 0,
    },
    expectedChecksum: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "uploading", "assembling", "completed", "failed", "cancelled"],
      default: "pending",
    },
    tempDir: {
      type: String,
      required: true,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

uploadSessionSchema.index({ userId: 1, status: 1, expiresAt: 1 });

const UploadSession = mongoose.model("UploadSession", uploadSessionSchema);

export default UploadSession;
