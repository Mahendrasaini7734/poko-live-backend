const Host = require("../models/host.model");

/**
 * Authorization gate for feed creation / mutation.
 * Must run AFTER validateUserToken. A normal user (no Host document) is rejected
 * server-side, regardless of what the Flutter UI shows.
 */
module.exports = async function requireHost(req, res, next) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    }

    const host = await Host.findOne({ userId }).select("_id isBlock").lean();

    if (!host) {
      return res.status(403).json({
        status: false,
        message: "Only hosts can create or manage feeds",
      });
    }

    if (host.isBlock) {
      return res.status(403).json({ status: false, message: "Host account is blocked" });
    }

    req.host = { _id: host._id };
    return next();
  } catch (err) {
    console.error("REQUIRE HOST ERROR =>", err.message);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
