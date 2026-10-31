# Merge report — Host Daily Task / live-session lifecycle (v5)  ×  Admin Live Command Center (v3)

## What was compared
| Codebase | Role |
|---|---|
| `zigo-backend-live-command-center-v2.zip` | original admin backend (base for the 3-way merge) |
| my v3 | v2 + Command Center fixes (room resolution, audit, pagination, permissions …) |
| `zigo-backend-final-v5.zip` | your Daily Task + live-session lifecycle work |

**Finding:** v5 was branched from an *older* admin backend. It does not contain `liveAdminAudit.model`, `liveComment.model`,
`History.liveHistoryId` (+ its indexes), the socket comment/gift hooks, nor the 1167-line `liveAnalytics.service` /
1240-line controller (v5 has 673 / 512-line older versions with zero Daily Task code). Copying v5 over v3 would have
silently deleted those. So the merge was done **per file** with a real 3-way merge (`git merge-file`, base = v2), never by overwrite.

## Decision per file
| File | Decision |
|---|---|
| `config/dailyTask.config.js`, `services/dailyTask.service.js`, `services/liveSession.service.js`, `controllers/client/dailyTask.controller.js`, `routes/client/dailyTask.route.js`, `models/hostDailyTask*.js`, `util/duration.js`, `tests/dailyTask.simulation.js`, `.env.example`, docs | **added as-is** (new, no overlap) |
| `models/host.model.js`, `models/liveBroadcastHistory.model.js`, `types/constant.js`, `package.json`, `index.js`, `routes/client/route.js`, `routes/client/liveBroadcaster.route.js` | **3-way merged, 0 conflicts** (v5 only adds) |
| `controllers/client/liveBroadcaster.controller.js` | 3-way merged, **1 conflict resolved by hand**: both sides appended code after the start-live response → kept both (Daily Task `[LIVE_START]` log + `triggerRefresh`, then my `START_ROOM` audit) |
| `socket.js` | **v3 + v5 hunks grafted by hand** (see below). v5's copy lacked all Command Center hooks |
| `models/history.model.js` | **kept v3** (v5's copy lacks `liveHistoryId` + indexes the Command Center needs) |
| `services/liveAnalytics.service.js` | **kept v3**, one change: admin `endRoom` now closes through `finalizeLiveSession` |
| `controllers/admin/liveAnalytics.controller.js`, `routes/admin/liveAnalytics.route.js`, `models/liveAdminAudit|liveComment|gift.model.js` | **kept v3** (v5 has nothing of its own here) |
| `services/liveSession.service.js` | v5 + a small Command Center bridge (below) |

## The real integration point: one end-path
v5 made `finalizeLiveSession()` the single atomic, idempotent place that closes a broadcast. v3 had its own end logic in 3 places
(socket `liveStreamEnd`, socket disconnect, admin `endRoom`) which would have bypassed it. Result of the merge:

| Way a live ends | Closes through | Command Center (END_ROOM audit, ROOM_END, final durations/revenue) | Daily Task refresh |
|---|---|---|---|
| Host "End Live" (socket) | `finalizeLiveSession` (`liveStreamEnd`) | actor **Host**, endedBy `host` | yes |
| HTTP `POST /HostStreamingEnd` | `finalizeLiveSession` (`http-end`) | actor **Host** | yes |
| Host socket disconnect | `finalizeLiveSession` (`socket-disconnect`) | actor **Host**, endedBy `host_disconnected` | yes |
| Stale reaper (no heartbeat) | `finalizeLiveSession` (`stale-timeout`) | actor **System** + reason | yes |
| New live start closes orphan | `finalizeLiveSession` (`new-live-start`) | actor **System**, endedBy `superseded` | yes |
| **Admin end-room** | `finalizeLiveSession` (`admin-end`, `analytics:false`) then `onRoomEnded` with the admin | actor **Admin** (+reason) | yes (new: admin-ended lives now count for the task) |

* The bridge lives **inside** `finalizeLiveSession`, so there is exactly one hook for all paths; `socket.js` no longer needs its own.
* It is fire-and-forget and wrapped in try/catch: a Command Center problem can never block or delay ending a live.
* `END_ROOM:<roomId>` is a unique `dedupeKey`, so duplicates/races produce one audit row and one ROOM_END event.

## `socket.js` — what was grafted
1. `global.emitHostStatusUpdate` (used by the reaper / HTTP end / finalize).
2. Host connect → `dailyTask.onHostSocketConnected`.
3. New `liveHeartbeat` / `liveHeartbeatAck`.
4. `liveStreamEnd` = v5's handler **plus my ownership rule** (the socket must belong to the host; `finalizeLiveSession` also checks `history.hostId`). `markEnding` moved into `finalizeLiveSession`.
5. Disconnect → `finalizeLiveSession` (my duplicated DB-update block removed).
6. Kept from v3: `resolveRoomId`, `notifyComment`, `notifyGift`, `History.liveHistoryId`, `module.exports`.

## Verification (no MongoDB / registry access in the build environment)
* `node --check` on all 264 JS files; static `require()` resolution over the whole tree.
* `npm run test:dailytask` (v5 suite) — passes on the merged tree.
* `npm run test:commandcenter` (**new**, 9 scenarios, real services over in-memory models): host end, repeated end / disconnect / HTTP end, disconnect vs reaper actors, foreign host rejected, orphan cleanup, admin end-room, admin retry (409, no new audit), **host+admin at the same instant → 1 winner / 1 audit / 1 ROOM_END**, `START_ROOM` once.
* My earlier Command Center suites (room resolution, idempotent audit, exact pagination over 48 events, permission gate) — pass on the merged tree.
* All 17 `History` queries in the Command Center are pinned to gift type 2, so Daily-Task reward rows (type 16) cannot affect gift revenue.

## Not verified (cannot be done here) — please run on staging
* Real boot with MongoDB + Firebase + `npm install` (registry returned 403 here).
* Flutter app, device tests; real `moment-timezone` (tests used the project's own IST shim where the package was absent).
* The two ZIPs share no `.git` history, so merge correctness rests on the per-file analysis above.

## Pre-existing issues (present in both original ZIPs, not touched)
* `controllers/email/emailCampaign.controller.js` requires `../../models/user/user.model` (path does not exist; lazily inside a function).
* `jsonwebtoken` is required by `controllers/admin/admin.controller.js` but is not listed in `package.json`.

## Security note
`POST /api/client/liveBroadcaster/HostStreamingEnd` (from v5) is protected by the app secret key only — the same as the existing `HostStreaming`.
Anyone holding the key who knows a `hostId` + `liveHistoryId` can end that live. Recommended: add `validateUserToken` and derive the host from the token
(needs the Flutter request to send the Bearer token + `x-user-uid`). I did not change it because that would break the current app.

## Deploy
1. Merge env: copy `.env.example` entries (`DAILY_TASK_*`, `LIVE_STALE_SECONDS`).
2. Indexes build automatically; if `autoIndex` is off run the commands in `LIVE_TASK_REPORT.md §E` **and** the `LiveAdminAudit.dedupeKey` command in `CHANGES_LIVE_COMMAND_CENTER_v3.md`.
3. `npm run test:dailytask && npm run test:commandcenter`.
