// server/middleware/auth.js
//
// CHANGED FOR FIREBASE: instead of verifying our own JWT, we verify the
// Firebase ID token the frontend got from firebase.auth() and sent in the
// "Authorization: Bearer <idToken>" header.

const { admin } = require("../firebaseAdmin");

// Protects a route: requires a valid Firebase ID token.
// On success, attaches req.user = { id, email, name }.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "not_logged_in", message: "Please log in to continue." });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      id: decoded.uid,
      email: decoded.email,
      name: decoded.name || decoded.email,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid_token", message: "Session expired, please log in again." });
  }
}

module.exports = { requireAuth };
