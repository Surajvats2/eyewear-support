// server/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const appointmentRoutes = require("./routes/appointments");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded "broken glasses" photos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/appointments", appointmentRoutes);

// Serve the frontend (everything in /public)
app.use(express.static(path.join(__dirname, "..", "public")));

// Basic error handler (e.g. multer file-type/size errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: "server_error", message: err.message || "Something went wrong." });
});

app.listen(PORT, () => {
  console.log(`SpecAI server running at http://localhost:${PORT}`);
});
