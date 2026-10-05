const express = require("express");
const { createOrder, listMyOrders } = require("../controllers/orderController");
const { requireUser } = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/mine", requireUser, listMyOrders);
router.post("/", requireUser, createOrder);

module.exports = router;
