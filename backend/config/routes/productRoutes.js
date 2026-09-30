const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");
const { requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDirectory = path.join(__dirname, "../../uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });
const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => callback(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-")}`)
});
const upload = multer({ storage });

router.post("/", requireAdmin, upload.fields([{ name: "imageFile", maxCount: 1 }, { name: "imageFiles", maxCount: 8 }, { name: "modelFile", maxCount: 1 }]), createProduct);

router.get("/", getProducts);

router.get("/:id", getProduct);

router.put("/:id", requireAdmin, upload.fields([{ name: "imageFile", maxCount: 1 }, { name: "imageFiles", maxCount: 8 }, { name: "modelFile", maxCount: 1 }]), updateProduct);

router.delete("/:id", requireAdmin, deleteProduct);

module.exports = router;