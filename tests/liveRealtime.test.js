/**
 * Live streaming realtime / lifecycle tests.      npm run test:live
 *
 * Runs the REAL socket.js + liveRoom / liveSession / liveSocketHandlers services + HostStreaming controller
 * on an in-memory socket.io hub and in-memory models (see tests/helpers/liveHarness.js).
 * No MongoDB, no network. Several independent socket clients per scenario.
 */



const assert = require("assert");
const path = require("path");

const H = require("./helpers/liveHarness");

// grace period of the host reconnect window: short for the test (read at call time)
process.env.LIVE_DISCONNECT_GRACE_SECONDS = "0.4";

const realLog = console.log;
const realErr = console.error;
const realWarn = console.warn;
const quiet = () => { console.log = () => {}; console.warn = () => {}; console.error = () => {}; };
// the console stays quiet for the whole run (service logs are noise here); the report uses realLog
const loud = () => { quiet(); };

quiet();
const env = H.createEnv();
const liveSession = require(path.join(H.ROOT, "services/liveSession.service.js"));
const liveRoom = require(path.join(H.ROOT, "services/liveRoom.service.js"));
const controller = require(path.join(H.ROOT, "controllers/client/liveBroadcaster.controller.js"));
loud();

const { db, S, sleep } = H;
const live = (id) => db.lives.find((l) => S(l._id) === S(id));
const hostDoc = (h) => db.hosts.find((x) => S(x._id) === S(h._id));
const names = (msgs) => msgs.map((m) => m.commentText);
const userText = (msgs) => msgs.filter((m) => !m.isSystemMessage);

/** a live with a connected host that is already in the room, plus n connected viewers that joined */
const setup = async (nViewers = 0, hostOver = {}) => {
  quiet();
  try {
    const host = H.seedHost(hostOver);
    const hs = await H.connectHost(env, host);
    const { liveHistoryId } = await H.startLive(env, host);
    await hs.call("liveSync", { liveHistoryId });
    const viewers = [];
    for (let i = 0; i < nViewers; i++) {
      const user = H.seedUser({ name: "Viewer" + i });
      const sock = await H.connectViewer(env, user);
      const ack = await sock.call("liveSync", { liveHistoryId, userId: String(user._id), userName: user.name });
      assert.equal(ack.ok, true, "viewer joined: " + JSON.stringify(ack));
      viewers.push({ user, sock });
    }
    hs.clear(); viewers.forEach((v) => v.sock.clear());
    return { host, hs, liveHistoryId, viewers };
  } finally { loud(); }
};
const hostComment = (hs, host, liveHistoryId, text, extra = {}) =>
  hs.call("liveCommentBroadcast", { liveHistoryId, userId: String(host._id), hostId: String(host._id), userName: "Riya", commentText: text, ...extra });
const viewerComment = (v, liveHistoryId, text, extra = {}) =>
  v.sock.call("liveCommentBroadcast", { liveHistoryId, userId: String(v.user._id), userName: v.user.name, commentText: text, ...extra });

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// =====================================================================================================
// 0. ROOT CAUSE: the host socket must have every live handler
// =====================================================================================================
test("ROOT CAUSE: a HOST socket gets all live handlers + chat + disconnect (host branch no longer returns early)", async () => {
  quiet(); const host = H.seedHost(); const hs = await H.connectHost(env, host); const vs = await H.connectViewer(env, H.seedUser()); loud();
  for (const ev of ["liveSync", "liveRoomJoin", "liveParticipantsRequest", "liveCommentBroadcast", "liveGiftSent", "liveHeartbeat", "liveStreamEnd", "liveJoinerCount", "removeLiveJoiner", "chatMessageSent", "disconnect"]) {
    assert(hs.handlers.has(ev), `host socket misses handler "${ev}"`);
    assert(vs.handlers.has(ev), `viewer socket misses handler "${ev}"`);
  }
  assert.equal(hs.data.isHost, true); assert.equal(vs.data.isHost, false);
  assert(hs.rooms.has(H.hostRoomName(host._id)), "host joined its daily task room");
  assert.equal(hostDoc(host).isOnline, true);
});

test('handshake isHost "false" (string) is NOT treated as a host', async () => {
  quiet(); const u = H.seedUser(); const s = await env.io.connect({ loginUserId: String(u._id), isHost: "false", globalRoom: `globalRoom:${u._id}` }); loud();
  assert.equal(s.data.isHost, false);
});

// =====================================================================================================
// 1. COMMENTS
// =====================================================================================================
test("host comment reaches EVERY connected viewer (and exactly once on the host)", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(4);
  const ack = await hostComment(hs, host, liveHistoryId, "welcome everyone");
  assert.equal(ack.ok, true);
  for (const v of viewers) {
    const got = userText(v.sock.chat());
    assert.deepEqual(names(got), ["welcome everyone"], `viewer ${v.user.name} got ${JSON.stringify(names(got))}`);
    assert.equal(got[0].isHostMessage, true);
    assert.equal(got[0].messageId, ack.messageId);
  }
  assert.equal(userText(hs.chat()).length, 1, "host receives its own message exactly once (no duplicate from room + personal room)");
});

test("viewer comment reaches the host and every OTHER viewer (and the sender, once)", async () => {
  const { hs, liveHistoryId, viewers } = await setup(3);
  const ack = await viewerComment(viewers[1], liveHistoryId, "hi host!");
  assert.equal(ack.ok, true);
  assert.deepEqual(names(userText(hs.chat())), ["hi host!"]);
  for (const v of viewers) assert.deepEqual(names(userText(v.sock.chat())), ["hi host!"]);
  assert.equal(userText(hs.chat())[0].isHostMessage, false);
});

