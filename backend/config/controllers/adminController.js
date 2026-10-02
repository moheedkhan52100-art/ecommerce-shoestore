const Category = require("../models/Category");
const Order = require("../models/Order");
const User = require("../models/User");
const AdminLog = require("../models/AdminLog");
const StoreSettings = require("../models/StoreSettings");
const { logAdminAction } = require("../utils/logger");
const emailService = require("../services/emailService");

const listUsers = async (req, res) => {
  const users = await User.find().select("name email blocked createdAt").sort({ createdAt: -1 });
  res.json(users);
};

const setUserBlocked = async (req, res) => {
  const isBlocked = Boolean(req.body.blocked);
  const user = await User.findByIdAndUpdate(req.params.id, { blocked: isBlocked }, { new: true }).select("name email blocked createdAt");
  if (!user) return res.status(404).json({ message: "User not found" });

  await logAdminAction({
    adminEmail: req.admin?.email || "Admin",
    action: isBlocked ? "BLOCK_USER" : "UNBLOCK_USER",
    description: `${isBlocked ? "Blocked" : "Unblocked"} user "${user.name}" (${user.email})`,
    targetType: "User",
    targetId: user._id,
    metadata: {
      userName: user.name,
      userEmail: user.email,
      blocked: isBlocked
    }
  });

  res.json(user);
};

const listOrders = async (req, res) => {
  const orders = await Order.find()
    .populate("customer", "name email")
    .populate("items.product", "name image images")
    .sort({ createdAt: -1 });
  res.json(orders);
};

const setOrderStatus = async (req, res) => {
  const allowed = ["Pending", "Shipped", "Delivered", "Paid"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid order status" });
  const previousOrder = await Order.findById(req.params.id);
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  )
    .populate("customer", "name email")
    .populate("items.product", "name image images");
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (previousOrder?.status !== order.status) {
    await emailService.sendOrderStatusEmail(order, previousOrder?.status);
  }

  await logAdminAction({
    adminEmail: req.admin?.email || "Admin",
    action: "UPDATE_ORDER_STATUS",
    description: `Updated order #${order._id.toString().slice(-6).toUpperCase()} status from "${previousOrder?.status || 'Unknown'}" to "${order.status}"`,
    targetType: "Order",
    targetId: order._id,
    metadata: {
      orderId: order._id,
      previousStatus: previousOrder?.status,
      newStatus: order.status,
      customerEmail: order.email,
      total: order.total
    }
  });

  res.json(order);
};

const listCategories = async (req, res) => res.json(await Category.find().sort({ name: 1 }));

const getStoreSettings = async (req, res) => {
  let settings = await StoreSettings.findOne();
  if (!settings) settings = await StoreSettings.create({});
  res.json(settings);
};

const updateStoreSettings = async (req, res) => {
  const allowed = ["USD", "EUR", "GBP"];
  if (req.body.currency && !allowed.includes(req.body.currency)) return res.status(400).json({ message: "Unsupported currency" });
  const settings = await StoreSettings.findOneAndUpdate({}, {
    ...(req.body.currency ? { currency: req.body.currency } : {}),
    ...(typeof req.body.storeName === "string" ? { storeName: req.body.storeName } : {}),
    ...(typeof req.body.supportEmail === "string" ? { supportEmail: req.body.supportEmail } : {}),
    ...(typeof req.body.fulfillmentSla === "string" ? { fulfillmentSla: req.body.fulfillmentSla } : {})
  }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
  res.json(settings);
};

const createCategory = async (req, res) => {
  const category = await Category.create({ name: req.body.name });

  await logAdminAction({
    adminEmail: req.admin?.email || "Admin",
    action: "CREATE_CATEGORY",
    description: `Created category "${category.name}"`,
    targetType: "Category",
    targetId: category._id,
    metadata: {
      categoryName: category.name
    }
  });

  res.status(201).json(category);
};

const updateCategory = async (req, res) => {
  const previous = await Category.findById(req.params.id);
  const category = await Category.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ message: "Category not found" });

  await logAdminAction({
    adminEmail: req.admin?.email || "Admin",
    action: "UPDATE_CATEGORY",
    description: `Updated category "${previous?.name || ''}" to "${category.name}"`,
    targetType: "Category",
    targetId: category._id,
    metadata: {
      previousName: previous?.name,
      newName: category.name
    }
  });

  res.json(category);
};

const deleteCategory = async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: "Category not found" });

  await logAdminAction({
    adminEmail: req.admin?.email || "Admin",
    action: "DELETE_CATEGORY",
    description: `Deleted category "${category.name}"`,
    targetType: "Category",
    targetId: category._id,
    metadata: {
      categoryName: category.name
    }
  });

  res.json({ message: "Category deleted" });
};

// Log endpoints
const listLogs = async (req, res) => {
  try {
    const { targetType, action, search, limit = 100 } = req.query;
    const filter = {};

    if (targetType && targetType !== "ALL") {
      filter.targetType = targetType;
    }

    if (action && action !== "ALL") {
      filter.action = action;
    }

    if (search && search.trim()) {
      filter.$or = [
        { description: { $regex: search.trim(), $options: "i" } },
        { adminEmail: { $regex: search.trim(), $options: "i" } }
      ];
    }

    const logs = await AdminLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearLogs = async (req, res) => {
  try {
    const count = await AdminLog.countDocuments();
    await AdminLog.deleteMany({});

    await logAdminAction({
      adminEmail: req.admin?.email || "Admin",
      action: "CLEAR_LOGS",
      description: `Cleared ${count} previous activity logs`,
      targetType: "System",
      metadata: { deletedCount: count }
    });

    res.json({ message: "All logs cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createLog = async (req, res) => {
  try {
    const { action, description, targetType, targetId, metadata } = req.body;
    if (!action || !description) {
      return res.status(400).json({ message: "Action and description are required" });
    }

    const log = await logAdminAction({
      adminEmail: req.admin?.email || "Admin",
      action,
      description,
      targetType: targetType || "System",
      targetId: targetId || "",
      metadata: metadata || {}
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listUsers,
  setUserBlocked,
  listOrders,
  setOrderStatus,
  listCategories,
  getStoreSettings,
  updateStoreSettings,
  createCategory,
  updateCategory,
  deleteCategory,
  listLogs,
  clearLogs,
  createLog
};

