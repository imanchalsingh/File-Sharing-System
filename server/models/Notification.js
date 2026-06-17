import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:      { type: String, enum: ['expiry_warning_24h', 'expiry_warning_1h', 'expired', 'extended', 'revoked'], required: true },
  shareId:   { type: mongoose.Schema.Types.ObjectId, ref: 'ShareLink' },
  fileId:    { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  message:   { type: String, required: true },
  read:      { type: Boolean, default: false },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
