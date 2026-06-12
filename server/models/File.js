import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      default: "application",
    },
    fileSize: {
      type: String,
      default: "0 KB",
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
    checksum: {
      type: String,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shareCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    shareHistory: [
      {
        timestamp: Date,
        source: String,
      },
    ],
    downloadHistory: [
      {
        timestamp: Date,
      },
    ],
    viewHistory: [
      {
        timestamp: Date,
      },
    ],
    lastAccessed: {
      type: Date,
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    versions: [
      {
        version: Number,
        fileUrl: String,
        fileSize: String,
        fileSizeBytes: Number,
        checksum: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isFavorite: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
fileSchema.index({ userId: 1, createdAt: -1 });
fileSchema.index({ userId: 1, shareCount: -1 });
fileSchema.index({ userId: 1, tags: 1 });
fileSchema.index({ _id: 1, userId: 1 });
const File = mongoose.model("File", fileSchema);

export default File;