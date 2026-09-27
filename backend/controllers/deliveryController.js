const DeliverySettings = require("../models/DeliverySettings");

const {
  calculateDeliveryCharge,
} = require("../services/deliveryDistanceService");

// =====================================================
// DEFAULT VEHICLE CONFIGURATION
// =====================================================

const getDefaultVehicles = () => {
  return [
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
  ];
};

// =====================================================
// GET DELIVERY SETTINGS
// =====================================================

const getDeliverySettings = async (req, res) => {
  try {
    let settings = await DeliverySettings.findOne();

    // -------------------------------------------------
    // CREATE SETTINGS ONLY IF THEY DON'T EXIST
    // -------------------------------------------------

    if (!settings) {
      settings = await DeliverySettings.create({
        vehicles: getDefaultVehicles(),
        maxDistanceKm: 50,
        isEnabled: true,
      });
    }

    // IMPORTANT:
    // Do NOT reset settings. Return the saved values.
    res.json(settings);
  } catch (error) {
    console.error(
      "Get delivery settings error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to get delivery settings",
    });
  }
};

// =====================================================
// UPDATE DELIVERY SETTINGS
// =====================================================

const updateDeliverySettings = async (req, res) => {
  try {
    const {
      maxDistanceKm,
      isEnabled,
      vehicles,
    } = req.body;

    let settings = await DeliverySettings.findOne();

    // -------------------------------------------------
    // CREATE SETTINGS IF MISSING
    // -------------------------------------------------

    if (!settings) {
      settings = new DeliverySettings({
        vehicles: getDefaultVehicles(),
        maxDistanceKm: 50,
        isEnabled: true,
      });
    }

    // -------------------------------------------------
    // UPDATE MAXIMUM DELIVERY DISTANCE
    // -------------------------------------------------

    if (maxDistanceKm !== undefined) {
      const distance = Number(maxDistanceKm);

      if (
        !Number.isFinite(distance) ||
        distance <= 0
      ) {
        return res.status(400).json({
          message:
            "Maximum delivery distance must be greater than 0.",
        });
      }

      settings.maxDistanceKm = distance;
    }

    // -------------------------------------------------
    // ENABLE / DISABLE HOME DELIVERY
    // -------------------------------------------------

    if (isEnabled !== undefined) {
      settings.isEnabled = Boolean(isEnabled);
    }

    // -------------------------------------------------
    // UPDATE VEHICLE SETTINGS
    // -------------------------------------------------

    if (Array.isArray(vehicles)) {
      const updatedVehicles = [];

      for (const vehicle of vehicles) {
        // ---------------------------------------------
        // VALIDATE VEHICLE TYPE
        // ---------------------------------------------

        if (
          vehicle.type !== "bike" &&
          vehicle.type !== "four_wheeler"
        ) {
          return res.status(400).json({
            message:
              "Invalid vehicle type.",
          });
        }

        // ---------------------------------------------
        // VALIDATE RATE
        // ---------------------------------------------

        const rate = Number(
          vehicle.ratePerKm
        );

        if (
          !Number.isFinite(rate) ||
          rate < 0
        ) {
          return res.status(400).json({
            message:
              `${vehicle.label || "Vehicle"} rate per km must be 0 or greater.`,
          });
        }

        // ---------------------------------------------
        // VALIDATE MAX WEIGHT
        // ---------------------------------------------

        const maxWeight = Number(
          vehicle.maxWeightKg
        );

        if (
          !Number.isFinite(maxWeight) ||
          maxWeight <= 0
        ) {
          return res.status(400).json({
            message:
              `${vehicle.label || "Vehicle"} maximum weight must be greater than 0.`,
          });
        }

        // ---------------------------------------------
        // SAVE VEHICLE
        // ---------------------------------------------

        updatedVehicles.push({
          type: vehicle.type,

          label:
            vehicle.type === "bike"
              ? "2-Wheeler"
              : "4-Wheeler",

          maxWeightKg: maxWeight,

          ratePerKm: rate,

          enabled:
            vehicle.enabled !== false,
        });
      }

      settings.vehicles = updatedVehicles;
    }

    // -------------------------------------------------
    // SAVE TO MONGODB
    // -------------------------------------------------

    await settings.save();

    // -------------------------------------------------
    // RETURN SAVED SETTINGS
    // -------------------------------------------------

    res.json({
      message:
        "Delivery settings updated successfully",

      settings,
    });
  } catch (error) {
    console.error(
      "Update delivery settings error:",
      error
    );

    res.status(400).json({
      message:
        error.message ||
        "Failed to update delivery settings",
    });
  }
};

// =====================================================
// CALCULATE DELIVERY
// =====================================================

const calculateDelivery = async (req, res) => {
  try {
    const {
      address,
      city,
      pincode,
      latitude,
      longitude,
      totalWeightKg,
    } = req.body;

    // -------------------------------------------------
    // VALIDATE ADDRESS
    // -------------------------------------------------

    if (
      !address ||
      !city ||
      !pincode
    ) {
      return res.status(400).json({
        message:
          "Address, city and pincode are required.",
      });
    }

    // -------------------------------------------------
    // VALIDATE EXACT LOCATION
    // -------------------------------------------------

    const customerLatitude = Number(latitude);
    const customerLongitude = Number(longitude);

    if (
      !Number.isFinite(customerLatitude) ||
      !Number.isFinite(customerLongitude)
    ) {
      return res.status(400).json({
        message:
          "Please select and confirm your exact delivery location.",
      });
    }

    if (
      customerLatitude < -90 ||
      customerLatitude > 90
    ) {
      return res.status(400).json({
        message:
          "Invalid delivery latitude.",
      });
    }

    if (
      customerLongitude < -180 ||
      customerLongitude > 180
    ) {
      return res.status(400).json({
        message:
          "Invalid delivery longitude.",
      });
    }

    // -------------------------------------------------
    // VALIDATE ORDER WEIGHT
    // -------------------------------------------------

    const weight = Number(
      totalWeightKg
    );

    if (
      !Number.isFinite(weight) ||
      weight <= 0
    ) {
      return res.status(400).json({
        message:
          "A valid total order weight is required.",
      });
    }

    // -------------------------------------------------
    // CALCULATE DELIVERY USING EXACT COORDINATES
    // -------------------------------------------------

    const result =
      await calculateDeliveryCharge({
        address: address.trim(),

        city: city.trim(),

        pincode: pincode.trim(),

        latitude: customerLatitude,

        longitude: customerLongitude,

        totalWeightKg: weight,
      });

    // -------------------------------------------------
    // SEND RESULT
    // -------------------------------------------------

    res.json(result);
  } catch (error) {
    console.error(
      "Calculate delivery error:",
      error
    );

    res.status(400).json({
      message:
        error.message ||
        "Unable to calculate delivery charge.",
    });
  }
};
// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getDeliverySettings,
  updateDeliverySettings,
  calculateDelivery,
};