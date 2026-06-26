// public/js/app.js
// CHANGED FOR FIREBASE: Auth now wraps firebase.auth() instead of our own
// JWT + localStorage. Everything else (cart, toast, cart drawer) is unchanged.

const API = ""; // same-origin

// ---------------- Auth helpers (Firebase) ----------------
let _firebaseUser = null; // kept in sync by onAuthStateChanged below

const Auth = {
  isLoggedIn() { return !!_firebaseUser; },
  getUser() {
    if (!_firebaseUser) return null;
    return { name: _firebaseUser.displayName || _firebaseUser.email, email: _firebaseUser.email, uid: _firebaseUser.uid };
  },
  async getIdToken() {
    if (!_firebaseUser) return null;
    return _firebaseUser.getIdToken();
  },
  logout() {
    firebase.auth().signOut().then(() => location.href = "index.html");
  },
  // Resolves once Firebase has told us whether someone's logged in or not.
  // Pages that gate on login (checkout.html, appointment.html) should
  // `await Auth.ready()` before checking Auth.isLoggedIn().
  ready() {
    return new Promise((resolve) => {
      firebase.auth().onAuthStateChanged((user) => {
        _firebaseUser = user;
        renderAuthSlot();
        resolve(user);
      });
    });
  },
};

async function apiFetch(url, options = {}) {
  const headers = options.headers || {};
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const token = await Auth.getIdToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API + url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// ---------------- Cart (kept in the browser until checkout) ----------------
const Cart = {
  KEY: "specai_cart",
  get() {
    const raw = localStorage.getItem(this.KEY);
    return raw ? JSON.parse(raw) : [];
  },
  save(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    updateCartBadge();
  },
  add(product) {
    const items = this.get();
    const existing = items.find((i) => i.id === product.id);
    if (existing) existing.qty += 1;
    else items.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 });
    this.save(items);
  },
  setQty(id, qty) {
    let items = this.get();
    if (qty <= 0) items = items.filter((i) => i.id !== id);
    else items = items.map((i) => (i.id === id ? { ...i, qty } : i));
    this.save(items);
  },
  remove(id) { this.save(this.get().filter((i) => i.id !== id)); },
  clear() { this.save([]); },
  total() { return this.get().reduce((sum, i) => sum + i.price * i.qty, 0); },
  count() { return this.get().reduce((sum, i) => sum + i.qty, 0); },
};

function updateCartBadge() {
  document.querySelectorAll(".cart-badge").forEach((el) => {
    const n = Cart.count();
    el.textContent = n;
    el.style.display = n > 0 ? "flex" : "none";
  });
}

// ---------------- Toast ----------------
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 2200);
}

// ---------------- Cart drawer ----------------
function injectCartDrawer() {
  if (document.getElementById("cart-drawer")) return;

  const overlay = document.createElement("div");
  overlay.id = "cart-overlay";
  overlay.onclick = closeCart;

  const drawer = document.createElement("div");
  drawer.id = "cart-drawer";
  drawer.innerHTML = `
    <div class="cart-head">
      <h3>Your Cart</h3>
      <button onclick="closeCart()" aria-label="Close cart">✕</button>
    </div>
    <div class="cart-items" id="cart-items"></div>
    <div class="cart-foot">
      <div class="total-row"><span>Total</span><b id="cart-total">$0</b></div>
      <button class="btn-dark" id="checkout-btn" onclick="goToCheckout()">Proceed to Checkout →</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
}

function renderCart() {
  const items = Cart.get();
  const list = document.getElementById("cart-items");
  if (!list) return;

  if (items.length === 0) {
    list.innerHTML = `<div class="cart-empty">Your cart is empty.<br>Add some glasses to get started!</div>`;
  } else {
    list.innerHTML = items.map((i) => `
      <div class="cart-item">
        <img src="${i.image}" alt="${i.name}">
        <div class="ci-info">
          <h6>${i.name}</h6>
          <div class="muted">$${i.price}</div>
          <div class="qty-row">
            <button onclick="changeQty('${i.id}', ${i.qty - 1})">−</button>
            <span>${i.qty}</span>
            <button onclick="changeQty('${i.id}', ${i.qty + 1})">+</button>
            <span class="remove" onclick="Cart.remove('${i.id}'); renderCart();">Remove</span>
          </div>
        </div>
      </div>
    `).join("");
  }
  document.getElementById("cart-total").textContent = "$" + Cart.total();
  updateCartBadge();
}

function changeQty(id, qty) { Cart.setQty(id, qty); renderCart(); }

function openCart() {
  injectCartDrawer();
  renderCart();
  document.getElementById("cart-overlay").classList.add("open");
  document.getElementById("cart-drawer").classList.add("open");
}
function closeCart() {
  document.getElementById("cart-overlay")?.classList.remove("open");
  document.getElementById("cart-drawer")?.classList.remove("open");
}

async function goToCheckout() {
  if (Cart.get().length === 0) { showToast("Your cart is empty."); return; }
  await Auth.ready();
  if (!Auth.isLoggedIn()) {
    location.href = "account.html?redirect=checkout.html";
  } else {
    location.href = "checkout.html";
  }
}

function wireAddToCartButtons() {
  document.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const product = {
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: parseFloat(btn.dataset.price),
        image: btn.dataset.image,
      };
      Cart.add(product);
      btn.classList.add("active");
      const original = btn.textContent;
      btn.textContent = "✓";
      showToast(`${product.name} added to cart`);
      setTimeout(() => { btn.classList.remove("active"); btn.textContent = original; }, 1200);
    });
  });
}

function renderAuthSlot() {
  const slot = document.getElementById("auth-slot");
  if (!slot) return;
  const user = Auth.getUser();
  if (user) {
    slot.innerHTML = `<a class="pill-btn" href="account.html">Hi, ${(user.name || "").split(" ")[0]} ▾</a>`;
  } else {
    slot.innerHTML = `<a class="pill-btn" href="account.html">Log in</a>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  injectCartDrawer();
  wireAddToCartButtons();
  updateCartBadge();
  Auth.ready(); // also wires up renderAuthSlot via the listener
});
