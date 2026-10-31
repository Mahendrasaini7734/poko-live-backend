const PromotionalBanner = require("../../models/promotionalBanner.model");

exports.retrievePromotionalBanners = async (req, res) => {
  try {
    const banners = await PromotionalBanner.find({
      bannerType: "promotional",
      isActive: true,
    })
      .select(
        "_id bannerType bannerUrl link phone sortOrder type"
      )
      .sort({
        sortOrder: 1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      status: true,
      message: "Promotional banners retrieved successfully.",
      data: banners,
    });
  } catch (error) {
    console.error(
      "RETRIEVE PROMOTIONAL BANNERS ERROR =>",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};