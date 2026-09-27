const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    nameTa: {
  type: String,
  required: true,
  trim: true,
},

    category: {
      type: String,
      required: true,
      default: "Vegetables",
    },

    // Price for ONE selling unit
    // Example:
    // 1 Moodai = ₹1485
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Customer-visible wholesale rate per kg
    // Example:
    // ₹27 per kg
    pricePerKg: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Wholesale selling unit
    // Examples:
    // kg, Moodai, Bag, Box, Crate
    unit: {
      type: String,
      required: true,
      default: "kg",
      trim: true,
    },

    // Weight represented by ONE selling unit
    // Example:
    // 1 Moodai = 55 kg
    // 1 Bag = 25 kg
    // 1 Box = 10 kg
    weightPerUnitKg: {
      type: Number,
      required: true,
      default: 1,
      min: 0.001,
    },

    // Stock is stored as number of selling units
    // Example:
    // 100 Moodai = stock 100
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    image: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;