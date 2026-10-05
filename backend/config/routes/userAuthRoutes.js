const express = require("express");

const {
  registerUser,
  verifyEmail,
  resendOtp,
  loginUser,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/userAuthController");

const router = express.Router();


// Register
router.post("/register", registerUser);


// Verify email
router.post("/verify-email", verifyEmail);
router.post("/verify-otp", verifyEmail);

// Resend verification code
router.post("/resend-otp", resendOtp);


// Login
router.post("/login", loginUser);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);


module.exports = router;
