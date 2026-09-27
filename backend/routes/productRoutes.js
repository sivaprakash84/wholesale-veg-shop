const express = require("express");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

/*
  PUBLIC CUSTOMER ROUTES
*/

router.get("/", getProducts);

router.get("/:id", getProductById);

/*
  ADMIN ONLY ROUTES
*/

router.post("/", protectAdmin, createProduct);

router.put("/:id", protectAdmin, updateProduct);

router.delete("/:id", protectAdmin, deleteProduct);

module.exports = router;