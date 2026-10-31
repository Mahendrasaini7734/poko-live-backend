/* Run: node tests/razorpayVerification.test.js  (gateway API mocked, no database) */
const assert = require("assert");
const rzp = require("../util/razorpay");
const { confirmPaymentWithRazorpay, PaymentError } = require("../services/coinPurchase.service");

const order = { razorpayOrderId: "order_A", amountPaise: 49900, currency: "INR" };
let n = 0, captured = 0;
const t = async (name, fn) => { try { await fn(); n++; console.log("  ok  -", name); } catch (e) { console.error("FAIL -", name, e); process.exitCode = 1; } };
const mock = (p) => { rzp.fetchPayment = async () => p; rzp.capturePayment = async () => { captured++; return { ...p, status: "captured" }; }; };
const rejects = async (p, code) => { mock(p); await assert.rejects(() => confirmPaymentWithRazorpay({}, order, "pay_1"), (e) => e instanceof PaymentError && e.code === code); };

(async () => {
  const ok = { id: "pay_1", order_id: "order_A", amount: 49900, currency: "INR", status: "captured" };
  await t("captured, matching payment accepted", async () => { mock(ok); assert.strictEqual((await confirmPaymentWithRazorpay({}, order, "pay_1")).status, "captured"); });
  await t("payment of another order rejected", () => rejects({ ...ok, order_id: "order_B" }, "ORDER_MISMATCH"));
  await t("wrong amount rejected (package/amount tampering)", () => rejects({ ...ok, amount: 100 }, "AMOUNT_MISMATCH"));
  await t("wrong currency rejected", () => rejects({ ...ok, currency: "USD" }, "CURRENCY_MISMATCH"));
  for (const st of ["failed", "created", "refunded"]) await t(`status ${st} rejected, no credit`, () => rejects({ ...ok, status: st }, "PAYMENT_NOT_CAPTURED"));
  await t("authorized payment is captured server-side then accepted", async () => { mock({ ...ok, status: "authorized" }); await confirmPaymentWithRazorpay({}, order, "pay_1"); assert.strictEqual(captured, 1); });
  console.log(`\n${n} checks passed`);
})();