test("host comment is delivered even when the host socket is NOT in the live room (reconnect / join race)", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(1);
  hs.leave(liveHistoryId); // simulate: host socket lost its room membership
  await viewerComment(viewers[0], liveHistoryId, "are you there?");
  assert.deepEqual(names(userText(hs.chat())), ["are you there?"], "host still gets chat through its personal room");
  assert.equal(userText(hs.chat()).length, 1);
});

test("comments keep their order and carry messageId + createdAt (clients can sort / de-duplicate)", async () => {
  const { hs, host, liveHistoryId, viewers } = await setup(2);
  for (let i = 0; i < 5; i++) await (i % 2 ? hostComment(hs, host, liveHistoryId, "m" + i) : viewerComment(viewers[0], liveHistoryId, "m" + i));
  const got = userText(viewers[1].sock.chat());
  assert.deepEqual(names(got), ["m0", "m1", "m2", "m3", "m4"]);
  assert.equal(new Set(got.map((m) => m.messageId)).size, 5);
  got.forEach((m) => assert(!Number.isNaN(Date.parse(m.createdAt))));
});

test("retry with the same clientMsgId is NOT delivered twice; empty / too long / rate-limited are rejected with an ack", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(1);
  const a = await hostComment(hs, host, liveHistoryId, "once", { clientMsgId: "abc" });
  const b = await hostComment(hs, host, liveHistoryId, "once", { clientMsgId: "abc" });
  assert.equal(a.ok, true); assert.equal(b.duplicate, true); assert.equal(b.messageId, a.messageId);
  assert.deepEqual(names(userText(viewers[0].sock.chat())), ["once"]);
  const empty = await hostComment(hs, host, liveHistoryId, "   ");
  assert.equal(empty.ok, false); assert.equal(empty.error, "EMPTY_MESSAGE");
  assert(hs.eventsOf("liveCommentError").length >= 1, "sender is told about the failure");
  const long = await hostComment(hs, host, liveHistoryId, "x".repeat(900));
  assert.equal(long.ok, true);
  assert.equal(userText(viewers[0].sock.chat()).pop().commentText.length, 500);
  let limited = 0;
  for (let i = 0; i < 12; i++) { const r = await viewerComment(viewers[0], liveHistoryId, "spam" + i); if (r.error === "RATE_LIMITED") limited++; }
  assert(limited > 0, "flood is rate limited");
});

test("comment to an ENDED live fails with LIVE_ENDED (no silent success) and the sender sees the end", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(1);
  quiet(); await hs.call("liveStreamEnd", { hostId: String(host._id), liveHistoryId }); loud();
  viewers[0].sock.clear();
  const r = await viewerComment(viewers[0], liveHistoryId, "too late");
  assert.equal(r.ok, false); assert.equal(r.error, "LIVE_ENDED");
});

test("comments are PERSISTED and a late joiner / restarted server still gets the recent chat", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(1);
  await hostComment(hs, host, liveHistoryId, "persist me");
  await viewerComment(viewers[0], liveHistoryId, "me too");
  assert.equal(db.comments.length, 2, "both comments stored");
  assert(db.comments.some((c) => c.text === "persist me" && c.isHostMessage === true));
  assert.equal(live(liveHistoryId).liveComments, 2, "comment counter on the live history");

  // server restart: in-memory replay buffer is gone
  liveRoom.clearRoomState(liveHistoryId);
  quiet(); const late = H.seedUser(); const ls = await H.connectViewer(env, late);
  const ack = await ls.call("liveSync", { liveHistoryId, userId: String(late._id), userName: "Late" }); loud();
  assert.deepEqual(names(userText(ack.recentComments)), ["persist me", "me too"]);
  assert.deepEqual(names(userText(ls.eventsOf("liveCommentHistory")[0])), ["persist me", "me too"]);
  assert.equal(ack.recentComments[0].isHostMessage, true);
});

// =====================================================================================================
// 2. JOIN / initial state / audience
// =====================================================================================================
test("newly joined viewer receives the full initial live state (ack + history event)", async () => {
  const { host, hs, liveHistoryId } = await setup(1);
  await hostComment(hs, host, liveHistoryId, "before you joined");
  quiet(); const u = H.seedUser(); const s = await H.connectViewer(env, u);
  const ack = await s.call("liveSync", { liveHistoryId, userId: String(u._id), userName: "New" }); loud();
  assert.equal(ack.ok, true); assert.equal(ack.isLive, true); assert.equal(ack.isHost, false);
  assert.equal(ack.liveHistoryId, liveHistoryId); assert.equal(ack.hostId, String(host._id));
  assert.equal(ack.totalViews, 2); assert(ack.token, "viewer gets a (subscriber) token"); assert(ack.channel);
  assert(names(ack.recentComments).includes("before you joined"));
  assert(s.rooms.has(liveHistoryId), "viewer is in the live room");
});

