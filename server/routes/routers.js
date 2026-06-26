import express from "express";
import {
  registerUser,
  loginUser,
  getUser,
  updateProfile,
  updatePassword,
} from "../controllers/userController.js";
import { validation } from "../middleware/validation.js";
import { loginValidation } from "../middleware/loginValidation.js";
import authenticateUser from "../middleware/authenticateUser.js";
import { logoutUser } from "../controllers/userController.js";
import { generate2FA, enable2FA, disable2FA, verify2FALogin } from "../controllers/twoFactorController.js";

const router = express.Router();

// Register
router.post("/register", validation, registerUser);

// Login
router.post("/login", loginValidation, loginUser);

//logout

router.post("/logout", authenticateUser, logoutUser);

// Get current user
router.get("/auth", authenticateUser, getUser);

// Update Profile
router.put("/profile", authenticateUser, updateProfile);

// Update Password
router.put("/password", authenticateUser, updatePassword);

// 2FA Routes
router.post("/2fa/generate", authenticateUser, generate2FA);
router.post("/2fa/enable", authenticateUser, enable2FA);
router.post("/2fa/disable", authenticateUser, disable2FA);
router.post("/login/2fa", verify2FALogin);

export default router;