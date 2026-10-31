const Gift = require("../../models/gift.model");
const GiftCategory = require("../../models/giftCategory.model");
const { deleteFromS3 } = require("../../util/s3Service");
const { getMediaUrl, getMediaUrls } = require("../../util/media");


// ================= CREATE GIFT =================
exports.addGift = async (req, res) => {
  try {
    const { type, giftCategoryId, coin } = req.body;

    if (!type || !giftCategoryId || !coin) {

      return res.status(400).json({
        status: false,
        message: "Invalid details",
      });
    }

    const giftCategory = await GiftCategory.findById(giftCategoryId).select(
      "_id name"
    );

    if (!giftCategory) {
      return res.status(404).json({
        status: false,
        message: "Gift category not found",
      });
    }

    const giftData = {
      type,
      giftCategoryId,
      coin,

      imageUrl: req.files?.image?.[0]?.location || "",
      imageKey: req.files?.image?.[0]?.key || "",

      svgaImageUrl:
        type == 3 && req.files?.svgaImage
          ? req.files.svgaImage[0].location
          : "",

      svgaImageKey:
        type == 3 && req.files?.svgaImage
          ? req.files.svgaImage[0].key
          : "",
    };

    const gift = await Gift.create(giftData);
    const responseGift = gift.toObject();

    responseGift.imageUrl = getMediaUrl(responseGift.imageKey);

    if (responseGift.svgaImageKey) {
      responseGift.svgaImageUrl = getMediaUrl(responseGift.svgaImageKey);
    }

    return res.status(201).json({
      status: true,
      message: "Gift created successfully",
      data: {
        ...responseGift,
        giftCategory,
      },
    });
  } catch (error) {
    console.error("Add Gift Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};


// ================= UPDATE GIFT =================
exports.modifyGift = async (req, res) => {
  try {
    const { giftId } = req.query;
    const { type, coin, giftCategoryId } = req.body;

    if (!giftId) {
      return res.status(400).json({
        status: false,
        message: "giftId is required",
      });
    }

    const gift = await Gift.findById(giftId);
    if (!gift) {
      return res.status(404).json({
        status: false,
        message: "Gift not found",
      });
    }

    if (giftCategoryId) {
      const category = await GiftCategory.findById(giftCategoryId);
      if (!category) {
        return res.status(404).json({
          status: false,
          message: "Gift category not found",
        });
      }
      gift.giftCategoryId = giftCategoryId;
    }

    if (type) gift.type = type;
    if (coin) gift.coin = coin;

    // ========= IMAGE UPDATE =========
    if (req.files?.image) {
      const oldImageKey = gift.imageKey;

      gift.imageUrl = req.files.image[0].location;
      gift.imageKey = req.files.image[0].key;

      await gift.save();

      if (oldImageKey) {
        try {
          await deleteFromS3(oldImageKey);
        } catch (err) {
          console.error("Failed to delete old gift image:", err.message);
        }
      }
    }

    // ========= SVGA UPDATE =========
    if (type == 3 && req.files?.svgaImage) {
      const oldSvgaKey = gift.svgaImageKey;

      gift.svgaImageUrl = req.files.svgaImage[0].location;
      gift.svgaImageKey = req.files.svgaImage[0].key;

      await gift.save();

      if (oldSvgaKey) {
        try {
          await deleteFromS3(oldSvgaKey);
        } catch (err) {
          console.error("Failed to delete old svga image:", err.message);
        }
      }
    }

    await gift.save();

    return res.status(200).json({
      status: true,
      message: "Gift updated successfully",
      data: gift,
    });
  } catch (error) {
    console.error("Modify Gift Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};


// ================= GET GIFTS =================
// ================= GET GIFTS =================
exports.retrieveGifts = async (req, res) => {
  try {
    const gifts = await Gift.aggregate([
      { $match: { isDelete: false } },

      {
        $lookup: {
          from: "giftcategories",
          localField: "giftCategoryId",
          foreignField: "_id",
          as: "category",
        },
      },

      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: "$giftCategoryId",

          categoryName: {
            $first: "$category.name",
          },

          gifts: {
            $push: {
              _id: "$_id",
              type: "$type",
              coin: "$coin",

              imageKey: "$imageKey",
              imageUrl: "$imageUrl",

              svgaImageKey: "$svgaImageKey",
              svgaImageUrl: "$svgaImageUrl",

              createdAt: "$createdAt",
            },
          },
        },
      },

      {
        $sort: {
          "gifts.createdAt": -1,
        },
      },
    ]);

    // ================= FORMAT CDN URL =================

    const formattedGifts = gifts.map((category) => ({
      ...category,

      gifts: category.gifts.map((gift) => ({
        ...gift,

        imageUrl: gift.imageKey
          ? getMediaUrl(gift.imageKey)
          : "",

        svgaImageUrl: gift.svgaImageKey
          ? getMediaUrl(gift.svgaImageKey)
          : "",
      })),
    }));


    console.error("Retrieve Gifts:", formattedGifts.gift);

    return res.status(200).json({
      status: true,
      message: "Gifts retrieved successfully",
      data: formattedGifts,
    });

  } catch (error) {
    console.error("Retrieve Gifts Error:", error);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};


// ================= DELETE GIFT =================
exports.discardGift = async (req, res) => {
  try {
    const { giftId } = req.query;

    if (!giftId) {
      return res.status(400).json({
        status: false,
        message: "giftId is required",
      });
    }

    const gift = await Gift.findById(giftId);
    if (!gift) {
      return res.status(404).json({
        status: false,
        message: "Gift not found",
      });
    }

    // delete images from S3
    if (gift.imageKey) await deleteFromS3(gift.imageKey);
    if (gift.svgaImageKey) await deleteFromS3(gift.svgaImageKey);

    await gift.deleteOne();

    return res.status(200).json({
      status: true,
      message: "Gift deleted successfully",
    });
  } catch (error) {
    console.error("Delete Gift Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
