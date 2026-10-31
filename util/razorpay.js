/** Razorpay server-side helpers. The secret key never leaves the server. */
const crypto = require("crypto");
const axios = require("axios");

const API = "https://api.razorpay.com/v1";
const PLACEHOLDER = /^(RAZOR\s*PAY|RAZOR)/i;

const getRazorpayCredentials = (settingDoc = global.settingJSON || {}) => {
  const keyId = String(process.env.RAZORPAY_KEY_ID || settingDoc.razorpayId || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || settingDoc.razorpaySecretKey || "").trim();
  const configured = /^rzp_(live|test)_/.test(keyId) && keySecret.length >= 10 && !PLACEHOLDER.test(keySecret);
  return { keyId, keySecret, configured };
};

const client = (creds) =>
  axios.create({
    baseURL: API,
    auth: { username: creds.keyId, password: creds.keySecret },
    timeout: 15000,
  });

const hmac = (secret, payload) => crypto.createHmac("sha256", secret).update(payload).digest("hex");

const safeEqualHex = (expected, provided) => {
  // `provided` is attacker controlled: must be a string of the exact same hex length before any buffer compare
  if (typeof expected !== "string" || typeof provided !== "string") return false;
  if (provided.length !== expected.length || !/^[0-9a-f]+$/i.test(provided)) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
};

/** official checkout signature: HMAC_SHA256(order_id|payment_id, key_secret) */
const verifyCheckoutSignature = ({ orderId, paymentId, signature, keySecret }) =>
  safeEqualHex(hmac(keySecret, `${orderId}|${paymentId}`), String(signature || ""));

/** webhook signature: HMAC_SHA256(raw body, webhook_secret) */
const verifyWebhookSignature = ({ rawBody, signature, webhookSecret }) =>
  Boolean(webhookSecret) && Buffer.isBuffer(rawBody) && safeEqualHex(hmac(webhookSecret, rawBody), String(signature || ""));

const createOrder = async (creds, { amountPaise, currency, receipt, notes }) =>
  (await client(creds).post("/orders", { amount: amountPaise, currency, receipt, notes })).data;

const fetchPayment = async (creds, paymentId) => (await client(creds).get(`/payments/${encodeURIComponent(paymentId)}`)).data;

const capturePayment = async (creds, paymentId, amountPaise, currency) =>
  (await client(creds).post(`/payments/${encodeURIComponent(paymentId)}/capture`, { amount: amountPaise, currency })).data;

const fetchOrderPayments = async (creds, orderId) => (await client(creds).get(`/orders/${encodeURIComponent(orderId)}/payments`)).data;

module.exports = {
  getRazorpayCredentials,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  createOrder,
  fetchPayment,
  capturePayment,
  fetchOrderPayments,
};
