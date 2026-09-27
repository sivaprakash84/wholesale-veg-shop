const Order = require("../models/Order");
const Product = require("../models/Product");

const {
  calculateDeliveryCharge,
} = require("../services/deliveryDistanceService");

const {
  sendOrderConfirmationEmail,
} = require("../services/emailService");

// =====================================================
// CREATE A NEW ORDER - CUSTOMER
// =====================================================

const createOrder = async (req, res) => {
  try {
    const {
      customer,
      delivery,
      items,
      paymentMethod,
      deliveryMethod,
    } = req.body;

    // =================================================
    // CHECK CUSTOMER AUTHENTICATION
    // =================================================

    if (!req.customer || !req.customer.uid) {
      return res.status(401).json({
        message:
          "Customer authentication is required",
      });
    }

    // =================================================
    // VALIDATE CUSTOMER DETAILS
    // =================================================

    if (!customer) {
      return res.status(400).json({
        message:
          "Customer object is missing",
      });
    }

    if (!customer.name) {
      return res.status(400).json({
        message:
          "Customer name is required",
      });
    }

    if (!customer.phone) {
      return res.status(400).json({
        message:
          "Customer phone is required",
      });
    }

    if (!customer.email) {
      return res.status(400).json({
        message:
          "Customer email is required",
      });
    }

    // =================================================
    // DETERMINE DELIVERY METHOD
    // =================================================

    const selectedDeliveryMethod =
      deliveryMethod ||
      delivery?.deliveryMethod ||
      delivery?.method ||
      "delivery";

    const allowedDeliveryMethods = [
      "delivery",
      "pickup",
    ];

    if (
      !allowedDeliveryMethods.includes(
        selectedDeliveryMethod
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid delivery method",
      });
    }

    // =================================================
    // VALIDATE ADDRESS ONLY FOR HOME DELIVERY
    // =================================================

    const deliveryAddress =
      delivery?.address ||
      customer.address ||
      "";

    const deliveryCity =
      delivery?.city ||
      customer.city ||
      "";

    const deliveryPincode =
      delivery?.pincode ||
      customer.pincode ||
      "";

      const deliveryLatitude =
  Number(delivery?.location?.latitude);

const deliveryLongitude =
  Number(delivery?.location?.longitude);

   if (
  selectedDeliveryMethod ===
  "delivery"
) {
  if (!deliveryAddress) {
    return res.status(400).json({
      message:
        "Delivery address is required for home delivery",
    });
  }

  if (!deliveryCity) {
    return res.status(400).json({
      message:
        "Delivery city is required for home delivery",
    });
  }

  if (!deliveryPincode) {
    return res.status(400).json({
      message:
        "Delivery pincode is required for home delivery",
    });
  }

  // -------------------------------------------------
  // EXACT CUSTOMER LOCATION
  // -------------------------------------------------

  if (
    !Number.isFinite(deliveryLatitude) ||
    !Number.isFinite(deliveryLongitude)
  ) {
    return res.status(400).json({
      message:
        "Please select and confirm your exact delivery location.",
    });
  }

  if (
    deliveryLatitude < -90 ||
    deliveryLatitude > 90
  ) {
    return res.status(400).json({
      message:
        "Invalid delivery latitude.",
    });
  }

  if (
    deliveryLongitude < -180 ||
    deliveryLongitude > 180
  ) {
    return res.status(400).json({
      message:
        "Invalid delivery longitude.",
    });
  }
}

    // =================================================
    // VALIDATE ITEMS
    // =================================================

    if (
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message:
          "Order must contain at least one product",
      });
    }

    // =================================================
    // SERVER-SIDE ORDER CALCULATION
    // =================================================

    const orderItems = [];

    let calculatedSubtotal = 0;
    let calculatedTotalWeightKg = 0;
    let calculatedTotalUnits = 0;

    // =================================================
    // CHECK PRODUCTS + STOCK + PRICE
    // =================================================

    for (const item of items) {
      // -----------------------------------------------
      // PRODUCT ID
      // -----------------------------------------------

      if (!item.productId) {
        return res.status(400).json({
          message:
            "Product ID is required",
        });
      }

      // -----------------------------------------------
      // QUANTITY
      // -----------------------------------------------

      const quantity =
        Number(item.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          message:
            "Product quantity must be a valid whole number",
        });
      }

      // -----------------------------------------------
      // GET PRODUCT FROM DATABASE
      // -----------------------------------------------

      const product =
        await Product.findById(
          item.productId
        );

      if (!product) {
        return res.status(404).json({
          message:
            "One of the selected products is no longer available",
        });
      }

      // -----------------------------------------------
      // PRODUCT AVAILABILITY
      // -----------------------------------------------

      if (!product.isAvailable) {
        return res.status(400).json({
          message:
            `${product.name} is currently unavailable`,
        });
      }

      // -----------------------------------------------
      // STOCK CHECK
      // -----------------------------------------------

      if (
        Number(product.stock) <
        quantity
      ) {
        return res.status(400).json({
          message:
            `Only ${product.stock} ${getUnitLabel(product.unit)} of ${product.name} is available`,
        });
      }

      // -----------------------------------------------
      // USE DATABASE PRICE
      // -----------------------------------------------

      const price =
        Number(product.price);

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        return res.status(400).json({
          message:
            `Invalid price configured for ${product.name}`,
        });
      }

      // -----------------------------------------------
      // WEIGHT PER SELLING UNIT
      // -----------------------------------------------

      const weightPerUnitKg =
        Number(
          product.weightPerUnitKg || 1
        );

      if (
        !Number.isFinite(
          weightPerUnitKg
        ) ||
        weightPerUnitKg <= 0
      ) {
        return res.status(400).json({
          message:
            `Invalid weight configuration for ${product.name}`,
        });
      }

      // -----------------------------------------------
      // CALCULATE ITEM TOTAL
      // -----------------------------------------------

      const itemTotal =
        price * quantity;

      const itemTotalWeightKg =
        weightPerUnitKg *
        quantity;

      // -----------------------------------------------
      // ADD TO SERVER-SIDE TOTALS
      // -----------------------------------------------

      calculatedSubtotal +=
        itemTotal;

      calculatedTotalWeightKg +=
        itemTotalWeightKg;

      calculatedTotalUnits +=
        quantity;

      // -----------------------------------------------
