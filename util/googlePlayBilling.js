const crypto = require("crypto");
const { google } = require("googleapis");
const Setting = require("../data");

let androidPublisher = null;

const getAndroidPublisher = async () => {
  if (androidPublisher) return androidPublisher;

  const packageName = Setting.packageName;

  const credentials = Setting.privateKey;

  if (!packageName) {
    throw new Error("Google Play package name is not configured");
  }

  
  if (!credentials) {
    throw new Error("Google service account credentials are not configured");
  }

  if (
    !credentials.client_email ||
    !credentials.private_key ||
    !credentials.project_id
  ) {
    throw new Error(
      "Incomplete Google service account credentials"
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/androidpublisher",
    ],
  });

  const authClient = await auth.getClient();

  androidPublisher = google.androidpublisher({
    version: "v3",
    auth: authClient,
  });

  return androidPublisher;
};

const createObfuscatedAccountId = (userId) => {
  return crypto
    .createHash("sha256")
    .update(String(userId))
    .digest("hex");
};

const verifyGooglePlayPurchase = async ({
  productId,
  purchaseToken,
  userId,
}) => {
  const packageName = Setting.packageName;

  if (!packageName) {
    throw new Error("Google Play package name is not configured");
  }

  if (!productId?.trim()) {
    throw new Error("Google Play productId is required");
  }

  if (!purchaseToken?.trim()) {
    throw new Error("Google Play purchaseToken is required");
  }

  if (!userId?.trim()) {
    throw new Error("Google Play userId is required");
  }

  const publisher = await getAndroidPublisher();

  const response =
    await publisher.purchases.productsv2.getproductpurchasev2({
      packageName,
      token: purchaseToken.trim(),
    });

  const purchase = response?.data;

  if (!purchase) {
    throw new Error(
      "Google Play purchase verification returned empty response"
    );
  }

  const expectedAccountId =
    createObfuscatedAccountId(userId);

  const googleAccountId =
    purchase.obfuscatedExternalAccountId
      ? String(purchase.obfuscatedExternalAccountId)
      : "";

  if (!googleAccountId) {
    throw new Error(
      "Google Play purchase is not linked to a Zigo account"
    );
  }

  if (googleAccountId !== expectedAccountId) {
    throw new Error("Google Play account mismatch");
  }

  const lineItems = Array.isArray(
    purchase.productLineItem
  )
    ? purchase.productLineItem
    : [];

  const matchingItem = lineItems.find(
    (item) =>
      item?.productId === productId.trim()
  );

  if (!matchingItem) {
    throw new Error(
      "Google Play product mismatch"
    );
  }

  const purchaseState =
    purchase.purchaseStateContext?.purchaseState;

  if (purchaseState !== "PURCHASED") {
    throw new Error(
      "Google Play purchase is not completed"
    );
  }

  const acknowledgementState =
    purchase.acknowledgementState || "";

  const purchaseCompletionTime =
    purchase.purchaseCompletionTime
      ? String(purchase.purchaseCompletionTime)
      : "";

  const orderId =
    purchase.orderId
      ? String(purchase.orderId)
      : "";

  const consumptionState =
    matchingItem.consumptionState || "";

  if (
    consumptionState ===
    "CONSUMPTION_STATE_CONSUMED"
  ) {
    throw new Error(
      "Google Play purchase has already been consumed"
    );
  }

  return {
    valid: true,
    productId: productId.trim(),
    purchaseToken: purchaseToken.trim(),
    orderId,
    purchaseState,
    consumptionState,
    acknowledgementState,
    purchaseCompletionTime,
    obfuscatedExternalAccountId:
      googleAccountId,
    obfuscatedExternalProfileId:
      purchase.obfuscatedExternalProfileId
        ? String(
            purchase.obfuscatedExternalProfileId
          )
        : "",
    regionCode:
      purchase.regionCode
        ? String(purchase.regionCode)
        : "",
    raw: purchase,
  };
};

const consumeGooglePlayPurchase = async ({
  productId,
  purchaseToken,
}) => {
  const packageName = Setting.packageName;

  if (!packageName) {
    throw new Error(
      "Google Play package name is not configured"
    );
  }

  if (!productId?.trim()) {
    throw new Error(
      "Google Play productId is required"
    );
  }

  if (!purchaseToken?.trim()) {
    throw new Error(
      "Google Play purchaseToken is required"
    );
  }

  const publisher = await getAndroidPublisher();

  await publisher.purchases.products.consume({
    packageName,
    productId: productId.trim(),
    token: purchaseToken.trim(),
    requestBody: {},
  });

  return true;
};

module.exports = {
  createObfuscatedAccountId,
  verifyGooglePlayPurchase,
  consumeGooglePlayPurchase,
};