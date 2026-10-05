const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const aiRoutes = require("./config/routes/aiRoutes");

const connectDB = require("./config/db");
const authRoutes = require("./config/routes/authRoutes");
const userAuthRoutes = require("./config/routes/userAuthRoutes");

const app = express();
const frontendDistPath = path.join(__dirname, "../frontend/dist");

app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/user", userAuthRoutes);
app.get("/api/health", (req, res) => {
  res.json({
    message: "E-commerce Admin API is running"
  });
});

const productRoutes = require("./config/routes/productRoutes");
const adminRoutes = require("./config/routes/adminRoutes");
const orderRoutes = require("./config/routes/orderRoutes");
const storeRoutes = require("./config/routes/storeRoutes");

app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/ai", aiRoutes);
app.use(express.static(frontendDistPath));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
    return next();
  }

  res.sendFile(path.join(frontendDistPath, "index.html"), (error) => {
    if (error) next(error);
  });
});
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
