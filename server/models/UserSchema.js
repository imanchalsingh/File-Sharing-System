import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username must not exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      default: null,
    },
    backupCodes: [
      {
        type: String,
        trim: true,
      },
    ],
    dailyBandwidth: {
      type: Number,
      default: 0,
      min: [0, "Daily bandwidth cannot be negative"],
    },
    bandwidthLimit: {
      type: Number,
      default: 1073741824, // 1 GB in bytes
      min: [0, "Bandwidth limit cannot be negative"],
    },
    quotaResetAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // auto createdAt & updatedAt
  }
);

const User = mongoose.model("User", userSchema);
export default User;