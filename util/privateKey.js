const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const { getAuth } = require("firebase-admin/auth");

const privateKey = settingJSON?.privateKey;

if (!privateKey) {
  console.error("❌ Firebase private key not found.");
  process.exit(1);
}

let app;

if (!getApps().length) {
  app = initializeApp({
    credential: cert(privateKey),
  });

} else {
  app = getApps()[0];
}

module.exports = {
  app,
  messaging: getMessaging(app),
  auth: getAuth(app),
};
