const PaymentSettings = require("../models/PaymentSettings");
const Order = require("../models/Order");


// =====================================================
// GET PAYMENT SETTINGS
// =====================================================

const getPaymentSettings = async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne();

    if (!settings) {
      settings = await PaymentSettings.create({
        qrImage: "",
        upiId: "",
        paymentName: "",
      });
    }

    res.status(200).json(settings);

  } catch (error) {
    console.error(
      "Get Payment Settings Error:",
      error
    );

    res.status(500).json({
      message: "Failed to get payment settings",
      error: error.message,
    });
  }
};


// =====================================================
// UPDATE PAYMENT SETTINGS - ADMIN
// =====================================================

const updatePaymentSettings = async (req, res) => {
  try {
    const {
      upiId,
      paymentName,
    } = req.body;

    let settings =
      await PaymentSettings.findOne();

    if (!settings) {
      settings = new PaymentSettings();
    }

    if (req.file) {
      settings.qrImage =
        `/uploads/payment/${req.file.filename}`;
    }

    settings.upiId =
      upiId || "";

    settings.paymentName =
      paymentName || "";

    await settings.save();

    res.status(200).json({
      message:
        "Payment settings updated successfully",

      settings,
    });

  } catch (error) {
    console.error(
      "Update Payment Settings Error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update payment settings",

      error: error.message,
    });
  }
};


// =====================================================
// SUBMIT CUSTOMER PAYMENT SCREENSHOT
// =====================================================

const submitPayment = async (req, res) => {
  try {

    // Check customer authentication

    if (
      !req.customer ||
      !req.customer.uid
    ) {
      return res.status(401).json({
        message:
          "Customer authentication is required",
      });
    }


    // Check uploaded screenshot

    if (!req.file) {
      return res.status(400).json({
        message:
          "Payment screenshot is required",
      });
    }


    const {
      orderId,
      amount,
    } = req.body;


    if (!orderId) {
      return res.status(400).json({
        message:
          "Order ID is required",
      });
    }


    // Find only this customer's order

    const order =
      await Order.findOne({
        orderId,
        customerUid:
          req.customer.uid,
      });


    if (!order) {
      return res.status(404).json({
        message:
          "Order not found",
      });
    }


    // Prevent duplicate submission

    if (
      order.paymentStatus === "Paid"
    ) {
      return res.status(400).json({
        message:
          "Payment for this order has already been verified",
      });
    }


    // Save screenshot path

    order.paymentScreenshot =
      `/uploads/payment/${req.file.filename}`;


    order.paymentSubmittedAt =
      new Date();


    // Payment remains pending
    // until admin verifies it

    order.paymentStatus =
      "Pending";


    // Customer paid using QR / UPI

    order.paymentMethod =
      "UPI";


    await order.save();


    res.status(200).json({
      message:
        "Payment submitted successfully",

      orderId:
        order.orderId,

      paymentStatus:
        order.paymentStatus,

      paymentScreenshot:
        order.paymentScreenshot,

      paymentSubmittedAt:
        order.paymentSubmittedAt,
    });

  } catch (error) {

    console.error(
      "Submit Payment Error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to submit payment",

      error: error.message,
    });
  }
};


module.exports = {
  getPaymentSettings,
  updatePaymentSettings,
  submitPayment,
};