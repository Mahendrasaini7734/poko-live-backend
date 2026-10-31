/**
 * Integration test: Host Daily Task / live-session lifecycle  +  Admin Live Command Center.
 *   npm run test:commandcenter          (no MongoDB, no network)
 *
 * Runs the REAL services/liveSession.service.js and services/liveAnalytics.service.js (incl. the real
 * admin endRoom) over in-memory stand-ins for the models, and checks that every way a live ends
 *   host End Live / socket disconnect / stale reaper / new-live cleanup / ADMIN end-room
 * produces exactly ONE closed session, ONE END_ROOM audit row with the right actor, ONE ROOM_END
 * event, a Daily Task refresh, and that duplicates / races / foreign hosts change nothing.
 */
const Module = require("module");
const path = require("path");
const assert = require("assert");
const ROOT = path.join(__dirname, "..");

// ------------------------------------------------------------------ fake mongoose / ids
let seq = 0;
const hex = () => (++seq).toString(16).padStart(24, "0");
class ObjectId {
  constructor(v) { this.v = v ? String(v) : hex(); }
  toString() { return this.v; }
  toJSON() { return this.v; }
  static isValid(v) { return /^[0-9a-f]{24}$/i.test(String(v)); }
}
const S = (x) => (x === null || x === undefined ? x : String(x));

// ------------------------------------------------------------------ fake DB
const db = { hosts: [], histories: [], broadcasters: [], views: [], audit: new Map(), auditRows: [], sessionsClosed: [], dailyRefresh: [] };
const matchOpen = (h) => h.endTime === "" || h.endTime === null || h.endTime === undefined;
const matchDoc = (doc, f) =>
  Object.entries(f || {}).every(([k, v]) => {
    if (k === "$or") return v.some((x) => matchDoc(doc, x));
    if (v && typeof v === "object" && "$in" in v) return v.$in.map(S).includes(S(doc[k]));
    if (v && typeof v === "object" && "$exists" in v) return (doc[k] !== undefined) === v.$exists;
    return S(doc[k]) === S(v);
  });
const chain = (get) => { const o = { select: () => o, sort: () => o, limit: () => o, lean: async () => get(), then: (r, j) => Promise.resolve(get()).then(r, j) }; return o; };
const clone = (d) => (d ? { ...d } : d);

const models = {
  "host.model": {
    findById: (id) => chain(() => clone(db.hosts.find((h) => S(h._id) === S(id)))),
    find: (f) => chain(() => db.hosts.filter((h) => matchDoc(h, f)).map(clone)),
    updateOne: async (f, u) => { const h = db.hosts.find((x) => matchDoc(x, f)); if (!h) return { modifiedCount: 0 }; Object.assign(h, u.$set || {}); return { modifiedCount: 1 }; },
  },
  "liveBroadcastHistory.model": {
    findById: (id) => chain(() => clone(db.histories.find((h) => S(h._id) === S(id)))),
    find: (f) => chain(() => db.histories.filter((h) => matchDoc(h, f)).map(clone)),
    // the ATOMIC gate: only the first caller can flip an open session to closed
    findOneAndUpdate: (f, u) => chain(() => {
      const h = db.histories.find((x) => S(x._id) === S(f._id) && matchOpen(x));
      if (!h) return null;
      Object.assign(h, u.$set); return clone(h);
    }),
    updateOne: async () => ({}),
  },
  "liveBroadcaster.model": {
    find: () => chain(() => db.broadcasters.map(clone)),
    findOne: (f) => chain(() => clone(db.broadcasters.find((b) => matchDoc(b, f)))),
    exists: async (f) => (db.broadcasters.some((b) => matchDoc(b, f)) ? { _id: 1 } : null),
    deleteOne: async (f) => { const i = db.broadcasters.findIndex((b) => matchDoc(b, f)); if (i >= 0) db.broadcasters.splice(i, 1); return {}; },
  },
  "liveBroadcastView.model": {
    find: (f) => chain(() => db.views.filter((v) => matchDoc(v, f)).map(clone)),
    findOne: (f) => chain(() => clone(db.views.find((v) => matchDoc(v, f)))),
    deleteMany: async (f) => { db.views = db.views.filter((v) => !matchDoc(v, f)); return {}; },
  },
  "liveSession.model": {
    collection: { updateMany: async (f) => { db.sessionsClosed.push(S(f.roomId)); return {}; }, bulkWrite: async () => ({}), insertMany: async () => ({}) },
    find: () => chain(() => []), findOne: () => chain(() => null), countDocuments: async () => 0, aggregate: async () => [],
  },
  "liveAdminAudit.model": {
    updateOne: async (f, u) => { if (db.audit.has(f.dedupeKey)) return { upsertedCount: 0 }; db.audit.set(f.dedupeKey, u.$setOnInsert); return { upsertedCount: 1 }; },
    create: async (d) => { db.auditRows.push(d); },
    exists: async (q) => (db.audit.has(q.dedupeKey) ? { _id: 1 } : null),
  },
  "liveComment.model": { create: async () => ({}), countDocuments: async () => 0 },
  "history.model": { aggregate: async () => [], countDocuments: async () => 0 },
  "room.model": { find: () => chain(() => []), findById: () => chain(() => null) },
  "participant.model": { find: () => chain(() => []), updateMany: async () => ({}) },
  "user.model": { find: () => chain(() => []), findById: () => chain(() => null) },
  "admin.model": {}, "gift.model": { find: () => chain(() => []), findById: () => chain(() => null) },
};

