const Host = require("../../models/host.model");
const { success, error } = require("../../util/response");
const dailyTaskService = require("../../services/dailyTask.service");

// GET /api/client/host/daily-task
exports.getDailyTask = async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return error(res, "Unauthorized", 401);

    // host is derived from the authenticated user - never from the client
    const host = await Host.findOne({ userId }).select("_id isBlock status").lean();

    if (!host) return error(res, "Host not found", 404);

    // data isolation: a hostId sent by the client is never used, and a foreign one is refused
    const requested = req.query && req.query.hostId;
    if (requested && String(requested) !== String(host._id)) {
      return error(res, "You cannot access another host's daily task.", 403);
    }
    if (host.isBlock) return error(res, "You are blocked by the admin.", 403);
    if (host.status !== 2) return error(res, "Host is not active", 403);

    const { payload } = await dailyTaskService.refreshHostDailyTask(host._id);

    return success(
      res,
      {
        // owner of this state: Flutter discards an answer that is not for the logged-in host
        hostId: payload.hostId,
        task: {
          type: payload.taskType,
          targetMinutes: payload.targetMinutes,
          rewardCoins: payload.rewardCoins,
        },
        progress: {
          completedMinutes: payload.completedMinutes,
          remainingMinutes: payload.remainingMinutes,
          percentage: payload.percentage,
          totalSeconds: payload.totalSeconds,
        },
        status: payload.status,
        rewardClaimed: payload.rewardClaimed,
        rewardClaimedAt: payload.rewardClaimedAt,
        taskDate: payload.taskDate,
        isLive: payload.isLive,
        timezone: payload.timezone,
        serverTime: payload.serverTime,
        nextResetAt: payload.nextResetAt,
      },
      "Daily task fetched successfully"
    );
  } catch (err) {
    console.error("getDailyTask error:", err);
    if (err && err.code === "INVALID_TASK_CONFIG") return error(res, "Daily task is not available", 503);
    return error(res, "Unable to fetch daily task", 500);
  }
};
