# Live streaming fix v10 (backend)

Scope: host comments not visible to viewers, live "ends by itself" on viewers, empty audience list for the host,
plus an audit of the whole live lifecycle. This ZIP contains the backend only; the Flutter/app code was not provided.

## Root causes (confirmed by running the ORIGINAL code in a test harness)

1. **`socket.js`, host branch of `io.on("connection")` ended with a bare `return;`.** That exits the whole connection
   callback, so for every HOST socket none of the `socket.on(...)` handlers below it were ever registered:
   `liveCommentBroadcast`, `liveSync`, `liveRoomJoin`, `liveParticipantsRequest`, `liveHeartbeat`, `liveStreamEnd`,
   `chatMessageSent`, call events and `disconnect`.
   Original code, host socket: **all 7 checked handlers MISSING** (see "Evidence").
   * Host comments: the host's `liveCommentBroadcast` was never handled -> viewers never got them.
   * Audience list: the host's `liveParticipantsRequest` was never handled -> the bottom sheet stayed empty.
   * Live ends by itself: the host's `liveHeartbeat` was never handled -> `lastHeartbeatAt` never written -> the stale
     reaper (120 s) treated a healthy live as dead, and the host's `disconnect` grace logic never ran either.
     The v6 report already notes "host chat root cause could not be reproduced (backend accepts it)" - same cause.
2. A reconnected host socket was never put back into the live room, so viewer join/leave/count events did not reach it.
3. Supporting defects: audience `totalViews` was `participants.length` (capped at 200); the reaper ended a live whose
   heartbeat was late even though the host socket was connected; recent chat existed only in memory (lost on restart);
   a join racing with end-live could leave an orphan viewer row; same user on 2 devices was dropped when the owning
   device disconnected; `onAny` logged every payload (chat text, tokens).

## What changed

| File | Change |
|---|---|
| `socket.js` | Live handlers registered for EVERY socket before any role code. Host branch uses a labeled block instead of `return`, so hosts also get chat/call/disconnect handlers. Host reconnect restores the live room + cancels the pending end. `isHost` handshake parsed strictly (`"false"` is not a host). `onAny` logs event names only. Disconnect no longer wipes a running live when the host also had a call. |
| `services/liveSocketHandlers.js` (new) | All live events (`liveSync`, `liveRoomJoin`, `liveParticipantsRequest`, `liveStreamStatusCheck`, `liveJoinerCount`, `removeLiveJoiner`, `liveCommentBroadcast`, `liveGiftSent`, `liveHeartbeat`, `liveStreamEnd`) + host disconnect grace (default 60 s) + `restoreHostLiveRoom`. Same event names/payloads as before. |
| `services/liveRoom.service.js` | Audience join/leave/count events also reach the host's personal room (one delivery per socket). `getAudience` (paged, true total, `hasMore`). Same user on several devices = one viewer; row handed to a surviving device. Join/finalize race cleaned up. Chat history = memory + persisted comments merged. Viewer token 24 h (`LIVE_VIEWER_TOKEN_HOURS`). |
| `services/liveSession.service.js` | Reaper keeps a live whose host socket is connected (heartbeat late) for up to `LIVE_STALE_WITH_SOCKET_SECONDS` (900); no socket + no heartbeat still ends after `LIVE_STALE_SECONDS` (120). End event also reaches the host's other devices. |
| `services/liveAnalytics.service.js`, `models/liveComment.model.js` | Persisted comment id == realtime `messageId`; `isHostMessage` stored. |
| `controllers/client/liveBroadcaster.controller.js`, `routes/client/liveBroadcaster.route.js` | New `GET /api/client/liveBroadcaster/LiveAudience?liveHistoryId=&hostId=&limit=&skip=` (host only; fallback/retry for the bottom sheet). `HostStreamingEnd` no longer emits a second, poorer `liveStreamEnd`. |
| `index.js` | socket.io `pingInterval 25 s / pingTimeout 40 s` (env tunable) for mobile networks. |
| `.env.example`, `package.json` | New env vars, `npm run test:live`. |
| `tests/liveRealtime.test.js`, `tests/helpers/liveHarness.js` (new) | 41 tests, see below. |

Database: no migration required. New optional field `LiveComment.isHostMessage`. (v9 unique indexes still apply.)

