# Live module sync fix (backend)

New: `services/liveRoom.service.js` (join/leave, viewer count, chat, gifts, liveSync).
Changed: `socket.js` (live handlers delegate to the service, disconnect cleanup, host 25s grace),
`services/liveSession.service.js` (every end path emits `liveStreamEnd`, empties the room),
`controllers/client/liveBroadcaster.controller.js` + route (`GET /api/client/liveBroadcaster/LiveStatus`),
`models/history.model.js` (`giftRequestId` + unique index), `models/liveBroadcastView.model.js` (`socketId`, unique viewer index).

Socket events (new): liveSync (ack), liveParticipantJoined/Left, liveParticipantsRequest/List,
liveCommentHistory, liveCommentError, liveGiftError, liveEarningsUpdate, liveJoinRejected, userCoinUpdated.
`liveCommentBroadcast`, `liveGiftSent`, `liveStreamEnd`, `liveStreamStatusCheck` now answer with an ack.
Legacy events (liveRoomJoin, liveJoinerCount, removeLiveJoiner) still work (old app builds).

Env: LIVE_DISCONNECT_GRACE_SECONDS (default 25).
Deploy note: unique indexes are created on start. If old duplicate rows exist in
`livebroadcastviews` or `histories(giftRequestId)` the index build logs an error but the app runs.

## Round 3
- hostStatusUpdate after joins/leaves is debounced (400ms) per host.
- Host earnings of a live = sum(History.hostCoin) -> `liveEarningsUpdate.sessionCoins`, `liveSync.sessionHostCoins`.
