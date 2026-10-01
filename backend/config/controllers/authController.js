const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");
const { logAdminAction } = require("../utils/logger");

const loginAdmin = async (req, res) => {
  try {
    const { password } = req.body;
    const email = String(req.body.email || "").trim().toLowerCase();

    // Check fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Find admin
    const admin = await Admin.findOne({
      email
    });

    if (admin && await bcrypt.compare(password, admin.password)) {
      const token = jwt.sign(
        { id: admin._id, email: admin.email, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      await logAdminAction({
        adminEmail: admin.email,
        action: "ADMIN_LOGIN",
        description: `Admin "${admin.name}" (${admin.email}) signed into the dashboard`,
        targetType: "Auth",
        targetId: admin._id,
        metadata: {
          adminName: admin.name,
          adminEmail: admin.email
        }
      });

      return res.json({
        message: "Login successful",
        token,
        role: "admin",
        admin: { id: admin._id, name: admin.name, email: admin.email }
      });
    }

    const user = await User.findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
      if (!user.isVerified) {
        return res.status(403).json({
          message: "Please verify your email before logging in",
          isUnverified: true,
          email: user.email
        });
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.json({
        message: "Login successful",
        token,
        role: "user",
        user: { id: user._id, name: user.name, email: user.email }
      });
    }

    return res.status(401).json({
      message: "Invalid email or password"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  loginAdmin
};