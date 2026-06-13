import speakeasy from "speakeasy";
import qrcode from "qrcode";
import jwt from "jsonwebtoken";
import User from "../models/UserSchema.js";

// Generate 2FA Secret and QR code for setup
export const generate2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const secret = speakeasy.generateSecret({
      name: `FileSharingApp (${user.email})`,
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
    });
  } catch (error) {
    console.error("Error generating 2FA:", error);
    res.status(500).json({ error: "Server error generating 2FA" });
  }
};

// Verify code and Enable 2FA
export const enable2FA = async (req, res) => {
  try {
    const { secret, token } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 1, // Allow a slight time drift
    });

    if (verified) {
      user.twoFactorSecret = secret;
      user.twoFactorEnabled = true;

      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
      user.backupCodes = backupCodes;

      await user.save();
      
      return res.json({
        success: true,
        message: "Two-factor authentication enabled successfully",
        backupCodes
      });
    } else {
      return res.status(400).json({ error: "Invalid verification code" });
    }
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    res.status(500).json({ error: "Server error enabling 2FA" });
  }
};

// Disable 2FA
export const disable2FA = async (req, res) => {
  try {
    const { password } = req.body; // Require password to disable 2FA for security
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password first
    const bcrypt = await import("bcryptjs");
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.backupCodes = [];
    await user.save();

    res.json({ success: true, message: "Two-factor authentication disabled" });
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    res.status(500).json({ error: "Server error disabling 2FA" });
  }
};

// Verify 2FA during Login
export const verify2FALogin = async (req, res) => {
  try {
    const { tempToken, token } = req.body; // token is the TOTP code or a backup code

    if (!tempToken || !token) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify temporary token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET || process.env.JWT_TOKEN);
    } catch (err) {
      return res.status(401).json({ error: "Session expired or invalid. Please login again." });
    }

    const userId = decoded.userId;
    const user = await User.findById(userId);

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ error: "Invalid 2FA request" });
    }

    // Check if token is a backup code
    if (user.backupCodes && user.backupCodes.includes(token)) {
      // Remove used backup code
      user.backupCodes = user.backupCodes.filter(c => c !== token);
      await user.save();
    } else {
      // Verify TOTP
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: token,
        window: 1,
      });

      if (!verified) {
        return res.status(400).json({ error: "Invalid verification code" });
      }
    }

    // Generate actual JWT token
    const payload = { user: { id: user.id, email: user.email } };
    const authToken = jwt.sign(payload, process.env.JWT_SECRET || process.env.JWT_TOKEN, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    });

    res.cookie("token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: "Login successful",
      authToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Error verifying 2FA login:", error);
    res.status(500).json({ error: "Server error verifying 2FA login" });
  }
};
