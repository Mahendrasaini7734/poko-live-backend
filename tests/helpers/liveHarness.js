/**
 * Test harness for the LIVE module (no MongoDB, no network, no socket.io package needed).
 *
 * It loads the REAL socket.js, services/liveRoom.service.js, services/liveSession.service.js,
 * services/liveSocketHandlers.js and controllers/client/liveBroadcaster.controller.js and puts them
 * on top of
 *   - an in-memory socket.io hub (rooms, except(), fetchSockets(), socketsLeave(), acks)
 *   - in-memory Mongo-like models (find / update operators / upsert / unique indexes / $inc / $max)
 *   - a controllable clock (Date.now) so hours of a live run in milliseconds
 *
 * LIMITS (be honest in reports): this is NOT MongoDB (no real transactions - the gift flow runs its
 * non-transactional path) and NOT the socket.io transport (no real packets / reconnection backoff).
 */
const Module = require("module");
const path = require("path");

// ------------------------------------------------------------------ ids / helpers
let seq = 0;
const hex = () => (++seq).toString(16).padStart(24, "0");
class ObjectId {
  constructor(v) { this.v = v ? String(v) : hex(); }
  toString() { return this.v; }
  toJSON() { return this.v; }
  static isValid(v) { return /^[0-9a-f]{24}$/i.test(String(v)); }
}
const S = (x) => (x === null || x === undefined ? x : String(x));
const isObj = (v) => v && typeof v === "object" && !(v instanceof Date) && !(v instanceof ObjectId);

// ------------------------------------------------------------------ controllable clock
const realNow = Date.now.bind(Date);
let clockOffset = 0;
Date.now = () => realNow() + clockOffset;
const clock = { advance: (ms) => { clockOffset += ms; }, reset: () => { clockOffset = 0; } };

// ------------------------------------------------------------------ in-memory database
const db = {};
const COLLECTIONS = ["users", "hosts", "agencies", "gifts", "histories", "broadcasters", "views", "lives", "comments"];
const resetDb = () => COLLECTIONS.forEach((c) => (db[c] = []));
resetDb();

const val = (v) => (v instanceof Date ? v.getTime() : v);
const matches = (doc, f) =>
  Object.entries(f || {}).every(([k, cond]) => {
    if (k === "$or") return cond.some((x) => matches(doc, x));
    if (k === "$and") return cond.every((x) => matches(doc, x));
    const dv = doc[k];
    if (isObj(cond)) {
      return Object.entries(cond).every(([op, ov]) => {
        switch (op) {
          case "$in": return ov.map(S).includes(S(dv));
          case "$nin": return !ov.map(S).includes(S(dv));
          case "$lt": return val(dv) < val(ov);
          case "$lte": return val(dv) <= val(ov);
          case "$gt": return val(dv) > val(ov);
          case "$gte": return val(dv) >= val(ov);
          case "$ne": return S(dv) !== S(ov);
          case "$exists": return (dv !== undefined) === ov;
          case "$type": return true;
          default: return true;
        }
      });
    }
    if (cond === null) return dv === null || dv === undefined;
    return S(dv) === S(cond);
  });

const applyUpdate = (doc, u, inserting = false) => {
  for (const [k, v] of Object.entries(u.$set || {})) doc[k] = v;
  for (const [k, v] of Object.entries(u.$inc || {})) doc[k] = (Number(doc[k]) || 0) + v;
  for (const [k, v] of Object.entries(u.$max || {})) doc[k] = Math.max(Number(doc[k]) || 0, v);
  if (inserting) for (const [k, v] of Object.entries(u.$setOnInsert || {})) doc[k] = v;
  doc.updatedAt = new Date(Date.now());
};

const chain = (get) => {
  const o = {
    _sort: null, _skip: 0, _limit: Infinity,
    select: () => o,
    sort(s) { o._sort = s; return o; },
    skip(n) { o._skip = n; return o; },
    limit(n) { o._limit = n; return o; },
    lean: () => o,
    then: (res, rej) => Promise.resolve().then(() => {
      let rows = get();
      if (Array.isArray(rows)) {
        if (o._sort) {
          const keys = Object.entries(o._sort);
          rows = rows.slice().sort((a, b) => {
            for (const [k, dir] of keys) {
              const av = val(a[k]), bv = val(b[k]);
              if (av < bv) return -dir; if (av > bv) return dir;
            }
            return 0;
          });
        }
        rows = rows.slice(o._skip, o._skip + o._limit);
        return rows.map((r) => ({ ...r }));
      }
      return rows ? { ...rows } : rows;
    }).then(res, rej),
  };
  return o;
};

