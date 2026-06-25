import Webhook from "../models/Webhook.js";
import crypto from "crypto";

// Create Webhook
export const createWebhook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUrl, events, secretKey, isActive } = req.body;

    if (!targetUrl || !secretKey) {
      return res.status(400).json({ error: "Target URL and Secret Key are required" });
    }

    const newWebhook = new Webhook({
      userId,
      targetUrl,
      secretKey,
      events: events || [],
      isActive: isActive !== undefined ? isActive : true,
    });

    await newWebhook.save();

    res.status(201).json({
      success: true,
      message: "Webhook created successfully",
      webhook: newWebhook,
    });
  } catch (error) {
    console.error("Create webhook error:", error);
    res.status(500).json({ error: "Failed to create webhook" });
  }
};

// Get all Webhooks for user
export const getWebhooks = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Only return up to 20 delivery logs to avoid massive payloads
    const webhooks = await Webhook.find({ userId }).sort({ createdAt: -1 })
      .slice('deliveryLogs', -20);
    
    res.json({
      success: true,
      webhooks,
    });
  } catch (error) {
    console.error("Get webhooks error:", error);
    res.status(500).json({ error: "Failed to get webhooks" });
  }
};

// Update Webhook
export const updateWebhook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { targetUrl, events, secretKey, isActive } = req.body;

    const webhook = await Webhook.findOne({ _id: id, userId });

    if (!webhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    if (targetUrl) webhook.targetUrl = targetUrl;
    if (events) webhook.events = events;
    if (secretKey) webhook.secretKey = secretKey;
    if (isActive !== undefined) webhook.isActive = isActive;

    await webhook.save();

    res.json({
      success: true,
      message: "Webhook updated successfully",
      webhook,
    });
  } catch (error) {
    console.error("Update webhook error:", error);
    res.status(500).json({ error: "Failed to update webhook" });
  }
};

// Delete Webhook
export const deleteWebhook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const webhook = await Webhook.findOneAndDelete({ _id: id, userId });

    if (!webhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    res.json({
      success: true,
      message: "Webhook deleted successfully",
    });
  } catch (error) {
    console.error("Delete webhook error:", error);
    res.status(500).json({ error: "Failed to delete webhook" });
  }
};
