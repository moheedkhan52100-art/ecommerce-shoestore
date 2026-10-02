const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema({
  currency: { type: String, enum: ["USD", "EUR", "GBP"], default: "USD" },
  storeName: { type: String, default: "KHAN E-Commerce" },
  supportEmail: { type: String, default: "support@khan.store" },
  fulfillmentSla: { type: String, default: "2-3 Business Days" }
}, { timestamps: true });

module.exports = mongoose.model("StoreSettings", storeSettingsSchema);
