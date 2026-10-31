# Feed Management + Host Profile & Performance - backend (V9)

Verified: all new modules load, admin app type-checks and `next build` passes. NOT run against a live DB - test on staging.

## Admin APIs  (/api/admin/feed/management, now behind validateAdminToken)
stats | list | host-options | :id | PATCH :id/status | PATCH :id/caption
host/:hostId/{profile,trends,feeds,live-history,gifts,supporters,earnings,wallet,kyc,settings}
Delete reuses DELETE /api/admin/feed/delete-feed/:postId.
Security: `/api/admin/feed` used to be reachable with only the secret key - it now also needs the admin token.

## Client APIs added for the app team (next Flutter build)
POST /api/client/feed/:id/gift    body { giftId, count }  -> { giftCount, coinsSpent, balance }
POST /api/client/feed/:id/report  body { reason }         -> one report per user per post
Gift rules = live-gift rules (Setting.adminCommissionRate, Agency commission); atomic coin deduction with refund on failure;
writes History{type:17 GIFT_IN_FEED, feedPostId, userCoin, adminCoin, agencyCoin, hostCoin} and emits FEED_GIFTED (admin updates live).
Note: History.giftCoin is the price PER gift; amounts paid are in History.userCoin (admin code uses userCoin).

## Schema (optional fields, old data stays valid)
FeedPost.moderation, History.feedPostId, Report.feedPostId, HISTORY_TYPE.GIFT_IN_FEED=17 + indexes.

## Still empty until the app ships it
Gift count / income / top gifts / feed earnings (until app calls /gift), Reported Feeds (until app calls /report).
Not tracked anywhere: host level, avg watch time. "Reels" = video posts, "Text Posts" empty (FeedPost.type is image|video).

## V2 (advanced feed management) - root causes fixed
1. Broken previews/reels/avatars: host.image & user.image are `{url,key}` objects (not strings) and post media are `{url,key}`; the old
   admin util getImageUrl() returns one constant URL for any input. API now returns ABSOLUTE CDN URLs (util/media getMediaUrl) in
   `mediaUrl`, `videoUrl`, `thumbnail`, `mediaUrls`, host.image, user.image, gift images. The feed UI uses them directly.
2. Feed-gift API used wrong Gift field names (fixed: imageUrl / svgaImageUrl).
3. captionHtml: whitelist-sanitised HTML (h1-h4,p,br,b,i,u,ul,ol,li,...; all attributes + scripts stripped); `caption` stays plain text.
New admin endpoints: GET :id/interactions/{likes|comments|shares|views|gifts} (paginated), DELETE :id/comments/:commentId,
POST bulk {ids,action: archive|block|unblock|restore|delete}, POST create (multipart: hostId,type,caption,media[]).
Delete cascades likes/views/shares/comments of the post; History (earnings) is kept.
Not available in data (not invented): view watch-duration/device/country, comment hide/report status (only delete), host level, avg watch time.

## V3
- GET /api/admin/feed/management/:id/analytics?startDate&endDate -> daily views/likes/comments/shares/gifts/diamonds + totals with growth vs previous period.
- Host profile response now has `headerStats` {followers, following, totalLikes, totalDiamonds, totalPosts} each {value, period, previous, growth}.
- Tabs: Video Posts and Text Posts removed (reels = video posts). Interactions `limit` up to 100.

## V5 - Dashboard V2 + Users/Hosts realtime
New: util/dateRange.js (ONE date policy: IST calendar days, inclusive; previous period = same length before; growth null when no baseline),
controllers/admin/dashboardV2.controller.js (GET /api/admin/dashboard/v2/overview|trends ?startDate&endDate),
services/adminDashboardEvents.service.js + util/adminDashboardPlugin.js (event `adminDashboard:event` {groups,seq,ts}; bursts coalesced to 1 emit / 1.5s; NO counters in payload),
GET /api/admin/user/summary|presence, GET /api/admin/host/summary|presence.
Changed: feedManagement.controller (computeFeedStats shared with dashboard; IST ranges + IST day buckets), user/host list APIs (below),
models User/Host (+lastActiveAt, indexes), Report/WithdrawalRequest/History (dashboard plugin, History createdAt index), util/liveAnalyticsPlugin (stamps lastActiveAt whenever isOnline is written), socket.js (throttled activity heartbeat: max 1 write/60s/account).
BUG FIXES found while inspecting: the Users and Hosts pages already sent isVip/isBlock/isOnline/isBusy/isHost/isLive/country but the old list APIs IGNORED them (filters did nothing);
`lastlogin` was never returned (Last Login column was empty); search used an unescaped user-supplied regex. All fixed (additive, same response keys).
Presence = existing system (isOnline flag set on connect / cleared when the account's LAST socket leaves => multi-device safe) -> liveAnalyticsPlugin -> batched `liveAnalytics:presence {users,hosts,many}` to the admin room. Admin socket auth/room unchanged.
