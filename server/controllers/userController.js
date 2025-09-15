import User from "../models/UserSchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// REGISTER
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Validate input (redundant since you have express-validator, but good for safety)
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
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
      authToken,
      message: "User registered successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    // Handle duplicate key errors (MongoDB)
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

    res.status(500).json({
      error: "Server Error",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email (case insensitive)
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" }); // 401 for unauthorized
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

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

    res.json({
      authToken,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      error: "Server Error",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// GET USER
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get user error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    res.status(500).json({
      error: "Server Error",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
