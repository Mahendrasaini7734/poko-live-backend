const CoinPlan = require("../../models/coinPlan.model");
const User = require("../../models/user.model");
const History = require("../../models/history.model");
const mongoose = require("mongoose");
const {
  verifyGooglePlayPurchase,
  consumeGooglePlayPurchase,
} = require("../../util/googlePlayBilling");

//generateHistoryUniqueId
const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");

const PaymentOrder = require("../../models/paymentOrder.model");
const rzp = require("../../util/razorpay");
const { getPaymentGatewayStatus, getResolvedRazorpayCredentials } = require("../../util/paymentGateways");
const {
  computeCoinAmounts,
  normalizeBonusCoins,
  creditCoinsInSession,
  processRazorpayPayment,
  PaymentError,
} = require("../../services/coinPurchase.service");





//get coinPlan
exports.getCoinPackage = async (req, res) => {
  try {
    const coinPlan = await CoinPlan.find({ isActive: true }).sort({ coin: 1, amount: 1 }).lean();

    return res.status(200).json({
      status: true,
      message: "Retrive CoinPlan Successfully",
      data: coinPlan,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};

//purchase coinPlan ( coinPlan history )

exports.recordCoinPlanPurchase = async (req, res) => {
  let session = null;

  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access. Invalid token.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        req.user.userId
      )
    ) {
      return res.status(401).json({
        status: false,
        message: "Invalid authenticated user.",
      });
    }

    const {
      coinPlanId,
      productId,
      purchaseToken,
      purchaseId,
      paymentGateway,
    } = req.body;

    if (
      !coinPlanId ||
      typeof coinPlanId !== "string" ||
      !mongoose.Types.ObjectId.isValid(
        coinPlanId
      )
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid coin plan.",
      });
    }

    if (
      !productId ||
      typeof productId !== "string" ||
      !productId.trim()
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid Google product.",
      });
    }

    if (
      !purchaseToken ||
      typeof purchaseToken !== "string" ||
      purchaseToken.trim().length < 20 ||
      purchaseToken.trim().length > 2000
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid purchase token.",
      });
    }

    if (
      purchaseId !== undefined &&
      purchaseId !== null &&
      typeof purchaseId !== "string"
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid purchase ID.",
      });
    }

    if (
      paymentGateway !== "google_play"
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid payment gateway.",
      });
    }

    const userObjectId =
      new mongoose.Types.ObjectId(
        req.user.userId
      );

    const cleanCoinPlanId =
      coinPlanId.trim();

    const cleanProductId =
      productId.trim();

    const cleanPurchaseToken =
      purchaseToken.trim();

    const cleanPurchaseId =
      typeof purchaseId === "string"
        ? purchaseId.trim()
        : "";

    if (
      cleanPurchaseToken.length < 20 ||
      cleanPurchaseToken.length > 2000
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid purchase token.",
      });
    }

    if (
      cleanProductId.length > 200
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid Google product.",
      });
    }

    if (
      cleanPurchaseId.length > 500
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid purchase ID.",
      });
    }

    const user =
      await User.findById(
        userObjectId
      )
        .select(
          "_id isVip firebaseUid"
        )
        .lean();

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User does not exist.",
      });
    }

    if (
      !user.firebaseUid ||
      typeof user.firebaseUid !== "string" ||
      !user.firebaseUid.trim()
    ) {
      return res.status(400).json({
        status: false,
        message: "User Firebase UID is missing.",
      });
    }

    const firebaseUid =
      user.firebaseUid.trim();

    const existingHistory =
      await History.findOne({
        purchaseToken:
          cleanPurchaseToken,
      }).lean();

    if (existingHistory) {
      if (
        !existingHistory.userId ||
        existingHistory.userId.toString() !==
          userObjectId.toString()
      ) {
        return res.status(403).json({
          status: false,
          message:
            "This purchase has already been associated with another account.",
        });
      }

      if (
        existingHistory.productId &&
        existingHistory.productId !==
          cleanProductId
      ) {
        return res.status(409).json({
          status: false,
          message:
            "Purchase token and product do not match.",
        });
      }

      if (
        existingHistory.paymentGateway !==
        "google_play"
      ) {
        return res.status(409).json({
          status: false,
          message:
            "Purchase gateway mismatch.",
        });
      }

      if (
        existingHistory.googleConsumeStatus !==
        "success"
      ) {
        try {
          await consumeGooglePlayPurchase({
            productId:
              existingHistory.productId ||
              cleanProductId,
            purchaseToken:
              existingHistory.purchaseToken ||
              cleanPurchaseToken,
          });

          await History.updateOne(
            {
              _id:
                existingHistory._id,
            },
            {
              $set: {
                googleConsumeStatus:
                  "success",
              },
            }
          );
        } catch (consumeError) {
          console.error(
            "Google Purchase Consume Retry Error:",
            consumeError?.message ||
              consumeError
          );
        }
      }

      return res.status(200).json({
        status: true,
        message:
          "This purchase has already been processed.",
        totalCoins:
          Number(
            existingHistory.userCoin || 0
          ),
        data: {
          historyId:
            existingHistory._id,
          uniqueId:
            existingHistory.uniqueId,
          coinPlanId:
            existingHistory.coinPlanId ||
            cleanCoinPlanId,
          productId:
            existingHistory.productId ||
            cleanProductId,
          coins:
            Number(
              existingHistory.userCoin || 0
            ) -
            Number(
              existingHistory.bonusCoins || 0
            ),
          bonusCoins:
            Number(
              existingHistory.bonusCoins || 0
            ),
          totalCoins:
            Number(
              existingHistory.userCoin || 0
            ),
          price:
            Number(
              existingHistory.price || 0
            ),
          paymentGateway:
            existingHistory.paymentGateway,
          consumeStatus:
            existingHistory.googleConsumeStatus ===
            "success"
              ? "success"
              : "failed",
        },
      });
    }

    // backend decides which gateways are permitted (outdated clients cannot bypass it)
    const gateways = await getPaymentGatewayStatus({ fresh: true });
    if (!gateways.googleIapEnabled) {
      return res.status(403).json({
        status: false,
        code: "GATEWAY_DISABLED",
        message: "Google Play purchases are currently unavailable.",
      });
    }

    let googlePurchase;

    try {
      console.log(
        "Google Purchase Verification Started"
      );

      console.log(
        "Google Product ID:",
        cleanProductId
      );

      console.log(
        "Google Firebase UID:",
        firebaseUid
      );

      googlePurchase =
        await verifyGooglePlayPurchase({
          productId:
            cleanProductId,
          purchaseToken:
            cleanPurchaseToken,
          userId:
            firebaseUid,
        });

      console.log(
        "Google Purchase Verification Successful"
      );
    } catch (googleError) {
      console.error(
        "Google Purchase Verification Error:",
        googleError?.message ||
          googleError
      );

      return res.status(400).json({
        status: false,
        message:
          "Google Play purchase verification failed.",
      });
    }

    if (
      !googlePurchase ||
      googlePurchase.valid !== true
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Invalid Google Play purchase.",
      });
    }

    if (
      googlePurchase.productId !==
      cleanProductId
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Google Play product mismatch.",
      });
    }

    if (
      googlePurchase.purchaseToken &&
      googlePurchase.purchaseToken !==
        cleanPurchaseToken
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Google Play purchase token mismatch.",
      });
    }

    if (
      googlePurchase.purchaseState !==
      "PURCHASED"
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Google Play purchase is not completed.",
      });
    }

    if (
      googlePurchase.consumptionState ===
      "CONSUMPTION_STATE_CONSUMED"
    ) {
      return res.status(409).json({
        status: false,
        message:
          "Google Play purchase has already been consumed.",
      });
    }

    if (
      !googlePurchase
        .obfuscatedExternalAccountId
    ) {
      return res.status(403).json({
        status: false,
        message:
          "Google Play purchase account verification failed.",
      });
    }

    const coinPlan =
      await CoinPlan.findById(
        cleanCoinPlanId
      )
        .select(
          "_id productId coins bonusCoins price"
        )
        .lean();

    if (!coinPlan) {
      return res.status(404).json({
        status: false,
        message:
          "CoinPlan does not exist.",
      });
    }

    if (
      !coinPlan.productId ||
      coinPlan.productId !==
        cleanProductId
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Coin plan and Google product do not match.",
      });
    }

    const planCoins =
      Number(
        coinPlan.coins || 0
      );

    // bonus comes from the plan record (admin panel) for EVERY buyer; missing/invalid -> 0
    const bonusCoins =
      normalizeBonusCoins(
        coinPlan.bonusCoins
      );

    const totalCoins =
      planCoins +
      bonusCoins;

    const price =
      Number(
        coinPlan.price || 0
      );

    if (
      !Number.isSafeInteger(
        planCoins
      ) ||
      planCoins <= 0
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Invalid coin plan configuration.",
      });
    }

    if (
      !Number.isSafeInteger(
        bonusCoins
      ) ||
      bonusCoins < 0
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Invalid bonus configuration.",
      });
    }

    if (
      !Number.isSafeInteger(
        totalCoins
      ) ||
      totalCoins <= 0
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Invalid total coin configuration.",
      });
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Invalid coin plan price.",
      });
    }

    const googleOrderId =
      googlePurchase.orderId
        ? String(
            googlePurchase.orderId
          )
        : "";

    const googlePurchaseTimeMillis =
      googlePurchase.purchaseCompletionTime
        ? String(
            googlePurchase.purchaseCompletionTime
          )
        : "";

    session =
      await mongoose.startSession();

    let history = null;

    try {
      await session.withTransaction(
        async () => {
          const duplicate =
            await History.findOne({
              purchaseToken:
                cleanPurchaseToken,
            })
              .session(session)
              .lean();

          if (duplicate) {
            if (
              !duplicate.userId ||
              duplicate.userId.toString() !==
                userObjectId.toString()
            ) {
              throw new Error(
                "PURCHASE_ALREADY_ASSOCIATED"
              );
            }

            if (
              duplicate.productId &&
              duplicate.productId !==
                cleanProductId
            ) {
              throw new Error(
                "PURCHASE_PRODUCT_MISMATCH"
              );
            }

            throw new Error(
              "PURCHASE_ALREADY_PROCESSED"
            );
          }

          history = await creditCoinsInSession(session, {
            userId: userObjectId,
            coinPlanId: coinPlan._id,
            totalCoins,
            bonusCoins,
            price,
            paymentGateway: "google_play",
            extra: {
              purchaseToken: cleanPurchaseToken,
              purchaseId: cleanPurchaseId,
              productId: cleanProductId,
              googleOrderId,
              googlePurchaseState: googlePurchase.purchaseState,
              googleConsumptionState: googlePurchase.consumptionState,
              googleAcknowledgementState: googlePurchase.acknowledgementState,
              googlePurchaseTimeMillis,
              googleConsumeStatus: "pending",
            },
          });
        },
        {
          readPreference:
            "primary",
          readConcern: {
            level:
              "snapshot",
          },
          writeConcern: {
            w: "majority",
          },
        }
      );
    } catch (transactionError) {
      if (
        transactionError.message ===
        "PURCHASE_ALREADY_ASSOCIATED"
      ) {
        return res.status(403).json({
          status: false,
          message:
            "This purchase has already been associated with another account.",
        });
      }

      if (
        transactionError.message ===
        "PURCHASE_PRODUCT_MISMATCH"
      ) {
        return res.status(409).json({
          status: false,
          message:
            "Purchase token and product do not match.",
        });
      }

      if (
        transactionError.message ===
        "PURCHASE_ALREADY_PROCESSED"
      ) {
        const duplicate =
          await History.findOne({
            purchaseToken:
              cleanPurchaseToken,
          }).lean();

        if (
          duplicate &&
          duplicate.userId &&
          duplicate.userId.toString() ===
            userObjectId.toString()
        ) {
          return res.status(200).json({
            status: true,
            message:
              "This purchase has already been processed.",
            totalCoins:
              Number(
                duplicate.userCoin || 0
              ),
            data: {
              historyId:
                duplicate._id,
              uniqueId:
                duplicate.uniqueId,
              coinPlanId:
                duplicate.coinPlanId ||
                cleanCoinPlanId,
              productId:
                duplicate.productId ||
                cleanProductId,
              coins:
                Number(
                  duplicate.userCoin || 0
                ) -
                Number(
                  duplicate.bonusCoins || 0
                ),
              bonusCoins:
                Number(
                  duplicate.bonusCoins || 0
                ),
              totalCoins:
                Number(
                  duplicate.userCoin || 0
                ),
              price:
                Number(
                  duplicate.price || 0
                ),
              paymentGateway:
                duplicate.paymentGateway,
              consumeStatus:
                duplicate.googleConsumeStatus,
            },
          });
        }

        return res.status(403).json({
          status: false,
          message:
            "This purchase has already been associated with another account.",
        });
      }

      if (
        transactionError?.code ===
          11000 &&
        transactionError?.keyPattern
          ?.purchaseToken
      ) {
        const duplicate =
          await History.findOne({
            purchaseToken:
              cleanPurchaseToken,
          }).lean();

        if (
          duplicate &&
          duplicate.userId &&
          duplicate.userId.toString() !==
            userObjectId.toString()
        ) {
          return res.status(403).json({
            status: false,
            message:
              "This purchase has already been associated with another account.",
          });
        }

        if (
          duplicate &&
          duplicate.userId &&
          duplicate.userId.toString() ===
            userObjectId.toString()
        ) {
          return res.status(200).json({
            status: true,
            message:
              "This purchase has already been processed.",
            totalCoins:
              Number(
                duplicate.userCoin || 0
              ),
            data: {
              historyId:
                duplicate._id,
              uniqueId:
                duplicate.uniqueId,
              coinPlanId:
                duplicate.coinPlanId ||
                cleanCoinPlanId,
              productId:
                duplicate.productId ||
                cleanProductId,
              coins:
                Number(
                  duplicate.userCoin || 0
                ) -
                Number(
                  duplicate.bonusCoins || 0
                ),
              bonusCoins:
                Number(
                  duplicate.bonusCoins || 0
                ),
              totalCoins:
                Number(
                  duplicate.userCoin || 0
                ),
              price:
                Number(
                  duplicate.price || 0
                ),
              paymentGateway:
                duplicate.paymentGateway,
              consumeStatus:
                duplicate.googleConsumeStatus,
            },
          });
        }
      }

      throw transactionError;
    }

    if (!history) {
      throw new Error(
        "PURCHASE_HISTORY_NOT_CREATED"
      );
    }

    let consumeStatus =
      "failed";

    try {
      await consumeGooglePlayPurchase({
        productId:
          cleanProductId,
        purchaseToken:
          cleanPurchaseToken,
      });

      consumeStatus =
        "success";

      await History.updateOne(
        {
          _id:
            history._id,
        },
        {
          $set: {
            googleConsumeStatus:
              "success",
          },
        }
      );
    } catch (consumeError) {
      console.error(
        "Google Purchase Consume Error:",
        consumeError?.message ||
          consumeError
      );

      await History.updateOne(
        {
          _id:
            history._id,
        },
        {
          $set: {
            googleConsumeStatus:
              "failed",
          },
        }
      );
    }

    console.log(
      "Coin purchase completed:",
      {
        historyId:
          history._id.toString(),
        userId:
          userObjectId.toString(),
        productId:
          cleanProductId,
        totalCoins,
        consumeStatus,
      }
    );

    return res.status(200).json({
      status: true,
      message: creditedMessage(totalCoins, bonusCoins),
      totalCoins,
      data: {
        historyId:
          history._id,
        uniqueId:
          history.uniqueId,
        coinPlanId:
          coinPlan._id,
        productId:
          cleanProductId,
        coins:
          planCoins,
        bonusCoins,
        totalCoins,
        price,
        paymentGateway:
          "google_play",
        googleOrderId,
        consumeStatus,
      },
    });
  } catch (error) {
    console.error(
      "recordCoinPlanPurchase Error:",
      error?.message ||
        error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        status: false,
        message:
          "Unable to process coin purchase.",
      });
    }
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};


