// server/db.js
//
// CHANGED FOR FIREBASE: this used to read/write a JSON file. Now every
// function does the same job against Firestore instead. Every route file
// only calls these functions — none of them touch Firestore directly —
// so this is the only file that changed when you moved off the JSON file.

const { db } = require("./firebaseAdmin");
const seed = require("./data.seed.json");

// ---------------- Products ----------------
// Products rarely change, so we seed them into Firestore once.
async function ensureProductsSeeded() {
  const snap = await db.collection("products").limit(1).get();
  if (!snap.empty) return;
  const batch = db.batch();
  for (const p of seed.products) {
    batch.set(db.collection("products").doc(p.id), p);
  }
  await batch.commit();
}

async function getProducts() {
  await ensureProductsSeeded();
  const snap = await db.collection("products").get();
  return snap.docs.map((d) => d.data());
}

async function getProduct(id) {
  const doc = await db.collection("products").doc(id).get();
  return doc.exists ? doc.data() : null;
}

// ---------------- Users (profile info synced from Firebase Auth) ----------------
async function upsertUserProfile(uid, data) {
  await db.collection("users").doc(uid).set(data, { merge: true });
}

// ---------------- Orders ----------------
async function createOrder(order) {
  await db.collection("orders").doc(order.id).set(order);
  return order;
}

async function getOrder(id) {
  const doc = await db.collection("orders").doc(id).get();
  return doc.exists ? doc.data() : null;
}

async function updateOrder(id, patch) {
  await db.collection("orders").doc(id).set(patch, { merge: true });
  return getOrder(id);
}

async function getOrdersForUser(uid) {
  const snap = await db.collection("orders").where("userId", "==", uid).get();
  return snap.docs.map((d) => d.data()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ---------------- Appointments ----------------
async function createAppointment(appt) {
  await db.collection("appointments").doc(appt.id).set(appt);
  return appt;
}

async function getAppointmentsForUser(uid) {
  const snap = await db.collection("appointments").where("userId", "==", uid).get();
  return snap.docs.map((d) => d.data()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

module.exports = {
  getProducts,
  getProduct,
  upsertUserProfile,
  createOrder,
  getOrder,
  updateOrder,
  getOrdersForUser,
  createAppointment,
  getAppointmentsForUser,
};
