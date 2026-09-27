const express = require("express");

const {
  getShopSettings,
  updateShopSettings,
} = require("../controllers/shopController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================
// GET SHOP DETAILS
// ADMIN ONLY
// =====================================

router.get(
  "/",
  protectAdmin,
  getShopSettings
);


// =====================================
// UPDATE SHOP DETAILS
// ADMIN ONLY
// =====================================

router.put(
  "/",
  protectAdmin,
  updateShopSettings
);


module.exports = router;