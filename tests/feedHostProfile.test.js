/**
 * Offline test: host profile feed preview (max 6 / counts / View-All flag / host isolation)
 * and the server-side "users cannot create feed" authorization.
 *   node tests/feedHostProfile.test.js
 */
const Module = require("module");
const assert = require("assert");
const path = require("path");

const oid = (n) => n.toString(16).padStart(24, "0");
const HOST_A = oid(1), HOST_B = oid(2), USER = oid(50), HOST_USER = oid(60);

// ---------- in-memory data ----------
let posts = [];
let t0 = Date.UTC(2026, 0, 1);
const addPosts = (hostId, type, n) => {
  for (let i = 0; i < n; i++) {
    posts.push({ _id: oid(1000 + posts.length), hostId, userId: oid(9), type, status: true,
      media: [{ url: `u/${posts.length}`, key: "k" }], views: 5, likes: 3, comments: 1, shares: 0,
      createdAt: new Date(t0 + posts.length * 1000) });
  }
};
const hosts = { [HOST_A]: { _id: HOST_A, name: "A", image: "a.png", isBlock: false }, [HOST_B]: { _id: HOST_B, name: "B", isBlock: false },
  [oid(3)]: { _id: oid(3), name: "Blocked", isBlock: true } };
const hostByUser = { [HOST_USER]: { _id: HOST_A, isBlock: false } };

const q = (fn) => { const o = { select: () => o, lean: () => o, sort: (s) => ((o._sort = s), o), limit: (n) => ((o._limit = n), o), skip: () => o, populate: () => o,
  then: (res, rej) => Promise.resolve().then(() => fn(o)).then(res, rej) }; return o; };

const FeedPost = {
  find: (f) => q((o) => posts.filter((p) => p.hostId === f.hostId && p.status === f.status && (!f.type || p.type === f.type))
    .sort((a, b) => b.createdAt - a.createdAt || (a._id < b._id ? 1 : -1)).slice(0, o._limit || 1e9)),
  countDocuments: async (f) => posts.filter((p) => p.hostId === f.hostId && p.status === f.status && (!f.type || p.type === f.type)).length,
  aggregate: async ([{ $match }]) => {
    const m = {};
    posts.filter((p) => String(p.hostId) === String($match.hostId) && p.status).forEach((p) => (m[p.type] = (m[p.type] || 0) + 1));
    return Object.entries(m).map(([_id, count]) => ({ _id, count }));
  },
};
const Host = {
  findOne: (f) => q(() => (f._id ? (hosts[f._id] && hosts[f._id].isBlock === f.isBlock ? hosts[f._id] : null) : hostByUser[f.userId] || null)),
};
const none = { find: () => q(() => []), findOne: () => q(() => null) };

class FakeOid { constructor(v) { this.v = String(v); } toString() { return this.v; } }
FakeOid.isValid = (v) => /^[a-f0-9]{24}$/i.test(v);
const stubs = {
  mongoose: { Types: { ObjectId: FakeOid } },
  "feedPost.model": FeedPost, "host.model": Host, "feedLike.model": none, "feedComment.model": none,
  "feedShare.model": {}, "feedView.model": {}, "block.model": none,
  response: { success: (res, data, message) => res.json({ status: true, message, data }), error: (res, message, code = 400) => res.status(code).json({ status: false, message }) },
  media: { getMediaUrl: (u) => u }, hostDisplay: { getDisplayName: (n) => n },
};
const orig = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request === "mongoose") return stubs.mongoose;
  for (const k of Object.keys(stubs)) if (request.endsWith("/" + k)) return stubs[k];
  return orig.call(this, request, parent, ...rest);
};
global.io = { to: () => ({ to: () => ({ emit() {} }), emit() {} }) };

const ctrl = require(path.join("..", "controllers", "client", "feed.controller.js"));
const requireHost = require(path.join("..", "middleware", "requireHost.middleware.js"));

const call = async (fn, { user = USER, params = {}, query = {}, body = {} } = {}) => {
  const out = { headers: {} };
  const res = { set: (k, v) => (out.headers[k] = v), json: (b) => ((out.body = b), (out.code = 200)), status: (c) => ({ json: (b) => ((out.body = b), (out.code = c)) }) };
  await fn({ user: { userId: user }, params, query, body }, res);
  return out;
};

let pass = 0;
const t = async (name, fn) => { try { posts = []; await fn(); pass++; console.log("  ✓", name); } catch (e) { console.error("  ✗", name, "\n   ", e.message); process.exitCode = 1; } };
const preview = (hostId) => call(ctrl.getHostFeedPreview, { params: { hostId } });

