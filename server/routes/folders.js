import express from "express";
import authenticateUser from "../middleware/authenticateUser.js";
import {
  createFolder,
  getFolderTree,
  getFolderContents,
  renameFolder,
  moveFolder,
  deleteFolder,
} from "../controllers/folderController.js";

const router = express.Router();

router.use(authenticateUser);

router.post("/", createFolder);
router.get("/tree", getFolderTree);
router.get("/:id/contents", getFolderContents);
router.patch("/:id/rename", renameFolder);
router.patch("/:id/move", moveFolder);
router.delete("/:id", deleteFolder);

export default router;
