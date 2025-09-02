const admin = require("firebase-admin");

if (!admin.apps.length) {
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saJson) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT env");
  const credential = admin.credential.cert(JSON.parse(saJson));
  admin.initializeApp({ credential });
}

const db = admin.firestore();
module.exports = { admin, db };
