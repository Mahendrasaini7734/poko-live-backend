/**
 * Feed realtime layer (shared by Reels feed + Host Profile feed).
 *
 * Rooms
 *   feed:<postId>      -> everybody currently looking at that post (viewer / comment sheet)
 *   feedHost:<hostId>  -> everybody looking at a host profile / host gallery
 *
 * Every event carries ABSOLUTE counts (updatedCount) + a monotonic `seq`
 * (server ms timestamp) so clients can reconcile idempotently:
 *   - duplicate delivery  -> same eventId  -> ignored
 *   - out-of-order        -> seq <= lastSeq -> ignored
 *   - API response + socket for the same action -> same absolute count -> no +2
 */
const crypto = require("crypto");

const FEED_EVENTS = Object.freeze({
  LIKED: "FEED_LIKED",
  UNLIKED: "FEED_UNLIKED",
  COMMENT_ADDED: "FEED_COMMENT_ADDED",
  COMMENT_UPDATED: "FEED_COMMENT_UPDATED",
  COMMENT_DELETED: "FEED_COMMENT_DELETED",
  VIEW_UPDATED: "FEED_VIEW_UPDATED",
  SHARED: "FEED_SHARED",
  DELETED: "FEED_DELETED",
  CREATED: "FEED_CREATED",
  GIFTED: "FEED_GIFTED",
});

const ADMIN_FEED_ROOM = "liveAnalytics:admin"; // same room as liveAnalytics.service ADMIN_ROOM

const postRoom = (postId) => `feed:${postId}`;
const hostRoom = (hostId) => `feedHost:${hostId}`;

let lastSeq = 0;
// strictly increasing even when two events happen in the same millisecond
const nextSeq = () => {
  const now = Date.now();
  lastSeq = now > lastSeq ? now : lastSeq + 1;
  return lastSeq;
};

const emitFeedEvent = (event, payload) => {
  try {
    const io = global.io;
    if (!io || !payload?.feedId) return null;

    const body = {
      eventId: crypto.randomBytes(8).toString("hex"),
      event,
      timestamp: new Date().toISOString(),
      ...payload,
      seq: payload.seq || nextSeq(),
      feedId: String(payload.feedId),
      userId: payload.userId ? String(payload.userId) : null,
      hostId: payload.hostId ? String(payload.hostId) : null,
    };

    let target = io.to(postRoom(body.feedId));
    if (body.hostId) target = target.to(hostRoom(body.hostId));

    // one emit to the union of both rooms -> a socket in both rooms receives it once
    target.emit(event, body);
    // admin Feed Management reuses the existing admin analytics room (no second socket architecture)
    io.to(ADMIN_FEED_ROOM).emit("feedAdmin:event", body);
    return body;
  } catch (err) {
    console.error("FEED REALTIME EMIT ERROR =>", err.message);
    return null;
  }
};

/** register join/leave handlers on a connected socket */
const registerFeedSocketHandlers = (socket) => {
  const MAX_ROOMS = 60; // a client can never subscribe to an unbounded number of rooms

  const valid = (id) => typeof id === "string" && /^[a-f0-9]{24}$/i.test(id);

  const countFeedRooms = () => {
    let n = 0;
    for (const r of socket.rooms) if (r.startsWith("feed:") || r.startsWith("feedHost:")) n++;
    return n;
  };

  socket.on("feed:join", (data) => {
    const ids = [].concat(data?.feedIds || data?.feedId || []);
    for (const id of ids) {
      if (!valid(id) || countFeedRooms() >= MAX_ROOMS) continue;
      socket.join(postRoom(id));
    }
  });

  socket.on("feed:leave", (data) => {
    const ids = [].concat(data?.feedIds || data?.feedId || []);
    for (const id of ids) if (valid(id)) socket.leave(postRoom(id));
  });

  socket.on("feed:joinHost", (data) => {
    if (valid(data?.hostId) && countFeedRooms() < MAX_ROOMS) socket.join(hostRoom(data.hostId));
  });

  socket.on("feed:leaveHost", (data) => {
    if (valid(data?.hostId)) socket.leave(hostRoom(data.hostId));
  });
};

module.exports = {
  FEED_EVENTS,
  emitFeedEvent,
  stampSeq: nextSeq,
  registerFeedSocketHandlers,
  postRoom,
  hostRoom,
};