test("joining an ENDED / unknown live is rejected and the viewer sees the end screen", async () => {
  const { host, hs, liveHistoryId } = await setup(0);
  quiet(); await hs.call("liveStreamEnd", { hostId: String(host._id), liveHistoryId });
  const u = H.seedUser(); const s = await H.connectViewer(env, u);
  const ack = await s.call("liveSync", { liveHistoryId, userId: String(u._id) }); loud();
  assert.equal(ack.ok, false); assert.equal(ack.reason, "LIVE_ENDED");
  assert.equal(s.eventsOf("liveJoinRejected").length, 1); assert.equal(s.ended().length, 1);
  assert.equal(db.views.length, 0, "no viewer row left behind");
  assert(!s.rooms.has(liveHistoryId));
});

test("host audience list loads (ack + event), with correct total and paging", async () => {
  const { hs, liveHistoryId, viewers, host } = await setup(7);
  const r = await hs.call("liveParticipantsRequest", { liveHistoryId });
  assert.equal(r.ok, true); assert.equal(r.totalViews, 7); assert.equal(r.participants.length, 7); assert.equal(r.hasMore, false);
  assert.deepEqual(r.participants.map((p) => p.userId), viewers.map((v) => String(v.user._id)), "oldest first");
  assert.equal(r.participants[0].name.length > 0, true);
  assert.equal(hs.eventsOf("liveParticipantsList").length, 1);

  const page = await hs.call("liveParticipantsRequest", { liveHistoryId, limit: 3, skip: 0 });
  assert.equal(page.participants.length, 3); assert.equal(page.totalViews, 7, "total is a COUNT, not the page size"); assert.equal(page.hasMore, true);
  const rest = await hs.call("liveParticipantsRequest", { liveHistoryId, limit: 3, skip: 6 });
  assert.equal(rest.participants.length, 1); assert.equal(rest.hasMore, false);

  // REST fallback for the bottom sheet (retry / socket down)
  const res = H.mkRes();
  await controller.LiveAudience({ query: { liveHistoryId, hostId: String(host._id) } }, res);
  assert.equal(res.body.status, true); assert.equal(res.body.data.totalViews, 7); assert.equal(res.body.data.participants.length, 7);
});

test("audience request on an ended live answers LIVE_ENDED; REST refuses other hosts", async () => {
  const { host, hs, liveHistoryId } = await setup(1);
  const other = H.seedHost();
  const res = H.mkRes();
  await controller.LiveAudience({ query: { liveHistoryId, hostId: String(other._id) } }, res);
  assert.equal(res.body.status, false, "another host cannot read this audience");
  quiet(); await hs.call("liveStreamEnd", { hostId: String(host._id), liveHistoryId }); loud();
  const r = await hs.call("liveParticipantsRequest", { liveHistoryId });
  assert.equal(r.ok, false); assert.equal(r.reason, "LIVE_ENDED");
  const res2 = H.mkRes(); await controller.LiveAudience({ query: { liveHistoryId, hostId: String(host._id) } }, res2);
  assert.equal(res2.body.isLive, false);
});

test("viewer count goes up on join and down on leave / disconnect; the HOST gets every update live", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(0);
  const counts = () => hs.eventsOf("liveJoinerCount");
  quiet();
  const u = [H.seedUser({ name: "A" }), H.seedUser({ name: "B" }), H.seedUser({ name: "C" })];
  const s = [];
  for (const x of u) { const sock = await H.connectViewer(env, x); await sock.call("liveSync", { liveHistoryId, userId: String(x._id), userName: x.name }); s.push(sock); }
  loud();
  assert.deepEqual(counts().slice(-3), [1, 2, 3]);
  const joinedNames = hs.eventsOf("liveParticipantJoined").map((e) => e.user.name);
  assert.equal(joinedNames.length, 3, "host sees WHO joined");
  ["A", "B", "C"].forEach((n, i) => assert(joinedNames[i].includes(n), `joined #${i} is ${n}: ${joinedNames[i]}`)); // names are display-styled
  assert.equal(hs.eventsOf("liveParticipantJoined").pop().totalViews, 3);
  assert.equal(live(liveHistoryId).audienceCount, 3, "peak audience persisted");
  assert.equal(db.broadcasters[0].view, 3); assert.equal(hostDoc(host).view, 3);

  // leave by button
  quiet(); const r = await s[0].call("removeLiveJoiner", { userId: String(u[0]._id), liveHistoryId }); loud();
  assert.equal(r.ok, true);
  assert.equal(counts().pop(), 2); assert.equal(hs.eventsOf("liveParticipantLeft").pop().userId, String(u[0]._id));
  assert(!s[0].rooms.has(liveHistoryId));
  // leave by network loss
  quiet(); await env.io.dropSocket(s[1]); loud();
  assert.equal(counts().pop(), 1);
  assert.equal(db.views.length, 1);
  assert.equal(db.broadcasters[0].view, 1);
  assert.equal(live(liveHistoryId).audienceCount, 3, "history keeps the PEAK");
  // ...and the audience list agrees
  const list = await hs.call("liveParticipantsRequest", { liveHistoryId });
  assert.equal(list.participants.length, 1); assert(list.participants[0].name.includes("C"));
  assert.equal(list.totalViews, 1);
});

test("viewers also see count changes of the room (all clients agree)", async () => {
  const { liveHistoryId, viewers } = await setup(3);
  quiet(); await env.io.dropSocket(viewers[2].sock); loud();
  for (const v of viewers.slice(0, 2)) assert.equal(v.sock.eventsOf("liveJoinerCount").pop(), 2);
});

