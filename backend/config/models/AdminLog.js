const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    adminEmail: {
      type: String,
      default: "Admin",
      trim: true
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    targetType: {
      type: String,
      enum: ["Product", "Category", "Order", "User", "Auth", "System"],
      default: "System"
    },
    targetId: {
      type: String,
      default: ""
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("AdminLog", adminLogSchema);
