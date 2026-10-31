/* Run: node tests/deleteOwnPost.test.js (models stubbed, no database) */
const assert = require("assert");
const FeedPost = require("../models/feedPost.model");
const Host = require("../models/host.model");
const FeedLike = require("../models/feedLike.model");
const FeedComment = require("../models/feedComment.model");
const FeedShare = require("../models/feedShare.model");
const FeedView = require("../models/feedView.model");
const s3 = require("../util/s3Service");
let calls;
s3.deleteFromS3 = async (k) => { calls.s3.push(k); }; // stubbed BEFORE the controller destructures it
const { deleteOwnPost } = require("../controllers/client/feed.controller");

const OID = "64b0000000000000000000";
const post = { _id: OID + "01", userId: OID + "11", hostId: OID + "21", media: [{ key: "feed/a.mp4" }, { key: "feed/b.jpg" }, {}] };
const setup = ({ found = post, host = { _id: post.hostId } } = {}) => {
  calls = { removed: 0, related: 0, s3: [] };
  FeedPost.findById = () => ({ select: () => ({ lean: async () => found }) });
  FeedPost.findOneAndDelete = (q) => ({ select: () => ({ lean: async () => { calls.removed++; calls.q = q; return { _id: post._id }; } }) });
  Host.findOne = () => ({ select: () => ({ lean: async () => host }) });
  for (const M of [FeedLike, FeedComment, FeedShare, FeedView]) M.deleteMany = async () => { calls.related++; };
};
const run = async (userId, id = post._id) => {
  const res = { code: 0, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await deleteOwnPost({ user: { userId }, params: { id } }, res);
  return res;
};
let n = 0;
const t = async (name, fn) => { try { await fn(); n++; console.log("  ok  -", name); } catch (e) { console.error("FAIL -", name, e); process.exitCode = 1; } };

(async () => {
  await t("owner deletes post + related records + media", async () => {
    setup(); const r = await run(post.userId);
    assert.strictEqual(r.body.status, true); assert.strictEqual(calls.removed, 1); assert.strictEqual(calls.related, 4);
    await new Promise((x) => setImmediate(x)); assert.deepStrictEqual(calls.s3, ["feed/a.mp4", "feed/b.jpg"]);
  });
  await t("another user cannot delete (403, nothing removed)", async () => {
    setup({ host: { _id: OID + "99" } }); const r = await run(OID + "55");
    assert.strictEqual(r.code, 403); assert.strictEqual(calls.removed, 0); assert.strictEqual(calls.related, 0); assert.strictEqual(calls.s3.length, 0);
  });
  await t("owner's user id but different host is refused", async () => {
    setup({ host: { _id: OID + "99" } }); assert.strictEqual((await run(post.userId)).code, 403);
  });
  await t("user without a host profile is refused", async () => { setup({ host: null }); assert.strictEqual((await run(post.userId)).code, 403); });
  await t("unknown post -> 404, malformed id -> 400, no token -> 401", async () => {
    setup({ found: null }); assert.strictEqual((await run(post.userId)).code, 404);
    setup(); assert.strictEqual((await run(post.userId, "not-an-id")).code, 400);
    setup(); assert.strictEqual((await run(undefined)).code, 401);
  });
  await t("delete query is pinned to the caller (race safe)", async () => {
    setup(); await run(post.userId);
    assert.strictEqual(String(calls.q.userId), post.userId); assert.strictEqual(String(calls.q.hostId), post.hostId);
  });
  console.log(`\n${n} checks passed`); process.exit(process.exitCode || 0);
})();
