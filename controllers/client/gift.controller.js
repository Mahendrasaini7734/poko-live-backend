const Gift = require("../../models/gift.model");
const GiftCategory = require("../../models/giftCategory.model");
const { getMediaUrl, getMediaUrls } = require("../../util/media");

//get gifts grouped by category
exports.fetchGiftList = async (req, res) => {
  try {
    const { giftCategoryId } = req.query;

    if (!giftCategoryId) {
      return res.status(200).json({
        status: false,
        message: "giftCategoryId query param is required.",
      });
    }

    const giftCategory = await GiftCategory.findById(giftCategoryId).lean();

    if (!giftCategory) {
      return res.status(200).json({
        status: false,
        message: "Gift category not found.",
      });
    }

    const gifts = await Gift.find({
      giftCategoryId,
      isDelete: false,
    })
      .select("_id type coin imageUrl imageKey svgaImageUrl svgaImageKey")
      .sort({ createdAt: -1 })
      .lean();

    const formattedGifts = gifts.map((gift) => ({
      _id: gift._id,
      type: gift.type,
      coin: gift.coin,

      image: {
        key: gift.imageKey || "",
        url: gift.imageKey
          ? getMediaUrl(gift.imageKey)
          : gift.imageUrl || "",
      },

      svgaImage: {
        key: gift.svgaImageKey || "",
        url: gift.svgaImageKey
          ? getMediaUrl(gift.svgaImageKey)
          : gift.svgaImageUrl || "",
      },
    }));

    return res.status(200).json({
      status: true,
      message: "Gift list retrieved successfully.",
      data: formattedGifts,
    });
    

  } catch (error) {
    console.error("fetchGiftList error:", error);

    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};


