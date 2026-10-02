const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: { type: String, required: true, trim: true, lowercase: true },
    items: [{ name: String, image: String, product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, quantity: Number, price: Number, size: String }],
    total: { type: Number, required: true },
    shipping: { name: String, address: String, city: String, postalCode: String },
    paymentMethod: { type: String, enum: ["cash", "card"], default: "cash" },
    status: { type: String, enum: ["Pending", "Shipped", "Delivered", "Paid"], default: "Pending" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
