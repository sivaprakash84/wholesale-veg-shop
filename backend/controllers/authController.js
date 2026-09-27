const jwt = require("jsonwebtoken");
const adminAuth = require("../config/firebaseAdmin");

// =====================================================
// ADMIN GOOGLE LOGIN
// =====================================================

const adminGoogleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Check Firebase ID token
    if (!idToken) {
      return res.status(400).json({
        message: "Google authentication token is required",
      });
    }

    // Verify Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const email = decodedToken.email;

    // Make sure Google account has an email
    if (!email) {
      return res.status(401).json({
        message: "Google account email could not be verified",
      });
    }

    // Approved admin email
    const adminEmail = process.env.ADMIN_EMAIL;

    // Only approved Google account can access admin
    if (
      email.toLowerCase() !==
      adminEmail.toLowerCase()
    ) {
      return res.status(403).json({
        message:
          "This Google account is not authorized as an admin.",
      });
    }

    // Create our application's admin JWT
    const token = jwt.sign(
      {
        uid: decodedToken.uid,
        email: email,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Admin Google login successful",

      token,

      admin: {
        uid: decodedToken.uid,
        email: email,
        name: decodedToken.name || "",
        photo: decodedToken.picture || "",
        role: "admin",
      },
    });

  } catch (error) {
    console.error(
      "Admin Google Login Error:",
      error
    );

    return res.status(401).json({
      message:
        "Google authentication failed. Please login again.",
    });
  }
};


module.exports = {
  adminGoogleLogin,
};