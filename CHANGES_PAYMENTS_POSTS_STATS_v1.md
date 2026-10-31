# Payments (Razorpay + Google IAP), host post deletion, live statistics

## 1. New / changed backend files
| File | What |
|---|---|
| `util/paymentGateways.js` | Authoritative gateway status (`razorpayEnabled`, `googleIapEnabled`), fail-closed, 3 s cache, `requireGateway()` guard |
| `util/razorpay.js` | Razorpay REST helpers + checkout/webhook HMAC verification (timing-safe) |
| `models/paymentOrder.model.js` | Server-created order: bound to user + coin plan, amount/currency/coins, status `created/failed/credited`, unique order + payment ids |
| `services/coinPurchase.service.js` | Shared crediting (History row + wallet `$inc` in ONE transaction), Razorpay verify/credit, reconciliation |
| `controllers/client/coinPlan.controller.js` | New: `getPaymentGateways`, `createRazorpayOrder`, `verifyRazorpayPayment`, `getRazorpayOrderStatus`, `razorpayWebhook`. Google flow now checks the gateway switch and uses the shared crediting function (same fields as before) |
| `routes/client/coinPlan.route.js` | New routes (below) |
| `models/history.model.js` | `razorpayOrderId`, `razorpayPaymentId` + partial **unique** indexes |
| `models/setting.model.js` | `googleIapEnabled` |
| `controllers/admin/setting.controller.js`, `routes/admin/setting.route.js` | `GET/PATCH /api/admin/setting/paymentGateways`, `googleIapEnabled` toggle in `updateSettingToggle` |
| `controllers/client/setting.controller.js` | `retrieveAppSettings` no longer returns `privateKey` (Google service account) or `razorpaySecretKey` |
| `controllers/client/feed.controller.js`, `routes/client/feed.route.js` | `DELETE /api/client/feed/:id` |
| `services/hostLiveStats.service.js`, `controllers/client/hostLiveStats.controller.js`, `routes/client/host.route.js` | `GET /api/client/host/liveStats` |
| `index.js` | keeps the raw body of the Razorpay webhook request for signature verification |
| `cron/index.js` | every 10 min: credits Razorpay payments whose app callback never arrived |
| `data.js`, `setting.js` | `googleIapEnabled` added; **real Razorpay keys removed** from `data.js` |
| `tests/*.test.js`, `package.json` | `npm run test:payments`, `npm run test:livestats` |

## 2. API
Client (header `key`, `authorization: Bearer <firebase token>`, `x-user-uid`):
- `GET  /api/client/coinPlan/paymentGateways` -> `{razorpayEnabled, googleIapEnabled, purchasesAvailable}` (503 + both false if settings cannot be read)
- `POST /api/client/coinPlan/razorpay/createOrder` `{coinPlanId}` -> `{orderId, keyId, amount, currency, totalCoins...}`
- `POST /api/client/coinPlan/razorpay/verify` `{razorpayOrderId, razorpayPaymentId, razorpaySignature}`
- `GET  /api/client/coinPlan/razorpay/order/:orderId` -> status (`created|failed|credited`)
- `POST /api/client/coinPlan/razorpay/webhook` (no user auth; HMAC `X-Razorpay-Signature`)
- `POST /api/client/coinPlan/recordCoinPlanPurchase` (Google, unchanged contract; 403 `GATEWAY_DISABLED` when switched off)
- `DELETE /api/client/feed/:id` (owner host only)
- `GET /api/client/host/liveStats` -> `{totalSessions, totalLiveSeconds, totalLiveDuration, ongoing:{active,elapsedSeconds}, interruptedSessions}`

Admin (already behind `validateAdminToken`):
- `GET   /api/admin/setting/paymentGateways`
- `PATCH /api/admin/setting/paymentGateways` body `{"razorpayEnabled":true,"googleIapEnabled":false}` (booleans only, either or both)
- legacy `PATCH /api/admin/setting/updateSettingToggle?settingId=..&type=googleIapEnabled|razorpayEnabled` also works.

## 3. Deployment
1. `npm install` (no new dependencies; `axios` was already present).
2. Environment (names only, see `.env.example`): `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, optional `RAZORPAY_CURRENCY`, `PAYMENT_SETTINGS_CACHE_MS`. The Settings values `razorpayId` / `razorpaySecretKey` still work as a fallback.
3. **Rotate the Razorpay key pair** (it was in `data.js` and was also sent to every app install) and put the new one in env.
4. Razorpay Dashboard -> Webhooks -> URL `https://<your-api>/api/client/coinPlan/razorpay/webhook`, secret = `RAZORPAY_WEBHOOK_SECRET`, events `payment.captured`, `order.paid`, `payment.failed`.
5. Restart. Mongoose creates the new indexes on start (no manual migration; all new unique indexes are *partial*, so existing History rows are unaffected). MongoDB must be a replica set (transactions were already required by the Google flow).
6. Choose the gateways: `PATCH /api/admin/setting/paymentGateways`. A switch `razorpayEnabled=true` without valid credentials is reported as disabled to the app.

Current shipped defaults (from `data.js`): Razorpay flag ON (but no credentials until you set env), Google IAP ON.

## 4. Behaviour notes
- Routing (app): Razorpay only -> opens Razorpay; Google only -> opens Google Play; both -> selection sheet; none -> "Purchases are temporarily unavailable", nothing launched; settings fetch failure -> nothing launched.
- Server enforcement: every create-order / verify / Google record call re-reads the switches (no cache) and answers 403 `GATEWAY_DISABLED`.
- A payment already credited is always answered idempotently, even if the gateway was switched off afterwards. If a user pays on Razorpay and the admin disables it before the app calls `verify`, the webhook/reconciliation still credits that already-captured payment exactly once.
- Exactly-once: atomic claim `findOneAndUpdate({status:{$ne:'credited'}})` inside the transaction + unique indexes on `razorpayPaymentId`/`razorpayOrderId` (History and PaymentOrder).
- Live stats come from `LiveBroadcastHistory` (one document = one session, durations recomputed from `startTime`/`endTime`). Open sessions that are not the host's current live are not counted (`interruptedSessions`); the current live is returned as `ongoing` and is not part of the completed total. Audio-room sessions (`LiveSession.source = room`) are not included.
- Post deletion removes the post, its likes/comments/shares/views and the S3 object (best effort). Gift `History` rows referencing the post are kept (financial records).

## 5. Known gaps (outside this task, please review)
- `POST /api/client/vipPlan/purchaseVipPlan` takes `paymentGateway` from the query string and grants VIP **and coins** with **no payment verification** (any logged-in user can call it). Same class of problem the coin flow had; it needs the same server-side verification.
- `data.js`, `setting.js` and `.env` contain a live Google service-account private key. Rotate it and load it from the environment / secret manager.
- `setting.js` is rewritten at runtime by `updateSettingFile`; `initializeSettings` still loads `data.js` at start, so non-payment settings changed in the admin panel revert to `data.js` after a restart. Payment switches are not affected (they are read from MongoDB).
