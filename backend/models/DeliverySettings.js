const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["bike", "four_wheeler"],
      required: true,
    },

    label: {
      type: String,
      required: true,
      trim: true,
    },

    // Maximum order weight this vehicle can carry
    maxWeightKg: {
      type: Number,
      required: true,
      min: 0,
    },

    // Fixed delivery rate per road kilometer
    ratePerKm: {
      type: Number,
      required: true,
      min: 0,
    },

    // Admin can enable/disable a vehicle
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const deliverySettingsSchema = new mongoose.Schema(
  {
    /*
     * Vehicles are selected automatically according to
     * the total weight of the customer's order.
     */
    vehicles: {
      type: [vehicleSchema],
      default: [
        {
          type: "bike",
          label: "2-Wheeler",
          maxWeightKg: 110,
          ratePerKm: 3,
          enabled: true,
        },
        {
          type: "four_wheeler",
          label: "4-Wheeler",
          maxWeightKg: 2000,
          ratePerKm: 6,
          enabled: true,
        },
      ],
    },

    /*
     * Maximum road distance from the shop
     * where delivery is allowed.
     */
    maxDistanceKm: {
      type: Number,
      default: 50,
      min: 1,
    },

    /*
     * Enable / disable home delivery.
     */
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const DeliverySettings =
  mongoose.model(
    "DeliverySettings",
    deliverySettingsSchema
  );

module.exports = DeliverySettings;