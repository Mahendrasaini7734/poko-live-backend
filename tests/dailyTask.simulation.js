/**
 * Offline simulation of the Daily LIVE Task (no MongoDB needed).
 *   DAILY_TASK_TARGET_MINUTES=12 DAILY_TASK_UPDATE_INTERVAL_MINUTES=3 node tests/dailyTask.simulation.js
 * Runs the REAL service code against in-memory stand-ins for the models.
 */
process.env.DAILY_TASK_TARGET_MINUTES = process.env.DAILY_TASK_TARGET_MINUTES || "12";
process.env.DAILY_TASK_UPDATE_INTERVAL_MINUTES = process.env.DAILY_TASK_UPDATE_INTERVAL_MINUTES || "3";
process.env.DAILY_TASK_REWARD_COINS = process.env.DAILY_TASK_REWARD_COINS || "1000";

const Module = require("module");
const path = require("path");
const assert = require("assert");
let moment;
try { moment = require("moment-timezone"); } catch (e) { moment = require("./helpers/moment-ist-shim"); }

// ---------------------------------------------------------------- fake clock
let now = moment.tz("2026-10-04 10:00:00", "Asia/Kolkata").valueOf();
const realNow = Date.now;
Date.now = () => now;
const advance = (sec) => { now += sec * 1000; };

// ------------------------------------------------------------ tiny fake DB
let seq = 0;
const newId = () => `id${++seq}`;
const match = (doc, filter) =>
  Object.entries(filter || {}).every(([k, v]) => {
    if (k === "$or") return v.some((f) => match(doc, f));
    const val = doc[k];
    if (v && typeof v === "object" && !(v instanceof Date)) {
      if ("$gte" in v && !(val >= v.$gte)) return false;
      if ("$lt" in v && !(val < v.$lt)) return false;
      if ("$nin" in v && v.$nin.includes(val)) return false;
      if ("$ne" in v && val === v.$ne) return false;
      if ("$exists" in v && (val !== undefined) !== v.$exists) return false;
      return true;
    }
    return String(val) === String(v);
  });
const q = (get) => { const o = { select: () => o, lean: async () => get(), then: (r, j) => Promise.resolve(get()).then(r, j) }; return o; };

const hosts = [], lives = [], tasks = [], rewards = [], histories = [];
const clone = (d) => (d ? JSON.parse(JSON.stringify(d)) : d);
const dupErr = () => Object.assign(new Error("E11000"), { code: 11000 });

const Host = {
  findById: (id) => q(() => clone(hosts.find((h) => h._id === String(id)))),
  find: (f) => q(() => clone(hosts.filter((h) => match(h, f)))),
  findOne: (f) => q(() => clone(hosts.find((h) => match(h, f)))),
  updateOne: async (f, u) => {
    const h = hosts.find((x) => match(x, f));
    if (!h) return { modifiedCount: 0 };
    if (u.$inc) Object.entries(u.$inc).forEach(([k, v]) => (h[k] += v));
    if (u.$set) Object.assign(h, u.$set);
    return { modifiedCount: 1 };
  },
};
const LiveBroadcastHistory = {
  findOneAndUpdate: (f, u) => q(() => {
    const l = lives.find((x) => match(x, f));
    if (!l) return null;
    Object.assign(l, u.$set); l.updatedAt = new Date(Date.now());
    return clone(l);
  }),
  updateOne: async (f, u) => { const l = lives.find((x) => match(x, f)); if (l) Object.assign(l, u.$set); return {}; },
  find: (f) => q(() => clone(lives.filter((l) => match(l, f)))),
  findById: (id) => q(() => clone(lives.find((l) => l._id === String(id)))),
};
const HostDailyTask = {
  findOneAndUpdate: (f, u, o = {}) => q(() => {
    let t = tasks.find((x) => match(x, f));
    if (!t && o.upsert) { t = { _id: newId(), ...f, ...(u.$setOnInsert || {}) }; tasks.push(t); }
    if (t && u.$set) Object.assign(t, u.$set);
    return clone(t);
  }),
  updateOne: async (f, u) => { const t = tasks.find((x) => match(x, f)); if (t) Object.assign(t, u.$set); return { modifiedCount: t ? 1 : 0 }; },
};
const HostDailyTaskReward = {
  findOne: (f) => q(() => clone(rewards.find((r) => match(r, f)))),
  create: async (d) => {
    const doc = Array.isArray(d) ? d[0] : d;
    if (rewards.some((r) => r.hostId === String(doc.hostId) && r.taskDate === doc.taskDate && r.taskType === doc.taskType)) throw dupErr();
    const r = { _id: newId(), ...doc, hostId: String(doc.hostId) }; rewards.push(r); return r;
  },
  updateOne: async (f, u) => { const r = rewards.find((x) => x._id === f._id); if (r) Object.assign(r, u.$set); return {}; },
  deleteOne: async (f) => { const i = rewards.findIndex((x) => x._id === f._id); if (i >= 0) rewards.splice(i, 1); return {}; },
};
const History = { create: async (d) => { const h = { _id: newId(), ...d }; histories.push(h); return h; } };