/* ====================================================================== */
/* Payment gateway settings + Razorpay (server verified)                  */
/* ====================================================================== */

//public (authenticated) gateway availability - the app reads this before every purchase
exports.getPaymentGateways = async (req, res) => {
  const s = await getPaymentGatewayStatus({ fresh: true });
  const body = {
    status: s.reason ? false : true,
    message: s.reason ? "Payment settings unavailable." : "Success",
    data: {
      razorpayEnabled: s.razorpayEnabled,
      googleIapEnabled: s.googleIapEnabled,
      purchasesAvailable: s.purchasesAvailable,
    },
  };
  return res.status(s.reason ? 503 : 200).json(body);
};

// message shown by the app after a verified purchase (actual credited amount)
function creditedMessage(totalCoins, bonusCoins) {
  const base = Number(totalCoins || 0) - Number(bonusCoins || 0);
  return bonusCoins > 0
    ? `${totalCoins} coins added to your wallet (${base} + ${bonusCoins} bonus).`
    : `${totalCoins} coins added to your wallet.`;
}

const orderPayload = (o) => ({
  orderId: o.razorpayOrderId,
  status: o.status,
  coinPlanId: o.coinPlanId,
  coins: o.coins,
  bonusCoins: o.bonusCoins,
  totalCoins: o.totalCoins,
  price: o.price,
  paymentGateway: "razorpay",
});

