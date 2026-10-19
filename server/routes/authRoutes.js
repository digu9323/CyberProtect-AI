
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  googleLogin,
  recoveryLogin,
  resetPassword,
} = require("../controllers/authController");

const {
  sendOTP,
  verifyOTP,
} = require("../controllers/otpController");

// Registration and login
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);

// OTP verification
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

// Password recovery
router.post("/recovery-login", recoveryLogin);
router.post("/reset-password", resetPassword);

module.exports = router;
