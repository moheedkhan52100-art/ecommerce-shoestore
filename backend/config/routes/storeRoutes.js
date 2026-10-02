const express = require("express");
const { getStoreSettings } = require("../controllers/adminController");

const router = express.Router();
router.get("/settings", getStoreSettings);

module.exports = router;
