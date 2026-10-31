/**
 * Offline test for the feed interaction layer (like / comment / view / share + realtime).
 * No database needed: mongoose + models are replaced with tiny in-memory fakes.
 *   node tests/feedInteractions.test.js
 */
const Module = require("module");
const assert = require("assert");
const path = require("path");

// ---------------------------------------------------------------- fakes
const oid = (n) => n.toString(16).padStart(24, "0");
const POST = oid(1), HOST = oid(2), USER_A = oid(10), USER_B = oid(11), OWNER = oid(12);

const db = {
  post: { _id: POST, hostId: HOST, userId: OWNER, status: true, likes: 0, comments: 0, views: 0, shares: 0 },
  likes: [], comments: [], views: [], shares: [], blocks: [],
};

const q = (fn) => {
  const o = { select: () => o, lean: () => o, populate: () => o, sort: () => o, skip: () => o, limit: () => o, then: (res, rej) => Promise.resolve().then(fn).then(res, rej) };
  return o;
};
const dup = () => Object.assign(new Error("dup"), { code: 11000 });

// extra posts for host-profile tests: host H2 has 3 posts, host H3 has 8 posts (mixed), H4 has none
const H2 = oid(20), H3 = oid(21), H4 = oid(22);
const manyPosts = [];
const addPosts = (hostId, n, typeOf) => { for (let i = 0; i < n; i++) manyPosts.push({ _id: oid(500 + manyPosts.length), hostId, userId: OWNER, type: typeOf(i), status: true, likes: 0, comments: 0, views: 0, shares: 0, createdAt: new Date(2026, 0, 1 + manyPosts.length) }); };
addPosts(H2, 3, () => "image");
addPosts(H3, 8, (i) => (i % 2 ? "video" : "image"));
const matchPosts = (f) => manyPosts.filter((p) => String(p.hostId) === String(f.hostId) && p.status === f.status && (!f.type || p.type === f.type)).sort((a, b) => b.createdAt - a.createdAt);

const FeedPost = {
  find: (f) => { let lim = 1e9; const o = q(() => matchPosts(f).slice(0, lim).map((p) => ({ ...p }))); o.limit = (n) => ((lim = n), o); return o; },
  countDocuments: (f) => q(() => matchPosts(f).length),
  aggregate: async (pipe) => { const h = String(pipe[0].$match.hostId); const rows = {}; manyPosts.filter((p) => String(p.hostId) === h && p.status).forEach((p) => (rows[p.type] = (rows[p.type] || 0) + 1)); return Object.entries(rows).map(([_id, count]) => ({ _id, count })); },
  findOne: (f) => q(() => (f._id === db.post._id && db.post.status === f.status ? { ...db.post } : null)),
  findById: (id) => q(() => (id === db.post._id ? { ...db.post } : null)),
  findByIdAndUpdate: (id, upd) => q(() => {
    for (const k in upd.$inc) db.post[k] += upd.$inc[k];
    return { ...db.post };
  }),
  updateOne: (f, u) => q(() => Object.assign(db.post, u.$set || {})),
};
const key = (a) => `${a.postId}:${a.userId}`;
const FeedLike = {
  findOne: (f) => q(() => db.likes.find((l) => key(l) === key(f)) || null),
  create: async (d) => { if (db.likes.some((l) => key(l) === key(d))) throw dup(); const r = { _id: "l" + db.likes.length, ...d }; db.likes.push(r); return r; },
  findOneAndDelete: (f) => q(() => { const i = db.likes.findIndex((l) => l._id === f._id); return i < 0 ? null : db.likes.splice(i, 1)[0]; }),
  find: () => q(() => []),
};
const FeedComment = {
  create: async (d) => { const r = { _id: oid(100 + db.comments.length), ...d }; db.comments.push(r); return r; },
  findById: (id) => q(() => { const c = db.comments.find((x) => x._id === id); return c && { ...c, userId: { _id: c.userId, name: "n" } }; }),
  findOne: (f) => q(() => db.comments.find((x) => x._id === f._id && x.postId === f.postId) || null),
  findOneAndDelete: (f) => q(() => { const i = db.comments.findIndex((x) => x._id === f._id); return i < 0 ? null : db.comments.splice(i, 1)[0]; }),
  find: () => q(() => []),
  countDocuments: () => q(() => db.comments.length),
};
const FeedShare = { create: async (d) => { if (db.shares.some((l) => key(l) === key(d))) throw dup(); db.shares.push(d); } };
const FeedView = { create: async (d) => { if (db.views.some((l) => key(l) === key(d))) throw dup(); db.views.push(d); } };
const Block = { findOne: (f) => q(() => db.blocks.find((b) => b.userId === f.userId) || null) };