// =====================================================================================================
// 3. DUPLICATE CONNECTIONS
// =====================================================================================================
test("same user joining twice / on two devices counts ONCE; the other device keeps him alive", async () => {
  const { hs, liveHistoryId } = await setup(0);
  quiet();
  const u = H.seedUser({ name: "Twin" });
  const d1 = await H.connectViewer(env, u); const d2 = await H.connectViewer(env, u);
  await d1.call("liveSync", { liveHistoryId, userId: String(u._id), userName: "Twin" });
  await d1.call("liveSync", { liveHistoryId, userId: String(u._id), userName: "Twin" }); // app resume: idempotent
  await d2.call("liveSync", { liveHistoryId, userId: String(u._id), userName: "Twin" });
  loud();
  assert.equal(db.views.length, 1, "one row per viewer");
  assert.equal(hs.eventsOf("liveParticipantJoined").length, 1, "joined announced once");
  assert.equal(hs.eventsOf("liveJoinerCount").pop(), 1);

  // the row belongs to device 2; device 1 goes away -> still 1 viewer
  quiet(); await env.io.dropSocket(d1); loud();
  assert.equal(db.views.length, 1); assert.equal(hs.eventsOf("liveJoinerCount").pop(), 1);
  // device 2 (owner) goes away while device 1 is gone too -> 0
  quiet(); await env.io.dropSocket(d2); loud();
  assert.equal(db.views.length, 0); assert.equal(hs.eventsOf("liveJoinerCount").pop(), 0);
});

test("when the OWNER device disconnects but the same user is still connected elsewhere, he stays counted", async () => {
  const { hs, liveHistoryId } = await setup(0);
  quiet();
  const u = H.seedUser();
  const d1 = await H.connectViewer(env, u); const d2 = await H.connectViewer(env, u);
  await d1.call("liveSync", { liveHistoryId, userId: String(u._id), userName: "T" });
  await d2.call("liveSync", { liveHistoryId, userId: String(u._id), userName: "T" }); // d2 owns the row
  await env.io.dropSocket(d2);
  loud();
  assert.equal(db.views.length, 1, "row handed over to the surviving device");
  assert.equal(db.views[0].socketId, d1.id);
  assert.equal(hs.eventsOf("liveJoinerCount").pop(), 1);
});

test("30 concurrent joins of 10 users create 10 rows (race safe) and a correct count", async () => {
  const { hs, liveHistoryId } = await setup(0);
  quiet();
  const users = Array.from({ length: 10 }, (_, i) => H.seedUser({ name: "C" + i }));
  const socks = [];
  for (const u of users) for (let k = 0; k < 3; k++) socks.push({ u, s: await H.connectViewer(env, u) });
  await Promise.all(socks.map(({ u, s }) => s.call("liveSync", { liveHistoryId, userId: String(u._id), userName: u.name })));
  loud();
  assert.equal(db.views.length, 10);
  const r = await hs.call("liveParticipantsRequest", { liveHistoryId });
  assert.equal(r.totalViews, 10); assert.equal(new Set(r.participants.map((p) => p.userId)).size, 10);
});

test("a viewer row whose socket silently died is healed by the periodic reconcile", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(2);
  // ghost: a row whose socket does not exist (server restart / missed disconnect)
  db.views.push({ _id: new H.ObjectId(), userId: new H.ObjectId(), liveHistoryId: new H.ObjectId(liveHistoryId), socketId: "ghost", name: "Ghost", createdAt: new Date(Date.now() - 60000), updatedAt: new Date(Date.now() - 60000) });
  assert.equal(db.views.length, 3);
  const total = await liveRoom.reconcileViewers(env.io, liveHistoryId, host._id);
  assert.equal(total, 2); assert.equal(hs.eventsOf("liveJoinerCount").pop(), 2);
});

// =====================================================================================================
// 4. TEMPORARY DISCONNECTS / RECOVERY
// =====================================================================================================
test("host socket drops and reconnects inside the grace period: live is NOT ended, nobody sees an end", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(3);
  quiet(); await env.io.dropSocket(hs); loud();
  assert.equal(live(liveHistoryId).endTime, "", "still open right after the drop");
  await sleep(150); // < grace (400ms)
  quiet(); const hs2 = await H.connectHost(env, host); loud();
  await sleep(500); // the old grace timer fires and must see the new socket / be cancelled
  assert.equal(live(liveHistoryId).endTime, "", "live survived the reconnect");
  assert.equal(hostDoc(host).isLive, true); assert.equal(db.broadcasters.length, 1);
  for (const v of viewers) assert.equal(v.sock.ended().length, 0, "no viewer was told the live ended");
  // server put the reconnected host socket back in the room WITHOUT any app call
  assert(hs2.rooms.has(liveHistoryId), "host socket restored into the live room");
  await viewerComment(viewers[0], liveHistoryId, "welcome back");
  assert.deepEqual(names(userText(hs2.chat())), ["welcome back"], "chat reaches the reconnected host with no liveSync");
  quiet(); const u = H.seedUser(); const s = await H.connectViewer(env, u); await s.call("liveSync", { liveHistoryId, userId: String(u._id), userName: "J" }); loud();
  assert.equal(hs2.eventsOf("liveParticipantJoined").length, 1, "audience events reach the reconnected host");
});

test("host does NOT come back: after the grace period the live is ended ONCE for everybody", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(2);
  quiet(); await env.io.dropSocket(hs); loud();
  await sleep(700);
  assert.notEqual(live(liveHistoryId).endTime, ""); assert.equal(live(liveHistoryId).endReason, "socket-disconnect");
  assert.equal(hostDoc(host).isLive, false); assert.equal(db.broadcasters.length, 0); assert.equal(db.views.length, 0);
  for (const v of viewers) { const e = v.sock.ended(); assert.equal(e.length, 1); assert.equal(e[0].reason, "socket-disconnect"); assert.equal(e[0].liveHistoryId, liveHistoryId); }
});

