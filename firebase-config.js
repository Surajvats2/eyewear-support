// public/firebase-config.js
//
// Your Firebase web config (the one you got from Firebase Console →
// Project settings → Your apps). This is the PUBLIC config — safe to
// expose in frontend code. It is NOT the same as the service account key
// on the backend (server/serviceAccountKey.json), which must stay private.
//
// Note: this app only uses Authentication + Firestore, so the Analytics
// SDK/measurementId from your snippet was left out on purpose — nothing
// in this project needs it. If you want Analytics later, add
// firebase-analytics-compat.js as a script tag and re-add getAnalytics().

const firebaseConfig = {
  apiKey: "AIzaSyBPUI4VCU-CZ58DsEwxBW9oi3qzVXT2bqs",
  authDomain: "eyewear-support.firebaseapp.com",
  projectId: "eyewear-support",
  storageBucket: "eyewear-support.firebasestorage.app",
  messagingSenderId: "1019699668530",
  appId: "1:1019699668530:web:43426caf6f80c67e9bfe2b",
};

firebase.initializeApp(firebaseConfig);
