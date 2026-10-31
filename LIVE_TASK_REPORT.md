# Live session + Daily LIVE Task - audit, fixes, tests (v5)

## A. Root causes
1. **Live status not updated on exit** - `liveStreamEnd` returned early (`if (!liveUser) return`, `if (!liveHistory) return`,
   `if (!host.isLive)`) before closing LiveBroadcastHistory, so a session could stay ACTIVE forever.
   Flutter only *logged* "Socket Not Connected" and dropped the End request.
2. **Ending was not atomic** - End Live, socket disconnect and any retry each did an unconditional
   `updateOne({endTime, duration})`: a second end overwrote endTime/duration (inflated or wrong minutes).
3. **No safety net** - nothing handled app kill / lost internet / server restart (disconnect never fires after a
   restart), no heartbeat, no stale detection. A new LIVE also left the previous open session orphaned.
4. **Stale progress** - progress was only recalculated on some hooks; orphan/zero-duration sessions were dropped
   from the daily sum, so the next LIVE appeared to start from 0 (v3 fixed the sum, v5 fixes the lifecycle).
5. **Wallet** - reward was credited correctly but the app only learnt the balance by re-fetching the profile.

## B. Files changed
Backend: services/liveSession.service.js (NEW), models/liveBroadcastHistory.model.js (+lastHeartbeatAt, +endReason, +indexes),
socket.js (liveStreamEnd, disconnect, liveHeartbeat, global.emitHostStatusUpdate), controllers/client/liveBroadcaster.controller.js
(start cleanup, [LIVE_START] log, HostStreamingEnd), routes/client/liveBroadcaster.route.js (POST /HostStreamingEnd),
services/dailyTask.service.js (orphan uses heartbeat, walletBalanceUpdated), config/dailyTask.config.js, index.js (reaper),
tests/dailyTask.simulation.js, .env.example.
Flutter: utils/socket_events.dart, utils/api.dart, pages/host_live_stream/api/end_host_live_api.dart (NEW),
socket/socket_services.dart (heartbeat, HTTP-fallback end + retry, walletBalanceUpdated),
pages/host_live_page/controller/host_live_controller.dart, pages/host_daily_task/controller/host_daily_task_controller.dart.

## C. Final flow
Host starts LIVE (HostStreaming: closes leftovers, creates ACTIVE session) -> liveHeartbeat every 20s ->
server computes daily total = finished sessions + active elapsed (server clock) -> every minute / on start / on end:
dailyTaskUpdate (room hostDailyTask:<hostId>) -> target reached: task completed, HostDailyTaskReward (unique) + Host.coin $inc
(transaction when available) -> dailyTaskReward + walletBalanceUpdated -> Flutter shows popup, sets coin, refreshes profile.
END paths (all call finalizeLiveSession, atomic): liveStreamEnd socket, HTTP /HostStreamingEnd, socket disconnect,
stale reaper (60s tick), next HostStreaming.

## D. Event / API contract (names kept; no renames of existing events)
- dailyTaskUpdate  (= "daily_task_progress_updated")   - dailyTaskReward   - NEW walletBalanceUpdated
  {hostId, coins, addedCoins, reason:"DAILY_TASK_REWARD", taskDate}
- NEW liveHeartbeat (app->server, no payload) / liveHeartbeatAck
- NEW POST /api/client/liveBroadcaster/HostStreamingEnd?hostId=&liveHistoryId=   (idempotent)
- GET /api/client/host/daily-task (unchanged)

## E. Migration
Mongoose creates the new indexes on startup. If autoIndex is off, run in mongosh:
  db.livebroadcasthistories.createIndex({ hostId: 1, createdAt: 1 })
  db.livebroadcasthistories.createIndex({ hostId: 1, endTime: 1 })
No data migration: lastHeartbeatAt/endReason default empty. Optional env: LIVE_STALE_SECONDS (default 120).
One-time cleanup of sessions stuck ACTIVE from before this fix happens automatically (reaper / next start).

## F. Test results (npm run test:dailytask, offline simulation with the REAL services)
Daily task: 3/6/9/12 cumulative, restart keeps progress, reward once, cap at target, 2 hosts isolated, new day = 0, scheduler interval.
Lifecycle: double End Live -> 1 finalization (duration frozen); 3 concurrent ends -> 1 winner; other host cannot end it;
late end of old session does not stop a new LIVE; killed app (heartbeat) -> ended at last heartbeat, no invented minutes;
legacy app kept while socket online, reaped after offline grace; orphan closed on next start without double count;
completion: coins 500->1500 exactly once, walletBalanceUpdated x1.
Not run here (no MongoDB / Flutter SDK): real DB, `flutter analyze`, device tests.

## G. Behaviour notes
- A stale session ends at its LAST proof of life (heartbeat), so minutes are never invented for offline time.
- An app that is backgrounded >120s without heartbeats is treated as gone (host is not streaming at that point).
- Over-target minutes still live in LiveBroadcastHistory (analytics) but the task is capped, reward is 1 per day.