test("viewer network loss + reconnect on a NEW socket: liveSync restores state, old socket's late disconnect does not kick him", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(2);
  await hostComment(hs, host, liveHistoryId, "while you were gone?");
  const v = viewers[0];
  // the app reconnects (new socket) and calls liveSync BEFORE the server noticed the old one is dead
  quiet(); const fresh = await H.connectViewer(env, v.user);
  const ack = await fresh.call("liveSync", { liveHistoryId, userId: String(v.user._id), userName: v.user.name });
  loud();
  assert.equal(ack.ok, true); assert.equal(ack.totalViews, 2, "same user is not counted twice");
  assert(names(ack.recentComments).includes("while you were gone?"));
  assert(fresh.rooms.has(liveHistoryId), "event subscriptions (room) restored");
  quiet(); await env.io.dropSocket(v.sock); loud(); // old socket's disconnect finally arrives
  assert.equal(db.views.length, 2, "viewer survived the old socket's disconnect");
  assert.equal(hs.eventsOf("liveJoinerCount").pop(), 2);
  await hostComment(hs, host, liveHistoryId, "after");
  assert.deepEqual(names(userText(fresh.chat())).slice(-1), ["after"], "new socket receives chat");
});

test("a viewer's temporary disconnect never ends the host's live", async () => {
  const { liveHistoryId, host, viewers } = await setup(2);
  quiet(); for (const v of viewers) await env.io.dropSocket(v.sock); loud();
  await sleep(500);
  assert.equal(live(liveHistoryId).endTime, ""); assert.equal(hostDoc(host).isLive, true);
  assert.equal(db.views.length, 0);
});

test("liveSync from the host (reconnect / app resume) is idempotent: 'started the live' announced once, audience returned", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(2);
  const a = await hs.call("liveSync", { liveHistoryId }); const b = await hs.call("liveSync", { liveHistoryId });
  assert.equal(a.isHost, true); assert.equal(a.participants.length, 2); assert.equal(b.participants.length, 2);
  const startedLines = (b.recentComments || []).filter((m) => m.isHostJoined);
  assert.equal(startedLines.length <= 1, true);
  assert.equal(a.token, "", "host keeps its publisher token");
});

// =====================================================================================================
// 5. LONG RUNNING LIVE / REAPER
// =====================================================================================================
test("a live with a healthy host runs for 3 HOURS (simulated) without being ended: heartbeats + reaper every minute", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(2);
  quiet();
  for (let sec = 0; sec < 3 * 3600; sec += 20) {
    H.clock.advance(20000);
    await hs.call("liveHeartbeat", {});
    if (sec % 60 === 0) await liveSession.reapStaleSessions();
  }
  loud();
  assert.equal(live(liveHistoryId).endTime, "", "live still open after 3h");
  assert.equal(hostDoc(host).isLive, true);
  for (const v of viewers) assert.equal(v.sock.ended().length, 0);
  assert(live(liveHistoryId).lastHeartbeatAt, "heartbeat persisted");
  assert.equal(hs.eventsOf("liveHeartbeatAck").length, 3 * 3600 / 20, "host got an ack for each heartbeat");
  quiet(); const r = await hs.call("liveSync", { liveHistoryId }); loud();
  assert.equal(r.ok, true, "state still available after 3h");
});

test("heartbeat silent for 5 minutes BUT the host socket is connected: live is kept (no premature end)", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(1);
  quiet(); await hs.call("liveHeartbeat", {}); H.clock.advance(5 * 60000); const n = await liveSession.reapStaleSessions(); loud();
  assert.equal(n, 0); assert.equal(live(liveHistoryId).endTime, "");
  assert.equal(viewers[0].sock.ended().length, 0);
});

test("DEAD session is still cleaned up: heartbeat silent + host socket gone -> ended by the reaper, viewers told", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(2);
  quiet(); await hs.call("liveHeartbeat", {});
  // host vanished without a disconnect event reaching the server (no grace timer)
  [...hs.rooms].forEach((r) => env.io._leave(hs, r)); hs.connected = false;
  H.clock.advance(3 * 60000);
  const n = await liveSession.reapStaleSessions(); loud();
  assert.equal(n, 1); assert.notEqual(live(liveHistoryId).endTime, ""); assert.equal(live(liveHistoryId).endReason, "stale-timeout");
  assert.equal(hostDoc(host).isLive, false);
  for (const v of viewers) assert.equal(v.sock.ended()[0].reason, "stale-timeout");
});

test("heartbeat silent far beyond the limit EVEN with a connected socket: ended (no immortal sessions)", async () => {
  const { host, hs, liveHistoryId } = await setup(0);
  quiet(); await hs.call("liveHeartbeat", {}); H.clock.advance(30 * 60000); const n = await liveSession.reapStaleSessions(); loud();
  assert.equal(n, 1); assert.notEqual(live(liveHistoryId).endTime, "");
});

