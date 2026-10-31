/**
 * Single date-range policy for admin analytics: the application timezone (ANALYTICS_TZ, default Asia/Kolkata,
 * same value liveAnalytics.service uses). `startDate` / `endDate` are calendar days (YYYY-MM-DD) in that
 * timezone; start = 00:00:00.000 of startDate, end = 23:59:59.999 of endDate (both inclusive).
 * The previous comparable period has the same length and ends right before `start`.
 */
const moment = require("moment-timezone");

const TZ = process.env.ANALYTICS_TZ || "Asia/Kolkata";
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 400;

/** -> { ok:true, start, end, prevStart, prevEnd, days, tz } | { ok:false, message } */
function parseRange(q = {}, { defaultDays = 30 } = {}) {
  let s = q.startDate, e = q.endDate;
  if (!s && !e) { // default: last N days including today
    e = moment.tz(TZ).format("YYYY-MM-DD");
    s = moment.tz(TZ).subtract(defaultDays - 1, "days").format("YYYY-MM-DD");
  } else if (!s || !e || !DAY.test(s) || !DAY.test(e)) {
    return { ok: false, message: "startDate and endDate are required as YYYY-MM-DD" };
  }
  const start = moment.tz(s, "YYYY-MM-DD", true, TZ).startOf("day");
  const end = moment.tz(e, "YYYY-MM-DD", true, TZ).endOf("day");
  if (!start.isValid() || !end.isValid()) return { ok: false, message: "Invalid date" };
  if (start.isAfter(end)) return { ok: false, message: "Start date must be before end date" };
  const days = Math.round(end.diff(start, "days", true));
  if (days > MAX_DAYS) return { ok: false, message: `Range too large (max ${MAX_DAYS} days)` };
  const len = end.valueOf() - start.valueOf() + 1;
  return {
    ok: true, tz: TZ, days, startDate: s, endDate: e,
    start: start.toDate(), end: end.toDate(),
    prevStart: new Date(start.valueOf() - len), prevEnd: new Date(start.valueOf() - 1),
  };
}

/** growth % of current vs previous; null when there is no baseline (frontend shows "New" / "N/A") */
const growthPct = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : cur > 0 ? null : 0);

/** $dateToString day bucket in the application timezone */
const dayBucket = (field = "$createdAt") => ({ $dateToString: { format: "%Y-%m-%d", date: field, timezone: TZ } });

/** HH:MM:SS string -> seconds, inside an aggregation */
const durSec = (f) => ({
  $let: {
    vars: { p: { $split: [{ $ifNull: [f, "00:00:00"] }, ":"] } },
    in: {
      $add: [
        { $multiply: [{ $convert: { input: { $arrayElemAt: ["$$p", 0] }, to: "int", onError: 0, onNull: 0 } }, 3600] },
        { $multiply: [{ $convert: { input: { $arrayElemAt: ["$$p", 1] }, to: "int", onError: 0, onNull: 0 } }, 60] },
        { $convert: { input: { $arrayElemAt: ["$$p", 2] }, to: "int", onError: 0, onNull: 0 } },
      ],
    },
  },
});

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = { TZ, parseRange, growthPct, dayBucket, durSec, escapeRegex };