// CREATE AUTHORITATIVE ORDER ITEM
// -----------------------------------------------

orderItems.push({
  productId:
    product._id,

  name:
    product.name,

  nameTa:
    product.nameTa || product.name,

  price:
    price,

  unit:
    product.unit,

  quantity:
    quantity,

  weightPerUnitKg:
    weightPerUnitKg,

  totalWeightKg:
    itemTotalWeightKg,

  total:
    itemTotal,
});
    }

    // =================================================
    // ROUND SUBTOTAL
    // =================================================

    calculatedSubtotal =
      Number(
        calculatedSubtotal.toFixed(2)
      );

    calculatedTotalWeightKg =
      Number(
        calculatedTotalWeightKg.toFixed(2)
      );

    // =================================================
    // CALCULATE DELIVERY CHARGE
    // =================================================

    let calculatedDeliveryCharge = 0;
    let calculatedDeliveryDistance = 0;
    let calculatedVehicle = null;

    // -------------------------------------------------
    // HOME DELIVERY
    // -------------------------------------------------

    if (
      selectedDeliveryMethod ===
      "delivery"
    ) {
      const deliveryResult =
  await calculateDeliveryCharge({
    address:
      deliveryAddress.trim(),

    city:
      deliveryCity.trim(),

    pincode:
      deliveryPincode.trim(),

    latitude:
      deliveryLatitude,

    longitude:
      deliveryLongitude,

    totalWeightKg:
      calculatedTotalWeightKg,
  });

      calculatedDeliveryCharge =
        Number(
          deliveryResult.deliveryCharge
        );

      calculatedDeliveryDistance =
        Number(
          deliveryResult.distanceKm || 0
        );

      calculatedVehicle =
        deliveryResult.vehicle || null;
    }

    // -------------------------------------------------
    // SELF PICKUP
    // -------------------------------------------------

    if (
      selectedDeliveryMethod ===
      "pickup"
    ) {
      calculatedDeliveryCharge = 0;
      calculatedDeliveryDistance = 0;
      calculatedVehicle = null;
    }

    // =================================================
    // FINAL SERVER-SIDE TOTAL
    // =================================================

    const calculatedTotal =
      Number(
        (
          calculatedSubtotal +
          calculatedDeliveryCharge
        ).toFixed(2)
      );

    // =================================================
    // CREATE UNIQUE ORDER ID
    // =================================================

    const generatedOrderId =
      "VEG" +
      Date.now()
        .toString()
        .slice(-8);

    // =================================================
    // CREATE DELIVERY OBJECT
    // =================================================

   const finalDelivery = {
  ...(delivery || {}),

  deliveryMethod:
    selectedDeliveryMethod,

  address:
    selectedDeliveryMethod ===
    "delivery"
      ? deliveryAddress
      : "",

  city:
    selectedDeliveryMethod ===
    "delivery"
      ? deliveryCity
      : "",

  pincode:
    selectedDeliveryMethod ===
    "delivery"
      ? deliveryPincode
      : "",

  distanceKm:
    calculatedDeliveryDistance,

  vehicle:
    calculatedVehicle,

  location:
    selectedDeliveryMethod ===
    "delivery"
      ? {
          latitude:
            deliveryLatitude,

          longitude:
            deliveryLongitude,

          formattedAddress:
            delivery?.location
              ?.formattedAddress ||
            deliveryAddress,
        }
      : {
          latitude: null,
          longitude: null,
          formattedAddress: "",
        },
};

    // =================================================
    // CREATE ORDER
    // =================================================

    const order = await Order.create({
      orderId:
        generatedOrderId,

      // Firebase customer UID
      customerUid:
        req.customer.uid,

      customer,

      delivery:
        finalDelivery,

      deliveryMethod:
        selectedDeliveryMethod,

      items:
        orderItems,

      subtotal:
        calculatedSubtotal,

      totalWeightKg:
        calculatedTotalWeightKg,

      totalUnits:
        calculatedTotalUnits,

      deliveryDistance:
        calculatedDeliveryDistance,

      deliveryCharge:
        calculatedDeliveryCharge,

      total:
        calculatedTotal,

      paymentMethod:
        paymentMethod ||
        "Not Selected",

      orderStatus:
        "Pending",

      paymentStatus:
        "Pending",

      orderedAt:
        new Date(),
    });

    // =================================================
    // REDUCE PRODUCT STOCK
    // =================================================

    for (const item of orderItems) {
      const updatedProduct =
        await Product.findOneAndUpdate(
          {
            _id: item.productId,

            // Make sure stock is still sufficient
            stock: {
              $gte: item.quantity,
            },
          },
          {
            $inc: {
              stock:
                -item.quantity,
            },
          },
          {
            new: true,
          }
        );

      if (!updatedProduct) {
        /*
         * Stock changed between the first
         * validation and stock reduction.
         */

        await Order.findOneAndDelete({
          orderId:
            generatedOrderId,
        });

        return res.status(409).json({
          message:
            `${item.name} stock changed while placing the order. Please try again.`,
        });
      }
    }

    // =================================================
    // SEND ORDER CONFIRMATION EMAIL
    // =================================================

    try {
      await sendOrderConfirmationEmail(
        order
      );

      console.log(
        "Order confirmation email sent successfully."
      );
    } catch (emailError) {
      console.error(
        "Order confirmation email failed:",
        emailError.message
      );
    }

    // =================================================
    // SUCCESS RESPONSE
    // =================================================

    res.status(201).json({
      message:
        "Order placed successfully",

      order,
    });

  } catch (error) {
    console.error(
      "Create Order Error:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to place order",
    });
  }
};


// =====================================================
// GET ALL ORDERS - ADMIN
// =====================================================

const getOrders = async (req, res) => {
  try {
    const orders =
      await Order.find().sort({
        createdAt: -1,
      });

    res.status(200).json(
      orders
    );
  } catch (error) {
    console.error(
      "Get Orders Error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch orders",
      error:
        error.message,
    });
  }
};


// =====================================================
// GET LOGGED-IN CUSTOMER ORDERS
// =====================================================

const getCustomerOrders =
  async (req, res) => {
    try {
      if (
        !req.customer ||
        !req.customer.uid
      ) {
        return res.status(401).json({
          message:
            "Customer authentication is required",
        });
      }

      const orders =
        await Order.find({
          customerUid:
            req.customer.uid,
        }).sort({
          createdAt: -1,
        });

      res.status(200).json(
        orders
      );
    } catch (error) {
      console.error(
        "Get Customer Orders Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch customer orders",
        error:
          error.message,
      });
    }
  };


// =====================================================
// GET ONE CUSTOMER ORDER
// =====================================================

const getCustomerOrderById =
  async (req, res) => {
    try {
      if (
        !req.customer ||
        !req.customer.uid
      ) {
        return res.status(401).json({
          message:
            "Customer authentication is required",
        });
      }

      const order =
        await Order.findOne({
          orderId:
            req.params.orderId,

          customerUid:
            req.customer.uid,
        });

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      res.status(200).json(
        order
      );
    } catch (error) {
      console.error(
        "Get Customer Order By ID Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch order",
        error:
          error.message,
      });
    }
  };


// =====================================================
// GET ONE ORDER - ADMIN
// =====================================================

const getOrderById =
  async (req, res) => {
    try {
      const order =
        await Order.findOne({
          orderId:
            req.params.orderId,
        });

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      res.status(200).json(
        order
      );
    } catch (error) {
      console.error(
        "Get Order By ID Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch order",
        error:
          error.message,
      });
    }
  };


// =====================================================
// UPDATE ORDER STATUS - ADMIN
// =====================================================

const updateOrderStatus =
  async (req, res) => {
    try {
      const {
        orderStatus,
      } = req.body;

      const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ];

      if (
        !allowedStatuses.includes(
          orderStatus
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid order status",
        });
      }

      const order =
        await Order.findOneAndUpdate(
          {
            orderId:
              req.params.orderId,
          },
          {
            orderStatus,
          },
          {
            new: true,
          }
        );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      res.status(200).json({
        message:
          "Order status updated",

        order,
      });
    } catch (error) {
      console.error(
        "Update Order Status Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update order status",
        error:
          error.message,
      });
    }
  };


// =====================================================
// VERIFY PAYMENT - ADMIN
// =====================================================

const updatePaymentStatus =
  async (req, res) => {
    try {
      const {
        paymentStatus,
      } = req.body;

      const allowedStatuses = [
        "Paid",
        "Failed",
      ];

      if (
        !allowedStatuses.includes(
          paymentStatus
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid payment status",
        });
      }

      const order =
        await Order.findOne({
          orderId:
            req.params.orderId,
        });

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      order.paymentStatus =
        paymentStatus;

      if (
        paymentStatus === "Paid"
      ) {
        order.orderStatus =
          "Confirmed";
      }

      if (
        paymentStatus === "Failed"
      ) {
        order.paymentStatus =
          "Failed";
      }

      await order.save();

      res.status(200).json({
        message:
          paymentStatus === "Paid"
            ? "Payment approved successfully"
            : "Payment rejected successfully",

        order,
      });

    } catch (error) {
      console.error(
        "Update Payment Status Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update payment status",
        error:
          error.message,
      });
    }
  };


// =====================================================
// EXPORT FUNCTIONS
// =====================================================

module.exports = {
  createOrder,
  getOrders,
  getCustomerOrders,
  getCustomerOrderById,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
};