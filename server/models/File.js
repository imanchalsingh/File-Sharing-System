import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
      minlength: [1, "File name cannot be empty"],
      maxlength: [255, "File name cannot exceed 255 characters"],
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
      trim: true,
      match: [/^https?:\/\/.+/, "Please enter a valid URL"],
    },
    fileType: {
      type: String,
      trim: true,
      lowercase: true,
      enum: {
        values: ["image", "video", "audio", "document", "application", "other"],
        message: "{VALUE} is not a valid file type",
      },
      default: "application",
    },
    fileSize: {
      type: String,
      trim: true,
      default: "0 KB",
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
      min: [0, "File size cannot be negative"],
    },
    checksum: {
      type: String,
      trim: true,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
      set: (tags) => tags.map((tag) => tag.trim().toLowerCase()),
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null, // null means root folder
    },
    shareCount: {
      type: Number,
      default: 0,
      min: [0, "Share count cannot be negative"],
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: [0, "Download count cannot be negative"],
    },
    viewCount: {
      type: Number,
      default: 0,
      min: [0, "View count cannot be negative"],
    },
    shareHistory: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        source: {
          type: String,
          trim: true,
          default: null,
        },
      },
    ],
    downloadHistory: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    viewHistory: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastAccessed: {
      type: Date,
      default: null,
    },
    currentVersion: {
      type: Number,
      default: 1,
      min: [1, "Version must be at least 1"],
    },
    versions: [
      {
        version: {
          type: Number,
          min: [1, "Version must be at least 1"],
        },
        fileUrl: {
          type: String,
          trim: true,
          match: [/^https?:\/\/.+/, "Please enter a valid URL"],
        },
        fileSize: {
          type: String,
          trim: true,
          default: "0 KB",
        },
        fileSizeBytes: {
          type: Number,
          default: 0,
          min: [0, "File size cannot be negative"],
        },
        checksum: {
          type: String,
          trim: true,
          default: null,
        },
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
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
fileSchema.index({ isDeleted: 1, userId: 1 });
fileSchema.index({ userId: 1, folderId: 1 });

const File = mongoose.model("File", fileSchema);

export default File;