/** `unique`: array of field lists; a duplicate insert throws E11000 like MongoDB */
const makeModel = (coll, { unique = [], defaults = () => ({}) } = {}) => {
  const rows = () => db[coll];
  const dup = (doc, ignore) =>
    unique.some((fields) => rows().some((r) => r !== ignore && fields.every((f) => S(r[f]) !== undefined && S(r[f]) !== null && S(r[f]) === S(doc[f]))));
  const insert = (d) => {
    const doc = { _id: new ObjectId(), createdAt: new Date(Date.now()), updatedAt: new Date(Date.now()), ...defaults(), ...d };
    if (dup(doc)) { const e = new Error("E11000 duplicate key"); e.code = 11000; throw e; }
    rows().push(doc);
    return doc;
  };
  // callable like a mongoose model: `new Model(doc)` + `.save()` (used by the HostStreaming controller)
  function Model(d) { Object.assign(this, { _id: new ObjectId(), createdAt: new Date(Date.now()), updatedAt: new Date(Date.now()), ...defaults(), ...d }); }
  Model.prototype.save = async function () { if (dup(this, this)) { const e = new Error("E11000 duplicate key"); e.code = 11000; throw e; } if (!rows().includes(this)) rows().push(this); return this; };
  const statics = {
    findById: (id) => chain(() => rows().find((r) => S(r._id) === S(id)) || null),
    findOne: (f) => chain(() => rows().find((r) => matches(r, f)) || null),
    find: (f) => chain(() => rows().filter((r) => matches(r, f))),
    countDocuments: async (f) => rows().filter((r) => matches(r, f)).length,
    exists: async (f) => (rows().some((r) => matches(r, f)) ? { _id: 1 } : null),
    create: async (d) => (Array.isArray(d) ? d.map(insert) : insert(d)),
    updateOne: async (f, u) => {
      const r = rows().find((x) => matches(x, f));
      if (!r) return { matchedCount: 0, modifiedCount: 0 };
      applyUpdate(r, u);
      return { matchedCount: 1, modifiedCount: 1 };
    },
    updateMany: async (f, u) => { const m = rows().filter((x) => matches(x, f)); m.forEach((r) => applyUpdate(r, u)); return { modifiedCount: m.length }; },
    findOneAndUpdate: (f, u, opts = {}) => chain(() => {
      let r = rows().find((x) => matches(x, f));
      if (!r && opts.upsert) {
        const base = {};
        Object.entries(f).forEach(([k, v]) => { if (!isObj(v) || v instanceof ObjectId) base[k] = v; });
        r = insert({ ...base });
        applyUpdate(r, u, true);
        return r;
      }
      if (!r) return null;
      applyUpdate(r, u);
      return r;
    }),
    findOneAndDelete: (f) => chain(() => {
      const i = rows().findIndex((x) => matches(x, f));
      if (i < 0) return null;
      return rows().splice(i, 1)[0];
    }),
    deleteOne: async (f) => { const i = rows().findIndex((x) => matches(x, f)); if (i >= 0) rows().splice(i, 1); return { deletedCount: i >= 0 ? 1 : 0 }; },
    deleteMany: async (f) => { const before = rows().length; db[coll] = rows().filter((x) => !matches(x, f)); return { deletedCount: before - db[coll].length }; },
    // History.aggregate: only the "host coins of a live" $group used by liveRoom.service
    aggregate: async (pipeline) => {
      const m = pipeline[0].$match;
      const hit = rows().filter((r) => matches(r, m));
      if (!hit.length) return [];
      return [{ _id: null, hostCoins: hit.reduce((a, r) => a + (r.hostCoin || 0), 0), gifts: hit.reduce((a, r) => a + (r.giftCount || 0), 0) }];
    },
  };
  return Object.assign(Model, statics);
};

