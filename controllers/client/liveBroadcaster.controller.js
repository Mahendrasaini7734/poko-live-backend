const LiveBroadcaster = require("../../models/liveBroadcaster.model");

//import model
const Host = require("../../models/host.model");
const LiveBroadcastHistory = require("../../models/liveBroadcastHistory.model");
const User = require("../../models/user.model");
const { getMediaUrl } = require("../../util/media");
//private key
const firebase = require("../../util/privateKey");

//momemt
const moment = require("moment-timezone");

//mongoose
const mongoose = require("mongoose");

//RtcTokenBuilder
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

//live host - explicit END over HTTP (fallback when the socket is down; idempotent)
exports.HostStreamingEnd = async (req, res) => {
  try {
    const { hostId, liveHistoryId } = req.query;

    if (
      !hostId ||
      !liveHistoryId ||
      !mongoose.Types.ObjectId.isValid(hostId) ||
      !mongoose.Types.ObjectId.isValid(liveHistoryId)
    ) {
      return res.status(200).json({ status: false, message: "Invalid request parameters." });
    }

    const result = await require("../../services/liveSession.service").finalizeLiveSession({
      hostId,
      historyId: liveHistoryId,
      reason: "http-end",
    });

    if (result.notFound || result.notOwner) {
      return res.status(200).json({ status: false, message: "Live session not found." });
    }

    // finalizeLiveSession already told the whole room (liveStreamEnd with reason + endedAt) and emptied it

    return res.status(200).json({
      status: true,
      message: result.finalized ? "Live ended successfully." : "Live already ended.",
    });
  } catch (error) {
    console.error("HostStreamingEnd ERROR =>", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//live status - is this live still running? (old notification tap / list tap / app resume)
//GET /api/client/liveBroadcaster/LiveStatus?liveHistoryId=&hostId=
exports.LiveStatus = async (req, res) => {
  try {
    const { liveHistoryId, hostId } = req.query;
    const liveRoom = require("../../services/liveRoom.service");

    if (liveHistoryId && mongoose.Types.ObjectId.isValid(liveHistoryId)) {
      const state = await liveRoom.getLiveState(liveHistoryId);
      if (state.isLive) {
        return res.status(200).json({ status: true, isLive: true, message: "Live is running.", data: state });
      }
    }

    // the requested live is over: tell the app, and (if the host started a NEW live) which one
    let currentLive = null;
    if (hostId && mongoose.Types.ObjectId.isValid(hostId)) {
      const host = await Host.findById(hostId).select("isLive liveHistoryId").lean();
      if (host && host.isLive && host.liveHistoryId) {
        const st = await liveRoom.getLiveState(host.liveHistoryId);
        if (st.isLive) currentLive = st;
      }
    }

    return res.status(200).json({
      status: true,
      isLive: false,
      ended: true,
      message: "This live has ended.",
      data: null,
      currentLive,
    });
  } catch (error) {
    console.error("LiveStatus ERROR =>", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//audience of a live (host's audience bottom sheet: first load / retry / fallback when the socket is down)
//GET /api/client/liveBroadcaster/LiveAudience?liveHistoryId=&hostId=&limit=&skip=
exports.LiveAudience = async (req, res) => {
  try {
    const { liveHistoryId, hostId, limit, skip } = req.query;
    if (!liveHistoryId || !mongoose.Types.ObjectId.isValid(liveHistoryId)) {
      return res.status(200).json({ status: false, message: "Invalid liveHistoryId." });
    }
    const liveRoom = require("../../services/liveRoom.service");

    const active = await liveRoom.getActiveLive(liveHistoryId);
    if (!active) {
      return res.status(200).json({ status: true, isLive: false, ended: true, message: "This live has ended.", data: null });
    }
    // only the host of THIS live reads its audience
    if (!hostId || String(active.broadcaster.hostId) !== String(hostId)) {
      return res.status(200).json({ status: false, message: "Not allowed." });
    }

    const data = await liveRoom.getAudience(liveHistoryId, { limit, skip });
    return res.status(200).json({ status: true, isLive: true, message: "Audience.", data });
  } catch (error) {
    console.error("LiveAudience ERROR =>", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//live host
exports.HostStreaming = async (req, res) => {
  try {
    const { hostId, channel, agoraUID } = req.query;

    if (!hostId || !channel || !agoraUID) {
      return res.status(200).json({
        status: false,
        message: "Invalid request parameters.",
      });
    }

    if (!settingJSON) {
      return res.status(200).json({
        status: false,
        message: "Setting not found.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(hostId)) {
      return res.status(200).json({
        status: false,
        message: "Invalid hostId.",
      });
    }

    const hostObjectId = new mongoose.Types.ObjectId(hostId);

    const role = RtcRole.PUBLISHER;
    const uid = 0;
    const expirationTimeInSeconds = 24 * 3600;

    const privilegeExpiredTs =
      Math.floor(Date.now() / 1000) +
      expirationTimeInSeconds;

    // NOTE: the old code deleted the host's LiveBroadcaster here, BEFORE any check - so a second
    // (duplicate) start request wiped the record of a live that was still running.
    const [host, token] = await Promise.all([
      Host.findById(hostObjectId)
        .select(
          "userId name gender image countryFlagImage country isFake isBlock"
        )
        .lean(),

      RtcTokenBuilder.buildTokenWithUid(
        settingJSON.agoraAppId,
        settingJSON.agoraAppCertificate,
        channel,
        uid,
        role,
        privilegeExpiredTs
      ),
    ]);

    if (!host) {
      return res.status(200).json({
        status: false,
        message: "Host not found.",
      });
    }

    if (host.isBlock) {
      return res.status(200).json({
        status: false,
        message: "You are blocked by the admin.",
      });
    }

    // ---- ONE active live per host, decided by the server (not by the app)
    const liveSessionService = require("../../services/liveSession.service");
    const activeGuard = await liveSessionService.checkActiveSession(host._id);
    if (activeGuard.active) {
      const existing = await LiveBroadcaster.findOne({
        hostId: host._id,
        liveHistoryId: activeGuard.liveHistoryId,
      });

      // same request repeated (double tap / lost response / retry): idempotent, return the SAME live
      if (existing && existing.channel === channel && String(existing.agoraUid) === String(agoraUID)) {
        console.log(`[LIVE_START] duplicate start for host ${host._id} -> returning the running session`);
        return res.status(200).json({
          status: true,
          message: "Live already running.",
          data: existing,
        });
      }

      console.log(`[LIVE_START] rejected: host ${host._id} already has an active live ${activeGuard.liveHistoryId}`);
      return res.status(200).json({
        status: false,
        message: "You are already live. End your current live before starting a new one.",
      });
    }

    // stale broadcaster left behind by a dead session
    await LiveBroadcaster.deleteOne({ hostId: hostObjectId });

    // a previous session that was never closed (app killed, missed disconnect, server restart)
    // is finalized at its last proof of life, so its minutes are kept and never double counted
    try {
      const closed = await require("../../services/liveSession.service").finalizeOpenSessionsForHost(
        host._id,
        "new-live-start"
      );
      if (closed > 0) console.log(`[LIVE_START] closed ${closed} stale session(s) of host ${host._id}`);
    } catch (err) {
      console.error("[LIVE_START] stale session cleanup failed:", err.message);
    }

    const liveHistory = new LiveBroadcastHistory({
      hostId: host._id,
      startTime: moment()
        .tz("Asia/Kolkata")
        .format(),
    });

    const liveBroadcaster = new LiveBroadcaster({
      liveHistoryId: liveHistory._id,
      hostId: host._id,
      userId: host.userId,
      name: host.name,
      gender: host.gender,
      image: host.image,
      countryFlagImage: host.countryFlagImage,
      country: host.country,
      isFake: host.isFake,
      agoraUid: agoraUID,
      channel,
      token,
    });

    await Promise.all([
      liveHistory.save(),

      liveBroadcaster.save(),

      Host.updateOne(
        {
          _id: hostObjectId,
        },
        {
          $set: {
            isBusy: true,
            isLive: true,
            liveHistoryId: liveHistory._id,
            agoraUid: agoraUID,
            channel,
            token,
          },
        }
      ),
    ]);

    res.status(200).json({
      status: true,
      message: "Live started successfully by the host.",
      data: liveBroadcaster,
    });

    console.log(
      "[LIVE_START]",
      JSON.stringify({
        hostId: String(host._id),
        sessionId: String(liveHistory._id),
        startedAt: liveHistory.startTime,
      })
    );

    // Discover / host lists: the SERVER announces "host is LIVE" (no longer depends on the host
    // app's liveRoomJoin arriving) -> hostStatusUpdate -> every subscribed user list updates.
    try {
      if (typeof global.emitHostStatusUpdate === "function") global.emitHostStatusUpdate(host._id);
    } catch (e) {
      console.error("[LIVE_START] host status emit failed:", e.message);
    }

    // Daily LIVE Task: push accumulated progress (e.g. 35/60) immediately
    require("../../services/dailyTask.service").triggerRefresh(
      host._id,
      "live-start"
    );

    // Command Center: START_ROOM audit (idempotent, never blocks the live flow)
    try {
      require("../../services/liveAnalytics.service")
        .recordRoomStart({
          roomId: liveHistory._id,
          hostId: host._id,
          hostName: host.name,
          source: "broadcast",
        })
        .catch(() => {});
    } catch (e) {
      /* observe only */
    }

    try {
      const users = await User.find({
        _id: {
          $ne: host.userId,
        },
        isBlock: false,
        fcmToken: {
          $nin: [null, ""],
        },
      })
        .select("fcmToken")
        .lean();

      const tokens = [
        ...new Set(
          users
            .map((user) => user.fcmToken)
            .filter(
              (token) =>
                typeof token === "string" &&
                token.trim().length > 0
            )
        ),
      ];

      console.log(
        `Host Live Notification: ${tokens.length} unique tokens found`
      );

      if (tokens.length === 0) {
        console.log("No valid FCM tokens found.");
        return;
      }

      const hostName = String(
        host.name || "Host"
      );

      const titleOptions = [
        `🌟 ${hostName} is LIVE now!`,
        `🔥 ${hostName} just went LIVE!`,
        `🎬 ${hostName} is live — join now!`,
        `🚨 ${hostName} is LIVE right now!`,
        `💖 ${hostName} is waiting for you!`,
        `✨ Don't miss ${hostName}'s LIVE!`,
      ];

      const bodyOptions = [
        "🎉 Join the live, say hello, and show your support!",
        `💬 Come join the conversation with ${hostName}!`,
        "🎁 Join the LIVE and support your favorite host!",
        "🔥 The LIVE has started! Tap to join now!",
        `❤️ Come hang out with ${hostName} and enjoy the LIVE!`,
        "✨ Jump into the LIVE and be part of the moment!",
      ];

      const title =
        titleOptions[
          Math.floor(
            Math.random() * titleOptions.length
          )
        ];

      const body =
        bodyOptions[
          Math.floor(
            Math.random() * bodyOptions.length
          )
        ];

      const senderImage = getMediaUrl(
        host.image?.url ||
          host.image ||
          ""
      );

      const chunkSize = 500;

      let totalSuccessCount = 0;
      let totalFailureCount = 0;

      for (
        let i = 0;
        i < tokens.length;
        i += chunkSize
      ) {
        const tokenChunk = tokens.slice(
          i,
          i + chunkSize
        );

        console.log(
          `Sending live notification ${i + 1}-${Math.min(
            i + chunkSize,
            tokens.length
          )} of ${tokens.length}`
        );

        const payload = {
          tokens: tokenChunk,
          data: {
            title,
            body,
            type: "LIVE",
            hostId: host._id.toString(),
            liveHistoryId:
              liveHistory._id.toString(),
            name: hostName,
            image: senderImage,
            senderImage,
            agoraUid: agoraUID.toString(),
            channel: channel.toString(),
            token: token.toString(),
          },
        };

        const response =
          await firebase.messaging.sendEachForMulticast(
            payload
          );

        totalSuccessCount +=
          response.successCount || 0;

        totalFailureCount +=
          response.failureCount || 0;

        if (response.failureCount > 0) {
          response.responses.forEach(
            (resp, index) => {
              if (!resp.success) {
               
              }
            }
          );
        }
      }

      console.log(
        "HOST LIVE NOTIFICATION RESULT:",
        {
          hostId: host._id.toString(),
          hostName,
          totalTokens: tokens.length,
          successCount: totalSuccessCount,
          failureCount: totalFailureCount,
          title,
          body,
        }
      );
    } catch (notificationError) {
      console.error(
        "HOST LIVE NOTIFICATION FCM ERROR:",
        notificationError.code,
        notificationError.message
      );
    }
  } catch (error) {
    console.error(
      "HOST STREAMING ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};
