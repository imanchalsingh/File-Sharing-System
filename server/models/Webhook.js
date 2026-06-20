import mongoose from "mongoose";

const webhookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetUrl: {
      type: String,
      required: true,
      trim: true,
    },
    secretKey: {
      type: String,
      required: true,
    },
    events: {
      type: [String],
      enum: ["file_shared", "link_accessed", "download_completed", "link_expired"],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deliveryLogs: [
      {
        event: String,
        payload: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now },
        status: { type: String, enum: ["success", "failed"] },
        statusCode: Number,
        error: String,
        attempt: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

webhookSchema.index({ userId: 1, isActive: 1 });

const Webhook = mongoose.model("Webhook", webhookSchema);
export default Webhook;