const models = {
  "user.model": makeModel("users"),
  "host.model": makeModel("hosts"),
  "agency.model": makeModel("agencies"),
  "gift.model": makeModel("gifts"),
  "history.model": makeModel("histories", { unique: [["giftRequestId", "userId"]] }),
  "liveBroadcaster.model": makeModel("broadcasters", { defaults: () => ({ view: 0 }) }),
  "liveBroadcastView.model": makeModel("views", { unique: [["liveHistoryId", "userId"]] }),
  "liveBroadcastHistory.model": makeModel("lives", { defaults: () => ({ endTime: "", duration: "00:00:00", coins: 0, gifts: 0, audienceCount: 0, liveComments: 0, lastHeartbeatAt: null }) }),
  "liveComment.model": makeModel("comments", { unique: [["feedId"]] }),
};
// models socket.js imports but the live flow never needs: harmless null models
const nullModel = new Proxy({}, {
  get: (_t, k) => {
    if (k === "then") return undefined;
    if (k === "findOne" || k === "findById") return () => chain(() => null);
    if (k === "find") return () => chain(() => []);
    if (k === "countDocuments") return async () => 0;
    return async () => ({ modifiedCount: 0 });
  },
});

// ------------------------------------------------------------------ in-memory socket.io hub
const isExcluded = (sock, except) => [...except].some((r) => sock.rooms.has(r));

class FakeSocket {
  constructor(io, handshake) {
    this.io = io;
    this.id = "sock_" + hex().slice(-8);
    this.handshake = handshake;
    this.data = {};
    this.rooms = new Set([this.id]);
    this.handlers = new Map();
    this.anyHandlers = [];
    this.received = [];
    this.connected = true;
    this.disconnectCalls = 0;
    io._register(this);
    io._join(this, this.id);
  }
  // ---- server side API used by the real code
  on(ev, fn) { if (this.handlers.has(ev)) this.handlers.get(ev).push(fn); else this.handlers.set(ev, [fn]); }
  onAny(fn) { this.anyHandlers.push(fn); }
  join(room) { this.io._join(this, room); }
  leave(room) { this.io._leave(this, room); }
  emit(ev, data) { if (this.connected) this.received.push({ ev, data }); } // server -> THIS client
  disconnect() { this.disconnectCalls += 1; this.io.dropSocket(this, "server namespace disconnect"); }
  // ---- client side API used by tests
  /** client -> server, resolves with the ack payload (or undefined when the handler never acks) */
  call(ev, data, timeoutMs = 1500) {
    return new Promise((resolve, reject) => {
      const list = this.handlers.get(ev);
      if (!this.connected) return reject(new Error(`socket ${this.id} is disconnected`));
      if (!list || list.length === 0) return reject(new Error(`NO SERVER HANDLER for "${ev}" on this socket`));
      this.anyHandlers.forEach((f) => f(ev, data));
      const t = setTimeout(() => resolve(undefined), timeoutMs);
      let pending = list.length;
      // resolves with the ack payload; handlers that never ack (e.g. liveHeartbeat) resolve when they finish
      list.forEach((h) =>
        Promise.resolve(h(data, (ack) => { clearTimeout(t); if (--pending <= 0 || ack !== undefined) resolve(ack); }))
          .then(() => { clearTimeout(t); resolve(undefined); })
          .catch(reject)
      );
    });
  }
  eventsOf(ev) { return this.received.filter((r) => r.ev === ev).map((r) => r.data); }
  /** chat messages the client would render (JSON strings parsed) */
  chat() { return this.eventsOf("liveCommentBroadcast").map((d) => (typeof d === "string" ? JSON.parse(d) : d)); }
  ended() { return this.eventsOf("liveStreamEnd").map((d) => (typeof d === "string" ? JSON.parse(d) : d)); }
  clear() { this.received.length = 0; }
}

class Target {
  constructor(io, rooms) { this.io = io; this.rooms = rooms; this.except_ = new Set(); }
  except(r) { (Array.isArray(r) ? r : [r]).forEach((x) => this.except_.add(String(x))); return this; }
  _sockets() {
    const out = new Map();
    for (const r of this.rooms) for (const id of this.io.adapter.rooms.get(String(r)) || []) {
      const s = this.io.all.get(id);
      if (s && s.connected && !isExcluded(s, this.except_)) out.set(id, s);
    }
    return [...out.values()];
  }
  emit(ev, data) { this._sockets().forEach((s) => s.emit(ev, data)); return true; }
  async fetchSockets() { return this._sockets(); }
  socketsLeave(room) { this._sockets().forEach((s) => s.leave(room)); }
}