const stubs = {
  "models/host.model": Host,
  "models/history.model": History,
  "models/liveBroadcastHistory.model": LiveBroadcastHistory,
  "models/liveBroadcaster.model": { deleteOne: async () => ({}) },
  "models/liveBroadcastView.model": { deleteMany: async () => ({}) },
  "models/hostDailyTask.model": HostDailyTask,
  "models/hostDailyTaskReward.model": HostDailyTaskReward,
  "util/generateHistoryUniqueId": async () => "H" + newId(),
};
const root = path.join(__dirname, "..");
const origLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (parent && parent.filename && parent.filename.startsWith(root)) {
    const abs = request.startsWith(".") ? path.relative(root, path.resolve(path.dirname(parent.filename), request)) : null;
    if (abs && stubs[abs]) return stubs[abs];
  }
  if (request === "moment-timezone" && moment && moment.ISO_8601 === "ISO_8601") return moment;
  if (request === "mongoose") {
    return { startSession: async () => { throw new Error("Transaction numbers are only allowed on a replica set"); }, Schema: class {}, model: () => ({}) };
  }
  return origLoad.call(this, request, parent, ...rest);
};

// -------------------------------------------------------------- capture emit
const emitted = [];
global.io = { to: (room) => ({ emit: (ev, payload) => emitted.push({ room, ev, payload }) }) };

const svc = require("../services/dailyTask.service");

// -------------------------------------------------------------- live helpers
const HOST = "host1";
hosts.push({ _id: HOST, isLive: false, liveHistoryId: null, isBlock: false, status: 2, coin: 0 });
const HOST2 = "host2";
hosts.push({ _id: HOST2, isLive: false, liveHistoryId: null, isBlock: false, status: 2, coin: 0 });
const fmt = (ms) => moment(ms).tz("Asia/Kolkata").format();
const hhmmss = (s) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");

const startLive = async () => {
  const l = { _id: newId(), hostId: HOST, startTime: fmt(now), endTime: "", duration: "00:00:00", createdAt: new Date(now), updatedAt: new Date(now) };
  lives.push(l);
  Object.assign(hosts[0], { isLive: true, liveHistoryId: l._id });
  return svc.refreshHostDailyTask(HOST);
};
const endLive = async () => {
  const l = lives.find((x) => x._id === hosts[0].liveHistoryId);
  l.endTime = fmt(now); l.updatedAt = new Date(now);
  l.duration = hhmmss(Math.floor((now - moment.tz(l.startTime, "Asia/Kolkata").valueOf()) / 1000));
  Object.assign(hosts[0], { isLive: false, liveHistoryId: null });
  return svc.refreshHostDailyTask(HOST);
};
const get = () => svc.refreshHostDailyTask(HOST).then((r) => r.payload);

