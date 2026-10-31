
require("dotenv").config();

const mongoose = require("mongoose");
const PromotionalBanner = require("../models/promotionalBanner.model");

const MONGO_URI = process.env.MONGO_URI;

const promotionalBanners = [
  {
    bannerType: "promotional",
    bannerUrl: "https://www.shutterstock.com/image-vector/brush-sale-banner-promotion-ribbon-260nw-1182942766.jpg",
    link: "https://www.stackearn.com/blog-details/stackearn-%E0%A4%95%E0%A5%8D%E0%A4%AF%E0%A4%BE-%E0%A4%B9%E0%A5%88-%E0%A4%98%E0%A4%B0-%E0%A4%AC%E0%A5%88%E0%A4%A0%E0%A5%87-%E0%A4%B8%E0%A5%80%E0%A4%96%E0%A5%8B-2025-%E0%A4%95%E0%A5%80-%E0%A4%AC%E0%A5%87%E0%A4%B8%E0%A5%8D%E0%A4%9F-%E0%A4%A1%E0%A4%BF%E0%A4%9C%E0%A4%BF%E0%A4%9F%E0%A4%B2-%E0%A4%85%E0%A4%AA%E0%A5%89%E0%A4%B0%E0%A5%8D%E0%A4%9A%E0%A5%8D%E0%A4%AF%E0%A5%81%E0%A4%A8%E0%A4%BF%E0%A4%9F%E0%A5%80",
    isActive: true,
    phone: "+91 7850972904",
    sortOrder: 1,
  },
  {
    bannerType: "promotional",
    bannerUrl: "https://stackearn-image.s3.ap-south-1.amazonaws.com/stackearn/admin/StackEarn+Kya+H.png",
    link: "https://www.stackearn.com/blog-details/stackearn-%E0%A4%95%E0%A5%8D%E0%A4%AF%E0%A4%BE-%E0%A4%B9%E0%A5%88-%E0%A4%98%E0%A4%B0-%E0%A4%AC%E0%A5%88%E0%A4%A0%E0%A5%87-%E0%A4%B8%E0%A5%80%E0%A4%96%E0%A5%8B-2025-%E0%A4%95%E0%A5%80-%E0%A4%AC%E0%A5%87%E0%A4%B8%E0%A5%8D%E0%A4%9F-%E0%A4%A1%E0%A4%BF%E0%A4%9C%E0%A4%BF%E0%A4%9F%E0%A4%B2-%E0%A4%85%E0%A4%AA%E0%A5%89%E0%A4%B0%E0%A5%8D%E0%A4%9A%E0%A5%8D%E0%A4%AF%E0%A5%81%E0%A4%A8%E0%A4%BF%E0%A4%9F%E0%A5%80",
    isActive: true,
    sortOrder: 2,
    phone: "+91 7850972904",
  },
];

const seedPromotionalBanners = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected");

    for (const banner of promotionalBanners) {
      const savedBanner =
        await PromotionalBanner.findOneAndUpdate(
          {
            bannerType: banner.bannerType,
            sortOrder: banner.sortOrder,
          },
          {
            $set: {
              bannerType: banner.bannerType,
              bannerUrl: banner.bannerUrl,
              link: banner.link,
              isActive: banner.isActive,
              sortOrder: banner.sortOrder,
              phone: banner.phone,
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );

      console.log(
        `Banner ready => ${savedBanner._id} | ${savedBanner.bannerUrl}`
      );
    }

    console.log(
      "Promotional banner seed completed"
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(
      "Promotional banner seed error =>",
      error
    );

    await mongoose.disconnect();
    process.exit(1);
  }
};

seedPromotionalBanners();