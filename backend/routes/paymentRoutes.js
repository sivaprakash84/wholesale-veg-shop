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


// ===============================
// MULTER STORAGE
// ===============================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/payment");
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    cb(
      null,
      `payment-${Date.now()}${extension}`
    );
  },
});


// ===============================
// MULTER CONFIGURATION
// ===============================

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only JPG, PNG and WEBP images are allowed"
        )
      );
    }
  },
});


// ===============================
// GET PAYMENT SETTINGS
// ===============================
// Customer can view QR / UPI details

router.get(
  "/",
  getPaymentSettings
);


// ===============================
// UPDATE PAYMENT SETTINGS
// ===============================
// Admin only

router.put(
  "/",
  protectAdmin,
  upload.single("qrImage"),
  updatePaymentSettings
);


// ===============================
// SUBMIT PAYMENT SCREENSHOT
// ===============================
// Customer only

router.post(
  "/submit",
  customerAuth,
  upload.single("screenshot"),
  submitPayment
);


module.exports = router;