const shim = require("./helpers/moment-ist-shim");
const originalLoad = Module._load;
Module._load = function (req, parent, ...rest) {
  if (req === "mongoose") return { Types: { ObjectId }, Schema: class {}, model: () => ({}) };
  if (req === "moment-timezone") return shim;
  if (req.endsWith("util/media")) return { getMediaUrl: (x) => x };
  if (/(^|\/)dailyTask\.service$/.test(req)) return { triggerRefresh: (hostId, source) => db.dailyRefresh.push({ hostId: S(hostId), source }) };
  const m = /models\/(.+)$/.exec(req);
  if (m && models[m[1]]) return models[m[1]];
  return originalLoad.call(this, req, parent, ...rest);
};

// fake socket.io server
const emitted = [];
const mkIo = () => {
  const target = (room) => ({ emit: (ev, data) => emitted.push({ room, ev, data }) });
  return { in: target, to: target, socketsLeave: (r) => emitted.push({ ev: "socketsLeave", room: r }), sockets: { adapter: { rooms: new Map() } }, emit: () => {} };
};
global.io = mkIo();
global.emitHostStatusUpdate = () => {};

const liveSession = require(path.join(ROOT, "services/liveSession.service.js"));
const analytics = require(path.join(ROOT, "services/liveAnalytics.service.js"));

// ------------------------------------------------------------------ helpers
const HOST = "a".repeat(24), HOST2 = "b".repeat(24);
const newLive = (hostId = HOST, name = "Riya") => {
  // each scenario starts from a clean slate for this host
  db.hosts = db.hosts.filter((h) => S(h._id) !== hostId);
  db.histories = db.histories.filter((h) => S(h.hostId) !== hostId);
  db.broadcasters = db.broadcasters.filter((b) => S(b.hostId) !== hostId);
  const hist = { _id: hex(), hostId, startTime: new Date(Date.now() - 5 * 60000).toISOString(), endTime: "", duration: "00:00:00" };
  db.histories.push(hist);
  db.hosts.push({ _id: hostId, name, uniqueId: "79129216", userId: "c".repeat(24), isLive: true, liveHistoryId: hist._id });
  db.broadcasters.push({ hostId, liveHistoryId: hist._id });
  return S(hist._id);
};
const settle = () => new Promise((r) => setTimeout(r, 60));
const reset = () => { db.audit.clear(); db.auditRows.length = 0; db.sessionsClosed.length = 0; db.dailyRefresh.length = 0; emitted.length = 0; };
const endRows = (id) => db.audit.get(`END_ROOM:${id}`);
const feedEnds = (id) => analytics.getActivity().filter((e) => e.type === "roomEnded" && e.roomId === id);
const results = [];
const ok = (name) => { results.push(name); console.log(`  ✓ ${name}`); };