// =====================================================================================================
// 6. EXPLICIT END
// =====================================================================================================
test("host End Live: DB closed, EVERY viewer gets liveStreamEnd, room emptied, Discover updated, host lists refreshed", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(4);
  quiet();
  // a Discover client listening to the host list
  const disc = await H.connectViewer(env, H.seedUser()); await disc.call("subscribeHostList", { country: "global" }).catch(() => {});
  disc.join("hostList:global");
  const ack = await hs.call("liveStreamEnd", { hostId: String(host._id), liveHistoryId });
  loud();
  assert.equal(ack.ok, true); assert.equal(ack.finalized, true);
  const l = live(liveHistoryId);
  assert.notEqual(l.endTime, ""); assert.match(l.duration, /^\d\d:\d\d:\d\d$/); assert.equal(l.endReason, "liveStreamEnd");
  assert.equal(hostDoc(host).isLive, false); assert.equal(hostDoc(host).liveHistoryId, null);
  assert.equal(db.broadcasters.length, 0); assert.equal(db.views.length, 0);
  for (const v of viewers) { const e = v.sock.ended(); assert.equal(e.length, 1, "exactly one end event per viewer"); assert.equal(e[0].liveHistoryId, liveHistoryId); assert.equal(e[0].reason, "liveStreamEnd"); assert(e[0].endedAt); }
  assert.equal(hs.ended().length, 1, "host's own devices are told once too");
  await sleep(2200); // finalize empties the room after the emit has been flushed
  for (const v of viewers) assert(!v.sock.rooms.has(liveHistoryId), "viewer left the dead room");
  assert(!env.io.adapter.rooms.has(liveHistoryId), "room is gone");
  assert(env.hostStatusLog.includes(String(host._id)), "host status broadcast (Discover refresh)");
  const status = disc.eventsOf("hostStatusUpdate").filter((x) => x._id === String(host._id)).pop();
  assert(status && status.isLive === false && status.hostType !== "live", "Discover receives isLive=false");
});

test("ended live disappears from Discover/LiveStatus; a NEW live of the same host gets a NEW id", async () => {
  const { host, hs, liveHistoryId } = await setup(1);
  quiet(); await hs.call("liveStreamEnd", { hostId: String(host._id), liveHistoryId });
  const res = H.mkRes(); await controller.LiveStatus({ query: { liveHistoryId, hostId: String(host._id) } }, res);
  assert.equal(res.body.isLive, false); assert.equal(res.body.ended, true);
  // Discover = hosts with isLive:true
  assert.equal(db.hosts.filter((h) => h.isLive).length, 0);
  const second = await H.startLive(env, host); loud();
  assert.notEqual(second.liveHistoryId, liveHistoryId);
  assert.equal(db.hosts.filter((h) => h.isLive).length, 1);
  const res2 = H.mkRes(); await controller.LiveStatus({ query: { liveHistoryId: second.liveHistoryId } }, res2);
  assert.equal(res2.body.isLive, true);
  assert.equal(live(liveHistoryId).endTime !== "", true, "old session stays closed");
});

test("start of a live: unique session id persisted, host flagged live, Discover subscribers are notified", async () => {
  quiet();
  const host = H.seedHost(); const hs = await H.connectHost(env, host);
  const disc = await H.connectViewer(env, H.seedUser()); disc.join("hostList:global");
  const { liveHistoryId, response } = await H.startLive(env, host);
  await sleep(50); loud();
  assert(live(liveHistoryId), "history row persisted"); assert.equal(live(liveHistoryId).endTime, "");
  assert.equal(hostDoc(host).isLive, true); assert.equal(S(hostDoc(host).liveHistoryId), liveHistoryId);
  assert.equal(db.broadcasters.length, 1); assert.equal(S(db.broadcasters[0].liveHistoryId), liveHistoryId);
  const ev = disc.eventsOf("hostStatusUpdate").filter((x) => x._id === String(host._id)).pop();
  assert(ev && ev.isLive === true && ev.status === "Live", "Discover shows the live");
  // duplicate start request (double tap) returns the SAME live
  quiet(); const again = await H.startLive(env, host); loud();
  assert.equal(again.liveHistoryId, liveHistoryId); assert.equal(db.lives.length, 1);
});

test("repeated end-live requests (socket x3, HTTP, concurrent) never corrupt the session", async () => {
  const { host, hs, liveHistoryId } = await setup(2);
  quiet();
  const first = await hs.call("liveStreamEnd", { hostId: String(host._id), liveHistoryId });
  const endTime = live(liveHistoryId).endTime; const duration = live(liveHistoryId).duration;
  await sleep(1100); // wall clock moves on: a second finalize would produce a different endTime
  const again = await Promise.all([
    hs.call("liveStreamEnd", { hostId: String(host._id), liveHistoryId }),
    hs.call("liveStreamEnd", { hostId: String(host._id), liveHistoryId }),
    (async () => { const r = H.mkRes(); await controller.HostStreamingEnd({ query: { hostId: String(host._id), liveHistoryId } }, r); return r.body; })(),
  ]);
  loud();
  assert.equal(first.finalized, true);
  assert.equal(again[0].alreadyEnded, true); assert.equal(again[1].alreadyEnded, true);
  assert.equal(again[2].status, true); assert.match(again[2].message, /already ended/i);
  assert.equal(live(liveHistoryId).endTime, endTime, "endTime frozen"); assert.equal(live(liveHistoryId).duration, duration);
  assert.equal(analyticsCountEnded(liveHistoryId), 1, "command center announced the end once");
});
const analyticsCountEnded = (id) => H.analyticsStub.calls.ended.filter((e) => S(e.roomId) === S(id)).length;

