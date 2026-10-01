const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  getPaymentSettings,
  updatePaymentSettings,
  submitPayment,
} = require("../controllers/paymentController");

const protectAdmin = require("../middleware/authMiddleware");
const customerAuth = require("../middleware/customerAuthMiddleware");

const router = express.Router();

// =====================================================
// CUSTOMER PAYMENT SCREENSHOT STORAGE
// =====================================================

const screenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/payment");
  },

  filename: (req, file, cb) => {
    const extension =
      path.extname(file.originalname);

    cb(
      null,
      `payment-${Date.now()}${extension}`
    );
  },
});

// =====================================================
// ADMIN QR IMAGE STORAGE
// =====================================================

// QR image is stored in MongoDB as base64.
// This avoids depending on Render's temporary filesystem.

const qrStorage = multer.memoryStorage();

// =====================================================
// COMMON FILE VALIDATION
// =====================================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (
    allowedTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, PNG and WEBP images are allowed"
      )
    );
  }
};

// =====================================================
// ADMIN QR UPLOAD
// =====================================================

const uploadQr = multer({
  storage: qrStorage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter,
});

// =====================================================
// CUSTOMER SCREENSHOT UPLOAD
// =====================================================

const uploadScreenshot = multer({
  storage: screenshotStorage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter,
});

// =====================================================
// GET PAYMENT SETTINGS
// =====================================================

// Customer can view QR / UPI details

router.get(
  "/",
  getPaymentSettings
);

// =====================================================
// UPDATE PAYMENT SETTINGS
// =====================================================

// Admin only

router.put(
  "/",
  protectAdmin,
  uploadQr.single("qrImage"),
  updatePaymentSettings
);

// =====================================================
// SUBMIT PAYMENT SCREENSHOT
// =====================================================

// Customer only

router.post(
  "/submit",
  customerAuth,
  uploadScreenshot.single("screenshot"),
  submitPayment
);

module.exports = router;