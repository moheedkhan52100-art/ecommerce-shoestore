const Order = require("../models/Order");
const Product = require("../models/Product");
const mongoose = require("mongoose");

const restoreReservedStock = (reservations) => Promise.all(
  reservations.map(({ productId, quantity }) =>
    Product.updateOne({ _id: productId }, { $inc: { stock: quantity } })
  )
);

const createOrder = async (req, res) => {
  try {
    const { items, total, shipping, paymentMethod } = req.body;
    if (!Array.isArray(items) || !items.length || !Number.isFinite(Number(total)) || Number(total) < 0) {
      return res.status(400).json({ message: "Items and total are required" });
    }

    const requestedQuantities = new Map();
    for (const item of items) {
      const productId = typeof item.product === "object" ? item.product?._id : item.product;
      const quantity = Number(item.quantity);
      if (!mongoose.Types.ObjectId.isValid(productId) || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: "Each order item must have a valid product and quantity" });
      }
      requestedQuantities.set(productId, (requestedQuantities.get(productId) || 0) + quantity);
    }

    const productIds = [...requestedQuantities.keys()];
    const products = await Product.find({ _id: { $in: productIds } }).select("name stock");
    const productsById = new Map(products.map((product) => [String(product._id), product]));
    const missingProduct = productIds.find((productId) => !productsById.has(productId));
    if (missingProduct) {
      return res.status(404).json({ message: "A product in this order is no longer available" });
    }

    const reservations = [];
    try {
      for (const [productId, quantity] of requestedQuantities) {
        const reservedProduct = await Product.findOneAndUpdate(
          { _id: productId, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } },
          { new: true }
        );

        if (!reservedProduct) {
          await restoreReservedStock(reservations);
          const product = await Product.findById(productId).select("name stock");
          const available = product?.stock || 0;
          return res.status(409).json({
            message: `Only ${available} ${product?.name || "units"} available. Reduce the quantity in your bag and try again.`
          });
        }

        reservations.push({ productId, quantity });
      }
    } catch (error) {
      await restoreReservedStock(reservations);
      throw error;
    }

    let order;
    try {
      order = await Order.create({ customer: req.user.id, email: req.user.email, items, total: Number(total), shipping, paymentMethod });
    } catch (error) {
      await restoreReservedStock(reservations);
      throw error;
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createOrder };
