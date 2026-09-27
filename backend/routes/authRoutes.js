const express = require("express");

const {
  adminGoogleLogin,
} = require("../controllers/authController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// ADMIN GOOGLE LOGIN
// =====================================================

router.post(
  "/admin/google-login",
  adminGoogleLogin
);


// =====================================================
// VERIFY ADMIN JWT
// =====================================================

router.get(
  "/admin/verify",
  protectAdmin,
  (req, res) => {

    res.status(200).json({
      valid: true,

      admin: {
        uid: req.admin.uid,
        email: req.admin.email,
        role: req.admin.role,
      },
    });

  }
);


module.exports = router;