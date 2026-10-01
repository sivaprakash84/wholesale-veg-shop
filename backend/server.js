const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
// ============================================
// LOAD ENVIRONMENT VARIABLES FIRST
// ============================================

dotenv.config();

// ============================================
// IMPORT AFTER ENVIRONMENT VARIABLES ARE LOADED
// ============================================

const connectDB = require("./config/db");

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const authRoutes = require("./routes/authRoutes");
const shopRoutes = require("./routes/shopRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");

// ============================================
// EXPRESS APP
// ============================================

const app = express();
const paymentUploadDir = path.join(
  __dirname,
  "uploads",
  "payment"
);

fs.mkdirSync(paymentUploadDir, {
  recursive: true,
});

connectDB();

app.use(cors());

app.use(express.json());

// ============================================
// HOME ROUTE
// ============================================

app.get("/", (req, res) => {
  res.json({
    message: "Wholesale Vegetable Shop API is running",
  });
});

// ============================================
// ROUTES
// ============================================

app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

app.use("/api/orders", orderRoutes);

app.use(
  "/api/payment-settings",
  paymentRoutes
);

app.use(
  "/api/shop-settings",
  shopRoutes
);

app.use(
  "/api/delivery-settings",
  deliveryRoutes
);

// ============================================
// SERVER
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});