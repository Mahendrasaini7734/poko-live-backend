# v7 - host data isolation + centralized History
Backend: history route now requires user token; host resolved from token (foreign hostId -> 403);
types 1,2,3,5,6,7,9-16 included (check-in, admin add/deduct, daily task reward were missing);
response adds historyType/reason/isIncome/hasMore; new socket event `hostHistoryUpdate`
(daily task reward + admin coins). Daily-task API refuses a foreign hostId.
Flutter: history API no longer caches `static hostId` (first host's id leaked to later logins);
pagination reset per visit/host, epoch guard for late answers, no duplicate rows, realtime insert,
new HostHistoryTile (icon/colour/sign per type); daily-task payloads without matching hostId are rejected;
host bottom bar uses ensure() so a stale controller is switched.
NOT done / unverified: Flutter not compiled, no real 3-host run (no DB/SDK here). Run flutter analyze first.
