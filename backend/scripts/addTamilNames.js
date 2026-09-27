const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Product = require("../models/Product");

dotenv.config();

const tamilNames = {
  Brinjal: "கத்திரிக்காய்",
  Cabbage: "முட்டைக்கோஸ்",
  Carrot: "கேரட்",
  Potato: "உருளைக்கிழங்கு",
  Onion: "வெங்காயம்",
  Tomato: "தக்காளி",
};

const updateTamilNames = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    for (const [englishName, tamilName] of Object.entries(tamilNames)) {
      const result = await Product.updateOne(
        { name: englishName },
        {
          $set: {
            nameTa: tamilName,
          },
        }
      );

      console.log(
        `${englishName} → ${tamilName} | Updated: ${result.modifiedCount}`
      );
    }

    console.log("Tamil vegetable names updated successfully.");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Update failed:", error);

    await mongoose.connection.close();
    process.exit(1);
  }
};

updateTamilNames();