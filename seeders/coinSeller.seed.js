require("dotenv").config();
const mongoose = require("mongoose");
const CoinSeller = require("../models/coinSeller.model");

const MONGO_URI = process.env.MONGO_URI


const coinSellers = [
  {
    name: "Zigo Official",
    image: "",
    uniqueId: "ZGSELLER001",
    country: "India",
    countryFlagImage: "",
    state: "Rajasthan",
    city: "Jaipur",
    mobileNumber: "+91 7850972904",
    whatsappNumber: "+91 7850972904",
    isOnline: true,
    isActive: true,
    isVerified: true,
    hasFrauds: false,
    fraudCount: 0,
    totalAvailableCoins: 1000000,
    totalPurchasedCoins: 1000000,
    totalSoldCoins: 0,
    totalOrders: 0,
    minPurchase: 99,
    maxPurchase: 9999,
    rating: 5,
    responseTime: "Usually replies within 5 min",
    sortOrder: 100,
  },
  {
    name: "Zigo Recharge",
    image: "",
    uniqueId: "ZGSELLER002",
    country: "India",
    countryFlagImage: "",
    state: "Delhi",
    city: "New Delhi",
    mobileNumber: "+91 7850972904",
    whatsappNumber: "+91 7850972904",
    isOnline: true,
    isActive: true,
    isVerified: true,
    hasFrauds: false,
    fraudCount: 0,
    totalAvailableCoins: 1000000,
    totalPurchasedCoins: 1000000,
    totalSoldCoins: 0,
    totalOrders: 0,
    minPurchase: 99,
    maxPurchase: 9999,
    rating: 5,
    responseTime: "Usually replies within 5 min",
    sortOrder: 120,
  },
];

const seedCoinSellers = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected");

    for (const sellerData of coinSellers) {
      const seller = await CoinSeller.findOneAndUpdate(
        {
          uniqueId: sellerData.uniqueId,
        },
        {
          $set: sellerData,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(
        `Seller ready => ${seller.name} | ${seller._id}`
      );
    }

    console.log("Coin sellers seed completed");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(
      "Coin seller seed error =>",
      error
    );

    await mongoose.disconnect();
    process.exit(1);
  }
};

seedCoinSellers();