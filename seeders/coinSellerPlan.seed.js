require("dotenv").config();
const mongoose = require("mongoose");
const CoinSeller = require("../models/coinSeller.model");
const CoinSellerPlan = require("../models/coinSellerPlan.model");

const MONGO_URI = process.env.MONGO_URI;

const sellerPlans = [
  {
    uniqueId: "ZGSELLER001",
    plans: [
      { amount: 99, coins: 250, sortOrder: 1 },
      { amount: 199, coins: 550, sortOrder: 2 },
      { amount: 499, coins: 1300, sortOrder: 3 },
      { amount: 999, coins: 2800, sortOrder: 4 },
      { amount: 1499, coins: 4200, sortOrder: 5 },
      { amount: 1999, coins: 5800, sortOrder: 6 },
      { amount: 2499, coins: 7500, sortOrder: 7 },
      { amount: 2999, coins: 9000, sortOrder: 8 },
      { amount: 4999, coins: 16000, sortOrder: 9 },
      { amount: 9999, coins: 34000, sortOrder: 10 },
    ],
  },
  {
    uniqueId: "ZGSELLER002",
    plans: [
      { amount: 99, coins: 270, sortOrder: 1 },
      { amount: 199, coins: 600, sortOrder: 2 },
      { amount: 499, coins: 1400, sortOrder: 3 },
      { amount: 999, coins: 3000, sortOrder: 4 },
      { amount: 1499, coins: 4500, sortOrder: 5 },
      { amount: 1999, coins: 6200, sortOrder: 6 },
      { amount: 2499, coins: 8000, sortOrder: 7 },
      { amount: 2999, coins: 9800, sortOrder: 8 },
      { amount: 4999, coins: 17200, sortOrder: 9 },
      { amount: 9999, coins: 36000, sortOrder: 10 },
    ],
  },
];

const seedCoinSellerPlans = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected");

    for (const sellerData of sellerPlans) {
      const seller = await CoinSeller.findOne({
        uniqueId: sellerData.uniqueId,
      });

      if (!seller) {
        console.log(
          `Seller not found => ${sellerData.uniqueId}`
        );
        continue;
      }

      for (const plan of sellerData.plans) {
        const savedPlan =
          await CoinSellerPlan.findOneAndUpdate(
            {
              sellerId: seller._id,
              amount: plan.amount,
            },
            {
              $set: {
                sellerId: seller._id,
                amount: plan.amount,
                coins: plan.coins,
                isActive: true,
                sortOrder: plan.sortOrder,
              },
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true,
            }
          );

        console.log(
          `Plan ready => ${seller.name} | ₹${savedPlan.amount} → ${savedPlan.coins} Coins`
        );
      }
    }

    console.log(
      "Coin seller plans seed completed"
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(
      "Coin seller plan seed error =>",
      error
    );

    await mongoose.disconnect();
    process.exit(1);
  }
};

seedCoinSellerPlans();