const fakeMongoose = {
  Types: { ObjectId: class { constructor(v) { this.v = v; } toString() { return this.v; } } },
};
fakeMongoose.Types.ObjectId.isValid = (v) => /^[a-f0-9]{24}$/i.test(v);

const stubs = {
  mongoose: fakeMongoose,
  "feedPost.model": FeedPost, "feedLike.model": FeedLike, "feedComment.model": FeedComment,
  "feedShare.model": FeedShare, "feedView.model": FeedView, "block.model": Block,
  "host.model": { findOne: (f) => q(() => (f._id === H4 || manyPosts.some((p) => String(p.hostId) === String(f._id)) ? { _id: f._id, name: "Host " + f._id.slice(-2), image: "i.png", isBlock: false } : null)) }, "response": {
    success: (res, data, message) => res.json({ status: true, message, data }),
    error: (res, message, code = 400) => res.status(code).json({ status: false, message }),
  },
  "media": { getMediaUrl: (u) => u }, "hostDisplay": { getDisplayName: (n) => n },
};
const origLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request === "mongoose") return stubs.mongoose;
  for (const k of Object.keys(stubs)) if (request.endsWith("/" + k)) return stubs[k];
  return origLoad.call(this, request, parent, ...rest);
};

// fake socket.io: records emits per room
const emitted = [];
global.io = { to: (r) => { const rooms = [r]; const t = { to: (r2) => { rooms.push(r2); return t; }, emit: (e, p) => emitted.push({ rooms, e, p }) }; return t; } };

const requireHost = require(path.join("..", "middleware", "requireHost.middleware.js"));
const ctrl = require(path.join("..", "controllers", "client", "feed.controller.js"));

// ---------------------------------------------------------------- helpers
const call = async (fn, { user = USER_A, params = {}, body = {}, query = {} } = {}) => {
  const out = {};
  const res = { set: () => {}, json: (b) => ((out.body = b), (out.code = 200)), status: (c) => ({ json: (b) => ((out.body = b), (out.code = c)) }) };
  await fn({ user: { userId: user }, params, body, query }, res);
  return out;
};
let pass = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log("  ✓", name); } catch (e) { console.error("  ✗", name, "\n   ", e.message); process.exitCode = 1; } };

