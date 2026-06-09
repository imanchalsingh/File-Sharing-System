import express from "express";
import {
  registerUser,
  loginUser,
  getUser,
} from "../controllers/userController.js";
import { validation } from "../middleware/validation.js";
import { loginValidation } from "../middleware/loginValidation.js";
import authenticateUser from "../middleware/authenticateUser.js";
import { logoutUser } from "../controllers/userController.js";

const router = express.Router();

// Register
router.post("/register", validation, registerUser);

// Login
router.post("/login", loginValidation, loginUser);

//logout

router.post("/logout", authenticateUser, logoutUser);

// Get current user
router.get("/auth", authenticateUser, getUser);

export default router;