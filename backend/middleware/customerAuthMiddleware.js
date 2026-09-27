const adminAuth = require("../config/firebaseAdmin");

const customerAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "Authorization token is required",
      });
    }

    const idToken = authHeader.split("Bearer ")[1];

    if (!idToken) {
      return res.status(401).json({
        message: "Firebase ID token is missing",
      });
    }

    // Verify Firebase customer token
    const decodedToken =
      await adminAuth.verifyIdToken(idToken);

    req.customer = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      name: decodedToken.name || "",
      picture: decodedToken.picture || "",
    };

    next();

  } catch (error) {
    console.error(
      "Customer authentication error:",
      error
    );

    return res.status(401).json({
      message:
        "Invalid or expired customer authentication token",
    });
  }
};

module.exports = customerAuthMiddleware;