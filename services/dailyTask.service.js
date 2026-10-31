/**
 * Host Daily LIVE Task service.
 *
 * Source of truth rules:
 *   LiveBroadcastHistory  -> LIVE duration (completed sessions)
 *   Host.isLive/liveHistoryId + history.startTime -> active session elapsed
 *   HostDailyTask         -> daily state / cache / claim record
 *   HostDailyTaskReward   -> reward idempotency + audit (unique per host/day/type)
 *   Host.coin             -> wallet
 *
 * Progress is never incremented blindly - it is always recomputed from LIVE data.
 */
const mongoose = require("mongoose");
const moment = require("moment-timezone");

const Host = require("../models/host.model");
const History = require("../models/history.model");
const LiveBroadcastHistory = require("../models/liveBroadcastHistory.model");
const HostDailyTask = require("../models/hostDailyTask.model");
const HostDailyTaskReward = require("../models/hostDailyTaskReward.model");

const generateHistoryUniqueId = require("../util/generateHistoryUniqueId");
const { parseDurationToSeconds } = require("../util/duration");
const { HISTORY_TYPE } = require("../types/constant");
const {
  TIMEZONE,
  SOCKET_EVENTS,
  SCHEDULER_INTERVAL_MS,
  getUpdateIntervalMs,
  getDailyTaskConfig,
  hostRoom,
} = require("../config/dailyTask.config");

const DUPLICATE_KEY = 11000;
const SCHEDULER_BATCH = 20;

// ---------------------------------------------------------------------------
// Date helpers (always Asia/Kolkata)
// ---------------------------------------------------------------------------

const getTaskDate = (date = new Date(Date.now())) =>
  moment(date).tz(TIMEZONE).format("YYYY-MM-DD");

/**
 * Start/end of an Asia/Kolkata day. startStr/endStr use the same ISO format
 * that LiveBroadcastHistory.startTime is stored in ("2026-10-04T18:00:00+05:30"),
 * so string range queries are correct and can use the (hostId, startTime) index.
 */
const getTodayStartEnd = (taskDate = getTaskDate()) => {
  const start = moment.tz(taskDate, "YYYY-MM-DD", TIMEZONE).startOf("day");
  const end = start.clone().add(1, "day");
  return { start, end, startStr: start.format(), endStr: end.format() };
};

// ---------------------------------------------------------------------------
// LIVE duration calculation
// ---------------------------------------------------------------------------

/**
 * Seconds of ONE stored session.
 *  - finished (endTime set): stored duration ("HH:mm:ss"); if that is missing/zero, endTime - startTime.
 *  - orphan (endTime empty but the host is no longer on that session - app killed, abnormal
 *    host reset): counted up to its last write (updatedAt) so the time is never lost.
 */
const sessionSeconds = (row, rangeEndMs) => {
  const startMs = Date.parse(row.startTime);
  const hasEnd = typeof row.endTime === "string" && row.endTime !== "";

  if (hasEnd) {
    const stored = parseDurationToSeconds(row.duration);
    if (stored > 0) return stored;
    const endMs = Date.parse(row.endTime);
    if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs) {
      return Math.floor((endMs - startMs) / 1000);
    }
    return 0;
  }

  const lastSeen = Math.max(
    new Date(row.updatedAt || 0).getTime() || 0,
    new Date(row.lastHeartbeatAt || 0).getTime() || 0
  );
  const lastMs = Math.min(lastSeen, rangeEndMs);
  if (Number.isFinite(startMs) && Number.isFinite(lastMs) && lastMs > startMs) {
    return Math.floor((lastMs - startMs) / 1000);
  }
  return 0;
};

/**
 * Sum of today's sessions of the host (finished + orphaned), EXCLUDING the currently active one.
 * A session belongs to today when startTime (Asia/Kolkata ISO string) is today OR its createdAt
 * (real Date, set when LIVE started) is today - either match is enough, nothing is counted twice
 * because it is a single find().
 */
