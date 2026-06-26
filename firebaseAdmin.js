// server/firebaseAdmin.js
//
// Initializes Firebase Admin so the backend can:
//  (a) verify the ID tokens the frontend sends with each request, and
//  (b) read/write Firestore directly.
//
// You need a SERVICE ACCOUNT key for this (different from the public web
// config you put in public/firebase-config.js). Get it from:
//   Firebase Console → ⚙ Project settings → Service accounts
//   → "Generate new private key" → downloads a JSON file.
//
// Put that file at server/serviceAccountKey.json (already gitignored —
// never commit it, it's a master key to your whole Firebase project).

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const KEY_PATH = path.join(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(KEY_PATH)) {
  console.error(
    "\n❌ Missing server/serviceAccountKey.json\n" +
    "   Firebase Console → Project settings → Service accounts → Generate new private key,\n" +
    "   then save the downloaded file as server/serviceAccountKey.json\n"
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(KEY_PATH)),
});

const db = admin.firestore();

module.exports = { admin, db };