test("concurrent end from host + stale reaper + HTTP: exactly one winner", async () => {
  const { host, hs, liveHistoryId } = await setup(1);
  quiet();
  const before = analyticsCountEnded(liveHistoryId);
  await Promise.all([
    liveSession.finalizeLiveSession({ hostId: host._id, historyId: liveHistoryId, reason: "stale-timeout" }),
    liveSession.finalizeLiveSession({ hostId: host._id, historyId: liveHistoryId, reason: "http-end" }),
    hs.call("liveStreamEnd", { hostId: String(host._id), liveHistoryId }),
  ]);
  await sleep(50); loud();
  assert.equal(analyticsCountEnded(liveHistoryId) - before, 1);
});

test("AUTHORIZATION: another user / another host cannot end this live (socket + HTTP)", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(1);
  quiet();
  const r1 = await viewers[0].sock.call("liveStreamEnd", { hostId: String(host._id), liveHistoryId });
  const other = H.seedHost(); const os = await H.connectHost(env, other);
  const r2 = await os.call("liveStreamEnd", { hostId: String(host._id), liveHistoryId });
  const r3 = await os.call("liveStreamEnd", { hostId: String(other._id), liveHistoryId }); // own id, foreign live
  const res = H.mkRes(); await controller.HostStreamingEnd({ query: { hostId: String(other._id), liveHistoryId } }, res);
  loud();
  assert.equal(r1.ok, false); assert.equal(r1.reason, "NOT_ALLOWED");
  assert.equal(r2.ok, false); assert.equal(r2.reason, "NOT_ALLOWED");
  assert.equal(r3.ok, false, "a host cannot end somebody else's session by sending its own hostId");
  assert.equal(res.body.status, false);
  assert.equal(live(liveHistoryId).endTime, ""); assert.equal(hostDoc(host).isLive, true);
  assert.equal(viewers[0].sock.ended().length, 0);
});

test("a second socket of the same host ending the live (other device) works and tells everyone", async () => {
  const { host, liveHistoryId, viewers } = await setup(2);
  quiet(); const dev2 = await H.connectHost(env, host); const r = await dev2.call("liveStreamEnd", { hostId: String(host._id), liveHistoryId }); loud();
  assert.equal(r.ok, true);
  for (const v of viewers) assert.equal(v.sock.ended().length, 1);
});

// =====================================================================================================
// 7. GIFTS + COINS
// =====================================================================================================
test("gift: viewer coins debited, host coins credited, ONE persisted transaction, live totals + events consistent", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(2);
  const gift = H.seedGift({ coin: 100 });
  const sender = viewers[0].user; sender.coin = 1000;
  quiet();
  const ack = await viewers[0].sock.call("liveGiftSent", { liveHistoryId, senderId: String(sender._id), receiverId: String(host._id), giftId: String(gift._id), giftCount: 3, giftRequestId: "req-1" });
  loud();
  assert.equal(ack.ok, true, JSON.stringify(ack));
  assert.equal(db.users.find((u) => S(u._id) === S(sender._id)).coin, 700);
  const hostCoin = hostDoc(host).coin; assert.equal(hostCoin, 270, "300 coins - 10% admin"); // adminCommissionRate 10
  assert.equal(db.histories.length, 1);
  const row = db.histories[0];
  assert.equal(row.userCoin, 300); assert.equal(row.hostCoin, 270); assert.equal(row.adminCoin, 30); assert.equal(S(row.liveHistoryId), liveHistoryId); assert.equal(row.giftRequestId, "req-1");
  assert.equal(row.userCoin, row.hostCoin + row.adminCoin + row.agencyCoin, "coins conserved");
  assert.equal(live(liveHistoryId).coins, 300); assert.equal(live(liveHistoryId).gifts, 3);
  // everybody in the live gets the gift exactly once, the host too
  for (const c of [hs, viewers[0].sock, viewers[1].sock]) assert.equal(c.eventsOf("liveGiftReceived").length, 1);
  const earn = hs.eventsOf("liveEarningsUpdate").pop();
  assert.equal(earn.sessionCoins, 270, "host live earnings == sum of persisted host coins"); assert.equal(earn.hostCoin, hostCoin);
  assert.equal(hs.eventsOf("walletBalanceUpdated").pop().coins, hostCoin);
});

test("gift retry with the same giftRequestId is charged ONCE; insufficient coins / bad input fail loudly without side effects", async () => {
  const { host, liveHistoryId, viewers } = await setup(1);
  const gift = H.seedGift({ coin: 50 });
  const u = viewers[0].user; u.coin = 120;
  const req = (extra = {}) => viewers[0].sock.call("liveGiftSent", { liveHistoryId, senderId: String(u._id), receiverId: String(host._id), giftId: String(gift._id), giftCount: 2, giftRequestId: "dup", ...extra });
  quiet();
  const a = await req(); const b = await req(); const [c, d] = await Promise.all([req(), req()]);
  loud();
  assert.equal(a.ok, true); assert.equal(b.duplicate, true); assert.equal(c.duplicate && d.duplicate, true);
  assert.equal(db.histories.length, 1); assert.equal(db.users.find((x) => S(x._id) === S(u._id)).coin, 20, "charged once");
  quiet();
  const broke = await req({ giftRequestId: "new", giftCount: 5 }); // 250 > 20
  const bad = await req({ giftRequestId: "bad", giftCount: 0 });
  const nogift = await req({ giftRequestId: "ng", giftId: String(new H.ObjectId()) });
  loud();
  assert.equal(broke.ok, false); assert.equal(broke.error, "INSUFFICIENT_COINS");
  assert.equal(bad.ok, false); assert.equal(nogift.ok, false);
  assert.equal(db.histories.length, 1); assert.equal(db.users.find((x) => S(x._id) === S(u._id)).coin, 20);
  assert(viewers[0].sock.eventsOf("liveGiftError").length >= 3, "sender is told why");
});

