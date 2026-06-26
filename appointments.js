// server/routes/appointments.js
// CHANGED FOR FIREBASE: appointment storage goes through Firestore (via db.js).
// Photo uploads STAY on local disk (multer) because Firebase Storage isn't
// enabled on your project yet — see the comment near `upload` below for how
// to switch to Firebase Storage once you do enable it.

const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { requireAuth } = require("../middleware/auth");
const { createAppointment, getAppointmentsForUser } = require("../db");

const router = express.Router();

// Local-disk storage for repair photos (kept exactly as before).
// To switch to Firebase Storage later: use multer.memoryStorage() instead,
// then in each route do:
//   const bucket = admin.storage().bucket();
//   const file = bucket.file(`appointments/${crypto.randomUUID()}.jpg`);
//   await file.save(req.file.buffer, { contentType: req.file.mimetype });
//   const photoUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, crypto.randomUUID() + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("only_images_allowed"));
    cb(null, true);
  },
});

const MOCK_ISSUES = [
  { issue: "Cracked or scratched lens", confidence: 0.82 },
  { issue: "Broken hinge", confidence: 0.77 },
  { issue: "Bent or misaligned frame", confidence: 0.85 },
  { issue: "Missing screw / loose temple arm", confidence: 0.74 },
  { issue: "Snapped temple arm", confidence: 0.8 },
];

// POST /api/appointments/detect — "AI Detect Problem" button
router.post("/detect", requireAuth, upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "no_photo", message: "Please upload a photo first." });
  }

  const pick = MOCK_ISSUES[Math.floor(Math.random() * MOCK_ISSUES.length)];

  res.json({
    detectedIssue: pick.issue,
    confidence: pick.confidence,
    photoUrl: "/uploads/" + req.file.filename,
    note: "This is a demo estimate. A staff member will confirm the real issue from your photo before your appointment.",
  });

  /* REAL AI VISION INTEGRATION — unchanged from before, still applies:
     see the original comment block for the exact fetch() call to Anthropic's
     API once you have ANTHROPIC_API_KEY set in .env. */
});

// POST /api/appointments — create the booking
router.post("/", requireAuth, upload.single("photo"), async (req, res) => {
  const { description, detectedIssue, date, time, photoUrl: existingPhotoUrl } = req.body;

  if (!date || !time) {
    return res.status(400).json({ error: "missing_slot", message: "Please choose a date and time." });
  }
  if (!description && !detectedIssue) {
    return res.status(400).json({ error: "missing_problem", message: "Please describe the problem or use AI Detect first." });
  }

  const photoUrl = req.file ? "/uploads/" + req.file.filename : (existingPhotoUrl || null);

  const appointment = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    photoUrl,
    description: description || null,
    detectedIssue: detectedIssue || null,
    date,
    time,
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };

  await createAppointment(appointment);
  res.json({ appointment });
});

// GET /api/appointments — this user's bookings
router.get("/", requireAuth, async (req, res) => {
  const appointments = await getAppointmentsForUser(req.user.id);
  res.json({ appointments });
});

module.exports = router;
