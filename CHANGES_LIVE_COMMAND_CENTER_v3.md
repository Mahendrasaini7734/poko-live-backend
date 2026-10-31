# Live Command Center v3 — one consistent live-room event system

Builds on v2. Nothing was removed; no collection was renamed; no new realtime architecture
(the existing admin Socket.IO room + REST history is still the only channel).

## Root causes (what was really wrong)

| # | Symptom (screenshots) | Root cause | Fix |
|---|---|---|---|
| 1 | Comments "No comments yet", Comments tab empty | Comments were only stored when the app payload carried a valid `liveHistoryId` and the text under the key `commentText`. Otherwise the handler returned silently (or `notifyComment` dropped it) → nothing stored, nothing emitted. | `resolveRoomId()` resolves the room server-side (payload → sender's/host's live room → room remembered on the socket). Text accepted from `commentText/comment/message/text`. Comment is **saved first**, then emitted; DB id == realtime id. |
| 2 | "No gift activity", Gifts 0, Coins 0, revenue 0, participant Gifts/Coins Sent 0 | Everything gift-related is aggregated from `History(type 2).liveHistoryId`. When the app sent the gift without (or with a stale) `liveHistoryId`, the gift was saved with `liveHistoryId = null` → invisible to every room query. In that case the handler even threw on `liveHistoryId.toString()` **after** the coins were already moved, so no realtime event was sent either. | Gift room = the **receiving host's active live room** (server-resolved; payload used only if it matches). Crash fixed (guarded emit). `LiveBroadcastHistory.coins/gifts` totals are now also updated for these gifts. |
| 3 | Top "Gifts / Coins" counters never moved | Header values were read from a REST list refreshed every 15 s and on room start/end only; the `earnings` / `viewerCountUpdated` socket events were ignored. | `useLiveRoomOptions` patches the counters from those events immediately. |
| 4 | "Real-time Activity (2)", `1 - 1 of 1`, no pagination | The count was `items.length` of one in-memory page (max 100, search/filter applied client-side); the backend merged sources with a hard cap (300) and applied search after paging. | New server-side pagination with exact merge (page × limit window), per-tab `counts` from `countDocuments`, search inside the queries. Tabs show real counts; switching tab / room / page size resets to page 1. |
| 5 | Audit log only has the admin END ROOM | Audit was written only by the admin `endRoom`. Host start (REST) and host end (socket `liveStreamEnd`, disconnect) never wrote audit. | `START_ROOM` (start controller) / `END_ROOM` (host socket, host disconnect, admin, reconcile safety net) — all idempotent through a unique `dedupeKey` (`START_ROOM:<roomId>`, `END_ROOM:<roomId>`). Rows carry actor type/id/name (admin / host / system). |
| 6 | Users who left vanished from Participants | Live rooms listed only the *current* viewers from the snapshot. | Participants = current viewers + sessions that already left (Left At + frozen duration). |
| 7 | "No data" shown for failed requests | Silent reloads kept the old list without any signal; empty text was shown for errors on non-empty lists. | Error banner with Retry; "Unable to load …" only on failure, "No … yet" only on a successful empty answer. |
| 8 | End Live Room with no permission check | Any logged-in admin; no pre-check; any app socket could emit `liveStreamEnd` for another host. | Server `canEndRoom` (main admin, or staff with **Delete** on module "Live Analytics"); UI asks `/permissions` before opening the modal; app socket must belong to the host that owns the room. |

## Backend
* `services/liveAnalytics.service.js` — `resolveRoomId`, `notifyComment` (persist-then-emit), profile cache, `decorate()` (eventId, eventType COMMENT/GIFT/JOIN/LEAVE/ROOM_START/ROOM_END, actorId, actorName, timestamp, readable `message`), idempotent `writeAudit`, `recordRoomStart`, `onRoomEnded`, `markEnding`, `finalizeRoomSessions`, duplicate-end lock, `liveAnalytics:audit` event, richer `earnings` payload (transactions, uniqueSenders). Session close never overwrites an already finalized `leftAt`.
* `controllers/admin/liveAnalytics.controller.js` — `roomActivity` rewritten (exact pagination, `counts`, server search, room events enriched from audit), `sessionParticipants`, `roomEventCounts`, `canEndRoom`, `GET /permissions`, `endRoom` returns `{status:"ended", endedAt}` and 409 on a repeated end (no extra audit row), audit rows expose `actorType/actorName/reason`.
* `socket.js` — room remembered per socket; comments/gifts use `resolveRoomId`; gift crash fixed; `liveStreamEnd` ownership check + analytics hook; disconnect-end hook.
* `controllers/client/liveBroadcaster.controller.js` — `START_ROOM` audit.
* Models — `LiveAdminAudit` (+actorType, actorId, actorName, reason, dedupeKey unique-partial index), `LiveComment` (+uniqueId), `Gift` (+optional `name`, used for "Rose x5"; falls back to "Gift" when empty).
* Route — `GET /api/admin/live-analytics/permissions`.

## Admin panel
* `RoomActivity.tsx` (+ `useRoomEvents.ts`) — paginated feed, tab counts, search, connection badge, error vs empty, final numbers for ended rooms.
* `RoomDetailDialog.tsx` — permission check → confirmation modal (permanent-action wording, Cancel / End Live Room), immediate LIVE→ENDED, full **Refresh Room** (room, revenue, participants, comments, gifts) with "Synced" only after full success, realtime badge, heartbeat polling only while realtime is down.
* `LiveSections.tsx` — same permission gate + wording for the table's End button.
* `AnalyticsSections.tsx` — Audit Log shows Actor (Admin / Host / System), reason, refreshes on `liveAnalytics:audit`.
* `useActivityFeed.ts` — real `total`, synchronous dedupe, `reload()` reports success.
* `useLiveRoomOptions.ts`, `useSocketStatus.ts`, `liveAnalyticsApi.ts`, `liveAnalyticsSocket.ts`, `ActivityFeed.tsx`.

## Deploy
1. **No data migration.** New fields have defaults. Mongoose builds the new unique partial index on `LiveAdminAudit.dedupeKey` on start (`autoIndex`); if autoIndex is off, run `db.liveadminaudits.createIndex({dedupeKey:1},{unique:true,partialFilterExpression:{dedupeKey:{$type:"string"}}})`.
2. Staff roles: to let a staff role end rooms, tick **Delete** on "Live Analytics". Main admin is always allowed.
3. Old gifts that were saved with `liveHistoryId = null` cannot be attributed retroactively. Old comments were never stored.
4. Still one Node process for realtime state (add the Socket.IO redis adapter before scaling out).
5. Host-socket ownership check accepts `socket.data.userId` / `socket.data.hostId` equal to the Host `_id` or Host `userId`. If your app logs hosts in with another id, watch for `⛔ liveStreamEnd rejected` in the logs.
