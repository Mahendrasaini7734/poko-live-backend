# Live Command Center v2 - what changed

## Structure (as requested)
* **Top = global**: summary cards (live users / hosts / rooms / viewers + today's gifts & earnings).
* **Everything below = per live room**:
  * *Live Rooms* table (click a row -> Room Command Center).
  * *Live Activity* is now **one room at a time** (room picker): that room's comments, gifts, joins/leaves, room events. History + realtime, "Load older" for more.
  * *Live Users* has a **room filter**.
  * *Room Command Center* works for **live and finished rooms**: host, participants (join/left/duration, gifts, coins), revenue split, comments, gifts, timeline.
  * *Historical Analytics -> Gifts -> Transactions*: sender (name + profile), host, **room id** (click to open), gift, coin split, with search, date filter and pagination. "By Gift" view kept.
  * *Room Analytics* rows open the room command view.

## Bugs fixed
| Bug (screenshot) | Root cause | Fix |
|---|---|---|
| Rows-per-page value not picked / wrong table changes | `Pagination` used the jQuery `<Select id="pagination">`; every table on the page had the SAME id | Native controlled `<select>`, no ids. `changeRowsPerPage` now resets to page 1. Fixes all 42 lists that use `Pagination`. |
| Hydration error (`01:36:29 AM` vs `01:36:30 AM`) | "Last Updated" rendered `Date.now()` on server and client | Starts empty, set on the client only. |
| Cards / room revenue not realtime | (1) admin socket read the Firebase token from `sessionStorage` on reconnect - expires after 1 h so the socket was rejected forever; server-side disconnects were never retried. (2) money push depended on profile lookups succeeding | (1) token fetched fresh from Firebase on **every** connection attempt, auto-retry after server disconnect, `authError` event. (2) `scheduleFinance()` is called first and always. (3) 5 s polling safety net while the tab is visible (paused when the tab is hidden). |
| Comments not showing | Comments lived only in a process-memory ring buffer (lost on restart / nodemon / pm2 reload, invisible to a second instance) | Persisted in `LiveComment` (TTL 30 days), paged by room. |
| Global activity feed | Showed the whole platform mixed | Replaced by the per-room feed. |
| Gift analytics: no sender / room, no pagination | Grouped by gift only | New transactions endpoint + view with pagination. |
| Squeezed room table | 15 columns in 100 % width | `min-width` per table, spacing, horizontal scroll. |

## Files
Backend: `models/liveComment.model.js` (new), `services/liveAnalytics.service.js`, `controllers/admin/liveAnalytics.controller.js`, `routes/admin/liveAnalytics.route.js`.
Admin: `extra/Pagination.tsx`, `hooks/usePersistedPagination.ts`, `utils/liveAnalyticsSocket.ts`, `hooks/useLiveAnalytics.ts`, `hooks/useActivityFeed.ts`, `hooks/useLiveRoomOptions.ts` (new), `api/liveAnalyticsApi.ts`, `pages/live-analytics.tsx`, `component/liveAnalytics/*` (`RoomActivity.tsx` new), `assets/scss/liveAnalytics.css`.

## Deploy notes
1. No migration. `LiveComment` collection + indexes are created automatically on first write (`autoIndex`).
2. Realtime state lives in ONE Node process. If you run more than one instance, add the Socket.IO redis adapter.
3. Gifts are attributed to a room only if the app sends `liveHistoryId` with `liveGiftSent` (the socket already does for live broadcasts). Gifts sent without it appear in Transactions with room "-".
4. Comments written before this update are not available (they were never stored).