const getHistoricalLiveSeconds = async (hostId, range, excludeHistoryId = null) => {
  const filter = {
    hostId,
    $or: [
      { startTime: { $gte: range.startStr, $lt: range.endStr } },
      { createdAt: { $gte: range.start.toDate(), $lt: range.end.toDate() } },
    ],
  };
  if (excludeHistoryId) filter._id = { $ne: excludeHistoryId };

  const rows = await LiveBroadcastHistory.find(filter)
    .select("startTime endTime duration updatedAt lastHeartbeatAt")
    .lean();

  let seconds = 0;
  for (const row of rows) seconds += sessionSeconds(row, range.end.valueOf());

  console.log(
    `DAILY TASK CALCULATION host=${hostId} sessions=${rows.length} historicalSeconds=${seconds}`
  );
  return seconds;
};

/** Elapsed seconds of the currently running session (counted from today's 00:00 at most). */
const getActiveLiveSeconds = async (host, range, nowMs = Date.now()) => {
  if (!host || !host.isLive || !host.liveHistoryId) {
    return { seconds: 0, activeHistoryId: null };
  }

  const history = await LiveBroadcastHistory.findById(host.liveHistoryId)
    .select("startTime endTime")
    .lean();

  // Missing history or already ended -> not active (ended ones are counted as historical).
  if (!history || history.endTime) return { seconds: 0, activeHistoryId: null };

  const start = moment.tz(history.startTime, moment.ISO_8601, TIMEZONE);
  if (!start.isValid()) return { seconds: 0, activeHistoryId: null };

  const effectiveStartMs = Math.max(start.valueOf(), range.start.valueOf());
  const seconds = Math.max(0, Math.floor((nowMs - effectiveStartMs) / 1000));

  return { seconds, activeHistoryId: history._id };
};

/** historical (finished, excluding active) + active elapsed. Never double counts. */
const getHostDailyLiveSeconds = async (hostId, range, nowMs = Date.now()) => {
  const host = await Host.findById(hostId).select("isLive liveHistoryId").lean();

  const active = await getActiveLiveSeconds(host, range, nowMs);
  const historicalSeconds = await getHistoricalLiveSeconds(
    hostId,
    range,
    active.activeHistoryId
  );

  console.log(
    `DAILY TASK CALCULATION host=${hostId} historical=${historicalSeconds}s active=${active.seconds}s live=${Boolean(active.activeHistoryId)}`
  );

  return {
    totalSeconds: historicalSeconds + active.seconds,
    historicalSeconds,
    activeSeconds: active.seconds,
    isLive: Boolean(active.activeHistoryId),
  };
};

const calculateDailyTaskProgress = (totalSeconds, targetMinutes) => {
  const safeTotal = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const completedMinutes = Math.floor(safeTotal / 60);

  const reached = safeTotal >= targetMinutes * 60;
  const displayMinutes = Math.min(completedMinutes, targetMinutes);

  const remainingMinutes = Math.max(targetMinutes - completedMinutes, 0);
  const percentage = Math.min(Math.floor((completedMinutes / targetMinutes) * 100), 100);

  let status = "not_started";
  if (reached) status = "completed";
  else if (completedMinutes > 0) status = "in_progress";

  return {
    // never exposed above the target
    totalSeconds: Math.min(safeTotal, targetMinutes * 60),
    completedMinutes: displayMinutes,
    remainingMinutes,
    percentage,
    status,
    reached,
  };
};

// ---------------------------------------------------------------------------
// Task document
// ---------------------------------------------------------------------------