const sendPaymentError = (res, err) => {
  if (err instanceof PaymentError) {
    return res.status(err.httpStatus).json({ status: false, code: err.code, message: err.message });
  }
  const rzpDesc = err?.response?.data?.error?.description;
  console.error("Razorpay error:", rzpDesc || err?.message || err);
  return res.status(500).json({ status: false, message: "Unable to process payment." });
};

//create a Razorpay order for ONE coin plan, bound to the authenticated user
exports.createRazorpayOrder = async (req, res) => {
  try {
    const gateways = await getPaymentGatewayStatus({ fresh: true });
    if (!gateways.razorpayEnabled) {
      return res.status(403).json({ status: false, code: "GATEWAY_DISABLED", message: "Razorpay is currently unavailable." });
    }

    const userId = req.user?.userId;
    const coinPlanId = req.body?.coinPlanId;
    if (!userId || typeof coinPlanId !== "string" || !mongoose.Types.ObjectId.isValid(coinPlanId)) {
      return res.status(400).json({ status: false, message: "Invalid coin plan." });
    }

    const [user, plan] = await Promise.all([
      User.findById(userId).select("_id isVip").lean(),
      CoinPlan.findOne({ _id: coinPlanId, isActive: true }).lean(),
    ]);
    if (!user) return res.status(404).json({ status: false, message: "User does not exist." });
    if (!plan) return res.status(404).json({ status: false, message: "CoinPlan does not exist." });

    const amounts = computeCoinAmounts(plan);
    const amountPaise = Math.round(amounts.price * 100);
    if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) {
      return res.status(400).json({ status: false, message: "Invalid coin plan price." });
    }

    const creds = await getResolvedRazorpayCredentials();
    const currency = String(process.env.RAZORPAY_CURRENCY || "INR").toUpperCase();
    const receipt = `zg_${String(userId).slice(-8)}_${Date.now().toString(36)}`;

    const rOrder = await rzp.createOrder(creds, {
      amountPaise,
      currency,
      receipt,
      notes: { userId: String(userId), coinPlanId: String(plan._id) },
    });

    const order = await PaymentOrder.create({
      userId,
      coinPlanId: plan._id,
      razorpayOrderId: rOrder.id,
      amountPaise,
      currency,
      coins: amounts.coins,
      bonusCoins: amounts.bonusCoins,
      totalCoins: amounts.totalCoins,
      price: amounts.price,
    });

    return res.status(200).json({
      status: true,
      message: "Order created.",
      data: {
        orderId: order.razorpayOrderId,
        keyId: creds.keyId, // public key id only
        amount: amountPaise,
        currency,
        coinPlanId: String(plan._id),
        coins: amounts.coins,
        bonusCoins: amounts.bonusCoins,
        totalCoins: amounts.totalCoins,
      },
    });
  } catch (err) {
    return sendPaymentError(res, err);
  }
};