test("gift to a live that already ended is refused and nothing is charged", async () => {
  const { host, hs, liveHistoryId, viewers } = await setup(1);
  const gift = H.seedGift({ coin: 10 }); const u = viewers[0].user;
  quiet(); await hs.call("liveStreamEnd", { hostId: String(host._id), liveHistoryId });
  const r = await viewers[0].sock.call("liveGiftSent", { liveHistoryId, senderId: String(u._id), receiverId: String(host._id), giftId: String(gift._id), giftCount: 1, giftRequestId: "late" }); loud();
  assert.equal(r.ok, false); assert.equal(r.error, "LIVE_ENDED"); assert.equal(db.histories.length, 0); assert.equal(db.users.find((x) => S(x._id) === S(u._id)).coin, 1000);
});

// =====================================================================================================
// 8. ISOLATION
// =====================================================================================================
test("two lives at the same time: concurrent viewers exchange comments with NO cross-session leakage", async () => {
  const A = await setup(3); const B = await setup(3);
  await Promise.all([
    ...A.viewers.map((v, i) => viewerComment(v, A.liveHistoryId, "A-" + i)),
    ...B.viewers.map((v, i) => viewerComment(v, B.liveHistoryId, "B-" + i)),
    hostComment(A.hs, A.host, A.liveHistoryId, "A-host"), hostComment(B.hs, B.host, B.liveHistoryId, "B-host"),
  ]);
  const seenA = [A.hs, ...A.viewers.map((v) => v.sock)].flatMap((c) => names(userText(c.chat())));
  const seenB = [B.hs, ...B.viewers.map((v) => v.sock)].flatMap((c) => names(userText(c.chat())));
  assert.equal(seenA.length, 4 * 4, "every A client got all 4 A messages"); assert(seenA.every((t) => t.startsWith("A-")), "no B message in A: " + seenA.filter((t) => !t.startsWith("A-")));
  assert.equal(seenB.length, 4 * 4); assert(seenB.every((t) => t.startsWith("B-")));
  // ending A does not touch B
  quiet(); await A.hs.call("liveStreamEnd", { hostId: String(A.host._id), liveHistoryId: A.liveHistoryId }); loud();
  assert.equal(live(B.liveHistoryId).endTime, ""); assert.equal(B.viewers.every((v) => v.sock.ended().length === 0), true);
  assert.equal(A.viewers.every((v) => v.sock.ended().length === 1), true);
  // audience lists are per live
  const r = await B.hs.call("liveParticipantsRequest", { liveHistoryId: B.liveHistoryId });
  assert.equal(r.totalViews, 3); assert(r.participants.every((p) => B.viewers.some((v) => String(v.user._id) === p.userId)));
});

// =====================================================================================================
// 9. SECURITY / OPS
// =====================================================================================================
test("socket event payloads are NOT written to the log (only event names)", async () => {
  const lines = []; console.log = (...a) => lines.push(a.map(String).join(" "));
  const host = H.seedHost(); const hs = await H.connectHost(env, host);
  await hs.call("liveStreamStatusCheck", { liveHistoryId: "secret-payload-marker" }).catch(() => {});
  // the server's onAny hook only runs for real transport events; invoke the registered ones
  hs.anyHandlers.forEach((f) => f("liveCommentBroadcast", { commentText: "PRIVATE-TEXT-123" }));
  quiet();
  assert(!lines.some((l) => l.includes("PRIVATE-TEXT-123")), "payload leaked into logs");
  assert(lines.some((l) => l.includes("liveCommentBroadcast")), "event name is logged");
});

test("HostStreamingEnd emits no second, poorer liveStreamEnd (single authoritative end payload)", async () => {
  const { host, liveHistoryId, viewers } = await setup(1);
  quiet(); const res = H.mkRes(); await controller.HostStreamingEnd({ query: { hostId: String(host._id), liveHistoryId } }, res); loud();
  assert.equal(res.body.status, true);
  const ends = viewers[0].sock.ended(); assert.equal(ends.length, 1); assert.equal(ends[0].reason, "http-end"); assert(ends[0].endedAt);
});

// =====================================================================================================
(async () => {
  let pass = 0, fail = 0; const failures = [];
  realLog(`Live realtime tests (${tests.length})\n`);
  for (const t of tests) {
    quiet(); H.resetDb();
    try { await Promise.race([t.fn(), new Promise((_, rej) => setTimeout(() => rej(new Error("TEST TIMEOUT (30s)")), 30000).unref())]); pass++; realLog(`  ✓ ${t.name}`); }
    catch (e) { fail++; failures.push({ name: t.name, e }); realLog(`  ✗ ${t.name}\n      ${String(e && e.message).split("\n")[0]}`); }
    finally { H.clock.reset(); }
  }
  realLog(`\n${pass} passed, ${fail} failed`);
  failures.forEach((f) => realLog(`\n--- ${f.name}\n${f.e && f.e.stack}`));
  process.exit(fail ? 1 : 0);
})();
