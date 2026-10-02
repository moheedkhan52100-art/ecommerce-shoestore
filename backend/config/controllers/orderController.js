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
    const { items, shipping, paymentMethod = "cash" } = req.body || {};
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "At least one order item is required" });
    }
    if (!["cash", "card"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Select a supported payment method" });
    }

    const shippingFields = ["name", "address", "city", "postalCode"];
    const normalizedShipping = {};
    for (const field of shippingFields) {
      const value = shipping?.[field];
      if (typeof value !== "string" || !value.trim()) {
        return res.status(400).json({ message: "Complete all shipping details" });
      }
      normalizedShipping[field] = value.trim();
    }

    const requestedQuantities = new Map();
    const requestedItems = [];
    for (const item of items) {
      const productIdValue = typeof item?.product === "object" ? item.product?._id : item?.product;
      const quantity = Number(item?.quantity);
      const size = typeof item?.size === "string" ? item.size.trim() : "";
      if (!mongoose.Types.ObjectId.isValid(productIdValue) || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: "Each order item must have a valid product and quantity" });
      }
      if (item?.size != null && (typeof item.size !== "string" || size.length > 20)) {
        return res.status(400).json({ message: "Each order item must have a valid size" });
      }

      const productId = String(productIdValue);
      requestedQuantities.set(productId, (requestedQuantities.get(productId) || 0) + quantity);
      requestedItems.push({ productId, quantity, size });
    }

    const productIds = [...requestedQuantities.keys()];
    const products = await Product.find({ _id: { $in: productIds } }).select("name stock price image images sizes");
    const productsById = new Map(products.map((product) => [String(product._id), product]));
    const missingProduct = productIds.find((productId) => !productsById.has(productId));
    if (missingProduct) {
      return res.status(404).json({ message: "A product in this order is no longer available" });
    }

    const orderItems = [];
    for (const item of requestedItems) {
      const product = productsById.get(item.productId);
      if (item.size && !product.sizes.includes(item.size)) {
        return res.status(409).json({ message: `${item.size} is no longer available for ${product.name}` });
      }
      const price = Number(product.price);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(409).json({ message: `${product.name} is currently unavailable` });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image || product.images?.[0] || "",
        quantity: item.quantity,
        price,
        size: item.size
      });
    }
    const total = Math.round(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;

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
      order = await Order.create({
        customer: req.user.id,
        email: req.user.email,
        items: orderItems,
        total,
        shipping: normalizedShipping,
        paymentMethod
      });
    } catch (error) {
      await restoreReservedStock(reservations);
      throw error;
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder };
