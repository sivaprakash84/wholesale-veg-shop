const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    nameTa: {
  type: String,
  default: "",
},

    price: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

     weightPerUnitKg: {
  type: Number,
  default: 1,
},

totalWeightKg: {
  type: Number,
  default: 0,
},

    total: {
      type: Number,
      required: true,
    },

   

  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    customerUid: {
  type: String,
  required: true,
  index: true
},

    customer: {
      name: {
        type: String,
        required: true,
      },

      phone: {
        type: String,
        required: true,
      },

      email: {
        type: String,
        required: true,
      },

      shopName: {
        type: String,
        default: "",
      },

     address: {
  type: String,
  default: "",
},

city: {
  type: String,
  default: "",
},

pincode: {
  type: String,
  default: "",
},
    },

    delivery: {
  date: {
    type: String,
    default: "",
  },

  time: {
    type: String,
    default: "",
  },

  instructions: {
    type: String,
    default: "",
  },

  location: {
    latitude: {
      type: Number,
      default: null,
      min: -90,
      max: 90,
    },

    longitude: {
      type: Number,
      default: null,
      min: -180,
      max: 180,
    },

    formattedAddress: {
      type: String,
      default: "",
    },
  },

  distanceKm: {
    type: Number,
    default: 0,
  },
},

    items: {
      type: [orderItemSchema],
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
    },

    deliveryCharge: {
      type: Number,
      required: true,
    },

    deliveryMethod: {
  type: String,
  enum: ["delivery", "pickup"],
  default: "delivery",
},

    total: {
      type: Number,
      required: true,
    },

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Failed",
      ],
      default: "Pending",
    },

    paymentMethod: {
      type: String,
      enum: [
        "UPI",
        "Cash on Delivery",
        "Not Selected",
      ],
      default: "Not Selected",
    },

    paymentScreenshot: {
  type: String,
  default: "",
},

paymentSubmittedAt: {
  type: Date,
  default: null,
},



    orderedAt: {
      type: Date,
      default: Date.now,
    },

    totalWeightKg: {
  type: Number,
  default: 0,
},

totalUnits: {
  type: Number,
  default: 0,
},

deliveryDistance: {
  type: Number,
  default: 0,
},

  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model(
  "Order",
  orderSchema
);

module.exports = Order;