## Events (unchanged names; what the app must do)

* After EVERY socket (re)connect and when returning from background, call `liveSync` with `{liveHistoryId, userId, userName, userImage}`
  (host: `{liveHistoryId}`). The ack contains the full state; `liveCommentHistory` replays the last 40 messages.
  A reconnected HOST socket is re-attached to its live room by the server automatically.
* Host sends `liveHeartbeat` every ~20 s; viewers de-duplicate chat by `messageId`.
* Host audience sheet: `liveParticipantsRequest` `{liveHistoryId, limit?, skip?}` -> ack and `liveParticipantsList`
  `{participants, totalViews, hasMore}`; live updates via `liveParticipantJoined/Left` and `liveJoinerCount`.
  Fallback: `GET .../LiveAudience`.
* Only `liveStreamEnd` from the owning host (or HTTP `HostStreamingEnd`, admin end, or a verified server termination) ends a live.

## Tests

`npm run test:live` -> **41 passed, 0 failed.** They drive the REAL `socket.js`, services and controller through an in-memory
socket.io hub and in-memory models (several independent clients per scenario, controllable clock). Covered: host/viewer comments
to all clients (single delivery, order, dedupe, rate limit, persistence, late-joiner history), initial state, audience list
(paging, true total, REST), viewer count up/down, duplicate connections / 2 devices / concurrent joins, host + viewer
reconnects, grace period (returns / does not return), 3-hour simulated live with heartbeats, silent heartbeat with and without
a connected socket, dead-session reaping, explicit end (all viewers, DB, room emptied, Discover), repeated/concurrent end,
authorization, gifts (debit/credit/History/idempotency/ended live), two simultaneous lives without leakage, log privacy.

Mutation check: re-introducing the original `return` makes 5 of these tests fail.
Existing scripts: `test:commandcenter`, `test:feedprofile`, `test:dailytask` pass (same as before). `test:feed`
has 2 failures that are **identical on the original ZIP** (expects `FEED_LIKED`, code emits `feedAdmin:event`); not touched.

### Not verified (be aware)
* No real MongoDB / socket.io transport / Agora / Flutter app were available (package registry and MongoDB downloads are blocked
  in the build sandbox, so `npm install` could not run). Tests use in-memory stand-ins: **Mongo transactions were not exercised**
  (the gift test runs the non-transactional path), nor real network packets or reconnect back-off. Run `npm install && npm run test:live`
  and one live smoke test on staging before release.
* App-side code (listeners, bottom sheet UI, Agora token renewal/`onError` handling) is not part of this ZIP.

## Remaining issues found (NOT changed - need a product/security decision)
1. `checkAccess.js`: `key = headers.key || body.privateKey || query.key || process.env.secretKey` - when no key is sent it falls back to the
   server's own secret, so every route protected by it (including `HostStreamingEnd`, `LiveAudience`) is effectively open.
2. Socket identity is taken from the client-supplied handshake (`loginUserId`, `hostId`, `isHost`) with no token check. Ownership checks for
   end-live compare against that claimed identity. Verify a Firebase/JWT token in the socket middleware.
3. `hostStatusUpdate` (broadcast to every Discover subscriber) contains the host's Agora **publisher** `token`/`channel`. Viewers should only
   ever receive a subscriber token (`liveSync` already returns one).
4. Multi-instance deployments: the replay buffer, rate limits and grace timers are per process; use the socket.io Redis adapter + sticky sessions.
5. Client flows that never call `liveSync` after a reconnect keep a stale socket outside the room (self-heals the count after ~15 s, but the viewer
   gets no events). The app must call `liveSync` (documented above).

## Deploy
Set (optional) `LIVE_DISCONNECT_GRACE_SECONDS=60`, `LIVE_STALE_SECONDS=120`, `LIVE_STALE_WITH_SOCKET_SECONDS=900`, `LIVE_VIEWER_TOKEN_HOURS=24`,
`SOCKET_PING_INTERVAL_MS=25000`, `SOCKET_PING_TIMEOUT_MS=40000`; restart. Verify: host starts live, 2 viewers join, host comment appears on both,
viewer comment appears on host + other viewer, audience sheet lists both, toggle host airplane mode for < 60 s (live continues), press End Live
(both viewers see the end screen, Discover entry disappears).
