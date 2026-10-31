/**
 * Shared coin-purchase ledger/crediting service (Google Play + Razorpay).
 * Every purchase = ONE History row (type COIN_PLAN_PURCHASE) + ONE wallet $inc, written in the caller's
 * transaction. Uniqueness is enforced by DB indexes (purchaseToken / razorpayPaymentId / razorpayOrderId).
 */
const mongoose = require("mongoose");
const History = require("../models/history.model");
const User = require("../models/user.model");
const PaymentOrder = require("../models/paymentOrder.model");
const CoinPlan = require("../models/coinPlan.model");
const generateHistoryUniqueId = require("../util/generateHistoryUniqueId");
const rzp = require("../util/razorpay");
const { getResolvedRazorpayCredentials } = require("../util/paymentGateways");

const COIN_PLAN_PURCHASE = 7;

/** plan.bonusCoins from the admin panel; missing / null / negative / fractional -> 0 (purchase still works) */
const normalizeBonusCoins = (value) => {
  const n = Number(value ?? 0);
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
};

/**
 * exact coins for a plan: base coins + the bonus configured on the plan record, for every buyer.
 * (The old rule granted the bonus only to VIP users, which is why normal users never received it.)
 */
const computeCoinAmounts = (coinPlan) => {
  const coins = Number(coinPlan.coins || 0);
  const bonusCoins = normalizeBonusCoins(coinPlan.bonusCoins);
  const totalCoins = coins + bonusCoins;
  const price = Number(coinPlan.price || 0);
  if (!Number.isSafeInteger(coins) || coins <= 0) throw new Error("Invalid coin plan configuration.");
  if (!Number.isFinite(price) || price < 0) throw new Error("Invalid coin plan price.");
  return { coins, bonusCoins, totalCoins, price };
};

/** History row + wallet increment inside the caller's transaction (session required) */
const creditCoinsInSession = async (session, { userId, coinPlanId, totalCoins, bonusCoins, price, paymentGateway, extra = {} }) => {
  if (!session) throw new Error("creditCoinsInSession requires a transaction session");
  const uniqueId = await generateHistoryUniqueId();
  const [history] = await History.create(
    [
      {
        uniqueId,
        type: COIN_PLAN_PURCHASE,
        userId,
        coinPlanId,
        userCoin: totalCoins,
        bonusCoins,
        price,
        paymentGateway,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        ...extra,
      },
    ],
    { session }
  );
  const wallet = await User.updateOne({ _id: userId }, { $inc: { coin: totalCoins, rechargedCoins: totalCoins } }, { session });
  if (wallet.modifiedCount !== 1) throw new Error("WALLET_UPDATE_FAILED");
  return history;
};

/* ------------------------------------------------------------------ */
/* Razorpay                                                            */
/* ------------------------------------------------------------------ */

