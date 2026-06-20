import mongoose from "mongoose";
import Folder from "../models/Folder.js";
import File from "../models/File.js";

// ✅ Create a new folder
export const createFolder = async (req, res, next) => {
  try {
    const { name, parentId } = req.body;
    const userId = req.user.id;

    if (!name || name.trim() === "") {
      const error = new Error("Folder name is required");
      error.statusCode = 400;
      return next(error);
    }

    const parent = parentId || null;

    if (parent) {
      const parentFolder = await Folder.findOne({ _id: parent, userId });
      if (!parentFolder) {
        const error = new Error("Parent folder not found or unauthorized");
        error.statusCode = 404;
        return next(error);
      }
    }

    const newFolder = new Folder({
      name: name.trim(),
      parentId: parent,
      userId,
    });

    await newFolder.save();

    res.status(201).json({
      success: true,
      message: "Folder created successfully",
      folder: newFolder,
    });
  } catch (error) {
    if (error.code === 11000) {
      const customError = new Error("A folder with this name already exists in this location");
      customError.statusCode = 409;
      return next(customError);
    }
    next(error);
  }
};

// ✅ Get folder tree for a user
export const getFolderTree = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const folders = await Folder.find({ userId }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      folders,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get folder contents (subfolders and files)
export const getFolderContents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const folderId = id === "root" ? null : id;

    if (folderId) {
      const folder = await Folder.findOne({ _id: folderId, userId });
      if (!folder) {
        const error = new Error("Folder not found or unauthorized");
        error.statusCode = 404;
        return next(error);
      }
    }

    const subfolders = await Folder.find({ parentId: folderId, userId }).sort({ name: 1 });
    const files = await File.find({ folderId: folderId, userId, isDeleted: false }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      folderId,
      subfolders,
      files,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Rename a folder
export const renameFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || name.trim() === "") {
      const error = new Error("Folder name is required");
      error.statusCode = 400;
      return next(error);
    }

    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      const error = new Error("Folder not found or unauthorized");
      error.statusCode = 404;
      return next(error);
    }

    folder.name = name.trim();
    await folder.save();

    res.status(200).json({
      success: true,
      message: "Folder renamed successfully",
      folder,
    });
  } catch (error) {
    if (error.code === 11000) {
      const customError = new Error("A folder with this name already exists in this location");
      customError.statusCode = 409;
      return next(customError);
    }
    next(error);
  }
};

// ✅ Move a folder
export const moveFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { parentId } = req.body;
    const userId = req.user.id;
    const newParentId = parentId || null;

    if (id === newParentId) {
      const error = new Error("Cannot move a folder into itself");
      error.statusCode = 400;
      return next(error);
    }

    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      const error = new Error("Folder not found or unauthorized");
      error.statusCode = 404;
      return next(error);
    }

    if (newParentId) {
      const newParent = await Folder.findOne({ _id: newParentId, userId });
      if (!newParent) {
        const error = new Error("Destination folder not found or unauthorized");
        error.statusCode = 404;
        return next(error);
      }

      // Prevent circular references (cannot move folder to its own subfolder)
      let currentParentId = newParent.parentId;
      while (currentParentId) {
        if (currentParentId.toString() === id) {
          const error = new Error("Cannot move a folder into its own subfolder");
          error.statusCode = 400;
          return next(error);
        }
        const pFolder = await Folder.findOne({ _id: currentParentId, userId });
        currentParentId = pFolder ? pFolder.parentId : null;
      }
    }

    folder.parentId = newParentId;
    await folder.save();

    res.status(200).json({
      success: true,
      message: "Folder moved successfully",
      folder,
    });
  } catch (error) {
    if (error.code === 11000) {
      const customError = new Error("A folder with this name already exists in the destination");
      customError.statusCode = 409;
      return next(customError);
    }
    next(error);
  }
};

// ✅ Delete a folder
export const deleteFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // If true, recursively deletes contents
    const userId = req.user.id;

    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      const error = new Error("Folder not found or unauthorized");
      error.statusCode = 404;
      return next(error);
    }

    if (force === "true") {
      // Recursive delete using a helper
      async function recursiveDelete(currentFolderId) {
        const subfolders = await Folder.find({ parentId: currentFolderId, userId });
        for (let sub of subfolders) {
          await recursiveDelete(sub._id);
        }
        await File.deleteMany({ folderId: currentFolderId, userId });
        await Folder.deleteOne({ _id: currentFolderId, userId });
      }
      await recursiveDelete(id);
    } else {
      // Safe delete: Move subfolders and files to the parent folder (or root if null)
      const targetParentId = folder.parentId;
      await Folder.updateMany(
        { parentId: id, userId },
        { $set: { parentId: targetParentId } }
      );
      await File.updateMany(
        { folderId: id, userId },
        { $set: { folderId: targetParentId } }
      );
      await Folder.deleteOne({ _id: id, userId });
    }

    res.status(200).json({
      success: true,
      message: force === "true" ? "Folder and its contents deleted" : "Folder deleted, contents moved to parent",
    });
  } catch (error) {
    next(error);
  }
};
