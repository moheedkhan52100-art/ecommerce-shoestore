const Product = require("../models/Product");
const { logAdminAction } = require("../utils/logger");

const uploadedFileUrl = (req, file) => file ? `${req.protocol}://${req.get("host")}/uploads/${file.filename}` : undefined;
const uploadedImageUrls = (req) => (req.files?.imageFiles || []).map((file) => uploadedFileUrl(req, file));

const productPayload = (req) => ({
  ...req.body,
  ...(uploadedFileUrl(req, req.files?.imageFile?.[0]) ? { image: uploadedFileUrl(req, req.files.imageFile[0]) } : {}),
  ...(uploadedImageUrls(req).length ? { images: uploadedImageUrls(req), image: uploadedImageUrls(req)[0] } : {}),
  ...(uploadedFileUrl(req, req.files?.modelFile?.[0]) ? { modelUrl: uploadedFileUrl(req, req.files.modelFile[0]) } : {})
});

// CREATE
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(productPayload(req));

    await logAdminAction({
      adminEmail: req.admin?.email || "Admin",
      action: "CREATE_PRODUCT",
      description: `Added new product "${product.name}" ($${product.price}, Stock: ${product.stock}, Category: ${product.category || "General"})`,
      targetType: "Product",
      targetId: product._id,
      metadata: {
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        audience: product.audience
      }
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// READ ALL
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// READ ONE
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// UPDATE
const updateProduct = async (req, res) => {
  try {
    const previous = await Product.findById(req.params.id);
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productPayload(req),
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    await logAdminAction({
      adminEmail: req.admin?.email || "Admin",
      action: "UPDATE_PRODUCT",
      description: `Updated product "${product.name}" ($${product.price}, Stock: ${product.stock})`,
      targetType: "Product",
      targetId: product._id,
      metadata: {
        name: product.name,
        price: product.price,
        stock: product.stock,
        previousPrice: previous?.price,
        previousStock: previous?.stock
      }
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// DELETE
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    await logAdminAction({
      adminEmail: req.admin?.email || "Admin",
      action: "DELETE_PRODUCT",
      description: `Deleted product "${product.name}" (ID: ${product._id}, Category: ${product.category || "General"})`,
      targetType: "Product",
      targetId: product._id,
      metadata: {
        name: product.name,
        category: product.category,
        price: product.price
      }
    });

    res.json({
      message: "Product deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
};