//verify signature + payment with Razorpay, then credit coins exactly once
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
    if (![razorpayOrderId, razorpayPaymentId, razorpaySignature].every((v) => typeof v === "string" && v.length > 5 && v.length < 200)) {
      return res.status(400).json({ status: false, message: "Invalid payment details." });
    }

    // order must exist and belong to the caller
    const order = await PaymentOrder.findOne({ razorpayOrderId });
    if (!order || String(order.userId) !== String(userId)) {
      return res.status(404).json({ status: false, message: "Order not found." });
    }

    // already credited -> idempotent success (works even if the gateway was switched off meanwhile)
    if (order.status === "credited") {
      return res.status(200).json({ status: true, message: "This payment has already been processed.", data: orderPayload(order) });
    }

    const gateways = await getPaymentGatewayStatus({ fresh: true });
    if (!gateways.razorpayEnabled) {
      return res.status(403).json({
        status: false,
        code: "GATEWAY_DISABLED",
        message: "Razorpay is currently unavailable. If you were charged, coins are added automatically after confirmation.",
      });
    }
    if (Date.now() - new Date(order.createdAt).getTime() > 24 * 3600 * 1000) {
      return res.status(410).json({ status: false, code: "ORDER_EXPIRED", message: "This order has expired." });
    }

    const r = await processRazorpayPayment({ order, paymentId: razorpayPaymentId, signature: razorpaySignature, via: "client" });
    const user = await User.findById(userId).select("coin").lean();
    return res.status(200).json({
      status: true,
      message: r.alreadyProcessed
        ? "This payment has already been processed."
        : creditedMessage(r.order.totalCoins, r.order.bonusCoins),
      totalCoins: r.order.totalCoins,
      data: { ...orderPayload(r.order), walletCoins: user?.coin ?? null },
    });
  } catch (err) {
    return sendPaymentError(res, err);
  }
};

