# CHANGES_SUMMARY (round 2)

## 1.1 Payment loading dialog with a single gateway
**Cause:** the routing code (added earlier) only showed the existing "Payment Processing" dialog after a gateway had started the purchase. With one enabled gateway the tap fetched settings / created the order with nothing on screen, so users saw no feedback and could tap again.
**Fix** (`top_up_controller.dart`, `payment_gateway_service.dart`): `purchaseCoinPlan` shows the *same* `_showProcessingDialog()` immediately on tap.
- One gateway: dialog stays up through the settings check and order creation (Razorpay) / purchase launch (Google Play).
- Several gateways: the dialog is hidden just before the selection sheet (`beforeSelection` hook) and shown again after a choice.
- Razorpay: dialog is hidden while the Razorpay checkout UI is open and shown again for server verification.
- Every exit path (cancel, failure, settings error, exception) hides it in a `finally`; Google Play keeps it only while its purchase stream is still in flight. `_routingPurchase` / `isPurchaseLoading` ignore repeated taps; `_processingDialogVisible` prevents duplicate dialogs.

## 1.2 Bonus coins missing
**Root cause:** both crediting paths granted `plan.bonusCoins` only when `user.isVip` was true (`coinPlan.controller.js` Google flow, and the same rule I had copied into the shared service). Normal buyers therefore always got base coins only.
**Fix:** bonus is read from the plan record (`CoinPlan.bonusCoins`, the field the admin panel already writes) for every buyer. `normalizeBonusCoins()` treats missing/null/negative/fractional as 0. Total = base + bonus; History stores `userCoin` (total), `bonusCoins`, `price`; the success message returned by the server states the actual credited amount (`1200 coins added to your wallet (1000 + 200 bonus).`) and the app shows that text and refreshes the wallet from the server. Nothing is calculated on the client.
Idempotency/atomicity is unchanged: one transaction (History + wallet `$inc`), unique `purchaseToken` / `razorpayPaymentId` / `razorpayOrderId`, atomic order claim; failed/pending/unverified payments never reach the crediting code.
Behaviour change to be aware of: VIP users previously were the only ones to get bonuses; now everyone does. Existing VIP bonus value is unchanged.

## 2. Delete post / reel from the host profile
- Removed the delete menu I had put on the general feed/reel screens (placement rule): `feed_image_view.dart`, `reels.dart` are back to their original behaviour.
- New `owner_post_menu.dart`: three-dot `PopupMenuButton` (anchored popup, no bottom sheet) with "Delete post" / "Delete reel" + delete icon, rendered only when `Database.hostId` equals the profile's host id. Added to the profile preview grid (`host_profile_sections.dart`) and the "view all" grid (`host_media.dart`).
- New `lib/custom/glass_confirm_dialog.dart`: same glassmorphism styling as `hostRequestDialog` (blur, translucent fill/border, gradient icon and button, round close button). It names the content type, has Delete/Cancel, shows a spinner in the button while deleting, blocks repeated taps/back while busy. Cancel never calls the API.
- `feed_post_actions.dart`: `DELETE /api/client/feed/:id`, then `FeedStore.markDeleted(id)` so the preview grids, view-all list and reel viewer drop the item immediately; handles 404 (already deleted), 401/403, offline and server errors.
- Backend `deleteOwnPost`: authenticated user must be `post.userId` **and** the host document of `post.hostId`; the delete query is pinned to both (race-safe); likes/comments/shares/views removed; S3 objects of that post's `media[].key` removed best-effort; gift History rows are kept.

## Files changed this round
Backend: `controllers/client/coinPlan.controller.js`, `services/coinPurchase.service.js`, `tests/coinBonus.test.js` (new), `tests/deleteOwnPost.test.js` (new), `package.json`.
App: `top_up_controller.dart`, `payment_gateway_service.dart`, `custom/glass_confirm_dialog.dart` (new), `shorts/service/feed_post_actions.dart`, `host_detail_page/widget/owner_post_menu.dart` (new), `host_profile_sections.dart`, `host_media.dart`, `feed_image_view.dart`, `reels.dart` (reverted to original behaviour).

## Checks actually executed
- Backend (Node, mocked models, no database/gateway access): `coinBonus` 4/4, `deleteOwnPost` 6/6, `paymentGateways` 13/13, `razorpayVerification` 8/8, `hostLiveStats` 6/6 all pass; `node --check` on every changed backend file passes.
- Flutter: **not compiled, analysed or run** (no Flutter/Dart SDK in this environment). I only checked bracket balance and references by reading the code. Please run `dart format`, `flutter analyze`, and test on a device.
- Not testable here (needs your live environment): real Razorpay/Google Play payments and webhooks, the DB transaction path, S3 deletion, admin panel input of bonus values.

## Manual test list
1. One gateway enabled: tap a plan -> "Payment Processing" dialog appears at once and closes on cancel/failure/success. Both enabled: sheet first, dialog after choosing.
2. Plan 1000 + 200 bonus as a non-VIP user -> wallet +1200, History row `bonusCoins=200`; plan with bonus 0 -> base only; replay verify/webhook -> no second credit.
3. Own profile -> "..." on a post and on a reel -> popup -> glass dialog -> Cancel (nothing happens) / Delete (tile disappears, also in "view all"). Other host's profile -> no "..." menu.

## Config
No new environment variables this round (see the previous notes for the Razorpay variables).