class FakeIO {
  constructor() {
    this.all = new Map();
    this.adapter = { rooms: new Map() };
    this.sockets = { adapter: this.adapter };
    this.connectionHandler = null;
    this.emittedAll = [];
  }
  on(ev, fn) { if (ev === "connection") this.connectionHandler = fn; }
  in(room) { return new Target(this, [room]); }
  to(room) { return new Target(this, [room]); }
  emit(ev, data) { this.emittedAll.push({ ev, data }); }
  socketsLeave(room) { new Target(this, [room]).socketsLeave(room); }
  async fetchSockets() { return [...this.all.values()].filter((s) => s.connected); }
  _register(s) { this.all.set(s.id, s); }
  _join(s, room) {
    room = String(room);
    s.rooms.add(room);
    if (!this.adapter.rooms.has(room)) this.adapter.rooms.set(room, new Set());
    this.adapter.rooms.get(room).add(s.id);
  }
  _leave(s, room) {
    room = String(room);
    s.rooms.delete(room);
    const set = this.adapter.rooms.get(room);
    if (set) { set.delete(s.id); if (set.size === 0) this.adapter.rooms.delete(room); }
  }
  /** the connection is gone (network loss / app killed / server side disconnect): rooms emptied, server "disconnect" handlers run */
  async dropSocket(s, reason = "transport close") {
    if (!s.connected) return;
    s.connected = false;
    [...s.rooms].forEach((r) => this._leave(s, r));
    for (const h of s.handlers.get("disconnect") || []) await h(reason);
  }
  /** a client connects: runs the REAL connection handler from socket.js */
  async connect({ loginUserId, hostId, isHost, globalRoom }) {
    const s = new FakeSocket(this, {
      url: "/socket.io/",
      query: { globalRoom },
      auth: { loginUserId, hostId, isHost },
    });
    await this.connectionHandler(s);
    return s;
  }
}

// ------------------------------------------------------------------ module wiring
const ROOT = path.join(__dirname, "..", "..");
const shim = require("./moment-ist-shim");
const stubProxy = () => new Proxy(function () {}, {
  get: (_t, k) => (k === "then" ? undefined : k === Symbol.toPrimitive ? () => "stub" : stubProxy()),
  apply: () => stubProxy(),
  construct: () => stubProxy(),
});

/** minimal Command-Center stand-in: same signatures, persists the live chat like the real notifyComment */
const analyticsStub = {
  calls: { ended: [], gifts: [] },
  isAdminHandshake: () => false,
  registerAdminSocket: () => {},
  start: () => {},
  markEnding: () => {},
  recordRoomStart: async () => {},
  onRoomEnded: async (x) => { analyticsStub.calls.ended.push(x); },
  resolveRoomId: async ({ liveHistoryId }) => (ObjectId.isValid(liveHistoryId) ? String(liveHistoryId) : ""),
  notifyComment: async ({ feedId, liveHistoryId, userId, userName, userImage, commentText, isSystemMessage, isHostMessage }) => {
    if (isSystemMessage) return;
    await models["liveComment.model"].create({
      _id: new ObjectId(feedId), feedId, roomId: new ObjectId(liveHistoryId), userId: String(userId || ""),
      name: userName, image: userImage, text: commentText, isHostMessage: isHostMessage === true, createdAt: new Date(Date.now()),
    });
  },
  notifyGift: (g) => analyticsStub.calls.gifts.push(g),
};

const hostRoomName = (id) => `hostDailyTask:${id}`;
const dailyTaskStub = {
  triggerRefresh: () => {},
  startDailyTaskScheduler: () => {},
  onHostSocketConnected: (socket, hostId) => { socket.join(hostRoomName(hostId)); },
};

const fakeMongoose = {
  Types: { ObjectId },
  Schema: class {},
  model: () => ({}),
  // no replica set in the harness -> gifts must take the (compensating) non-transactional path
  startSession: async () => { throw new Error("Transaction numbers are only allowed on a replica set member or mongos"); },
};