//order status (app polls this after a payment when the verify call could not complete)
exports.getRazorpayOrderStatus = async (req, res) => {
  try {
    const order = await PaymentOrder.findOne({ razorpayOrderId: req.params.orderId, userId: req.user.userId }).lean();
    if (!order) return res.status(404).json({ status: false, message: "Order not found." });
    return res.status(200).json({ status: true, message: "Success", data: orderPayload(order) });
  } catch (err) {
    return sendPaymentError(res, err);
  }
};

//Razorpay webhook (no user auth - authenticated by HMAC over the raw body)
exports.razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.get("x-razorpay-signature");
    if (!rzp.verifyWebhookSignature({ rawBody: req.rawBody, signature, webhookSecret: secret })) {
      return res.status(400).json({ status: false, message: "Invalid signature." });
    }

    const event = req.body?.event;
    const payment = req.body?.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id || req.body?.payload?.order?.entity?.id;
    if (!razorpayOrderId) return res.status(200).json({ status: true, message: "Ignored." });

    const order = await PaymentOrder.findOne({ razorpayOrderId });
    if (!order) return res.status(200).json({ status: true, message: "Unknown order ignored." });

    if (event === "payment.failed") {
      await PaymentOrder.updateOne({ _id: order._id, status: "created" }, { $set: { status: "failed", failureReason: payment?.error_code || "payment_failed" } });
      return res.status(200).json({ status: true, message: "Recorded." });
    }

    if ((event === "payment.captured" || event === "order.paid") && payment?.id) {
      await processRazorpayPayment({ order, paymentId: payment.id, via: "webhook" });
    }
    return res.status(200).json({ status: true, message: "OK" });
  } catch (err) {
    // 5xx makes Razorpay retry; crediting is idempotent so retries are safe
    console.error("razorpayWebhook error:", err?.message || err);
    const code = err instanceof PaymentError && err.httpStatus < 500 ? 200 : 500;
    return res.status(code).json({ status: false, message: "Webhook processing failed." });
  }
};
