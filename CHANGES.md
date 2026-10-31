# Host Daily LIVE Task - cumulative version

Rule: progress = SUM of all LIVE sessions of the Asia/Kolkata day (finished sessions from
LiveBroadcastHistory + the running session's elapsed time, counted once). Never resets on
LIVE start/end, app restart, socket reconnect or server restart - only when taskDate changes.

## Backend
- config/dailyTask.config.js: env-driven (DAILY_TASK_TARGET_MINUTES, DAILY_TASK_REWARD_COINS,
  DAILY_TASK_UPDATE_INTERVAL_MINUTES, DAILY_TASK_ENABLED). See .env.example.
- services/dailyTask.service.js:
  * an UNCLAIMED task follows the current config (change 60 -> 12 and today's task adapts);
    a paid task keeps the target/reward it was paid with.
  * scheduler checks every 60s (reward never late) but emits dailyTaskUpdate only every
    DAILY_TASK_UPDATE_INTERVAL_MINUTES (or immediately on status change / reward).
    LIVE start, LIVE end, API call and socket connect always emit.
- tests/dailyTask.simulation.js: `npm run test:dailytask` (no DB needed) - 12 min flow 3/6/9/12,
  app restart, reward exactly once, over-completion cap, new day, scheduler interval.

## Flutter
- HostDailyTaskController.ensure() single permanent controller (bottom bar + socket layer + cards).
- Reconnect always forces GET /api/client/host/daily-task.
- New screen HostDailyTaskView + HostDailyTaskBinding + route AppRoutes.hostDailyTaskPage
  (home card tap opens it). Reward dialog shows "N / N Minutes" + reward from backend.
- Home card: discover_host_for_user_page/widget/tab_bar_widget.dart. Profile card: profile_name_widget.dart.

## 12-minute test
.env: DAILY_TASK_TARGET_MINUTES=12, DAILY_TASK_UPDATE_INTERVAL_MINUTES=3 -> restart Node. Flutter untouched.

## Fix: progress went back to 0 after LIVE ended / app restart
- getHistoricalLiveSeconds: a session now counts if startTime OR createdAt is today; per-session
  seconds = stored duration, else endTime-startTime; sessions left open (host reset without
  endTime) are counted up to their last write instead of being dropped.
- syncDailyTask: progress inside a day never goes below what the task document already reached.
- New logs: "DAILY TASK CALCULATION host=.. sessions=N historical=..s active=..s".
- tests: regression block (zero duration / orphan / lost history).

## Fix: one host completing the task showed "completed" for every host
Backend was already per-host (task doc, API token -> own Host, room hostDailyTask:<hostId>);
verified by tests/dailyTask.simulation.js (host1 12/12 completed + reward, host2 0/12, separate rooms/wallet).
The leak was Flutter: ONE permanent HostDailyTaskController kept the previous host's state when
another host logged in on the same device (and any payload was applied blindly). Now:
- every socket update / reward / API answer carries hostId; Flutter drops anything not for the
  logged-in host (ownerHostId), and drops API answers that arrive after an account switch (epoch).
- ensure() switches owner (clears state + refetches) when Database.hostId changes, and deletes the
  controller when the logged-in account is not a host.
- login profile API calls ensure() right after storing hostId.
- socket connect leaves any other hostDailyTask:* room before joining its own.
