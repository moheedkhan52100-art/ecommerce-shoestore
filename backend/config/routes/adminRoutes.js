const express = require("express");
const { requireAdmin } = require("../middleware/authMiddleware");
const {
  listUsers,
  setUserBlocked,
  listOrders,
  setOrderStatus,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listLogs,
  clearLogs,
  createLog
} = require("../controllers/adminController");

const router = express.Router();
router.use(requireAdmin);
router.get("/users", listUsers);
router.patch("/users/:id/block", setUserBlocked);
router.get("/orders", listOrders);
router.patch("/orders/:id/status", setOrderStatus);
router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);
router.get("/logs", listLogs);
router.delete("/logs", clearLogs);
router.post("/logs", createLog);

module.exports = router;

