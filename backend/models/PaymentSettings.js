const mongoose = require("mongoose");

const paymentSettingsSchema = new mongoose.Schema(
  {
    qrImage: {
      type: String,
      default: "",
    },

    upiId: {
      type: String,
      default: "",
      trim: true,
    },

    paymentName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PaymentSettings",
  paymentSettingsSchema
);