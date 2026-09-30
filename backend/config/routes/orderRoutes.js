const express = require("express");
const { createOrder } = require("../controllers/orderController");
const { requireUser } = require("../middleware/authMiddleware");

const router = express.Router();
router.post("/", requireUser, createOrder);

module.exports = router;