(async () => {
  const T = Number(process.env.DAILY_TASK_TARGET_MINUTES);
  let r, p;
  console.log(`target=${T} interval=${process.env.DAILY_TASK_UPDATE_INTERVAL_MINUTES}min reward=${process.env.DAILY_TASK_REWARD_COINS}`);

  p = await get();
  assert.strictEqual(p.completedMinutes, 0); assert.strictEqual(p.status, "not_started");
  console.log("0 min        ->", `${p.completedMinutes}/${p.targetMinutes}`, p.status);

  // sessions 1..3: 3 minutes each, NEVER resets
  for (let i = 1; i <= 3; i++) {
    r = await startLive();
    assert.strictEqual(r.payload.completedMinutes, (i - 1) * 3, `session ${i} start must keep progress`);
    assert.strictEqual(r.payload.isLive, true);
    advance(90); p = await get();            // mid-session (active time included)
    assert.strictEqual(p.totalSeconds, (i - 1) * 180 + 90);
    advance(90);
    r = await endLive();
    assert.strictEqual(r.payload.completedMinutes, i * 3, `session ${i} end`);
    assert.strictEqual(r.payload.isLive, false);
    console.log(`session ${i} end ->`, `${r.payload.completedMinutes}/${r.payload.targetMinutes}`, r.payload.status, r.payload.percentage + "%");
  }

  // regression for "progress went back to 0 after LIVE ended":
  // (a) stored duration is 00:00:00 but start/end are real -> falls back to endTime-startTime
  // (b) session left open (host reset without endTime) -> counted up to its last write
  // (c) even if history vanished, stored progress is never lowered
  {
    const savedLives = lives.splice(0, lives.length);
    const savedTasks = tasks.splice(0, tasks.length); // isolate from the stored-progress floor
    const t0 = now;
    lives.push({ _id: newId(), hostId: HOST, startTime: fmt(t0 - 600000), endTime: fmt(t0 - 240000), duration: "00:00:00", createdAt: new Date(t0 - 600000), updatedAt: new Date(t0 - 240000) }); // 360s
    p = await get();
    assert.strictEqual(p.totalSeconds, 360, "zero-duration session recovered");
    lives.push({ _id: newId(), hostId: HOST, startTime: fmt(t0 - 100000), endTime: "", duration: "00:00:00", createdAt: new Date(t0 - 100000), updatedAt: new Date(t0 - 40000) }); // orphan 60s
    p = await get();
    assert.ok(p.totalSeconds >= 420, "orphan counted (360 + 60)");
    lives.splice(0, lives.length);                       // history lost
    p = await get();
    assert.ok(p.completedMinutes >= 7, "never lowered");
    lives.push(...savedLives);
    tasks.splice(0, tasks.length, ...savedTasks);
    console.log("regression    -> zero-duration / orphan / lost-history all keep progress");
  }

  // "app restart" = fresh GET, same value
  p = await get(); assert.strictEqual(p.completedMinutes, 9); console.log("app restart  ->", `${p.completedMinutes}/${p.targetMinutes}`);

  // session 4 completes + reward once
  r = await startLive(); assert.strictEqual(r.payload.completedMinutes, 9);
  advance(180); r = await get();
  assert.strictEqual(r.status, "completed"); assert.strictEqual(r.completedMinutes, T);
  assert.strictEqual(r.percentage, 100); assert.strictEqual(r.rewardClaimed, true);
  assert.strictEqual(hosts[0].coin, 1000);
  console.log("session 4    ->", `${r.completedMinutes}/${r.targetMinutes}`, r.status, "rewardClaimed=" + r.rewardClaimed, "coins=" + hosts[0].coin);

  // keep LIVE 30 more minutes: capped, no 2nd reward; spam concurrent refreshes
  advance(1800);
  await Promise.all([get(), get(), get(), svc.refreshHostDailyTask(HOST)]);
  p = await get();
  assert.strictEqual(p.completedMinutes, T); assert.strictEqual(p.totalSeconds, T * 60);
  assert.strictEqual(hosts[0].coin, 1000); assert.strictEqual(rewards.length, 1);
  assert.strictEqual(emitted.filter((e) => e.ev === "dailyTaskReward").length, 1);
  assert.ok(emitted.every((e) => e.room === `hostDailyTask:${HOST}`));
  console.log("over-complete ->", `${p.completedMinutes}/${p.targetMinutes}`, "coins=" + hosts[0].coin, "rewards=" + rewards.length);

  await endLive(); p = await get();
  assert.strictEqual(p.completedMinutes, T); assert.strictEqual(tasks.length, 1);

  // ISOLATION: host1 finished, host2 must stay untouched (own progress, own reward, own room)
  {
    const p2 = (await svc.refreshHostDailyTask(HOST2)).payload;
    assert.strictEqual(p2.hostId, HOST2); assert.strictEqual(p2.completedMinutes, 0);
    assert.strictEqual(p2.status, "not_started"); assert.strictEqual(p2.rewardClaimed, false);
    assert.strictEqual(hosts[1].coin, 0);
    assert.ok(emitted.filter((e) => e.payload && e.payload.hostId === HOST).every((e) => e.room === `hostDailyTask:${HOST}`));
    assert.ok(emitted.filter((e) => e.payload && e.payload.hostId === HOST2).every((e) => e.room === `hostDailyTask:${HOST2}`));
    assert.ok(emitted.filter((e) => e.ev === "dailyTaskReward").every((e) => e.payload.hostId === HOST));
    console.log("isolation     -> host1 12/12 completed, host2", `${p2.completedMinutes}/${p2.targetMinutes}`, p2.status, "(separate rooms)");
  }

  // new day -> new task at 0
  now = moment.tz("2026-10-05 00:05:00", "Asia/Kolkata").valueOf();
  p = await get();
  assert.strictEqual(p.taskDate, "2026-10-05"); assert.strictEqual(p.completedMinutes, 0);
  assert.strictEqual(p.rewardClaimed, false); assert.strictEqual(tasks.filter((t) => String(t.hostId) === HOST).length, 2); // host1: day 1 + day 2
  console.log("new day      ->", p.taskDate, `${p.completedMinutes}/${p.targetMinutes}`, p.status);

  // scheduler honours DAILY_TASK_UPDATE_INTERVAL_MINUTES while LIVE
  const IV = Number(process.env.DAILY_TASK_UPDATE_INTERVAL_MINUTES);
  await startLive();                              // emit @0
  await svc.schedulerTick();                      // same minute: nothing
  advance(60); await svc.schedulerTick();         // not_started -> in_progress: emit (state change)
  let mark = emitted.length;
  const gaps = [];
  for (let m = 1; m <= IV; m++) {                 // after that: silent until the interval has passed
    advance(60); const b4 = emitted.length; await svc.schedulerTick(); gaps.push(emitted.length - b4);
  }
  console.log("scheduler emits per minute after a state change:", gaps.join(","), `(interval ${IV} min)`);
  assert.strictEqual(gaps.slice(0, IV - 1).every((n) => n === 0), true);
  assert.strictEqual(gaps[IV - 1], 1);

  // ======================================================================
  // LIVE SESSION LIFECYCLE (finalize / heartbeat / reaper)  - host3
  // ======================================================================
  {
    const ls = require("../services/liveSession.service");
    // earlier scenarios left host1/host2 flagged live; end them properly first
    for (const h of hosts) if (h.isLive) await ls.finalizeLiveSession({ hostId: h._id, historyId: h.liveHistoryId, reason: "test-cleanup" });
    now = moment.tz("2026-10-07 09:00:00", "Asia/Kolkata").valueOf();
    hosts.push({ _id: "host3", isLive: false, liveHistoryId: null, isBlock: false, status: 2, coin: 500 });
    const H3 = hosts[hosts.length - 1];
    const goLive = async (id = "host3") => {
      const h = hosts.find((x) => x._id === id);
      const l = { _id: newId(), hostId: id, startTime: fmt(now), endTime: "", duration: "00:00:00", createdAt: new Date(now), updatedAt: new Date(now), lastHeartbeatAt: null };
      lives.push(l); Object.assign(h, { isLive: true, liveHistoryId: l._id });
      return l;
    };
    const live3 = (id) => lives.find((x) => x._id === id);
    const get3 = () => svc.refreshHostDailyTask("host3").then((r) => r.payload);

    // 1) End Live pressed twice (60s apart) -> ONE finalization, duration frozen at first end
    let l = await goLive(); advance(240);
    let r1 = await ls.finalizeLiveSession({ hostId: "host3", historyId: l._id, reason: "liveStreamEnd" });
    advance(60);
    let r2 = await ls.finalizeLiveSession({ hostId: "host3", historyId: l._id, reason: "liveStreamEnd" });
    assert.strictEqual(r1.finalized, true); assert.strictEqual(r2.finalized, false); assert.strictEqual(r2.alreadyEnded, true);
    assert.strictEqual(live3(l._id).duration, "00:04:00"); assert.strictEqual(H3.isLive, false); assert.strictEqual(H3.liveHistoryId, null);
    p = await get3(); assert.strictEqual(p.completedMinutes, 4);
    console.log("lifecycle 1   -> double End Live: finalized once, duration", live3(l._id).duration, `task ${p.completedMinutes}/${p.targetMinutes}`);

    // 2) three concurrent end requests (End + disconnect + HTTP) -> exactly one winner
    l = await goLive(); advance(180);
    const res = await Promise.all([
      ls.finalizeLiveSession({ hostId: "host3", historyId: l._id, reason: "liveStreamEnd" }),
      ls.finalizeLiveSession({ hostId: "host3", historyId: l._id, reason: "socket-disconnect" }),
      ls.finalizeLiveSession({ hostId: "host3", historyId: l._id, reason: "http-end" }),
    ]);
    assert.strictEqual(res.filter((x) => x.finalized).length, 1);
    p = await get3(); assert.strictEqual(p.completedMinutes, 7);
    console.log("lifecycle 2   -> 3 concurrent ends: winners =", res.filter((x) => x.finalized).length, `task ${p.completedMinutes}/${p.targetMinutes}`);

    // 3) a host cannot end somebody else's session
    const other = await ls.finalizeLiveSession({ hostId: "host2", historyId: l._id });
    assert.strictEqual(other.notOwner, true);

    // 4) late end must not clobber a NEWER session of the same host
    const old = l; l = await goLive();
    await ls.finalizeLiveSession({ hostId: "host3", historyId: old._id, reason: "late" });
    assert.strictEqual(H3.isLive, true); assert.strictEqual(String(H3.liveHistoryId), String(l._id));
    console.log("lifecycle 3   -> late end of an old session leaves the new LIVE running");

    // 5) heartbeat-aware app killed: no heartbeat for >120s -> reaper ends it at the LAST heartbeat
    await ls.recordHeartbeat("host3");           // t0 heartbeat written
    advance(30); await ls.recordHeartbeat("host3"); // +30s
    advance(400);                                  // app killed, nothing arrives
    const reaped = await ls.reapStaleSessions();
    assert.strictEqual(reaped, 1); assert.strictEqual(H3.isLive, false);
    assert.strictEqual(live3(l._id).endReason, "stale-timeout");
    assert.strictEqual(live3(l._id).duration, "00:00:30", "ended at last heartbeat, no invented minutes");
    console.log("lifecycle 4   -> killed app: reaped at last heartbeat, duration", live3(l._id).duration);

    // 6) legacy app (no heartbeat), socket online -> NOT reaped; socket gone for >120s -> reaped
    global.io.sockets = { adapter: { rooms: new Map([["hostDailyTask:host3", new Set(["s1"])]]) } };
    l = await goLive(); advance(60);
    assert.strictEqual(await ls.reapStaleSessions(), 0); assert.strictEqual(H3.isLive, true);
    global.io.sockets.adapter.rooms.clear();       // socket vanished (offline / server restarted)
    await ls.reapStaleSessions();                  // marks offline-since
    advance(130);
    assert.strictEqual(await ls.reapStaleSessions(), 1); assert.strictEqual(H3.isLive, false);
    console.log("lifecycle 5   -> legacy app: kept while socket online, reaped after offline grace");
    delete global.io.sockets;

    // 7) starting a new LIVE closes an orphaned one (keeps its proven minutes, no double count)
    const orphan = await goLive(); advance(240); orphan.lastHeartbeatAt = new Date(now - 60000); // proven 3 min
    H3.isLive = false; H3.liveHistoryId = null;    // host flags were reset elsewhere, history left open
    const closed = await ls.finalizeOpenSessionsForHost("host3", "new-live-start");
    assert.strictEqual(closed, 1); assert.strictEqual(live3(orphan._id).duration, "00:03:00");
    console.log("lifecycle 6   -> orphan closed on next start at", live3(orphan._id).duration);

    // 8) full day for host3: reward once + wallet event once; extra LIVE adds nothing
    const before = emitted.length;
    l = await goLive(); advance(60 * 60); // way past target
    p = await get3();
    assert.strictEqual(p.status, "completed"); assert.strictEqual(p.completedMinutes, T); assert.strictEqual(p.rewardClaimed, true);
    assert.strictEqual(H3.coin, 500 + 1000);
    await Promise.all([get3(), get3(), ls.finalizeLiveSession({ hostId: "host3", historyId: l._id, reason: "liveStreamEnd" })]);
    await get3();
    assert.strictEqual(H3.coin, 1500, "reward exactly once");
    const wallet = emitted.slice(before).filter((e) => e.ev === "walletBalanceUpdated");
    assert.strictEqual(wallet.length, 1); assert.strictEqual(wallet[0].payload.coins, 1500); assert.strictEqual(wallet[0].payload.addedCoins, 1000);
    assert.strictEqual(wallet[0].payload.reason, "DAILY_TASK_REWARD"); assert.strictEqual(wallet[0].room, "hostDailyTask:host3");
    console.log("lifecycle 7   -> completed, coins 500 -> 1500 once, walletBalanceUpdated x1");
  }

  // ======================================================================
  // DAY ROLLOVER + ACTIVE-LIVE GUARD (host4)
  // ======================================================================
  {
    const ls = require("../services/liveSession.service");
    for (const h of hosts) if (h.isLive) await ls.finalizeLiveSession({ hostId: h._id, historyId: h.liveHistoryId, reason: "test-cleanup" });
    hosts.push({ _id: "host4", isLive: false, liveHistoryId: null, isBlock: false, status: 2, coin: 0 });
    const H4 = hosts[hosts.length - 1];

    // payload tells the app WHEN the day changes (single timezone: Asia/Kolkata)
    now = moment.tz("2026-10-08 23:50:00", "Asia/Kolkata").valueOf();
    const pay = (await svc.refreshHostDailyTask("host4")).payload;
    assert.strictEqual(pay.taskDate, "2026-10-08");
    assert.strictEqual(pay.timezone, "Asia/Kolkata");
    assert.strictEqual(new Date(pay.nextResetAt).getTime(), moment.tz("2026-10-09 00:00:00", "Asia/Kolkata").valueOf());
    assert.ok(Math.abs(new Date(pay.serverTime).getTime() - now) < 2000);
    console.log("rollover 1    -> payload nextResetAt =", pay.nextResetAt, "tz", pay.timezone);

    // host with an open app (socket room) gets the NEW day pushed by the first tick after midnight
    global.io.sockets = { adapter: { rooms: new Map([["hostDailyTask:host4", new Set(["s9"])]]) } };
    await svc.schedulerTick();                         // 23:50 -> remembers 2026-10-08
    emitted.length = 0;
    now = moment.tz("2026-10-09 00:00:20", "Asia/Kolkata").valueOf();
    await svc.schedulerTick();                         // first tick of the new day
    const pushed = emitted.filter((e) => e.room === "hostDailyTask:host4" && e.ev === "dailyTaskUpdate");
    assert.strictEqual(pushed.length, 1);
    assert.strictEqual(pushed[0].payload.taskDate, "2026-10-09");
    assert.strictEqual(pushed[0].payload.completedMinutes, 0);
    assert.strictEqual(pushed[0].payload.status, "not_started");
    console.log("rollover 2    -> midnight push to open app: day", pushed[0].payload.taskDate, "0/" + pushed[0].payload.targetMinutes);
    delete global.io.sockets;

    // one ACTIVE live per host: fresh session blocks a second start, a silent one does not
    const lv = { _id: newId(), hostId: "host4", startTime: fmt(now), endTime: "", duration: "00:00:00", createdAt: new Date(now), updatedAt: new Date(now), lastHeartbeatAt: null };
    lives.push(lv); Object.assign(H4, { isLive: true, liveHistoryId: lv._id });
    assert.strictEqual((await ls.checkActiveSession("host4")).active, true, "just started -> active");
    advance(20); await ls.recordHeartbeat("host4");
    advance(30); assert.strictEqual((await ls.checkActiveSession("host4")).active, true, "heartbeat 30s ago -> active");
    advance(60); assert.strictEqual((await ls.checkActiveSession("host4")).active, false, "silent 60s -> dead, a new start may supersede");
    await ls.finalizeLiveSession({ hostId: "host4", historyId: lv._id, reason: "liveStreamEnd" });
    assert.strictEqual((await ls.checkActiveSession("host4")).active, false, "ended -> not active");
    console.log("guard         -> active while alive, superseded when silent, never after End");
  }

  console.log("\nALL ASSERTIONS PASSED");
  Date.now = realNow; process.exit(0);
})().catch((e) => { console.error("FAILED:", e); process.exit(1); });
