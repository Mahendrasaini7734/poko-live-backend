/**
 * Payment gateway availability (authoritative, server side).
 *
 * Source order:
 *   1. Setting document in MongoDB (the one the admin panel edits: global.settingJSON._id, else the latest)
 *   2. No Setting document exists at all -> the file based settings already loaded by initializeSettings
 *   3. Anything fails / is invalid -> BOTH gateways disabled (fail closed, never silently enabled)
 *
 * Flags: razorpayEnabled, googleIapEnabled (legacy googlePlayEnabled is honoured only while
 * googleIapEnabled has never been set). Only a real boolean `true` enables a gateway.
 */
const mongoose = require("mongoose");
const Setting = require("../models/setting.model");
const { getRazorpayCredentials } = require("./razorpay");

const CACHE_TTL_MS = Number(process.env.PAYMENT_SETTINGS_CACHE_MS ?? 3000);
let cache = { at: 0, value: null };

const isTrue = (v) => v === true;

const resolveGoogle = (doc) => {
  if (typeof doc.googleIapEnabled === "boolean") return doc.googleIapEnabled;
  return isTrue(doc.googlePlayEnabled); // legacy flag
};

const loadSettingDoc = async () => {
  const fileId = global.settingJSON?._id;
  if (fileId && mongoose.Types.ObjectId.isValid(String(fileId))) {
    const byId = await Setting.findById(fileId).lean();
    if (byId) return byId;
  }
  const latest = await Setting.findOne().sort({ updatedAt: -1 }).lean();
  if (latest) return latest;
  const file = global.settingJSON;
  return file && typeof file === "object" && Object.keys(file).length ? file : null;
};

const closed = (reason) => ({
  razorpayEnabled: false,
  googleIapEnabled: false,
  purchasesAvailable: false,
  razorpayFlag: false,
  reason,
});

/** @returns {Promise<{razorpayEnabled:boolean, googleIapEnabled:boolean, purchasesAvailable:boolean}>} */
const getPaymentGatewayStatus = async ({ fresh = false } = {}) => {
  const now = Date.now();
  if (!fresh && cache.value && now - cache.at < CACHE_TTL_MS) return cache.value;

  let value;
  try {
    const doc = await loadSettingDoc();
    if (!doc) {
      value = closed("settings_unavailable");
    } else {
      const razorpayFlag = isTrue(doc.razorpayEnabled);
      // a gateway that is switched on but has no credentials is NOT offered to the app
      const razorpayEnabled = razorpayFlag && getRazorpayCredentials(doc).configured;
      const googleIapEnabled = resolveGoogle(doc);
      value = {
        razorpayEnabled,
        googleIapEnabled,
        purchasesAvailable: razorpayEnabled || googleIapEnabled,
        razorpayFlag,
      };
      if (razorpayFlag && !razorpayEnabled) console.warn("[payments] razorpayEnabled=true but credentials are missing; Razorpay is not offered");
    }
  } catch (err) {
    console.error("[payments] settings lookup failed, purchases disabled:", err.message);
    value = closed("settings_error");
  }
  cache = { at: now, value };
  return value;
};

const invalidatePaymentGatewayCache = () => {
  cache = { at: 0, value: null };
};

/** express guard factory: 403 when the gateway is not currently permitted */
const requireGateway = (name) => async (req, res, next) => {
  const s = await getPaymentGatewayStatus({ fresh: true });
  const ok = name === "razorpay" ? s.razorpayEnabled : s.googleIapEnabled;
  if (!ok) {
    return res.status(403).json({
      status: false,
      code: "GATEWAY_DISABLED",
      message: "This payment method is currently unavailable.",
    });
  }
  next();
};

/** credentials resolved from the SAME setting document used for the enabled flags */
const getResolvedRazorpayCredentials = async () => getRazorpayCredentials((await loadSettingDoc()) || {});

module.exports = { getResolvedRazorpayCredentials, getPaymentGatewayStatus, invalidatePaymentGatewayCache, requireGateway };
