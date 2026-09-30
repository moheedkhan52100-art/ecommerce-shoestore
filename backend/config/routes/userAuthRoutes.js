const express = require("express");

const {
  registerUser,
  verifyEmail,
  resendOtp,
  loginUser,
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


module.exports = router;
