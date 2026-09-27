const express = require("express");

const {
  createOrder,
  getOrders,
  getOrderById,
  getCustomerOrders,
  getCustomerOrderById,
  updateOrderStatus,
  updatePaymentStatus,
} = require("../controllers/orderController");

const protectAdmin = require("../middleware/authMiddleware");
const customerAuth = require("../middleware/customerAuthMiddleware");

const router = express.Router();

// =====================================
// CUSTOMER ROUTES
// =====================================

// Create new order
router.post(
  "/",
  customerAuth,
  createOrder
);

// Get logged-in customer's own orders
router.get(
  "/customer",
  customerAuth,
  getCustomerOrders
);

// Get ONE order belonging to logged-in customer
// IMPORTANT: This must come BEFORE /:orderId
router.get(
  "/customer/:orderId",
  customerAuth,
  getCustomerOrderById
);

// =====================================
// ADMIN ROUTES
// =====================================

// Get all orders
router.get(
  "/",
  protectAdmin,
  getOrders
);

// =====================================
// ADMIN - VERIFY PAYMENT
// =====================================

router.put(
  "/:orderId/payment-status",
  protectAdmin,
  updatePaymentStatus
);

// Get one order by order ID
router.get(
  "/:orderId",
  protectAdmin,
  getOrderById
);

// Update order status
router.put(
  "/:orderId/status",
  protectAdmin,
  updateOrderStatus
);

module.exports = router;