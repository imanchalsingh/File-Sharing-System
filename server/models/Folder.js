import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Folder name is required"],
      trim: true,
      minlength: [1, "Folder name cannot be empty"],
      maxlength: [255, "Folder name cannot exceed 255 characters"],
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null, // null means root folder
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster lookups
folderSchema.index({ userId: 1, parentId: 1 });
// Ensure no duplicate folder names under the same parent for the same user
folderSchema.index({ userId: 1, name: 1, parentId: 1 }, { unique: true });

const Folder = mongoose.model("Folder", folderSchema);

export default Folder;
