# Daily Task + Live Streaming - complete fix (v6)

Base: your latest backend (Daily Task v5 x Live Command Center merge) and Flutter app. Nothing of the Command Center was touched.

## 1-4. Root causes
1. **Daily Task refresh** - `_load()` returned immediately when a request was already running (a pull-to-refresh
   could silently do nothing), a failed manual refresh showed nothing, and Home never re-synced when shown.
   Daily-Task state could therefore look stale/cached. (Session accounting itself was already server-side.)
2. **Host chat** - the backend does NOT reject host messages (verified: `liveCommentBroadcast` accepts every sender).
   Client-side causes fixed: the app read the room id from `Get.arguments`, which is null while a dialog/sheet is the top
   route (the exception was swallowed -> message dropped); host accounts could send an EMPTY user id so the server ignored
   `liveRoomJoin` (host never in the room, no join message); a failed send gave no feedback and cleared the text.
   I could not reproduce this on a device here - please verify on a phone (steps below).
3. **Live end UI** - Stop used `Get.close(3)` (blind pop of 3 routes = "back" feel) and the end request was fired from
   `dispose()` without waiting. Also an End while the socket was down was lost (v5 added the HTTP fallback).
4. **Discover realtime** - the "host is LIVE" broadcast was triggered by the HOST APP's `liveRoomJoin` (and skipped when the
   notification had already been sent), so if that event did not arrive nobody's list updated. The app also did a FULL reload
   (shimmer, list cleared) for every single event.
Extra bug found: `HostStreaming` deleted the host's `LiveBroadcaster` BEFORE any check, so a duplicate start wiped a running live.

## 5-8. Backend changes
* `services/liveSession.service.js`: `checkActiveSession` (one active live per host, server-side); viewers get `liveStreamEnd`
  for disconnect / stale / superseded ends; "host joined" announce flag is cleared on end.
* `controllers/client/liveBroadcaster.controller.js` (HostStreaming): duplicate-live guard (same channel+agoraUid = idempotent
  retry returns the SAME live; otherwise "You are already live"), broadcaster deleted only AFTER the guard, server emits
  `hostStatusUpdate` right after the live is created (no dependency on the app).
* `socket.js` `liveRoomJoin`: falls back to the authenticated socket identity when the app sends no user id; ONE
  "Host joined the LIVE" system message per session (broadcast + Command Center record), no duplicate on reconnect.
* `services/dailyTask.service.js` + `controllers/client/dailyTask.controller.js`: payload now has `timezone`,
  `serverTime`, `nextResetAt` (next Asia/Kolkata midnight). Scheduler pushes the NEW day (0/target) at midnight to every host
  that has a socket connected (live or not). `getTaskDate` uses the same clock as everything else.
* Tests: `npm run test:dailytask` (rollover payload + midnight push + active-live guard added) and `npm run test:commandcenter`.

## 5-8. Flutter changes
* `host_daily_task_controller.dart`: refresh joins/queues behind a running request, manual-refresh errors are shown, `syncIfStale()`
  for Home, `nextResetAt` timer -> automatic reload at midnight (fallback: local IST midnight, same zone as backend),
  state cleared/ignored on owner change (epoch + hostId checks, from v4).
* Home: Daily Task card moved INTO the scrollable content of the Popular and Following tabs (`HostDailyTaskHeader`); it scrolls with
  the page and re-syncs when shown. (Removed from the fixed tab bar. It is not shown on the One-to-One tab.)
* Logout / delete account: `SocketServices.disconnectSocket()` now also clears all socket listeners, stops the heartbeat,
  drops any pending End and deletes the Daily Task controller. New login -> `ensure()` creates a fresh controller for the new host.
* `host_live_controller.dart`: robust `onSendComment` (own session id, feedback, keeps text on failure), `endLiveAndExit()`
  (end on server -> leave Agora -> `Get.until(bottomBar)` -> Daily Task re-sync), `onDispose` runs once and is awaited.
* `stop_live_dialog.dart`: Stop calls `endLiveAndExit()`.
* `socket_services.dart`: `onComment` returns a bool, host id fallback for room join / comments.
* Discover: realtime events are debounced (600 ms) and refresh silently (list never blanks).

## Events (names kept; mapping to your list)
LIVE_STARTED / LIVE_ENDED = `hostStatusUpdate` (server-emitted on start and on every end path) + `liveStreamEnd` to the room;
LIVE_SESSION_PROGRESS / DAILY_TASK_UPDATED / DAILY_TASK_RESET = `dailyTaskUpdate` (now also at midnight);
DAILY_TASK_COMPLETED / REWARD_UPDATED = `dailyTaskReward` + `walletBalanceUpdated`;
USER_LOGIN / USER_LOGOUT = controller `ensure()` / `disconnectSocket()` (client side). Fallback for every push = GET /api/client/host/daily-task.

## 9-10. Session-based calculation, timezone
progress = finished sessions (duration from SERVER timestamps, `finalizeLiveSession`) + running session elapsed, summed per
Asia/Kolkata calendar day; never reset by start/end/restart; capped at target; reward once. Day boundary = Asia/Kolkata
everywhere (backend `taskDate`, `nextResetAt`; Flutter only uses it as a trigger and then loads from the server).

## 11. Tests run (offline, real services over in-memory models)
Daily task suite: 3/6/9/12 cumulative, restart, reward once, cap, 2-host isolation, new day, scheduler interval; lifecycle: double End,
3 concurrent ends, foreign host, late end vs newer live, killed app, legacy app, orphan on next start, reward+wallet once;
NEW: `nextResetAt`/serverTime payload, midnight push to an open app, active-live guard (alive / silent / ended).
Command Center suite: 9/9. `node --check` on all touched JS. Dart: bracket-balance check only (no Flutter SDK here).

## 12. Remaining risks / to verify on device
* Flutter was NOT compiled/run: run `flutter pub get && flutter analyze`, then test: host live -> type a message (host sees it, viewer sees it),
  "Host joined the LIVE" appears once, Stop -> lands on home, Discover updates on another phone, Daily Task after End.
* Host chat root cause could not be reproduced here (backend accepts it); if it still fails send the Flutter log lines `Socket Not Connected` /
  the backend `[liveCommentBroadcast]` lines.
* A host who kills the app and restarts a live within 45 s (LIVE_START_GUARD_SECONDS) gets "You are already live" until the old session goes silent.
* iOS may pause Dart timers in background: after 120 s without heartbeat the server ends the session (LIVE_STALE_SECONDS).
* Midnight push covers hosts with an open socket; others load the new day on next open (API is date-aware).
* Env: `LIVE_START_GUARD_SECONDS` (45), `LIVE_STALE_SECONDS` (120), `DAILY_TASK_*` as before. No DB migration needed.
* Pre-existing, untouched: HostStreamingEnd HTTP route is protected by the app secret only (see MERGE report).
