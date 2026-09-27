const ShopSettings = require("../models/ShopSettings");

// =====================================
// GET SHOP DETAILS
// =====================================

const getShopSettings = async (req, res) => {
  try {
    let shop = await ShopSettings.findOne();

    if (!shop) {
      shop = await ShopSettings.create({
        shopName: "",
        phone: "",
        address: "",
        city: "",
        pincode: "",
        latitude: null,
        longitude: null,
      });
    }

    res.status(200).json(shop);

  } catch (error) {
    console.error(
      "Get Shop Settings Error:",
      error
    );

    res.status(500).json({
      message: "Failed to get shop settings",
      error: error.message,
    });
  }
};

// =====================================
// UPDATE SHOP DETAILS
// =====================================

const updateShopSettings = async (req, res) => {
  try {

    const {
      shopName,
      phone,
      address,
      city,
      pincode,
      latitude,
      longitude,
    } = req.body;

    let shop = await ShopSettings.findOne();

    if (!shop) {
      shop = new ShopSettings();
    }

    shop.shopName = shopName || "";
    shop.phone = phone || "";
    shop.address = address || "";
    shop.city = city || "";
    shop.pincode = pincode || "";

    // Save shop coordinates
    shop.latitude =
      latitude !== null &&
      latitude !== undefined &&
      latitude !== ""
        ? Number(latitude)
        : null;

    shop.longitude =
      longitude !== null &&
      longitude !== undefined &&
      longitude !== ""
        ? Number(longitude)
        : null;

    await shop.save();

    res.status(200).json({
      message: "Shop details updated successfully",
      shop,
    });

  } catch (error) {

    console.error(
      "Update Shop Settings Error:",
      error
    );

    res.status(500).json({
      message: "Failed to update shop settings",
      error: error.message,
    });
  }
};

module.exports = {
  getShopSettings,
  updateShopSettings,
};