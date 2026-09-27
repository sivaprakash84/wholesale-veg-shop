const express = require("express");

const {
  getDeliverySettings,
  updateDeliverySettings,
  calculateDelivery,
} = require("../controllers/deliveryController");

const protectAdmin =
  require("../middleware/authMiddleware");

const router = express.Router();

// Public delivery settings
router.get(
  "/",
  getDeliverySettings
);

// Admin updates delivery settings
router.put(
  "/",
  protectAdmin,
  updateDeliverySettings
);

// Calculate delivery charge
router.post(
  "/calculate",
  calculateDelivery
);

module.exports = router;