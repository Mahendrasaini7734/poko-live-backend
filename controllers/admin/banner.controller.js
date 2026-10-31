const Banner = require("../../models/banner.model");

/**
 * ADD BANNER
 */
exports.addBanner = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    if (!req.file) {
      return res.status(400).json({ message: "Image required" });
    }

    // const banner = await Banner.create({
    //   name: req.body.name,
    //   link: req.body.link,
    //   Image: req.file.location, // ✅ S3 URL
    // });

    // res.status(201).json({
    //   success: true,
    //   data: banner,
    // });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET ALL
 */
exports.getBanners = async (req, res) => {
  const data = await Banner.find().sort({ createdAt: -1 });
  res.json({ success: true, data });
};

/**
 * UPDATE
 */
exports.updateBanner = async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) return res.status(404).json({ message: "Not found" });

  if (req.body.name) banner.name = req.body.name;
  if (req.body.link) banner.link = req.body.link;
  if (req.file) banner.Image = req.file.location;

  await banner.save();
  res.json({ success: true, data: banner });
};

/**
 * DELETE
 */
exports.deleteBanner = async (req, res) => {
  await Banner.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
