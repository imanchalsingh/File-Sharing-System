import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  dailyBandwidth: {
    type: Number,
    default: 0,
  },
  bandwidthLimit: {
    type: Number,
    default: 1073741824, // 1 GB in bytes
  },
  quotaResetAt: {
    type: Date,
    default: null,
  },
});
const User = mongoose.model("UserSchema", UserSchema);
export default User;
