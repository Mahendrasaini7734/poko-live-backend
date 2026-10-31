# Host Profile Feed + Reels Feed — realtime interactions

## Socket events (server -> client)
FEED_LIKED, FEED_UNLIKED, FEED_COMMENT_ADDED, FEED_COMMENT_UPDATED (reserved), FEED_COMMENT_DELETED,
FEED_VIEW_UPDATED, FEED_SHARED, FEED_DELETED.
Payload: `{ eventId, event, seq, timestamp, feedId, hostId, userId, action, updatedCount, [commentId, comment] }`
`updatedCount` is ABSOLUTE (never a delta) and `seq` is strictly increasing; REST responses of
like/comment/view/share also return the same `seq` => clients apply each change exactly once.

## Socket events (client -> server)
`feed:join {feedId|feedIds}`, `feed:leave`, `feed:joinHost {hostId}`, `feed:leaveHost` (max 60 feed rooms per socket).

## REST
- POST /feed/:id/like        body `{ liked?: bool }` (idempotent) -> `{ liked, likes, seq }`
- POST /feed/:id/comment     -> comment doc + `commentsCount`, `seq`
- DELETE /feed/:id/comment/:commentId  (author or post owner)
- GET  /feed/:id/comments?page&limit   -> + `hasNextPage`
- POST /feed/:id/view        (fixes missing FeedView import) -> `{ views, counted, seq }`
- POST /feed/:id/share
- GET  /feed/:id             single post (404 + available:false when deleted)
- GET  /feed/host/:hostId?type&page&limit&before   strictly hostId-scoped, stable sort `createdAt,_id`

## Validation / security
ObjectId validation on every id, post must be active, user<->host Block check, per-user throttles,
comment trimmed 1..500, unique like/view/share indexes, counts only changed when the underlying row changed.

## DB
No schema change. New compound indexes: FeedPost(hostId,type,status,createdAt,_id), FeedComment(postId,createdAt,_id).

## Tests
`npm run test:feed` (offline, 13 checks)

---
# Round 2 — dynamic Host Profile / navigation / authorization

- NEW `GET /api/client/feed/host/:hostId/preview` -> `{ counts, feed, reels, images }`, each `{ items (max 6), total, hasMore }`
  (1 aggregate for counts + 3 limited finds + 1 host lookup + 1 likes/comments lookup; no per-post populate, no N+1).
- `GET /feed/host/:hostId` now also accepts `type=all`, loads the host ONCE (no per-post join), `Cache-Control: no-store`.
- `retrieveHostDetails` (profile summary) now returns `feedCount, reelsCount, imagesCount, giftsCount` — still light (no feed payload).
- `requireHost` middleware on `POST /feed/create`: a normal user (no Host doc) or a blocked host gets 403 server-side.
- `/images` and `/videos`: `hostId` = authoritative `FeedPost.hostId` (it used to be derived through user->host lookup and was `null`
  when that lookup failed -> profile could not open); bounded (newest 100, optional page/limit); `/videos` now requires auth so `isLiked` is correct.
- Indexes: FeedPost(hostId,type,status,createdAt,_id), FeedComment(postId,userId).
- Tests: `npm run test:feed` (17 offline checks).

## Round 2 — dynamic host profile
- `GET /feed/host/:hostId/preview` : feed / reels / images (max 6 each) + totals + `hasMore` (total > 6) in one light call.
- Profile APIs (`retrieveHostDetails`, `fetchHostInfo`) return only `feedCount / reelsCount / imagesCount` (no more 12 posts + like/comment lookups per profile open).
- `POST /feed/create` behind `requireHost` (users get 403 server-side; there is no client edit/delete route).
- All GET feed routes: `Cache-Control: no-store`.
- Tests: `npm run test:feed` + `node tests/feedHostProfile.test.js` (12 checks: 0/1/6/10 feeds, host isolation, authorization).