(async () => {
  console.log("host profile feed");

  await t("0 feeds -> all sections empty, no View All", async () => {
    const d = (await preview(HOST_A)).body.data;
    for (const k of ["feed", "reels", "images"]) { assert.strictEqual(d[k].items.length, 0); assert.strictEqual(d[k].total, 0); assert.strictEqual(d[k].hasMore, false); }
  });

  await t("1 feed", async () => {
    addPosts(HOST_A, "image", 1);
    const d = (await preview(HOST_A)).body.data;
    assert.strictEqual(d.feed.items.length, 1); assert.strictEqual(d.feed.hasMore, false); assert.strictEqual(d.reels.items.length, 0);
  });

  await t("exactly 6 feeds -> 6 shown, View All hidden", async () => {
    addPosts(HOST_A, "image", 6);
    const d = (await preview(HOST_A)).body.data;
    assert.strictEqual(d.feed.items.length, 6); assert.strictEqual(d.feed.total, 6); assert.strictEqual(d.feed.hasMore, false);
  });

  await t("10 feeds -> only 6 shown, total 10, View All shown", async () => {
    addPosts(HOST_A, "image", 7); addPosts(HOST_A, "video", 3);
    const d = (await preview(HOST_A)).body.data;
    assert.strictEqual(d.feed.items.length, 6); assert.strictEqual(d.feed.total, 10); assert.strictEqual(d.feed.hasMore, true);
    assert.strictEqual(d.images.items.length, 6); assert.strictEqual(d.images.total, 7); assert.strictEqual(d.images.hasMore, true);
    assert.strictEqual(d.reels.items.length, 3); assert.strictEqual(d.reels.total, 3); assert.strictEqual(d.reels.hasMore, false);
    assert.ok(d.reels.items.every((p) => p.type === "video") && d.images.items.every((p) => p.type === "image"));
  });

  await t("images only host: reels section empty, images present (conditional sections)", async () => {
    addPosts(HOST_A, "image", 2);
    const d = (await preview(HOST_A)).body.data;
    assert.strictEqual(d.reels.items.length, 0); assert.strictEqual(d.images.items.length, 2);
  });

  await t("newest first + real counts + no fake data", async () => {
    addPosts(HOST_A, "image", 3);
    const items = (await preview(HOST_A)).body.data.feed.items;
    for (let i = 1; i < items.length; i++) assert.ok(new Date(items[i - 1].createdAt) >= new Date(items[i].createdAt));
    assert.ok(items.every((p) => p.likes === 3 && p.showFakeData === false && p.fakeData === null));
  });

  await t("host isolation: Host A preview never contains Host B posts", async () => {
    addPosts(HOST_A, "image", 2); addPosts(HOST_B, "image", 5); addPosts(HOST_B, "video", 4);
    const d = (await preview(HOST_A)).body.data;
    const all = [...d.feed.items, ...d.reels.items, ...d.images.items];
    assert.strictEqual(d.feed.total, 2);
    assert.ok(all.every((p) => p.hostId._id === HOST_A || String(p.hostId._id) === HOST_A));
  });

  await t("invalid / unknown / blocked host", async () => {
    assert.strictEqual((await preview("nope")).code, 400);
    assert.strictEqual((await preview(oid(77))).code, 404);
    assert.strictEqual((await preview(oid(3))).code, 404);
  });

  await t("preview responses are never cached", async () => {
    assert.strictEqual((await preview(HOST_A)).headers["Cache-Control"], "no-store");
  });

  await t("User (non-host) cannot create feed: requireHost -> 403 and next() NOT called", async () => {
    let nextCalled = false, status = 0;
    const res = { status: (c) => ({ json: () => (status = c) }) };
    await requireHost({ user: { userId: USER } }, res, () => (nextCalled = true));
    assert.strictEqual(status, 403); assert.strictEqual(nextCalled, false);
  });

  await t("unauthenticated create -> 401; host -> allowed", async () => {
    let status = 0, next = false;
    const res = { status: (c) => ({ json: () => (status = c) }) };
    await requireHost({ user: {} }, res, () => {});
    assert.strictEqual(status, 401);
    const req = { user: { userId: HOST_USER } };
    await requireHost(req, res, () => (next = true));
    assert.strictEqual(next, true); assert.strictEqual(String(req.host._id), HOST_A);
  });

  await t("create route is protected by requireHost before upload", async () => {
    const src = require("fs").readFileSync(path.join(__dirname, "..", "routes", "client", "feed.route.js"), "utf8");
    const i = src.indexOf('"/create"');
    const seg = src.slice(i, src.indexOf("controller.createPost", i));
    assert.ok(seg.indexOf("requireHost") > -1 && seg.indexOf("requireHost") < seg.indexOf("upload("));
    assert.ok(!/router\.(put|patch|delete)\(\s*"\/(create|:id)"\s*,/.test(src.replace(/"\/:id\/comment\/:commentId"/, "")), "no client edit/delete route for posts");
  });

  console.log(`\n${pass} passed`);
})();
