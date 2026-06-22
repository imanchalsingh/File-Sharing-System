import mongoose from 'mongoose';

const shareLinkSchema = new mongoose.Schema({
  token:          { type: String, required: true, unique: true, index: true },
  fileId:         { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt:      { type: Date, default: null },       // null = never expires
  status:         { type: String, enum: ['active', 'expired', 'revoked'], default: 'active' },
  accessCount:    { type: Number, default: 0 },
  maxAccessCount: { type: Number, default: null },     // optional download limit
  notifiedAt24h:  { type: Boolean, default: false },
  notifiedAt1h:   { type: Boolean, default: false },
  downloadCount: {
    type: Number,
    default: 0
  },
  downloadHistory: [{
    downloadedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  dailyBandwidth: { type: Number, default: 0 },
  bandwidthLimit: { type: Number, default: 524288000 }, // 500 MB in bytes
  isSuspended:    { type: Boolean, default: false },
}, { timestamps: true });

shareLinkSchema.index({ fileId: 1, userId: 1 });
shareLinkSchema.index({ expiresAt: 1, status: 1 });
shareLinkSchema.index({ status: 1, expiresAt: 1, notifiedAt24h: 1 });

const ShareLink = mongoose.model('ShareLink', shareLinkSchema);
export default ShareLink;