const getOrCreateDailyTask = async (hostId, taskDate, config) => {
  const filter = { hostId, taskDate, taskType: config.taskType };

  const run = () =>
    HostDailyTask.findOneAndUpdate(
      filter,
      {
        $setOnInsert: {
          targetMinutes: config.targetMinutes,
          rewardCoins: config.rewardCoins,
          remainingMinutes: config.targetMinutes,
          completedMinutes: 0,
          progressPercentage: 0,
          status: "not_started",
          rewardClaimed: false,
          rewardClaimedAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

  try {
    return await run();
  } catch (err) {
    // two concurrent upserts -> one loses with E11000; the doc now exists.
    if (err && err.code === DUPLICATE_KEY) return run();
    throw err;
  }
};

/**
 * Recalculates from LIVE data and stores the result on HostDailyTask.
 * Returns the fresh task + live info.
 */
const syncDailyTask = async (hostId, nowMs = Date.now()) => {
  const config = getDailyTaskConfig();
  if (!config) {
    const e = new Error("Daily task is disabled or has an invalid configuration");
    e.code = "INVALID_TASK_CONFIG";
    throw e;
  }

  const taskDate = getTaskDate(new Date(nowMs));
  const range = getTodayStartEnd(taskDate);

  let task = await getOrCreateDailyTask(hostId, taskDate, config);

  // Config changed (e.g. 60 -> 12 for testing)? An unclaimed task follows the current
  // config; a task whose reward was already credited keeps the values it was paid with.
  if (
    !task.rewardClaimed &&
    (task.targetMinutes !== config.targetMinutes || task.rewardCoins !== config.rewardCoins)
  ) {
    task = await HostDailyTask.findOneAndUpdate(
      { _id: task._id, rewardClaimed: false },
      { $set: { targetMinutes: config.targetMinutes, rewardCoins: config.rewardCoins } },
      { new: true }
    ).lean() || task;
  }

  const live = await getHostDailyLiveSeconds(hostId, range, nowMs);

  // Progress inside one day only ever goes UP. The task document already holds the minutes
  // that were reached (they were computed from real LIVE time), so a recalculation that comes
  // out lower means LIVE data was lost/closed abnormally - never show a reset because of it.
  const floorSeconds = Math.max(0, Number(task.completedMinutes) || 0) * 60;
  if (live.totalSeconds < floorSeconds) {
    console.log(
      `DAILY TASK CALCULATION host=${hostId} lower than stored (${live.totalSeconds}s < ${floorSeconds}s) - keeping stored progress`
    );
  }
  const effectiveSeconds = Math.max(live.totalSeconds, floorSeconds);

  let progress = calculateDailyTaskProgress(effectiveSeconds, task.targetMinutes);

  // A completed + paid task never regresses (history anomalies, config changes).
  if (task.status === "completed" && task.rewardClaimed && !progress.reached) {
    progress = calculateDailyTaskProgress(task.targetMinutes * 60, task.targetMinutes);
  }

  const changed =
    task.completedMinutes !== progress.completedMinutes ||
    task.remainingMinutes !== progress.remainingMinutes ||
    task.progressPercentage !== progress.percentage ||
    task.status !== progress.status;

  let fresh = task;
  if (changed) {
    fresh = await HostDailyTask.findOneAndUpdate(
      { _id: task._id },
      {
        $set: {
          completedMinutes: progress.completedMinutes,
          remainingMinutes: progress.remainingMinutes,
          progressPercentage: progress.percentage,
          status: progress.status,
        },
      },
      { new: true }
    ).lean();
  }

  return { task: fresh, progress, isLive: live.isLive };
};

// ---------------------------------------------------------------------------
// Reward (exactly once)
// ---------------------------------------------------------------------------

const markTaskClaimed = (taskId, creditedAt) =>
  HostDailyTask.updateOne(
    { _id: taskId, rewardClaimed: false },
    { $set: { rewardClaimed: true, rewardClaimedAt: creditedAt } }
  );

const buildHistoryDoc = async (task, creditedAt) => ({
  uniqueId: await generateHistoryUniqueId(),
  type: HISTORY_TYPE.DAILY_LIVE_TASK_REWARD,
  hostId: task.hostId,
  hostCoin: task.rewardCoins,
  reason: `Daily LIVE Task ${task.taskDate}`,
  date: moment(creditedAt).tz(TIMEZONE).format("D MMM, YYYY, hh:mm A"),
});

const isTransactionUnsupported = (err) =>
  /Transaction numbers are only allowed|replica set|does not support transactions|not supported/i.test(
    String((err && err.message) || "")
  );

const rewardDocFor = (task, creditedAt) => ({
  hostId: task.hostId,
  taskDate: task.taskDate,
  taskType: task.taskType,
  rewardCoins: task.rewardCoins,
  status: "credited",
  creditedAt,
});

/** Transaction path: reward record + coin $inc + history + task state commit together. */
const creditRewardWithTransaction = async (task, historyDoc) => {
  const session = await mongoose.startSession();
  let creditedAt = null;

  try {
    await session.withTransaction(async () => {
      creditedAt = new Date();

      const [reward] = await HostDailyTaskReward.create([rewardDocFor(task, creditedAt)], { session });

      const wallet = await Host.updateOne(
        { _id: task.hostId, isBlock: false, status: 2 },
        { $inc: { coin: task.rewardCoins } },
        { session }
      );
      if (wallet.modifiedCount !== 1) throw new Error("WALLET_UPDATE_FAILED");

      const [hist] = await History.create([historyDoc], { session });
      await HostDailyTaskReward.updateOne({ _id: reward._id }, { $set: { historyId: hist._id } }, { session });

      await HostDailyTask.updateOne(
        { _id: task._id, rewardClaimed: false },
        { $set: { rewardClaimed: true, rewardClaimedAt: creditedAt } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return creditedAt;
};

/** Fallback (standalone Mongo): unique reward record first, then atomic $inc, compensate on failure. */
const creditRewardWithoutTransaction = async (task, historyDoc) => {
  const creditedAt = new Date();
  const reward = await HostDailyTaskReward.create(rewardDocFor(task, creditedAt)); // E11000 => already claimed

  try {
    const wallet = await Host.updateOne(
      { _id: task.hostId, isBlock: false, status: 2 },
      { $inc: { coin: task.rewardCoins } }
    );
    if (wallet.modifiedCount !== 1) throw new Error("WALLET_UPDATE_FAILED");
  } catch (err) {
    // coins were NOT credited -> drop the reward record so a retry can succeed.
    await HostDailyTaskReward.deleteOne({ _id: reward._id }).catch(() => {});
    throw err;
  }

  try {
    const hist = await History.create(historyDoc);
    await HostDailyTaskReward.updateOne({ _id: reward._id }, { $set: { historyId: hist._id } });
  } catch (err) {
    console.error("DAILY TASK REWARD FAILED (history only, coins credited):", err.message);
  }

  await markTaskClaimed(task._id, creditedAt);
  return creditedAt;
};

/**
 * Returns { credited, alreadyClaimed, skipped, creditedAt }.
 * Safe to call from API, scheduler, live-end and reconnect at the same time.
 */
const processDailyTaskReward = async (task) => {
  const key = `${task.hostId}:${task.taskDate}:${task.taskType}`;

  if (task.rewardClaimed) return { credited: false, alreadyClaimed: true, creditedAt: task.rewardClaimedAt };

  // cheap pre-check before any write
  const existing = await HostDailyTaskReward.findOne({
    hostId: task.hostId,
    taskDate: task.taskDate,
    taskType: task.taskType,
  })
    .select("creditedAt")
    .lean();

  if (existing) {
    await markTaskClaimed(task._id, existing.creditedAt);
    console.log("DAILY TASK REWARD ALREADY CLAIMED", key);
    return { credited: false, alreadyClaimed: true, creditedAt: existing.creditedAt };
  }

  const host = await Host.findById(task.hostId).select("isBlock status").lean();
  if (!host || host.isBlock || host.status !== 2) {
    console.log("DAILY TASK REWARD PROCESS skipped (host blocked/inactive)", key);
    return { credited: false, skipped: true };
  }

  console.log("DAILY TASK REWARD PROCESS", key, task.rewardCoins);

  try {
    const historyDoc = await buildHistoryDoc(task, new Date());

    let creditedAt;
    try {
      creditedAt = await creditRewardWithTransaction(task, historyDoc);
    } catch (err) {
      if (err && err.code !== DUPLICATE_KEY && isTransactionUnsupported(err)) {
        creditedAt = await creditRewardWithoutTransaction(task, historyDoc);
      } else {
        throw err;
      }
    }

    console.log("DAILY TASK COMPLETED", key, "reward credited");
    return { credited: true, creditedAt };
  } catch (err) {
    if (err && err.code === DUPLICATE_KEY) {
      const row = await HostDailyTaskReward.findOne({
        hostId: task.hostId,
        taskDate: task.taskDate,
        taskType: task.taskType,
      })
        .select("creditedAt")
        .lean();
      const at = row ? row.creditedAt : new Date();
      await markTaskClaimed(task._id, at);
      console.log("DAILY TASK REWARD ALREADY CLAIMED", key);
      return { credited: false, alreadyClaimed: true, creditedAt: at };
    }

    // task stays "completed", rewardClaimed stays false -> retried by the next tick / API call.
    console.error("DAILY TASK REWARD FAILED", key, err.message);
    return { credited: false, failed: true };
  }
};

// ---------------------------------------------------------------------------
// Payload + socket emit
// ---------------------------------------------------------------------------

// next day boundary of the task day in the single authoritative timezone (Asia/Kolkata)
const getNextResetAt = (taskDate) =>
  moment.tz(taskDate, "YYYY-MM-DD", TIMEZONE).add(1, "day").startOf("day").toDate().toISOString();

const buildPayload = (task, progress, isLive) => ({
  // owner of this state - Flutter drops any payload that is not for the logged-in host
  hostId: String(task.hostId),
  taskDate: task.taskDate,
  taskType: task.taskType,

  targetMinutes: task.targetMinutes,
  rewardCoins: task.rewardCoins,

  completedMinutes: progress.completedMinutes,
  remainingMinutes: progress.remainingMinutes,
  percentage: progress.percentage,
  totalSeconds: progress.totalSeconds,

  status: progress.status,

  rewardClaimed: Boolean(task.rewardClaimed),
  rewardClaimedAt: task.rewardClaimedAt ? new Date(task.rewardClaimedAt).toISOString() : null,

  isLive: Boolean(isLive),

  // day boundary info: the app reloads the task exactly at the reset, no manual refresh needed
  timezone: TIMEZONE,
  serverTime: new Date(Date.now()).toISOString(),
  nextResetAt: getNextResetAt(task.taskDate),
});

// last socket update per host (used to honour DAILY_TASK_UPDATE_INTERVAL_MINUTES in the scheduler)
const lastEmitAt = new Map();
const lastState = new Map(); // status|claimed|live seen by the scheduler (emit on change)

const emitDailyTaskUpdate = (hostId, payload) => {
  lastEmitAt.set(String(hostId), Date.now());
  if (!global.io) return;
  global.io.to(hostRoom(hostId)).emit(SOCKET_EVENTS.UPDATE, payload);
  console.log(
    `DAILY TASK SOCKET UPDATE host=${hostId} ${payload.completedMinutes}/${payload.targetMinutes} ${payload.status} live=${payload.isLive}`
  );
};

/** Wallet realtime: new authoritative balance read back from the Host document. */
const emitWalletBalanceUpdated = async (hostId, task) => {
  if (!global.io) return;
  try {
    const host = await Host.findById(hostId).select("coin").lean();
    if (!host) return;
    global.io.to(hostRoom(hostId)).emit(SOCKET_EVENTS.WALLET, {
      hostId: String(hostId),
      coins: host.coin,
      addedCoins: task.rewardCoins,
      reason: "DAILY_TASK_REWARD",
      taskDate: task.taskDate,
    });
    console.log("[WALLET_REWARD]", JSON.stringify({ hostId: String(hostId), coins: host.coin, addedCoins: task.rewardCoins }));
  } catch (err) {
    console.error("DAILY TASK wallet emit failed:", err.message);
  }
};

/** History realtime: the new "Daily Task Completed" row is pushed to the host's open History screen. */
const emitHostHistoryEntry = async (hostId, historyId) => {
  if (!global.io || !historyId) return;
  try {
    const host = await Host.findById(hostId).select("_id userId").lean();
    if (!host) return;
    const { getHostHistoryEntryById } = require("../controllers/client/history.controller");
    const entry = await getHostHistoryEntryById(historyId, host._id, host.userId);
    if (!entry) return;
    global.io.to(hostRoom(hostId)).emit(SOCKET_EVENTS.HISTORY, { hostId: String(hostId), entry });
  } catch (err) {
    console.error("DAILY TASK history emit failed:", err.message);
  }
};

const emitDailyTaskReward = (hostId, task, creditedAt) => {
  if (!global.io) return;
  global.io.to(hostRoom(hostId)).emit(SOCKET_EVENTS.REWARD, {
    hostId: String(hostId),
    taskDate: task.taskDate,
    taskType: task.taskType,
    rewardCoins: task.rewardCoins,
    status: "credited",
    creditedAt: new Date(creditedAt).toISOString(),
  });
};

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

// concurrent calls for the same host share one computation (less DB load, one reward emit)
const inflight = new Map();

const runRefresh = async (hostId, shouldEmit = null) => {
  const { task, progress, isLive } = await syncDailyTask(hostId);

  let finalTask = task;
  let rewardResult = null;

  if (progress.reached && !task.rewardClaimed) {
    rewardResult = await processDailyTaskReward(task);
    if (rewardResult.credited || rewardResult.alreadyClaimed) {
      finalTask = { ...task, rewardClaimed: true, rewardClaimedAt: rewardResult.creditedAt || new Date() };
    }
  }

  const payload = buildPayload(finalTask, progress, isLive);
  const rewardCredited = Boolean(rewardResult && rewardResult.credited);

  // API / LIVE start / LIVE end / socket-connect always emit; the scheduler passes a
  // predicate so running LIVE updates follow the configured interval.
  if (!shouldEmit || shouldEmit(payload, rewardCredited)) {
    emitDailyTaskUpdate(hostId, payload);
  }

  if (rewardResult && rewardResult.credited) {
    emitDailyTaskReward(hostId, finalTask, rewardResult.creditedAt);
    emitWalletBalanceUpdated(hostId, finalTask);
    const rewardRow = await HostDailyTaskReward.findOne({
      hostId: finalTask.hostId,
      taskDate: finalTask.taskDate,
      taskType: finalTask.taskType,
    })
      .select("historyId")
      .lean();
    emitHostHistoryEntry(hostId, rewardRow && rewardRow.historyId);
  }

  return { payload, rewardCredited: Boolean(rewardResult && rewardResult.credited) };
};

/** Recalculate -> persist -> (reward) -> emit to the host's room. Returns the payload. */
const refreshHostDailyTask = (hostId, shouldEmit = null) => {
  const key = String(hostId);
  if (inflight.has(key)) return inflight.get(key);

  const promise = runRefresh(hostId, shouldEmit).finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
};

/** Fire-and-forget wrapper used by LIVE start/end/socket hooks - never throws. */
const triggerRefresh = (hostId, source = "hook") => {
  if (!hostId) return;
  refreshHostDailyTask(hostId).catch((err) =>
    console.error(`DAILY TASK ${source} refresh failed:`, err.message)
  );
};

/** Host socket connected: join the dedicated room and push the latest state. */
const onHostSocketConnected = (socket, hostId) => {
  try {
    // a socket only ever listens to ITS host: leave any other host's task room first
    const mine = hostRoom(hostId);
    for (const room of socket.rooms) {
      if (room.startsWith("hostDailyTask:") && room !== mine) socket.leave(room);
    }
    socket.join(mine);
    triggerRefresh(hostId, "socket-connect");
  } catch (err) {
    console.error("DAILY TASK socket connect failed:", err.message);
  }
};

// ---------------------------------------------------------------------------
// Scheduler (one global interval, only LIVE hosts)
// ---------------------------------------------------------------------------

let schedulerTimer = null;
let schedulerRunning = false;
let previouslyLive = new Set();

let lastTickTaskDate = null;

/**
 * Day rollover: the first tick after midnight (Asia/Kolkata) pushes the NEW day's task (0 / target)
 * to every host that currently has a socket connected - live or not - so an open app switches day
 * on its own. Only connected hosts are processed (rooms hostDailyTask:*), never the whole host table.
 */
const broadcastDayRollover = async () => {
  const today = getTaskDate();
  const previous = lastTickTaskDate;
  lastTickTaskDate = today;
  if (previous === null || previous === today) return;

  if (!global.io || !global.io.sockets || !global.io.sockets.adapter) return;
  const prefix = hostRoom("");
  const hostIds = [];
  for (const [room, members] of global.io.sockets.adapter.rooms) {
    if (room.startsWith(prefix) && members.size > 0) hostIds.push(room.slice(prefix.length));
  }
  console.log(`DAILY TASK DAY ROLLOVER ${previous} -> ${today} hosts=${hostIds.length}`);

  for (let i = 0; i < hostIds.length; i += SCHEDULER_BATCH) {
    await Promise.allSettled(hostIds.slice(i, i + SCHEDULER_BATCH).map((id) => refreshHostDailyTask(id)));
  }
};

const schedulerTick = async () => {
  if (schedulerRunning) return; // never overlap
  schedulerRunning = true;

  try {
    await broadcastDayRollover();

    const liveHosts = await Host.find({ isLive: true, liveHistoryId: { $ne: null } })
      .select("_id")
      .lean();

    const currentlyLive = new Set(liveHosts.map((h) => String(h._id)));
    // hosts that stopped since the last tick get one final authoritative sync
    const justStopped = [...previouslyLive].filter((id) => !currentlyLive.has(id));
    previouslyLive = currentlyLive;
    for (const id of lastEmitAt.keys()) {
      if (!currentlyLive.has(id) && !justStopped.includes(id)) {
        lastEmitAt.delete(id); // no leak
        lastState.delete(id);
      }
    }

    const targets = [...currentlyLive, ...justStopped];
    if (!targets.length) return;

    console.log(`DAILY TASK SCHEDULER live=${currentlyLive.size} finalSync=${justStopped.length}`);

    for (let i = 0; i < targets.length; i += SCHEDULER_BATCH) {
      const batch = targets.slice(i, i + SCHEDULER_BATCH);
      const intervalMs = getUpdateIntervalMs();
      const results = await Promise.allSettled(
        batch.map((id) => {
          const shouldEmit = (payload, rewardCredited) => {
            const last = lastEmitAt.get(String(id)) || 0;
            const key = `${payload.status}|${payload.rewardClaimed}|${payload.isLive}`;
            const prev = lastState.get(String(id));
            const stateChanged = prev !== undefined && prev !== key;
            lastState.set(String(id), key);
            // 5s tolerance: the 60s tick can land just before the interval boundary
            return (
              rewardCredited ||
              (payload.status === "completed" && !payload.rewardClaimed) ||
              stateChanged ||
              Date.now() - last >= intervalMs - 5000
            );
          };
          return refreshHostDailyTask(id, shouldEmit);
        })
      );
      results.forEach((r, idx) => {
        if (r.status === "rejected") {
          console.error(`DAILY TASK SCHEDULER host=${batch[idx]} failed:`, r.reason && r.reason.message);
        }
      });
    }
  } catch (err) {
    console.error("DAILY TASK SCHEDULER error:", err.message);
  } finally {
    schedulerRunning = false;
  }
};

const startDailyTaskScheduler = () => {
  if (schedulerTimer) return schedulerTimer; // single interval per process

  schedulerTimer = setInterval(schedulerTick, SCHEDULER_INTERVAL_MS);
  if (schedulerTimer.unref) schedulerTimer.unref();

  console.log(`DAILY TASK SCHEDULER started (check 60s, socket update every ${getUpdateIntervalMs() / 60000} min)`);
  return schedulerTimer;
};

module.exports = {
  getTaskDate,
  getTodayStartEnd,
  getHistoricalLiveSeconds,
  getActiveLiveSeconds,
  getHostDailyLiveSeconds,
  calculateDailyTaskProgress,
  getOrCreateDailyTask,
  syncDailyTask,
  processDailyTaskReward,
  emitDailyTaskUpdate,
  emitDailyTaskReward,
  emitHostHistoryEntry,
  refreshHostDailyTask,
  triggerRefresh,
  onHostSocketConnected,
  startDailyTaskScheduler,
  schedulerTick,
};
