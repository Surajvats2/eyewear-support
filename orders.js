// server/routes/orders.js — UPI QR Code payment flow

const express = require("express");
const crypto = require("crypto");
const { requireAuth } = require("../middleware/auth");
const { getProduct, createOrder, getOrder, updateOrder, getOrdersForUser } = require("../db");

const router = express.Router();

// POST /api/orders — create order from cart items
router.post("/", requireAuth, async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "empty_cart", message: "Your cart is empty." });
  }

  let amount = 0;
  const lineItems = [];

  for (const it of items) {
    const product = await getProduct(it.productId);
    if (!product) {
      return res.status(400).json({ error: "bad_product", message: `Unknown product: ${it.productId}` });
    }
    const qty = Math.max(1, parseInt(it.qty, 10) || 1);
    amount += product.price * qty;
    lineItems.push({ productId: product.id, name: product.name, price: product.price, qty });
  }

  const order = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    items: lineItems,
    amount,
    currency: "INR",
    status: "pending_payment",
    createdAt: new Date().toISOString(),
  };

  await createOrder(order);

  // UPI payment string — customer scans this QR
  const upiId = process.env.UPI_ID || "yourname@upi";
  const upiLink = `upi://pay?pa=${upiId}&pn=SpecAI&am=${amount}&cu=INR&tn=Order-${order.id.slice(0,8)}`;

  res.json({ order, upiLink, upiId, amount });
});

// POST /api/orders/:id/confirm — mark order as paid (manual confirm by user)
router.post("/:id/confirm", requireAuth, async (req, res) => {
  const { utrNumber } = req.body; // UTR / transaction reference from customer
  const order = await getOrder(req.params.id);
  if (!order || order.userId !== req.user.id) {
    return res.status(404).json({ error: "not_found", message: "Order not found." });
  }
  if (order.status === "paid") return res.json({ order });

  const updated = await updateOrder(order.id, {
    status: "paid",
    paymentId: utrNumber || "UPI-" + crypto.randomBytes(4).toString("hex").toUpperCase(),
    paidAt: new Date().toISOString(),
  });

  res.json({ order: updated });
});

// GET /api/orders — this user's order history
router.get("/", requireAuth, async (req, res) => {
  const orders = await getOrdersForUser(req.user.id);
  res.json({ orders });
});

// GET /api/orders/:id — single order (for invoice)
router.get("/:id", requireAuth, async (req, res) => {
  const order = await getOrder(req.params.id);
  if (!order || order.userId !== req.user.id) {
    return res.status(404).json({ error: "not_found", message: "Order not found." });
  }
  res.json({ order });
});

module.exports = router;
