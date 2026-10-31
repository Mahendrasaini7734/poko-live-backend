/* Run: node tests/paymentGateways.test.js  (no database needed) */
const assert = require("assert");
const crypto = require("crypto");
process.env.RAZORPAY_KEY_ID = "rzp_test_abcdef123456";
process.env.RAZORPAY_KEY_SECRET = "secret_for_tests_only_123";
process.env.PAYMENT_SETTINGS_CACHE_MS = "0";

const Setting = require("../models/setting.model");
const rzp = require("../util/razorpay");
const gw = require("../util/paymentGateways");

let passed = 0;
const t = async (name, fn) => {
  try { await fn(); passed++; console.log("  ok  -", name); }
  catch (e) { console.error("FAIL  -", name, "\n", e); process.exitCode = 1; }
};
const useDoc = (doc) => {
  global.settingJSON = { _id: "64b000000000000000000001" };
  Setting.findById = () => ({ lean: async () => doc });
  Setting.findOne = () => ({ sort: () => ({ lean: async () => doc }) });
};

(async () => {
  console.log("payment routing matrix (server side)");
  await t("A: only Razorpay", async () => {
    useDoc({ razorpayEnabled: true, googleIapEnabled: false });
    const s = await gw.getPaymentGatewayStatus({ fresh: true });
    assert.deepStrictEqual([s.razorpayEnabled, s.googleIapEnabled, s.purchasesAvailable], [true, false, true]);
  });
  await t("B: only Google IAP", async () => {
    useDoc({ razorpayEnabled: false, googleIapEnabled: true });
    const s = await gw.getPaymentGatewayStatus({ fresh: true });
    assert.deepStrictEqual([s.razorpayEnabled, s.googleIapEnabled], [false, true]);
  });
  await t("C: both", async () => {
    useDoc({ razorpayEnabled: true, googleIapEnabled: true });
    const s = await gw.getPaymentGatewayStatus({ fresh: true });
    assert.deepStrictEqual([s.razorpayEnabled, s.googleIapEnabled], [true, true]);
  });
  await t("D: both disabled", async () => {
    useDoc({ razorpayEnabled: false, googleIapEnabled: false });
    const s = await gw.getPaymentGatewayStatus({ fresh: true });
    assert.strictEqual(s.purchasesAvailable, false);
  });
  await t("legacy googlePlayEnabled honoured only when googleIapEnabled never set", async () => {
    useDoc({ razorpayEnabled: false, googlePlayEnabled: true });
    assert.strictEqual((await gw.getPaymentGatewayStatus({ fresh: true })).googleIapEnabled, true);
    useDoc({ razorpayEnabled: false, googlePlayEnabled: true, googleIapEnabled: false });
    assert.strictEqual((await gw.getPaymentGatewayStatus({ fresh: true })).googleIapEnabled, false);
  });
  await t("invalid values (strings, numbers) never enable a gateway", async () => {
    useDoc({ razorpayEnabled: "true", googleIapEnabled: 1 });
    const s = await gw.getPaymentGatewayStatus({ fresh: true });
    assert.deepStrictEqual([s.razorpayEnabled, s.googleIapEnabled], [false, false]);
  });
  await t("settings lookup failure fails CLOSED", async () => {
    global.settingJSON = { _id: "64b000000000000000000001" };
    Setting.findById = () => ({ lean: async () => { throw new Error("db down"); } });
    const s = await gw.getPaymentGatewayStatus({ fresh: true });
    assert.deepStrictEqual([s.razorpayEnabled, s.googleIapEnabled, s.purchasesAvailable], [false, false, false]);
    assert.ok(s.reason);
  });
  await t("Razorpay flag on but credentials missing -> not offered", async () => {
    const id = process.env.RAZORPAY_KEY_ID, sec = process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_KEY_ID; delete process.env.RAZORPAY_KEY_SECRET;
    useDoc({ razorpayEnabled: true, razorpayId: "RAZOR PAY ID", razorpaySecretKey: "RAZOR SECRET KEY", googleIapEnabled: false });
    const s = await gw.getPaymentGatewayStatus({ fresh: true });
    assert.strictEqual(s.razorpayEnabled, false);
    process.env.RAZORPAY_KEY_ID = id; process.env.RAZORPAY_KEY_SECRET = sec;
  });

  console.log("razorpay signatures");
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const sig = crypto.createHmac("sha256", secret).update("order_X1|pay_Y2").digest("hex");
  await t("valid checkout signature", () => assert.ok(rzp.verifyCheckoutSignature({ orderId: "order_X1", paymentId: "pay_Y2", signature: sig, keySecret: secret })));
  await t("tampered payment id rejected", () => assert.ok(!rzp.verifyCheckoutSignature({ orderId: "order_X1", paymentId: "pay_Z9", signature: sig, keySecret: secret })));
  await t("garbage / empty / wrong-length signature rejected", () => {
    for (const bad of ["", "abc", "zz".repeat(32), undefined, null, 123]) assert.ok(!rzp.verifyCheckoutSignature({ orderId: "order_X1", paymentId: "pay_Y2", signature: bad, keySecret: secret }));
  });
  const body = Buffer.from('{"event":"payment.captured"}');
  const wsig = crypto.createHmac("sha256", "whsec").update(body).digest("hex");
  await t("valid webhook signature", () => assert.ok(rzp.verifyWebhookSignature({ rawBody: body, signature: wsig, webhookSecret: "whsec" })));
  await t("webhook with wrong secret / missing secret / altered body rejected", () => {
    assert.ok(!rzp.verifyWebhookSignature({ rawBody: body, signature: wsig, webhookSecret: "other" }));
    assert.ok(!rzp.verifyWebhookSignature({ rawBody: body, signature: wsig, webhookSecret: undefined }));
    assert.ok(!rzp.verifyWebhookSignature({ rawBody: Buffer.from("x"), signature: wsig, webhookSecret: "whsec" }));
  });

  console.log(`\n${passed} checks passed`);
  process.exit(process.exitCode || 0);
})();
