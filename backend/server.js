require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const aiRoutes = require("./config/routes/aiRoutes");

dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./config/routes/authRoutes");
const userAuthRoutes = require("./config/routes/userAuthRoutes");

connectDB();

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

app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/ai", aiRoutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
