import express from "express";
import {
  createWebhook,
  getWebhooks,
  updateWebhook,
  deleteWebhook,
} from "../controllers/webhookController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// All webhook routes require authentication
router.use(verifyToken);

router.post("/", createWebhook);
router.get("/", getWebhooks);
router.put("/:id", updateWebhook);
router.delete("/:id", deleteWebhook);

export default router;