(async () => {
  const log = console.log; // keep service chatter out of the report
  const quiet = (fn) => async (...a) => { console.log = () => {}; try { return await fn(...a); } finally { console.log = log; } };

  await quiet(async () => {})();
  console.log("Merged Daily Task + Command Center lifecycle");

  // 1. host presses End Live
  let id = newLive(); reset();
  let r = await quiet(liveSession.finalizeLiveSession)({ hostId: HOST, historyId: id, reason: "liveStreamEnd" }); await settle();
  assert.equal(r.finalized, true);
  assert.notEqual(db.histories.find((h) => S(h._id) === id).endTime, "");
  assert.equal(db.hosts[0].isLive, false); assert.equal(db.broadcasters.length, 0);
  assert.equal(endRows(id).action, "END_ROOM"); assert.equal(endRows(id).actorType, "host"); assert.equal(endRows(id).actorName, "Riya"); assert.equal(endRows(id).metadata.endedBy, "host");
  assert.equal(feedEnds(id).length, 1); assert(db.sessionsClosed.includes(id), "participant sessions finalized");
  assert(db.dailyRefresh.some((x) => x.hostId === HOST), "daily task refreshed");
  ok("host End Live: session closed, END_ROOM(host) audit, ROOM_END event, durations finalized, Daily Task refreshed");

  // 2. end pressed again / disconnect / HTTP fallback afterwards -> nothing changes
  const endTimeBefore = db.histories.find((h) => S(h._id) === id).endTime; reset();
  for (const reason of ["liveStreamEnd", "socket-disconnect", "http-end"]) await quiet(liveSession.finalizeLiveSession)({ hostId: HOST, historyId: id, reason });
  await settle();
  assert.equal(db.histories.find((h) => S(h._id) === id).endTime, endTimeBefore, "endTime never overwritten");
  assert.equal(db.audit.size, 0, "no duplicate audit"); assert.equal(feedEnds(id).length, 1, "still one ROOM_END");
  ok("repeated End / disconnect / HTTP end: endTime frozen, no duplicate audit or event");

  // 3. disconnect and stale reaper
  id = newLive(); reset();
  await quiet(liveSession.finalizeLiveSession)({ hostId: HOST, historyId: id, reason: "socket-disconnect" }); await settle();
  assert.equal(endRows(id).actorType, "host"); assert.equal(endRows(id).metadata.endedBy, "host_disconnected");
  id = newLive(); reset();
  await quiet(liveSession.finalizeLiveSession)({ hostId: HOST, historyId: id, reason: "stale-timeout" }); await settle();
  assert.equal(endRows(id).actorType, "system"); assert.equal(endRows(id).metadata.endedBy, "stale_timeout"); assert(/heartbeat/i.test(endRows(id).reason));
  ok("socket disconnect -> host_disconnected; stale reaper -> System actor with reason");

  // 4. another host cannot end it
  id = newLive(); reset();
  r = await quiet(liveSession.finalizeLiveSession)({ hostId: HOST2, historyId: id, reason: "liveStreamEnd" }); await settle();
  assert.equal(r.notOwner, true); assert.equal(db.audit.size, 0); assert.equal(db.hosts.find((h) => S(h._id) === HOST).isLive, true);
  ok("foreign host cannot end the room: nothing closed, nothing audited");

  // 5. start of a new live closes the orphan and logs it as System
  id = newLive(); reset();
  const closed = await quiet(liveSession.finalizeOpenSessionsForHost)(HOST, "new-live-start"); await settle();
  assert.equal(closed, 1); assert.equal(endRows(id).actorType, "system"); assert.equal(endRows(id).metadata.endedBy, "superseded");
  ok("new live start closes the orphaned session (System), counted once");

  // 6. ADMIN ends a live broadcast through the real endRoom
  id = newLive(); reset();
  const admin = { _id: "d".repeat(24), email: "admin@gmail.com" };
  r = await quiet(analytics.endRoom)(id, admin, "policy"); await settle();
  assert.equal(r.ok, true, JSON.stringify(r)); assert.equal(r.data.status, "ended");
  assert.notEqual(db.histories.find((h) => S(h._id) === id).endTime, ""); assert.match(db.histories.find((h) => S(h._id) === id).duration, /^\d\d:\d\d:\d\d$/);
  assert.equal(db.hosts[0].isLive, false); assert.equal(db.broadcasters.length, 0);
  assert.equal(endRows(id).actorType, "admin"); assert.equal(endRows(id).adminEmail, "admin@gmail.com"); assert.equal(endRows(id).reason, "policy");
  assert.equal(feedEnds(id).length, 1); assert.equal(feedEnds(id)[0].data.actorType, "admin");
  assert(db.dailyRefresh.some((x) => x.hostId === HOST), "admin-ended live still feeds the host's Daily Task");
  assert(emitted.some((e) => e.ev === "liveStreamEnd" && e.data.endedBy === "admin"), "app clients are told");
  ok("ADMIN end-room: same atomic close, END_ROOM(admin) audit, ROOM_END event, Daily Task refreshed, clients notified");

  // 7. admin retry on the finished room -> 409 and NO extra audit row
  const rows = db.audit.size; r = await quiet(analytics.endRoom)(id, admin, "again");
  assert.equal(r.ok, false); assert.equal(r.status, 409); assert.equal(db.audit.size, rows); assert.equal(db.auditRows.length, 0);
  ok("admin retry on an ended room: 409, no duplicate audit");

  // 8. race: host End Live and admin end-room at the same instant
  id = newLive(); reset();
  const [a, b] = await Promise.all([
    quiet(liveSession.finalizeLiveSession)({ hostId: HOST, historyId: id, reason: "liveStreamEnd" }),
    quiet(analytics.endRoom)(id, admin, ""),
  ]); await settle();
  assert.equal([a.finalized, b.ok].filter(Boolean).length, 1, "exactly one winner");
  assert.equal([...db.audit.keys()].filter((k) => k.startsWith("END_ROOM:")).length, 1, "exactly one END_ROOM audit");
  assert.equal(feedEnds(id).length, 1);
  ok("host + admin end at the same time: one winner, one END_ROOM audit, one ROOM_END");

  // 9. START_ROOM once
  id = newLive(); reset();
  await analytics.recordRoomStart({ roomId: id, hostId: HOST, hostName: "Riya" }); await analytics.recordRoomStart({ roomId: id, hostId: HOST, hostName: "Riya" });
  assert.equal([...db.audit.keys()].filter((k) => k.startsWith("START_ROOM:")).length, 1); assert.equal(db.audit.get(`START_ROOM:${id}`).actorType, "host");
  ok("START_ROOM(host) written once");

  console.log(`\nALL ${results.length} INTEGRATION ASSERTIONS PASSED`);
  setTimeout(() => process.exit(0), 100);
})().catch((e) => { console.error("\nFAIL:", e.stack); process.exit(1); });
