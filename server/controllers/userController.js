import User from "../models/UserSchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redisClient, { redisAvailable } from "../config/redis.js";

// REGISTER
export const registerUser = async (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body;

  try {
    // Validate input (redundant since you have express-validator, but good for safety)
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Ensure password and confirmPassword match 
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Check if user already exists by email or username
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: "Email already exists" });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(12); // Increased salt rounds for better security
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        email: user.email,
      },
    };

    const authToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || process.env.JWT_TOKEN,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      }
    );

    return res.status(201).json({
      success: true,
      authToken,
      message: "User registered successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    // Handle duplicate key errors (MongoDB) — normalizer in globalErrorHandler also handles these,
    // but we preserve this branch for the specific field-level message.
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        error: `${field} already exists`,
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: errors.join(", ") });
    }

    next(error);
  }
};

// LOGIN

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // --- Redis cache read (with DB fallback) ---
    let user = null;

    if (redisAvailable) {
      try {
        const cached = await redisClient.get(`user:${normalizedEmail}`);
        if (cached) {
          user = JSON.parse(cached);
          console.log("Cache hit: user record served from Redis.");
        }
      } catch (redisError) {
        console.error("Redis fetch failed, falling back to primary DB:", redisError.message);
        // Non-fatal — fall through to MongoDB
      }
    }

    // --- Primary DB fallback ---
    if (!user) {
      user = await User.findOne({ email: normalizedEmail });

      // Warm the cache if Redis is healthy (non-blocking, non-fatal)
      if (user && redisAvailable) {
        try {
          await redisClient.setEx(`user:${normalizedEmail}`, 300, JSON.stringify(user));
        } catch (redisError) {
          console.error("Redis cache-write failed (non-fatal):", redisError.message);
        }
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const payload = { user: { id: user._id || user.id, email: user.email } };

    if (user.twoFactorEnabled) {
      // Generate temporary token for 2FA verification (valid for 5 mins)
      const tempToken = jwt.sign(
        { userId: user._id || user.id },
        process.env.JWT_SECRET || process.env.JWT_TOKEN,
        { expiresIn: "5m" }
      );

      return res.json({
        success: true,
        requires2FA: true,
        tempToken,
        message: "Two-factor authentication required",
      });
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET || process.env.JWT_TOKEN, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Login successful",
      authToken: token,
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};


// LOGOUT

export const logoutUser = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (token) {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0 && redisAvailable) {
          // Wrap in try/catch — a Redis failure must never prevent a successful logout
          try {
            await redisClient.setEx(`blacklist:${token}`, ttl, "blocked");
            console.log("✅ Token blacklisted in Redis.");
          } catch (redisError) {
            console.error("Redis blacklist write failed (non-fatal, logout proceeds):", redisError.message);
          }
        }
      }
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};


// GET USER
export const getUser = async (req, res, next) => {
  try {
    const cacheKey = `user:profile:${req.user.id}`;
    let user = null;

    // --- Redis cache read (with DB fallback) ---
    if (redisAvailable) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          user = JSON.parse(cached);
          console.log("Cache hit: user profile served from Redis.");
        }
      } catch (redisError) {
        console.error("Redis fetch failed, falling back to primary DB:", redisError.message);
        // Non-fatal — fall through to MongoDB
      }
    }

    // --- Primary DB fallback ---
    if (!user) {
      user = await User.findById(req.user.id).select("-password");

      // Warm the cache if Redis is healthy (non-blocking, non-fatal)
      if (user && redisAvailable) {
        try {
          await redisClient.setEx(cacheKey, 120, JSON.stringify(user));
        } catch (redisError) {
          console.error("Redis cache-write failed (non-fatal):", redisError.message);
        }
      }
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    
    if (!username || !email) {
      return res.status(400).json({ error: "Username and email are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if new email or username is already taken by another user
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: username.trim() }],
      _id: { $ne: req.user.id }
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(400).json({ error: "Email already in use" });
      }
      if (existingUser.username === username.trim()) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        username: username.trim(),
        email: normalizedEmail
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Invalidate profile cache if Redis is available
    if (redisAvailable) {
      try {
        await redisClient.del(`user:profile:${req.user.id}`);
        await redisClient.del(`user:${normalizedEmail}`);
      } catch (redisError) {
        console.error("Redis cache invalidation failed:", redisError.message);
      }
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id || updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    next(error);
  }
};

// UPDATE PASSWORD
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};
