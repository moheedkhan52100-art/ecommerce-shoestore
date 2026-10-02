const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const aiRoutes = require("./config/routes/aiRoutes");

const connectDB = require("./config/db");
const authRoutes = require("./config/routes/authRoutes");
const userAuthRoutes = require("./config/routes/userAuthRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/user", userAuthRoutes);
app.get("/", (req, res) => {
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