const stubbedBySuffix = [
  [/util\/privateKey$/, () => ({ messaging: { sendEachForMulticast: async () => ({ successCount: 0, failureCount: 0, responses: [] }) }, admin: stubProxy() })],
  [/util\/media$/, () => ({ getMediaUrl: (x) => x, getMediaObject: (x) => x })],
  [/util\/agoraToken$/, () => ({ buildToken: () => "tok" })],
  [/util\/generateHistoryUniqueId$/, () => async () => "U" + Math.floor(Math.random() * 1e9)],
  [/(?:^|\/)notification\.service$/, () => stubProxy()],
  [/(?:^|\/)feedRealtime\.service$/, () => ({ registerFeedSocketHandlers: () => {} })],
  [/(?:^|\/)userOnlineNotification\.service$/, () => ({ sendUserOnlineNotificationToHosts: async () => ({}) })],
  [/(?:^|\/)hostOnlineNotifictaions\.service$/, () => ({ sendHostOnlineNotificationToUsers: async () => ({}) })],
  [/(?:^|\/)liveAnalytics\.service$/, () => analyticsStub],
  [/(?:^|\/)dailyTask\.service$/, () => dailyTaskStub],
  [/^agora-access-token$/, () => ({ RtcTokenBuilder: { buildTokenWithUid: () => "agora-token" }, RtcRole: { PUBLISHER: 1, SUBSCRIBER: 2 } })],
];

const originalLoad = Module._load;
Module._load = function (req, parent, ...rest) {
  if (req === "mongoose") return fakeMongoose;
  if (req === "moment-timezone") return shim;
  for (const [re, make] of stubbedBySuffix) if (re.test(req)) return make();
  const m = /(?:^|\/)models\/([^/]+)$/.exec(req);
  if (m) return models[m[1]] || nullModel;
  return originalLoad.call(this, req, parent, ...rest);
};

// ------------------------------------------------------------------ environment
/**
 * @param {string} [root] project root to test (default: this project). Used to run the SAME scenario
 *                        against the ORIGINAL code to prove a bug existed.
 */
const createEnv = (root = ROOT) => {
  const io = new FakeIO();
  global.io = io;
  global.settingJSON = { agoraAppId: "app", agoraAppCertificate: "cert", adminCommissionRate: 10 };
  const hostStatusLog = [];
  const socketModule = require(path.join(root, "socket.js")); // registers global.emitHostStatusUpdate + io.on("connection")
  const realEmitHostStatus = global.emitHostStatusUpdate;
  global.emitHostStatusUpdate = (hostId) => { hostStatusLog.push(String(hostId)); return realEmitHostStatus(hostId); };
  return { io, socketModule, hostStatusLog };
};

// ------------------------------------------------------------------ data builders
const seedUser = (over = {}) => {
  const u = { _id: new ObjectId(), name: "User" + (seq + 1), image: "", gender: "male", country: "india", countryFlagImage: "", coin: 1000, spentCoins: 0, isBlock: false, isOnline: false, ...over };
  db.users.push(u);
  return u;
};
const seedHost = (over = {}) => {
  const owner = seedUser({ name: "HostOwner" });
  const h = { _id: new ObjectId(), userId: owner._id, name: "Riya", status: 2, isBlock: false, isOnline: false, isLive: false, isBusy: false, liveHistoryId: null, coin: 0, totalGifts: 0, country: "india", agencyId: null, ...over };
  db.hosts.push(h);
  return h;
};
const seedGift = (over = {}) => { const g = { _id: new ObjectId(), coin: 100, image: "g.png", svgaImage: "", type: 1, ...over }; db.gifts.push(g); return g; };

/** starts a live exactly like the app: connected host socket + HostStreaming controller */
const startLive = async (env, host) => {
  const controller = require(path.join(ROOT, "controllers/client/liveBroadcaster.controller.js"));
  const res = mkRes();
  await controller.HostStreaming({ query: { hostId: String(host._id), channel: "ch_" + host._id, agoraUID: "1234" } }, res);
  if (!res.body || res.body.status !== true) throw new Error("HostStreaming failed: " + JSON.stringify(res.body));
  const liveHistoryId = String(res.body.data.liveHistoryId);
  return { liveHistoryId, response: res.body };
};
const mkRes = () => {
  const r = { statusCode: 200, body: null, status(c) { r.statusCode = c; return r; }, json(b) { r.body = b; return r; } };
  return r;
};

const connectHost = (env, host) =>
  env.io.connect({ loginUserId: String(host.userId), hostId: String(host._id), isHost: true, globalRoom: `globalRoom:${host._id}` });
const connectViewer = (env, user) =>
  env.io.connect({ loginUserId: String(user._id), isHost: false, globalRoom: `globalRoom:${user._id}` });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = {
  ROOT, db, resetDb, models, ObjectId, S, clock, createEnv, analyticsStub,
  seedUser, seedHost, seedGift, startLive, connectHost, connectViewer, mkRes, sleep, hostRoomName,
};
