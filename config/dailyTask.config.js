/**
 * Daily LIVE Task configuration.
 *
 * Single place to control the task. Today these are constants; later an Admin
 * configuration can replace getDailyTaskConfig() without touching the service,
 * controller, socket or Flutter code.
 */
module.exports.TIMEZONE = "Asia/Kolkata";

module.exports.TASK_TYPE = {
  LIVE_TIME: "LIVE_TIME",
};

/**
 * Values come from environment variables so the task can be re-tuned (e.g. a
 * 12 minute test run) without touching code or Flutter:
 *
 *   DAILY_TASK_TARGET_MINUTES          default 60   (test: 12)
 *   DAILY_TASK_REWARD_COINS            default 1000
 *   DAILY_TASK_UPDATE_INTERVAL_MINUTES default 1    (test: 3)
 *   DAILY_TASK_ENABLED                 default true
 */
const envInt = (name, fallback, min) => {
  const raw = process.env[name];
  if (raw === undefined || raw === null || String(raw).trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min) return fallback;
  return Math.floor(n);
};

const envBool = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || raw === null || String(raw).trim() === "") return fallback;
  return !["false", "0", "off", "no"].includes(String(raw).trim().toLowerCase());
};

// read lazily so the values always reflect the current environment
const readEnvConfig = () => ({
  TASK_TYPE: "LIVE_TIME",
  TARGET_MINUTES: envInt("DAILY_TASK_TARGET_MINUTES", 60, 1),
  REWARD_COINS: envInt("DAILY_TASK_REWARD_COINS", 1000, 0),
  UPDATE_INTERVAL_MINUTES: envInt("DAILY_TASK_UPDATE_INTERVAL_MINUTES", 1, 1),
  STATUS: envBool("DAILY_TASK_ENABLED", true),
});

const DEFAULT_CONFIG = readEnvConfig();

module.exports.DEFAULT_CONFIG = DEFAULT_CONFIG;

// Socket / room names (Flutter contract)
module.exports.SOCKET_EVENTS = {
  UPDATE: "dailyTaskUpdate",
  REWARD: "dailyTaskReward",
  WALLET: "walletBalanceUpdated",
  HISTORY: "hostHistoryUpdate",
};

module.exports.hostRoom = (hostId) => `hostDailyTask:${hostId}`;

// The scheduler always CHECKS once a minute (cheap: live hosts only) so completion and
// the reward are never late; the socket UPDATE frequency is DAILY_TASK_UPDATE_INTERVAL_MINUTES.
module.exports.SCHEDULER_INTERVAL_MS = 60 * 1000;

module.exports.getUpdateIntervalMs = () =>
  readEnvConfig().UPDATE_INTERVAL_MINUTES * 60 * 1000;

/**
 * Returns a validated config object or null when the task is disabled/invalid.
 */
module.exports.getDailyTaskConfig = () => {
  const cfg = readEnvConfig();

  const target = Number(cfg.TARGET_MINUTES);
  const reward = Number(cfg.REWARD_COINS);

  if (
    !cfg.STATUS ||
    cfg.TASK_TYPE !== "LIVE_TIME" ||
    !Number.isFinite(target) ||
    target <= 0 ||
    !Number.isFinite(reward) ||
    reward < 0
  ) {
    return null;
  }

  return {
    taskType: cfg.TASK_TYPE,
    targetMinutes: Math.floor(target),
    rewardCoins: Math.floor(reward),
  };
};
