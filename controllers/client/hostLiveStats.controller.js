const Host = require("../../models/host.model");
const { getHostLiveStats } = require("../../services/hostLiveStats.service");

//host's own live performance (sessions + cumulative duration)
exports.getMyLiveStats = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Unauthorized" });

    const host = await Host.findOne({ userId }).select("_id").lean();
    if (!host) return res.status(403).json({ status: false, message: "Only hosts have live statistics." });

    const data = await getHostLiveStats(host._id);
    return res.status(200).json({ status: true, message: "Success", data });
  } catch (err) {
    console.error("getMyLiveStats error:", err.message);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
