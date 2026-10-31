/* Run: node tests/coinBonus.test.js (no database) */
const assert = require("assert");
const { computeCoinAmounts, normalizeBonusCoins } = require("../services/coinPurchase.service");
let n = 0;
const t = (name, fn) => { try { fn(); n++; console.log("  ok  -", name); } catch (e) { console.error("FAIL -", name, e); process.exitCode = 1; } };

t("1000 base + 200 bonus = 1200 for a NORMAL (non-VIP) buyer", () => {
  assert.deepStrictEqual(computeCoinAmounts({ coins: 1000, bonusCoins: 200, price: 99 }), { coins: 1000, bonusCoins: 200, totalCoins: 1200, price: 99 });
});
t("zero bonus credits base only", () => assert.strictEqual(computeCoinAmounts({ coins: 500, bonusCoins: 0, price: 49 }).totalCoins, 500));
t("missing / null / invalid bonus is treated as 0 (purchase still works)", () => {
  for (const b of [undefined, null, -5, 2.5, "abc", NaN]) assert.strictEqual(computeCoinAmounts({ coins: 500, bonusCoins: b, price: 49 }).totalCoins, 500);
  assert.strictEqual(normalizeBonusCoins("200"), 200);
});
t("invalid base coins rejected", () => assert.throws(() => computeCoinAmounts({ coins: 0, bonusCoins: 10, price: 1 })));
console.log(`\n${n} checks passed`);