class PaymentError extends Error {
  constructor(message, httpStatus = 400, code = "PAYMENT_INVALID") {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

/** Ask Razorpay (trusted server-to-server) whether this payment is really captured for this order */
const confirmPaymentWithRazorpay = async (creds, order, paymentId) => {
  let payment = await rzp.fetchPayment(creds, paymentId);
  if (payment.order_id !== order.razorpayOrderId) throw new PaymentError("Payment does not belong to this order.", 400, "ORDER_MISMATCH");
  if (Number(payment.amount) !== order.amountPaise) throw new PaymentError("Payment amount mismatch.", 400, "AMOUNT_MISMATCH");
  if (String(payment.currency) !== order.currency) throw new PaymentError("Payment currency mismatch.", 400, "CURRENCY_MISMATCH");
  if (payment.status === "authorized") {
    payment = await rzp.capturePayment(creds, paymentId, order.amountPaise, order.currency);
  }
  if (payment.status !== "captured") throw new PaymentError(`Payment is not completed (${payment.status}).`, 402, "PAYMENT_NOT_CAPTURED");
  return payment;
};

/**
 * Verify + credit a Razorpay payment exactly once.
 * @param order      PaymentOrder doc (already bound to a user by the server)
 * @param via        "client" | "webhook" | "reconcile"
 * @param signature  required when via === "client"
 */
const processRazorpayPayment = async ({ order, paymentId, signature, via }) => {
  const creds = await getResolvedRazorpayCredentials();
  if (!creds.configured) throw new PaymentError("Razorpay is not configured.", 503, "NOT_CONFIGURED");
  if (!/^pay_[A-Za-z0-9]{6,40}$/.test(String(paymentId || ""))) throw new PaymentError("Invalid payment id.", 400);

  if (via === "client") {
    if (!rzp.verifyCheckoutSignature({ orderId: order.razorpayOrderId, paymentId, signature, keySecret: creds.keySecret })) {
      await PaymentOrder.updateOne({ _id: order._id, status: { $ne: "credited" } }, { $set: { status: "failed", failureReason: "invalid_signature" } });
      throw new PaymentError("Invalid payment signature.", 400, "BAD_SIGNATURE");
    }
  }

  // already done (idempotent replay): return the stored result, never credit again
  if (order.status === "credited") return { alreadyProcessed: true, order };

  const payment = await confirmPaymentWithRazorpay(creds, order, paymentId);

  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      // atomic claim: only ONE concurrent caller can move the order to "credited"
      const claimed = await PaymentOrder.findOneAndUpdate(
        { _id: order._id, status: { $ne: "credited" } },
        {
          $set: {
            status: "credited",
            razorpayPaymentId: payment.id,
            signatureVerified: via === "client",
            verifiedVia: via,
            creditedAt: new Date(),
            failureReason: "",
          },
        },
        { session, new: true }
      );
      if (!claimed) {
        result = { alreadyProcessed: true };
        return;
      }
      const history = await creditCoinsInSession(session, {
        userId: claimed.userId,
        coinPlanId: claimed.coinPlanId,
        totalCoins: claimed.totalCoins,
        bonusCoins: claimed.bonusCoins,
        price: claimed.price,
        paymentGateway: "razorpay",
        extra: { razorpayOrderId: claimed.razorpayOrderId, razorpayPaymentId: payment.id },
      });
      await PaymentOrder.updateOne({ _id: claimed._id }, { $set: { historyId: history._id } }, { session });
      result = { alreadyProcessed: false, history };
    });
  } finally {
    await session.endSession();
  }

  const fresh = await PaymentOrder.findById(order._id).lean();
  console.log("[razorpay] credit", { order: order.razorpayOrderId, payment: payment.id, via, duplicate: result?.alreadyProcessed });
  return { alreadyProcessed: Boolean(result?.alreadyProcessed), order: fresh };
};

/** Cron/CLI: pick up payments whose client verify call never arrived (app killed, no network) */
const reconcilePendingRazorpayOrders = async ({ minAgeMs = 5 * 60 * 1000, maxAgeMs = 48 * 3600 * 1000, limit = 100 } = {}) => {
  const creds = await getResolvedRazorpayCredentials();
  if (!creds.configured) return { checked: 0, credited: 0 };
  const now = Date.now();
  const orders = await PaymentOrder.find({
    status: { $in: ["created", "failed"] },
    createdAt: { $lte: new Date(now - minAgeMs), $gte: new Date(now - maxAgeMs) },
  })
    .sort({ createdAt: 1 })
    .limit(limit);
  let credited = 0;
  for (const order of orders) {
    try {
      const list = await rzp.fetchOrderPayments(creds, order.razorpayOrderId);
      const paid = (list.items || []).find((p) => p.status === "captured" || p.status === "authorized");
      if (!paid) continue;
      const r = await processRazorpayPayment({ order, paymentId: paid.id, via: "reconcile" });
      if (!r.alreadyProcessed) credited += 1;
    } catch (e) {
      console.error("[razorpay] reconcile failed", order.razorpayOrderId, e.message);
    }
  }
  return { checked: orders.length, credited };
};

module.exports = {
  computeCoinAmounts,
  normalizeBonusCoins,
  creditCoinsInSession,
  processRazorpayPayment,
  reconcilePendingRazorpayOrders,
  confirmPaymentWithRazorpay,
  PaymentError,
  CoinPlan,
};
