const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const { sendOtpEmail: sendVerificationEmail } = require("../services/emailService");

const createVerificationCode = () => Math.floor(
  100000 + Math.random() * 900000
).toString();

const getVerificationExpiry = () => new Date(Date.now() + 10 * 60 * 1000);


// ========================================
// REGISTER USER
// ========================================

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      if (!existingUser.isVerified) {
        // If user already signed up but hasn't verified yet, update details and re-send OTP
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = createVerificationCode();
        const verificationCodeExpires = getVerificationExpiry();

        existingUser.name = name;
        existingUser.password = hashedPassword;
        existingUser.verificationCode = verificationCode;
        existingUser.verificationCodeExpires = verificationCodeExpires;
        await existingUser.save();

        await sendVerificationEmail(normalizedEmail, verificationCode);

        return res.status(200).json({
          message: "A verification code has been sent to your email.",
          userId: existingUser._id,
        });
      }

      return res.status(400).json({
        message: "Email is already registered. Please sign in instead.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6 digit OTP
    const verificationCode = createVerificationCode();

    // OTP expires in 10 minutes
    const verificationCodeExpires = getVerificationExpiry();

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
    });

    // Send OTP
    await sendVerificationEmail(
      normalizedEmail,
      verificationCode
    );

    res.status(201).json({
      message:
        "Account created. Verification code sent to your email.",
      userId: user._id,
    });

  } catch (error) {
    console.error("Registration error:", error);

    // If duplicate email race condition occurred
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email is already registered. Please sign in instead.",
      });
    }

    res.status(500).json({
      message: "Registration failed. Please try again.",
      error: error.message,
    });
  }
};


// ========================================
// VERIFY EMAIL
// ========================================

const verifyEmail = async (req, res) => {
  try {

    const { email } = req.body;
    const code = String(req.body.code || req.body.otp || "").trim();

    if (!email || !code) {
      return res.status(400).json({
        message: "Email and verification code are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Already verified
    if (user.isVerified) {
      return res.status(400).json({
        message: "Email is already verified",
      });
    }

    // Check OTP
    if (user.verificationCode !== code) {
      return res.status(400).json({
        message: "Invalid verification code",
      });
    }

    // Check expiration
    if (
      !user.verificationCodeExpires ||
      user.verificationCodeExpires < new Date()
    ) {
      return res.status(400).json({
        message: "Verification code has expired",
      });
    }

    // Verify user
    user.isVerified = true;

    // Remove OTP
    user.verificationCode = null;
    user.verificationCodeExpires = null;

    await user.save();

    res.json({
      message: "Email verified successfully",
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Email verification failed",
      error: error.message,
    });
  }
};

// ========================================
// RESEND VERIFICATION CODE
// ========================================

const resendOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "Email is already verified",
      });
    }

    const verificationCode = createVerificationCode();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = getVerificationExpiry();
    await user.save();

    await sendVerificationEmail(email, verificationCode);

    res.json({
      message: "A new verification code has been sent to your email.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to resend verification code",
      error: error.message,
    });
  }
};


// ========================================
// LOGIN USER
// ========================================

const loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Don't allow unverified users
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        isUnverified: true,
        email: user.email,
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: "user",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};


module.exports = {
  registerUser,
  verifyEmail,
  resendOtp,
  loginUser,
};
