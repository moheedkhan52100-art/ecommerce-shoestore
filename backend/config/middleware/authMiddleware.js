const jwt = require("jsonwebtoken");

const requireAdmin = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) return res.status(401).json({ message: "Admin authentication required" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") return res.status(403).json({ message: "Admin access required" });
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired admin token" });
  }
};

const requireUser = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) return res.status(401).json({ message: "Please sign in to place an order" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "user") return res.status(403).json({ message: "Customer account required" });
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Your session expired. Please sign in again" });
  }
};

module.exports = { requireAdmin, requireUser };