(async () => {
  console.log("feed interactions");

  await t("like -> count 1 + FEED_LIKED to post & host rooms", async () => {
    const r = await call(ctrl.toggleLike, { params: { id: POST }, body: { liked: true } });
    assert.strictEqual(r.body.data.likes, 1); assert.strictEqual(r.body.data.liked, true);
    const ev = emitted.at(-1); assert.strictEqual(ev.e, "FEED_LIKED"); assert.strictEqual(ev.p.updatedCount, 1);
    assert.deepStrictEqual(ev.rooms, [`feed:${POST}`, `feedHost:${HOST}`]);
    assert.strictEqual(ev.p.seq, r.body.data.seq); // REST + socket carry the same seq -> client applies once
  });

  await t("duplicate like (same desired state) does not double count / emit", async () => {
    const n = emitted.length;
    const r = await call(ctrl.toggleLike, { params: { id: POST }, body: { liked: true } });
    assert.strictEqual(r.body.data.likes, 1); assert.strictEqual(r.body.data.changed, false);
    assert.strictEqual(emitted.length, n);
  });

  await t("concurrent duplicate like requests -> single like", async () => {
    await call(ctrl.toggleLike, { params: { id: POST }, body: { liked: false } }); // reset: 0
    const rs = await Promise.all([1, 2, 3].map(() => call(ctrl.toggleLike, { params: { id: POST }, body: { liked: true } })));
    assert.strictEqual(db.post.likes, 1, "likes=" + db.post.likes);
    assert.ok(rs.every((x) => x.body.data.liked === true));
  });

  await t("another user likes -> 2, unlike -> 1, never negative", async () => {
    let r = await call(ctrl.toggleLike, { user: USER_B, params: { id: POST } });
    assert.strictEqual(r.body.data.likes, 2);
    r = await call(ctrl.toggleLike, { user: USER_B, params: { id: POST } });
    assert.strictEqual(r.body.data.likes, 1);
    assert.strictEqual(emitted.at(-1).e, "FEED_UNLIKED");
  });

  await t("invalid / unknown post ids are rejected", async () => {
    assert.strictEqual((await call(ctrl.toggleLike, { params: { id: "abc" } })).code, 400);
    assert.strictEqual((await call(ctrl.toggleLike, { params: { id: oid(999) } })).code, 404);
    assert.strictEqual((await call(ctrl.sharePost, { params: { id: "zzz" } })).code, 400);
    assert.strictEqual((await call(ctrl.addPostView, { params: { postId: oid(999) } })).code, 404);
  });

  await t("blocked pair cannot like/comment", async () => {
    db.blocks.push({ userId: OWNER });
    assert.strictEqual((await call(ctrl.toggleLike, { user: OWNER, params: { id: POST } })).code, 403);
    assert.strictEqual((await call(ctrl.commentPost, { user: OWNER, params: { id: POST }, body: { comment: "x" } })).code, 403);
    db.blocks.length = 0;
  });

  await t("comment: validation, count, realtime payload", async () => {
    assert.strictEqual((await call(ctrl.commentPost, { params: { id: POST }, body: { comment: "   " } })).code, 400);
    assert.strictEqual((await call(ctrl.commentPost, { params: { id: POST }, body: { comment: "x".repeat(501) } })).code, 400);
    const r = await call(ctrl.commentPost, { params: { id: POST }, body: { comment: " hello " } });
    assert.strictEqual(r.body.data.commentsCount, 1); assert.strictEqual(r.body.data.comment, "hello");
    const ev = emitted.at(-1);
    assert.strictEqual(ev.e, "FEED_COMMENT_ADDED"); assert.strictEqual(ev.p.updatedCount, 1);
    assert.strictEqual(ev.p.commentId, r.body.data._id); assert.strictEqual(ev.p.comment.comment, "hello");
  });

  await t("comment flood is throttled", async () => {
    let last;
    for (let i = 0; i < 8; i++) last = await call(ctrl.commentPost, { user: USER_B, params: { id: POST }, body: { comment: "spam" + i } });
    assert.strictEqual(last.code, 429);
  });

  await t("delete comment: stranger forbidden, author/owner allowed, count decrements", async () => {
    const c = db.comments[0];
    const stranger = await call(ctrl.deleteComment, { user: oid(77), params: { id: POST, commentId: c._id } });
    assert.strictEqual(stranger.code, 403);
    const before = db.post.comments;
    const ok = await call(ctrl.deleteComment, { user: OWNER, params: { id: POST, commentId: c._id } });
    assert.strictEqual(ok.body.data.commentsCount, before - 1);
    assert.strictEqual(emitted.at(-1).e, "FEED_COMMENT_DELETED");
  });

  await t("view is unique per user (+ one event)", async () => {
    const a = await call(ctrl.addPostView, { params: { postId: POST } });
    assert.strictEqual(a.body.data.counted, true); assert.strictEqual(a.body.data.views, 1);
    const n = emitted.length;
    const b = await call(ctrl.addPostView, { params: { postId: POST } });
    assert.strictEqual(b.body.data.counted, false); assert.strictEqual(db.post.views, 1);
    assert.strictEqual(emitted.length, n);
  });

  await t("share counts once per user", async () => {
    const a = await call(ctrl.sharePost, { params: { id: POST } });
    assert.strictEqual(a.body.data.shares, 1);
    const b = await call(ctrl.sharePost, { params: { id: POST } });
    assert.strictEqual(b.body.data.counted, false); assert.strictEqual(db.post.shares, 1);
    assert.ok(emitted.some((e) => e.e === "FEED_SHARED"));
  });

  await t("hidden/deleted post is unavailable everywhere", async () => {
    db.post.status = false;
    assert.strictEqual((await call(ctrl.toggleLike, { params: { id: POST } })).code, 404);
    assert.strictEqual((await call(ctrl.fetchComments, { params: { id: POST } })).code, 404);
    db.post.status = true;
  });

  await t("seq is strictly increasing", async () => {
    const seqs = emitted.map((e) => e.p.seq);
    for (let i = 1; i < seqs.length; i++) assert.ok(seqs[i] > seqs[i - 1], `seq order at ${i}`);
  });

  await t("host preview: 7+ posts -> 6 items + hasMore, counts by type", async () => {
    const r = await call(ctrl.getHostFeedPreview, { params: { hostId: H3 } });
    const d = r.body.data;
    assert.strictEqual(d.feed.items.length, 6); assert.strictEqual(d.feed.total, 8); assert.strictEqual(d.feed.hasMore, true);
    assert.strictEqual(d.reels.total, 4); assert.strictEqual(d.reels.hasMore, false); assert.strictEqual(d.reels.items.length, 4);
    assert.strictEqual(d.images.total, 4);
    assert.ok(d.feed.items.every((p) => p.hostId._id === H3), "only this host");
    assert.ok(d.reels.items.every((p) => p.type === "video"));
  });

  await t("host preview: <=6 posts -> no View All; 0 posts -> empty sections", async () => {
    let d = (await call(ctrl.getHostFeedPreview, { params: { hostId: H2 } })).body.data;
    assert.strictEqual(d.feed.items.length, 3); assert.strictEqual(d.feed.hasMore, false);
    assert.strictEqual(d.reels.total, 0); assert.strictEqual(d.reels.items.length, 0);
    d = (await call(ctrl.getHostFeedPreview, { params: { hostId: H4 } })).body.data;
    assert.deepStrictEqual(d.counts, { feed: 0, images: 0, reels: 0 });
  });

  await t("host posts: type=all works, strictly one host, unknown host 404, bad id 400", async () => {
    const d = (await call(ctrl.getHostPosts, { params: { hostId: H3 }, query: { limit: "5" } })).body.data;
    assert.strictEqual(d.posts.length, 5); // limit respected
    assert.ok(d.posts.every((p) => p.hostId._id === H3));
    assert.strictEqual((await call(ctrl.getHostPosts, { params: { hostId: oid(999) } })).code, 404);
    assert.strictEqual((await call(ctrl.getHostPosts, { params: { hostId: "bad" } })).code, 400);
    assert.strictEqual((await call(ctrl.getHostPosts, { params: { hostId: H3 }, query: { type: "audio" } })).code, 400);
  });

  await t("requireHost: user (no Host doc) -> 403, host -> next, blocked host -> 403", async () => {
    const Host = stubs["host.model"];
    const run = async (hostDoc) => {
      Host.findOne = () => q(() => hostDoc);
      let nexted = false; const out = {};
      const res = { status: (c) => ({ json: (b) => ((out.code = c), (out.body = b)) }) };
      await requireHost({ user: { userId: USER_A } }, res, () => (nexted = true));
      return { nexted, out };
    };
    let r = await run(null); assert.strictEqual(r.out.code, 403); assert.strictEqual(r.nexted, false);
    r = await run({ _id: HOST, isBlock: true }); assert.strictEqual(r.out.code, 403);
    r = await run({ _id: HOST, isBlock: false }); assert.strictEqual(r.nexted, true);
  });

  console.log(`\n${pass} passed`);
})();
