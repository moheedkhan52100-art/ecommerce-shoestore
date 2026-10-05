const express = require("express");
const { requireAdmin } = require("../middleware/authMiddleware");
const {
  listUsers,
  setUserBlocked,
  listOrders,
  listProductReviews,
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
} = require("../controllers/adminController");

const router = express.Router();
router.get("/categories", listCategories);
router.get("/users", requireAdmin, listUsers);
router.patch("/users/:id/block", requireAdmin, setUserBlocked);
router.get("/orders", requireAdmin, listOrders);
router.get("/reviews", requireAdmin, listProductReviews);
router.patch("/orders/:id/status", requireAdmin, setOrderStatus);
router.post("/categories", requireAdmin, createCategory);
router.put("/categories/:id", requireAdmin, updateCategory);
router.delete("/categories/:id", requireAdmin, deleteCategory);
router.get("/settings", requireAdmin, getStoreSettings);
router.put("/settings", requireAdmin, updateStoreSettings);
router.get("/logs", requireAdmin, listLogs);
router.delete("/logs", requireAdmin, clearLogs);
router.post("/logs", requireAdmin, createLog);

module.exports = router;
