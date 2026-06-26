// server/routes/products.js
const express = require("express");
const { db } = require("../firebaseAdmin");
const { getProducts, getProduct } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
  const products = await getProducts();
  res.json({ products });
});

// POST — add new product (auth required)
router.post("/", requireAuth, async (req, res) => {
  const { id, name, price, tag, image, stock } = req.body;
  if (!name || !price || !image) return res.status(400).json({ error: "name, price, image required" });
  const product = { id: id || "p" + Date.now(), name, price: Number(price), tag: tag || "Style", image, stock: Number(stock) || 10 };
  await db.collection("products").doc(product.id).set(product);
  res.json({ product });
});

// PUT — update product
router.put("/:id", requireAuth, async (req, res) => {
  const { name, price, tag, image, stock } = req.body;
  const update = {};
  if (name) update.name = name;
  if (price) update.price = Number(price);
  if (tag) update.tag = tag;
  if (image) update.image = image;
  if (stock !== undefined) update.stock = Number(stock);
  await db.collection("products").doc(req.params.id).set(update, { merge: true });
  const product = await getProduct(req.params.id);
  res.json({ product });
});

// DELETE — remove product
router.delete("/:id", requireAuth, async (req, res) => {
  await db.collection("products").doc(req.params.id).delete();
  res.json({ deleted: req.params.id });
});

module.exports = router;
