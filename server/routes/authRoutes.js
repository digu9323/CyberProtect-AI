const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  googleLogin
} = require("../controllers/authController");

const {
  sendOTP,
  verifyOTP
} = require("../controllers/otpController");

// Registration
router.post("/register", registerUser);

// Normal Login
router.post("/login", loginUser);

// Google Login
router.post("/google", googleLogin);

// Email OTP
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

module.exports = router;