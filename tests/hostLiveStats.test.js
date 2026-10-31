/* Run: node tests/hostLiveStats.test.js  (no database needed) */
const assert = require("assert");
const Host = require("../models/host.model");
const LBH = require("../models/liveBroadcastHistory.model");
const { getHostLiveStats, formatHMS } = require("../services/hostLiveStats.service");

const stub = (rows, host) => {
  Host.findById = () => ({ select: () => ({ lean: async () => host }) });
  LBH.find = () => ({ select: () => ({ lean: () => ({ cursor: async function* () { for (const r of rows) yield r; } }) }) });
};
let n = 0;
const t = async (name, fn) => { try { await fn(); n++; console.log("  ok  -", name); } catch (e) { console.error("FAIL -", name, e); process.exitCode = 1; } };

(async () => {
  const now = Date.parse("2026-10-27T10:00:00+05:30");
  await t("formats h/m/s", () => assert.strictEqual(formatHMS(48 * 3600 + 32 * 60 + 15), "48h 32m 15s"));
  await t("counts completed sessions and sums timestamp durations", async () => {
    stub([
      { _id: "a", startTime: "2026-10-01T10:00:00+05:30", endTime: "2026-10-01T11:00:30+05:30" },
      { _id: "b", startTime: "2026-10-02T10:00:00+05:30", endTime: "2026-10-02T10:30:00+05:30" },
    ], { isLive: false });
    const s = await getHostLiveStats("h1", { now, useCache: false });
    assert.strictEqual(s.totalSessions, 2);
    assert.strictEqual(s.totalLiveSeconds, 3630 + 1800);
  });
  await t("same session id never counted twice", async () => {
    const r = { _id: "a", startTime: "2026-10-01T10:00:00+05:30", endTime: "2026-10-01T11:00:00+05:30" };
    stub([r, r], { isLive: false });
    const s = await getHostLiveStats("h2", { now, useCache: false });
    assert.strictEqual(s.totalSessions, 1);
    assert.strictEqual(s.totalLiveSeconds, 3600);
  });
  await t("interrupted (open, not current) session is excluded", async () => {
    stub([{ _id: "x", startTime: "2026-10-01T10:00:00+05:30", endTime: "" }], { isLive: false });
    const s = await getHostLiveStats("h3", { now, useCache: false });
    assert.deepStrictEqual([s.totalSessions, s.totalLiveSeconds, s.interruptedSessions], [0, 0, 1]);
  });
  await t("current live session reported as ongoing, not added to completed totals", async () => {
    stub([
      { _id: "done", startTime: "2026-10-01T10:00:00+05:30", endTime: "2026-10-01T11:00:00+05:30" },
      { _id: "live", startTime: "2026-10-27T09:00:00+05:30", endTime: "" },
    ], { isLive: true, liveHistoryId: "live" });
    const s = await getHostLiveStats("h4", { now, useCache: false });
    assert.deepStrictEqual([s.totalSessions, s.totalLiveSeconds], [1, 3600]);
    assert.deepStrictEqual(s.ongoing, { active: true, elapsedSeconds: 3600 });
  });
  await t("corrupt rows (bad dates, end before start) are ignored", async () => {
    stub([
      { _id: "c1", startTime: "garbage", endTime: "2026-10-01T11:00:00+05:30" },
      { _id: "c2", startTime: "2026-10-01T12:00:00+05:30", endTime: "2026-10-01T11:00:00+05:30" },
      { _id: "c3", startTime: "2026-10-01T12:00:00+05:30", endTime: "nope" },
    ], { isLive: false });
    const s = await getHostLiveStats("h5", { now, useCache: false });
    assert.deepStrictEqual([s.totalSessions, s.totalLiveSeconds], [0, 0]);
  });
  console.log(`\n${n} checks passed`);
})();
