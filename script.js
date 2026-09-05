/* =========================================================
   BLINKIT CLONE — ADVANCED FRONTEND ENGINE
   Single script.js
   Works with existing HTML + style.css + media.css
   Image paths are NOT changed.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* =========================================================
     1. GLOBAL STATE
     ========================================================= */

  const STORAGE = {
    CART: "blinkitCart",
    WISHLIST: "blinkitWishlist",
    ORDERS: "blinkitOrders",
    RECENT: "blinkitRecentlyViewed",
    LOCATION: "blinkitLocation",
    USER: "blinkitUser",
    LOGGED: "blinkitLoggedIn",
    MOBILE: "blinkitMobile",
    OTP: "blinkitDemoOTP",
    COUPON: "blinkitCoupon",
    WELCOME: "blinkitWelcomeShown",
    THEME: "blinkitTheme"
  };

  const ACCOUNT_KEY = "blinkitAccount";

  let cart = readJSON(STORAGE.CART, []);
  let wishlist = readJSON(STORAGE.WISHLIST, []);
  let orders = readJSON(STORAGE.ORDERS, []);
  let recentlyViewed = readJSON(STORAGE.RECENT, []);
  let appliedCoupon = readJSON(STORAGE.COUPON, null);

  let searchTimer = null;
  let otpTimer = null;
  let generatedOTP = "";
  let resendSeconds = 30;

  const COUPONS = {
    BLINKIT50: {
      code: "BLINKIT50",
      type: "flat",
      value: 50,
      min: 299,
      label: "₹50 OFF on orders above ₹299"
    },

    SAVE20: {
      code: "SAVE20",
      type: "percent",
      value: 20,
      max: 100,
      min: 499,
      label: "20% OFF up to ₹100"
    },

    FIRST100: {
      code: "FIRST100",
      type: "flat",
      value: 100,
      min: 599,
      label: "₹100 OFF on orders above ₹599"
    }
  };

  /* =========================================================
     2. HELPERS
     ========================================================= */

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  }

  function escapeHTML(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function money(value) {
    return `₹${Number(value || 0).toFixed(0)}`;
  }

  function parsePrice(value) {
    if (typeof value === "number") {
      return value;
    }

    const cleaned = String(value || "")
      .replace(/[^\d.]/g, "");

    const number = parseFloat(cleaned);

    return Number.isFinite(number)
      ? number
      : 0;
  }

  function debounce(fn, delay = 300) {
    return (...args) => {
      clearTimeout(searchTimer);

      searchTimer = setTimeout(
        () => fn(...args),
        delay
      );
    };
  }

  function vibrate(pattern = 20) {
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  /* =========================================================
     3. TOAST SYSTEM
     ========================================================= */

  function createToastSystem() {
    if ($("#blinkitToast")) return;

    const toast = document.createElement("div");

    toast.id = "blinkitToast";

    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fa-solid fa-check"></i>
      </div>

      <div class="toast-content">
        <strong id="toastTitle">Success</strong>
        <span id="toastMessage"></span>
      </div>
    `;

    document.body.appendChild(toast);

    const style = document.createElement("style");

    style.textContent = `
      #blinkitToast{
        position:fixed;
        left:50%;
        bottom:28px;
        transform:translate(-50%,120px);
        min-width:290px;
        max-width:calc(100vw - 30px);
        padding:13px 16px;
        background:#fff;
        color:#222;
        border-radius:14px;
        box-shadow:0 15px 50px rgba(0,0,0,.18);
        display:flex;
        align-items:center;
        gap:12px;
        z-index:9999999;
        opacity:0;
        transition:.35s cubic-bezier(.2,.8,.2,1);
        border:1px solid #eee;
      }

      #blinkitToast.show{
        opacity:1;
        transform:translate(-50%,0);
      }

      #blinkitToast.error .toast-icon{
        background:#ffe9e9;
        color:#e53935;
      }

      #blinkitToast.info .toast-icon{
        background:#eef4ff;
        color:#2675ff;
      }

      .toast-icon{
        width:36px;
        height:36px;
        border-radius:50%;
        background:#eaf7e6;
        color:#2d7e05;
        display:grid;
        place-items:center;
        flex-shrink:0;
      }

      .toast-content{
        display:flex;
        flex-direction:column;
        gap:2px;
      }

      .toast-content strong{
        font-size:13px;
      }

      .toast-content span{
        font-size:12px;
        color:#666;
      }

      .blinkit-badge{
        position:absolute;
        top:-6px;
        right:-6px;
        min-width:18px;
        height:18px;
        padding:0 5px;
        border-radius:20px;
        background:#ff3d00;
        color:#fff;
        font-size:10px;
        display:grid;
        place-items:center;
        font-weight:700;
        border:2px solid #fff;
      }

      .blinkit-added{
        animation:blinkitPop .35s ease;
      }

      @keyframes blinkitPop{
        0%{transform:scale(.8)}
        60%{transform:scale(1.12)}
        100%{transform:scale(1)}
      }

      .wishlist-active{
        color:#e91e63 !important;
      }

      .blinkit-product-highlight{
        animation:blinkitHighlight 1.2s ease;
      }

      @keyframes blinkitHighlight{
        0%,100%{
          box-shadow:0 0 0 rgba(45,126,5,0)
        }

        50%{
          box-shadow:0 0 0 5px rgba(45,126,5,.12)
        }
      }

      body.blinkit-lock{
        overflow:hidden;
      }
    `;

    document.head.appendChild(style);
  }

  let toastTimeout;

  function showToast(
    message,
    type = "success",
    title = ""
  ) {
    const toast = $("#blinkitToast");

    if (!toast) return;

    clearTimeout(toastTimeout);

    const titleElement =
      $("#toastTitle");

    const messageElement =
      $("#toastMessage");

    const icon =
      $(".toast-icon i", toast);

    const titles = {
      success: "Done",
      error: "Oops",
      info: "Blinkit"
    };

    const icons = {
      success: "fa-check",
      error: "fa-xmark",
      info: "fa-info"
    };

    titleElement.textContent =
      title ||
      titles[type] ||
      "Blinkit";

    messageElement.textContent =
      message;

    toast.className = "";

    toast.classList.add(type);

    icon.className =
      `fa-solid ${
        icons[type] || icons.info
      }`;

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    toastTimeout =
      setTimeout(() => {
        toast.classList.remove("show");
      }, 2800);
  }

  createToastSystem();

  /* =========================================================
     4. PRODUCT DATA ENGINE
     ========================================================= */

  function getProductData(card) {
    if (!card) return null;

    const name =
      $(".productContent h5", card)
        ?.textContent
        ?.trim() ||

      $(".productContent h3", card)
        ?.textContent
        ?.trim() ||

      "Product";

    const quantity =
      $(".productContent > p", card)
        ?.textContent
        ?.trim() ||

      "1 unit";

    const priceElement =
      $(".btn-price-outer b", card);

    const price =
      parsePrice(
        priceElement?.textContent ||
        $(".btn-price-outer", card)
          ?.textContent
      );

    const image =
      $(".productimg > img", card)
        ?.getAttribute("src") ||
      "";

    const oldPriceElement =
      $(".old-price", card);

    const oldPrice =
      oldPriceElement
        ? parsePrice(
            oldPriceElement.textContent
          )
        : 0;

    return {
      id: createProductId(
        name,
        quantity
      ),

      name,
      quantity,
      price,
      oldPrice,
      image
    };
  }

  function createProductId(
    name,
    quantity
  ) {
    return `${name}-${quantity}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function getAllProducts() {
    return $$(".productItems")
      .map(getProductData)
      .filter(Boolean);
  }

  /* =========================================================
     5. CART ENGINE
     ========================================================= */

  function saveCart() {
    writeJSON(
      STORAGE.CART,
      cart
    );
  }

  function cartCount() {
    return cart.reduce(
      (sum, item) =>
        sum + Number(item.qty || 0),
      0
    );
  }

  function cartSubtotal() {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.qty || 0),
      0
    );
  }

  function getDeliveryFee(
    subtotal = cartSubtotal()
  ) {
    if (!subtotal) return 0;

    return subtotal >= 199
      ? 0
      : 25;
  }

  function getDiscount(
    subtotal = cartSubtotal()
  ) {
    if (!appliedCoupon) return 0;

    const coupon =
      COUPONS[
        appliedCoupon.code
      ];

    if (
      !coupon ||
      subtotal < coupon.min
    ) {
      return 0;
    }

    if (coupon.type === "flat") {
      return Math.min(
        coupon.value,
        subtotal
      );
    }

    if (coupon.type === "percent") {
      return Math.min(
        Math.round(
          subtotal *
          coupon.value /
          100
        ),
        coupon.max ||
          Infinity
      );
    }

    return 0;
  }

  function getGrandTotal() {
    const subtotal =
      cartSubtotal();

    const delivery =
      getDeliveryFee(subtotal);

    const discount =
      getDiscount(subtotal);

    return Math.max(
      0,
      subtotal +
      delivery -
      discount
    );
  }

  function addToCart(
    product,
    quantity = 1
  ) {
    if (!product) return;

    const existing =
      cart.find(
        item =>
          item.id ===
          product.id
      );

    if (existing) {
      existing.qty += quantity;
    } else {
      cart.push({
        ...product,
        qty: quantity
      });
    }

    saveCart();

    updateCartUI();

    pulseCartButton();

    showToast(
      `${product.name} added to cart`,
      "success",
      "Added to cart"
    );

    vibrate(25);
  }

  function increaseQuantity(id) {
    const item =
      cart.find(
        product =>
          product.id === id
      );

    if (!item) return;

    item.qty++;

    saveCart();

    updateCartUI();

    vibrate(15);
  }

  function decreaseQuantity(id) {
    const item =
      cart.find(
        product =>
          product.id === id
      );

    if (!item) return;

    item.qty--;

    if (item.qty <= 0) {
      cart =
        cart.filter(
          product =>
            product.id !== id
        );
    }

    saveCart();

    updateCartUI();

    vibrate(15);
  }

  function removeFromCart(id) {
    const item =
      cart.find(
        product =>
          product.id === id
      );

    cart =
      cart.filter(
        product =>
          product.id !== id
      );

    saveCart();

    updateCartUI();

    if (item) {
      showToast(
        `${item.name} removed`,
        "info"
      );
    }
  }

  /* =========================================================
     6. CART BUTTON
     ========================================================= */

  function getCartButton() {
    return $$(".headerbtn button")
      .find(button =>
        /my\s*cart/i.test(
          button.textContent
        )
      );
  }

  function updateHeaderCart() {
    const button =
      getCartButton();

    if (!button) return;

    const count =
      cartCount();

    button.style.position =
      "relative";

    button.innerHTML = `
      <i class="fa-solid fa-cart-shopping"></i>
      My Cart

      ${
        count > 0
          ? `
            <span class="blinkit-badge">
              ${
                count > 99
                  ? "99+"
                  : count
              }
            </span>
          `
          : ""
      }
    `;
  }

  function pulseCartButton() {
    const button =
      getCartButton();

    if (!button) return;

    button.classList.remove(
      "blinkit-added"
    );

    void button.offsetWidth;

    button.classList.add(
      "blinkit-added"
    );
  }

  /* =========================================================
     7. CART DRAWER
     ========================================================= */

  function createCartDrawer() {
    if ($("#cartDrawer")) return;

    const drawer =
      document.createElement("div");

    drawer.id =
      "cartDrawer";

    drawer.innerHTML = `
      <div
        class="cart-backdrop"
        data-close-cart
      ></div>

      <aside class="cart-panel">

        <div class="cart-header">

          <div>
            <small>
              Your basket
            </small>

            <h2>
              My Cart
            </h2>
          </div>

          <button
            class="cart-close"
            aria-label="Close cart"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>

        </div>

        <div class="cart-delivery-box">

          <div class="cart-delivery-icon">
            <i class="fa-solid fa-bolt"></i>
          </div>

          <div>
            <strong>
              Delivery in 10 minutes
            </strong>

            <span id="cartLocationText">
              Add delivery location
            </span>
          </div>

          <button id="selectLocation">
            Change
          </button>

        </div>

        <div class="cart-body">

          <div id="cartItems"></div>

          <div class="coupon-area">

            <div class="coupon-title">
              <i class="fa-solid fa-ticket"></i>
              Apply coupon
            </div>

            <div class="coupon-input-row">

              <input
                id="couponInput"
                type="text"
                placeholder="Enter coupon code"
                autocomplete="off"
              >

              <button id="applyCoupon">
                Apply
              </button>

            </div>

            <div id="couponMessage"></div>

            <div class="coupon-suggestions">

              <button data-coupon="BLINKIT50">
                BLINKIT50
              </button>

              <button data-coupon="SAVE20">
                SAVE20
              </button>

              <button data-coupon="FIRST100">
                FIRST100
              </button>

            </div>

          </div>

        </div>

        <div class="cart-footer">

          <div
            class="cart-saving"
            id="cartSaving"
          ></div>

          <div class="cart-bill">

            <div>
              <span>
                Items total
              </span>

              <b id="cartSubtotal">
                ₹0
              </b>
            </div>

            <div>
              <span>
                Delivery fee
              </span>

              <b id="cartDelivery">
                ₹0
              </b>
            </div>

            <div
              id="discountRow"
              style="display:none"
            >
              <span>
                Discount
              </span>

              <b id="cartDiscount">
                -₹0
              </b>
            </div>

            <div class="cart-grand-total">

              <span>
                Grand total
              </span>

              <strong id="cartGrandTotal">
                ₹0
              </strong>

            </div>

          </div>

          <button
            id="checkoutBtn"
            class="checkout-btn"
          >
            Proceed to checkout

            <i class="fa-solid fa-arrow-right"></i>
          </button>

        </div>

      </aside>
    `;

    document.body.appendChild(
      drawer
    );

    addCartDrawerStyles();

    $(".cart-close", drawer)
      ?.addEventListener(
        "click",
        closeCart
      );

    $(".cart-backdrop", drawer)
      ?.addEventListener(
        "click",
        closeCart
      );

    $("#checkoutBtn", drawer)
      ?.addEventListener(
        "click",
        checkout
      );

    $("#selectLocation", drawer)
      ?.addEventListener(
        "click",
        detectLocation
      );

    $("#applyCoupon", drawer)
      ?.addEventListener(
        "click",
        applyCoupon
      );

    $("#couponInput", drawer)
      ?.addEventListener(
        "keydown",
        event => {
          if (event.key === "Enter") {
            applyCoupon();
          }
        }
      );

    $$(".coupon-suggestions button", drawer)
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            $("#couponInput").value =
              button.dataset.coupon;

            applyCoupon();
          }
        );
      });
  }

  function addCartDrawerStyles() {
    if ($("#blinkitCartStyles"))
      return;

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "blinkitCartStyles";

    style.textContent = `
      #cartDrawer{
        position:fixed;
        inset:0;
        z-index:99998;
        visibility:hidden;
      }

      #cartDrawer.open{
        visibility:visible;
      }

      .cart-backdrop{
        position:absolute;
        inset:0;
        background:rgba(0,0,0,.45);
        opacity:0;
        transition:.3s ease;
        backdrop-filter:blur(3px);
      }

      #cartDrawer.open .cart-backdrop{
        opacity:1;
      }

      .cart-panel{
        position:absolute;
        top:0;
        right:0;
        width:min(440px,100%);
        height:100%;
        background:#fff;
        display:flex;
        flex-direction:column;
        transform:translateX(100%);
        transition:.4s cubic-bezier(.2,.8,.2,1);
        box-shadow:-15px 0 50px rgba(0,0,0,.16);
      }

      #cartDrawer.open .cart-panel{
        transform:translateX(0);
      }

      .cart-header{
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:22px;
        border-bottom:1px solid #eee;
      }

      .cart-header small{
        color:#777;
        font-size:11px;
      }

      .cart-header h2{
        margin:2px 0 0;
        font-size:22px;
      }

      .cart-close{
        width:38px;
        height:38px;
        border:0;
        border-radius:50%;
        background:#f5f5f5;
        cursor:pointer;
        font-size:17px;
      }

      .cart-delivery-box{
        margin:14px 18px;
        padding:13px;
        border-radius:14px;
        background:#f7fbf5;
        display:flex;
        align-items:center;
        gap:10px;
      }

      .cart-delivery-icon{
        width:38px;
        height:38px;
        display:grid;
        place-items:center;
        border-radius:10px;
        background:#e8f5e2;
        color:#2d7e05;
      }

      .cart-delivery-box > div:nth-child(2){
        flex:1;
        display:flex;
        flex-direction:column;
        gap:3px;
      }

      .cart-delivery-box strong{
        font-size:12px;
      }

      .cart-delivery-box span{
        font-size:10px;
        color:#777;
      }

      #selectLocation{
        border:0;
        background:transparent;
        color:#2d7e05;
        font-weight:bold;
        cursor:pointer;
      }

      .cart-body{
        flex:1;
        overflow:auto;
        padding:0 18px 20px;
      }

      .cart-item{
        display:flex;
        gap:12px;
        padding:14px 0;
        border-bottom:1px solid #f0f0f0;
      }

      .cart-item-image{
        width:64px;
        height:64px;
        border-radius:10px;
        background:#fafafa;
        object-fit:contain;
        flex-shrink:0;
      }

      .cart-item-main{
        flex:1;
        min-width:0;
      }

      .cart-item-main strong{
        display:block;
        font-size:13px;
        line-height:1.35;
      }

      .cart-item-main small{
        display:block;
        color:#777;
        font-size:11px;
        margin-top:4px;
      }

      .cart-item-bottom{
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:8px;
        margin-top:9px;
      }

      .cart-item-price{
        font-weight:700;
        font-size:12px;
      }

      .quantity-control{
        display:flex;
        align-items:center;
        border:1px solid #2d7e05;
        border-radius:7px;
        overflow:hidden;
      }

      .quantity-control button{
        width:27px;
        height:27px;
        border:0;
        background:#f3faef;
        color:#2d7e05;
        font-weight:bold;
        cursor:pointer;
      }

      .quantity-control span{
        width:28px;
        text-align:center;
        font-size:12px;
      }

      .remove-cart-item{
        margin-top:6px;
        background:none;
        border:0;
        color:#999;
        font-size:10px;
        cursor:pointer;
      }

      .cart-empty{
        text-align:center;
        padding:70px 20px;
        color:#777;
      }

      .cart-empty-icon{
        width:75px;
        height:75px;
        margin:0 auto 15px;
        border-radius:50%;
        background:#f4f8f1;
        color:#2d7e05;
        display:grid;
        place-items:center;
        font-size:28px;
      }

      .cart-empty h3{
        color:#222;
        margin-bottom:7px;
      }

      .coupon-area{
        margin-top:18px;
        padding:15px;
        background:#fafafa;
        border-radius:14px;
      }

      .coupon-title{
        font-size:12px;
        font-weight:700;
        margin-bottom:10px;
      }

      .coupon-input-row{
        display:flex;
        gap:7px;
      }

      .coupon-input-row input{
        flex:1;
        min-width:0;
        padding:10px;
        border:1px solid #ddd;
        border-radius:8px;
        outline:none;
        text-transform:uppercase;
        font-size:11px;
      }

      .coupon-input-row button{
        padding:0 13px;
        border:0;
        background:#2d7e05;
        color:#fff;
        border-radius:8px;
        font-weight:bold;
        cursor:pointer;
      }

      #couponMessage{
        font-size:10px;
        margin-top:7px;
      }

      .coupon-suggestions{
        display:flex;
        gap:6px;
        flex-wrap:wrap;
        margin-top:10px;
      }

      .coupon-suggestions button{
        border:1px dashed #b9b9b9;
        background:#fff;
        padding:5px 8px;
        border-radius:6px;
        font-size:9px;
        cursor:pointer;
      }

      .cart-footer{
        border-top:1px solid #eee;
        padding:15px 18px 20px;
        background:#fff;
      }

      .cart-saving{
        text-align:center;
        font-size:11px;
        color:#2d7e05;
        min-height:18px;
        margin-bottom:5px;
      }

      .cart-bill > div{
        display:flex;
        justify-content:space-between;
        padding:4px 0;
        font-size:12px;
      }

      .cart-grand-total{
        margin-top:7px;
        padding-top:10px !important;
        border-top:1px dashed #ddd;
        font-size:15px !important;
      }

      .checkout-btn{
        width:100%;
        margin-top:13px;
        padding:14px;
        border:0;
        border-radius:11px;
        background:#2d7e05;
        color:#fff;
        font-weight:bold;
        cursor:pointer;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:10px;
      }

      .checkout-btn:disabled{
        background:#ccc;
        cursor:not-allowed;
      }

      @media(max-width:575px){
        .cart-panel{
          width:100%;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }

  function openCart() {
    createCartDrawer();

    const drawer =
      $("#cartDrawer");

    drawer.classList.add(
      "open"
    );

    document.body.classList.add(
      "blinkit-lock"
    );

    updateCartUI();
  }

  function closeCart() {
    $("#cartDrawer")
      ?.classList.remove("open");

    document.body.classList.remove(
      "blinkit-lock"
    );
  }

  function renderCartItems() {
    const container =
      $("#cartItems");

    if (!container) return;

    if (!cart.length) {
      container.innerHTML = `
        <div class="cart-empty">

          <div class="cart-empty-icon">
            <i class="fa-solid fa-basket-shopping"></i>
          </div>

          <h3>
            Your cart is empty
          </h3>

          <p>
            Add some products and
            they'll appear here.
          </p>

        </div>
      `;

      return;
    }

    container.innerHTML =
      cart.map(item => `
        <div class="cart-item">

          <img
            class="cart-item-image"
            src="${escapeHTML(item.image)}"
            alt="${escapeHTML(item.name)}"
          >

          <div class="cart-item-main">

            <strong>
              ${escapeHTML(item.name)}
            </strong>

            <small>
              ${escapeHTML(item.quantity)}
            </small>

            <div class="cart-item-bottom">

              <span class="cart-item-price">
                ${money(
                  item.price *
                  item.qty
                )}
              </span>

              <div class="quantity-control">

                <button
                  data-minus="${escapeHTML(item.id)}"
                >
                  −
                </button>

                <span>
                  ${item.qty}
                </span>

                <button
                  data-plus="${escapeHTML(item.id)}"
                >
                  +
                </button>

              </div>

            </div>

            <button
              class="remove-cart-item"
              data-remove="${escapeHTML(item.id)}"
            >
              Remove
            </button>

          </div>

        </div>
      `).join("");

    $$("[data-minus]", container)
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            decreaseQuantity(
              button.dataset.minus
            );
          }
        );
      });

    $$("[data-plus]", container)
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            increaseQuantity(
              button.dataset.plus
            );
          }
        );
      });

    $$("[data-remove]", container)
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            removeFromCart(
              button.dataset.remove
            );
          }
        );
      });
  }

  function updateCartUI() {
    updateHeaderCart();

    if (!$("#cartDrawer")) {
      return;
    }

    renderCartItems();

    const subtotal =
      cartSubtotal();

    const delivery =
      getDeliveryFee(
        subtotal
      );

    const discount =
      getDiscount(
        subtotal
      );

    const total =
      getGrandTotal();

    $("#cartSubtotal").textContent =
      money(subtotal);

    $("#cartDelivery").textContent =
      delivery === 0 &&
      subtotal > 0
        ? "FREE"
        : money(delivery);

    $("#cartGrandTotal").textContent =
      money(total);

    const discountRow =
      $("#discountRow");

    if (discount > 0) {
      discountRow.style.display =
        "flex";

      $("#cartDiscount")
        .textContent =
        `-${money(discount)}`;
    } else {
      discountRow.style.display =
        "none";
    }

    const saving =
      $("#cartSaving");

    if (saving) {
      saving.textContent =
        subtotal > 0 &&
        subtotal < 199
          ? `Add ${money(
              199 - subtotal
            )} more for FREE delivery`
          : subtotal >= 199
            ? "🎉 You unlocked FREE delivery"
            : "";
    }

    const checkout =
      $("#checkoutBtn");

    if (checkout) {
      checkout.disabled =
        cart.length === 0;
    }

    const location =
      readJSON(
        STORAGE.LOCATION,
        null
      );

    if ($("#cartLocationText")) {
      $("#cartLocationText")
        .textContent =
        location?.address ||
        location?.city ||
        "Add delivery location";
    }
  }

  /* =========================================================
     8. ADD BUTTON ENGINE
     ========================================================= */

  function initializeAddButtons() {
    $$(".productItems")
      .forEach(card => {

        const button =
          $(".btn-price-outer button", card);

        if (!button) return;

        if (
          button.dataset.blinkitInitialized
        ) {
          return;
        }

        button.dataset.blinkitInitialized =
          "true";

        button.addEventListener(
          "click",
          event => {

            event.preventDefault();
            event.stopPropagation();

            const product =
              getProductData(card);

            addToCart(product);

            button.dataset.originalText =
              button.dataset.originalText ||
              button.textContent.trim();

            button.textContent =
              "ADDED ✓";

            setTimeout(() => {

              button.textContent =
                button.dataset.originalText ||
                "ADD";

            }, 900);
          }
        );
      });
  }

  /* =========================================================
     9. WISHLIST
     ========================================================= */

  function saveWishlist() {
    writeJSON(
      STORAGE.WISHLIST,
      wishlist
    );
  }

  function isWishlisted(product) {
    return wishlist.some(
      item =>
        item.id === product.id
    );
  }

  function toggleWishlist(
    product,
    card
  ) {
    if (!product) return;

    const exists =
      isWishlisted(product);

    if (exists) {

      wishlist =
        wishlist.filter(
          item =>
            item.id !== product.id
        );

      showToast(
        `${product.name} removed from wishlist`,
        "info"
      );

    } else {

      wishlist.push(product);

      showToast(
        `${product.name} saved`,
        "success",
        "Wishlist"
      );
    }

    saveWishlist();

    updateWishlistButtons();
  }

  function addWishlistButtons() {
    $$(".productItems")
      .forEach(card => {

        const product =
          getProductData(card);

        if (!product) return;

        if (
          $(".wishlist-button", card)
        ) {
          return;
        }

        card.style.position =
          "relative";

        const button =
          document.createElement(
            "button"
          );

        button.className =
          "wishlist-button";

        button.innerHTML = `
          <i class="fa-regular fa-heart"></i>
        `;

        button.setAttribute(
          "aria-label",
          "Add to wishlist"
        );

        button.style.cssText = `
          position:absolute;
          top:9px;
          right:9px;
          width:30px;
          height:30px;
          border:0;
          border-radius:50%;
          background:#fff;
          box-shadow:0 3px 12px rgba(0,0,0,.08);
          color:#777;
          z-index:3;
          cursor:pointer;
        `;

        button.addEventListener(
          "click",
          event => {

            event.preventDefault();
            event.stopPropagation();

            toggleWishlist(
              product,
              card
            );
          }
        );

        card.appendChild(button);
      });

    updateWishlistButtons();
  }

  function updateWishlistButtons() {
    $$(".productItems")
      .forEach(card => {

        const product =
          getProductData(card);

        const button =
          $(".wishlist-button", card);

        if (!product || !button) {
          return;
        }

        const active =
          isWishlisted(product);

        button.classList.toggle(
          "wishlist-active",
          active
        );

        button.innerHTML = `
          <i class="fa-${
            active
              ? "solid"
              : "regular"
          } fa-heart"></i>
        `;
      });
  }

  /* =========================================================
     10. RECENTLY VIEWED
     ========================================================= */

  function saveRecentlyViewed(
    product
  ) {
    recentlyViewed =
      recentlyViewed.filter(
        item =>
          item.id !== product.id
      );

    recentlyViewed.unshift(
      product
    );

    recentlyViewed =
      recentlyViewed.slice(0, 8);

    writeJSON(
      STORAGE.RECENT,
      recentlyViewed
    );
  }

  function initializeProductCards() {
    $$(".productItems")
      .forEach(card => {

        card.addEventListener(
          "click",
          event => {

            if (
              event.target.closest(
                "button"
              ) ||
              event.target.closest("a")
            ) {
              return;
            }

            const product =
              getProductData(card);

            if (!product) return;

            saveRecentlyViewed(
              product
            );

            card.classList.add(
              "blinkit-product-highlight"
            );

            setTimeout(() => {

              card.classList.remove(
                "blinkit-product-highlight"
              );

            }, 1200);
          }
        );

        card.addEventListener(
          "dblclick",
          event => {

            event.preventDefault();

            const product =
              getProductData(card);

            addToCart(product);
          }
        );
      });
  }

  /* =========================================================
     11. SEARCH ENGINE
     ========================================================= */

  function createSearchUI() {
    const searchBox =
      $(".searchBox");

    if (!searchBox) return;

    searchBox.style.position =
      "relative";

    if (!$("#searchSuggestions")) {

      const suggestions =
        document.createElement(
          "div"
        );

      suggestions.id =
        "searchSuggestions";

      suggestions.style.cssText = `
        position:absolute;
        top:calc(100% + 7px);
        left:0;
        right:0;
        background:#fff;
        border:1px solid #eee;
        border-radius:12px;
        box-shadow:0 15px 40px rgba(0,0,0,.12);
        overflow:hidden;
        display:none;
        z-index:9999;
        max-height:330px;
        overflow-y:auto;
      `;

      searchBox.appendChild(
        suggestions
      );
    }
  }

  function renderSearchSuggestions(
    query
  ) {
    const suggestions =
      $("#searchSuggestions");

    if (!suggestions) return;

    const term =
      query
        .trim()
        .toLowerCase();

    if (!term) {

      suggestions.style.display =
        "none";

      return;
    }

    const products =
      getAllProducts();

    const matches =
      products
        .filter(product =>
          `${product.name} ${product.quantity}`
            .toLowerCase()
            .includes(term)
        )
        .slice(0, 7);

    if (!matches.length) {

      suggestions.innerHTML = `
        <div style="
          padding:15px;
          font-size:12px;
          color:#777;
        ">
          No products found
        </div>
      `;

      suggestions.style.display =
        "block";

      return;
    }

    suggestions.innerHTML =
      matches.map(product => `
        <button
          type="button"
          data-search-product="${escapeHTML(product.id)}"
          style="
            width:100%;
            display:flex;
            align-items:center;
            gap:10px;
            padding:10px 12px;
            background:#fff;
            border:0;
            border-bottom:1px solid #f3f3f3;
            text-align:left;
            cursor:pointer;
          "
        >

          <img
            src="${escapeHTML(product.image)}"
            style="
              width:42px;
              height:42px;
              object-fit:contain;
            "
            alt=""
          >

          <span style="
            display:flex;
            flex-direction:column;
            gap:3px;
          ">

            <strong style="
              font-size:12px;
              color:#222
            ">
              ${escapeHTML(product.name)}
            </strong>

            <small style="
              font-size:10px;
              color:#777
            ">
              ${escapeHTML(product.quantity)}
              · ${money(product.price)}
            </small>

          </span>

        </button>
      `).join("");

    suggestions.style.display =
      "block";

    $$(
      "[data-search-product]",
      suggestions
    ).forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.searchProduct;

          const card =
            $$(".productItems")
              .find(productCard =>
                getProductData(
                  productCard
                )?.id === id
              );

          if (card) {

            const product =
              getProductData(card);

            $("#searchInput").value =
              product.name;

            performSearch(
              product.name
            );

            card.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });

            card.classList.add(
              "blinkit-product-highlight"
            );

            setTimeout(() => {

              card.classList.remove(
                "blinkit-product-highlight"
              );

            }, 1300);
          }

          suggestions.style.display =
            "none";
        }
      );
    });
  }

  function performSearch(query) {
    const term =
      query
        .trim()
        .toLowerCase();

    const sections =
      $$(".productSection");

    let visibleCount = 0;

    sections.forEach(section => {

      const cards =
        $$(".productItems", section);

      let sectionMatches = 0;

      cards.forEach(card => {

        const product =
          getProductData(card);

        if (!product) return;

        const searchable = `
          ${product.name}
          ${product.quantity}
        `.toLowerCase();

        const match =
          !term ||
          searchable.includes(term);

        card.style.display =
          match
            ? ""
            : "none";

        if (match) {

          sectionMatches++;
          visibleCount++;
        }
      });

      section.style.display =
        sectionMatches > 0
          ? ""
          : "none";
    });

    updateSearchMessage(
      term,
      visibleCount
    );
  }

  function updateSearchMessage(
    query,
    count
  ) {
    let message =
      $("#searchResultMessage");

    if (!message) {

      message =
        document.createElement(
          "div"
        );

      message.id =
        "searchResultMessage";

      message.style.cssText = `
        max-width:1280px;
        margin:14px auto;
        padding:0 15px;
        font-size:13px;
        color:#666;
      `;

      const banner =
        $(".bannerSection");

      if (banner) {

        banner.insertAdjacentElement(
          "afterend",
          message
        );

      } else {

        document.body.prepend(
          message
        );
      }
    }

    if (!query) {

      message.textContent =
        "";

      return;
    }

    message.textContent =
      count > 0
        ? `${count} product${
            count > 1
              ? "s"
              : ""
          } found for "${query}"`
        : `No products found for "${query}"`;
  }

  function initializeSearch() {
    createSearchUI();

    const input =
      $(".searchBox input") ||
      $("#searchInput");

    if (!input) return;

    input.id =
      "searchInput";

    input.placeholder =
      "Search for products...";

    const liveSearch =
      debounce(
        value => {
          renderSearchSuggestions(
            value
          );
        },
        180
      );

    input.addEventListener(
      "input",
      event => {

        const value =
          event.target.value;

        liveSearch(value);

        performSearch(value);
      }
    );

    input.addEventListener(
      "focus",
      () => {

        if (input.value.trim()) {

          renderSearchSuggestions(
            input.value
          );
        }
      }
    );

    input.addEventListener(
      "keydown",
      event => {

        if (event.key === "Escape") {

          input.value = "";

          performSearch("");

          if (
            $("#searchSuggestions")
          ) {
            $("#searchSuggestions")
              .style.display =
              "none";
          }

          input.blur();
        }
      }
    );

    document.addEventListener(
      "click",
      event => {

        if (
          !event.target.closest(
            ".searchBox"
          )
        ) {

          if (
            $("#searchSuggestions")
          ) {
            $("#searchSuggestions")
              .style.display =
              "none";
          }
        }
      }
    );

    const form =
      $(".searchBox");

    if (
      form &&
      form.tagName === "FORM"
    ) {

      form.addEventListener(
        "submit",
        event => {

          event.preventDefault();

          const value =
            input.value.trim();

          if (!value) {

            showToast(
              "Type a product name to search",
              "info"
            );

            return;
          }

          performSearch(value);

          const firstVisible =
            $$(".productItems")
              .find(card =>
                card.style.display !==
                "none"
              );

          firstVisible?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });

          if (
            $("#searchSuggestions")
          ) {
            $("#searchSuggestions")
              .style.display =
              "none";
          }
        }
      );
    }
  }

  /* =========================================================
     12. SEE ALL
     ========================================================= */

  function initializeSeeAll() {
    $$(".headingRow a, .seeall a")
      .forEach(link => {

        link.addEventListener(
          "click",
          event => {

            event.preventDefault();

            const section =
              link.closest(
                ".productSection"
              );

            if (!section) return;

            $$(".productItems", section)
              .forEach(card => {
                card.style.display =
                  "";
              });

            section.style.display =
              "";

            section.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

            showToast(
              "Showing all products",
              "info"
            );
          }
        );
      });
  }

  /* =========================================================
     13. PROFESSIONAL ACCOUNT PROFILE
     ========================================================= */

  function getAccount() {
    try {
      return JSON.parse(
        localStorage.getItem(
          ACCOUNT_KEY
        )
      ) || null;
    } catch {
      return null;
    }
  }

  function saveAccount(account) {
    localStorage.setItem(
      ACCOUNT_KEY,
      JSON.stringify(account)
    );
  }

  /* =========================================================
     CREATE NAME FIELD
     ========================================================= */

  function ensureNameField() {
    const loginForm =
      $("#loginForm");

    const mobileInput =
      $("#mobile");

    if (
      !loginForm ||
      !mobileInput
    ) {
      return;
    }

    if (
      $("#userName")
    ) {
      return;
    }

    const mobileGroup =
      mobileInput.closest(
        ".input-group"
      );

    if (!mobileGroup) {
      return;
    }

    const nameBox =
      document.createElement(
        "div"
      );

    nameBox.className =
      "input-group blinkit-name-group";

    nameBox.innerHTML = `
      <span>
        <i class="fa-solid fa-user"></i>
      </span>

      <input
        type="text"
        id="userName"
        placeholder="Enter your name"
        autocomplete="name"
        maxlength="40"
      >
    `;

    mobileGroup.insertAdjacentElement(
      "beforebegin",
      nameBox
    );
  }

  /* =========================================================
     PROFILE HTML
     ========================================================= */

  function createProfileModal() {
    if (
      $("#blinkitProfileOverlay")
    ) {
      return;
    }

    const profileHTML = `
      <div
        class="blinkit-profile-overlay"
        id="blinkitProfileOverlay"
      >

        <div class="blinkit-profile-modal">

          <button
            class="blinkit-profile-close"
            id="blinkitProfileClose"
            aria-label="Close profile"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>

          <!-- PROFILE HEADER -->

          <div class="blinkit-profile-header">

            <div
              class="blinkit-profile-avatar"
              id="blinkitProfileAvatar"
            >
              A
            </div>

            <div class="blinkit-profile-user">

              <div class="blinkit-profile-name">

                <h2 id="blinkitProfileName">
                  Blinkit User
                </h2>

                <span>
                  <i class="fa-solid fa-check"></i>
                </span>

              </div>

              <p id="blinkitProfileMobile">
                +91 0000000000
              </p>

              <small>
                <i class="fa-solid fa-circle"></i>
                Active Account
              </small>

            </div>

          </div>

          <!-- STATS -->

          <div class="blinkit-profile-stats">

            <div>

              <i class="fa-solid fa-bag-shopping"></i>

              <span>
                Orders
              </span>

              <strong
                id="blinkitProfileOrders"
              >
                0
              </strong>

            </div>

            <div>

              <i class="fa-solid fa-cart-shopping"></i>

              <span>
                Cart
              </span>

              <strong
                id="blinkitProfileCart"
              >
                0
              </strong>

            </div>

            <div>

              <i class="fa-solid fa-heart"></i>

              <span>
                Wishlist
              </span>

              <strong
                id="blinkitProfileWishlist"
              >
                0
              </strong>

            </div>

          </div>

          <!-- INFORMATION -->

          <div class="blinkit-profile-body">

            <div class="blinkit-profile-row">

              <div>
                <i class="fa-solid fa-user"></i>
                <span>Full Name</span>
              </div>

              <strong id="blinkitFullName">
                User
              </strong>

            </div>

            <div class="blinkit-profile-row">

              <div>
                <i class="fa-solid fa-mobile-screen"></i>
                <span>Mobile Number</span>
              </div>

              <strong id="blinkitFullMobile">
                +91 0000000000
              </strong>

            </div>

            <div class="blinkit-profile-row">

              <div>
                <i class="fa-solid fa-calendar"></i>
                <span>Member Since</span>
              </div>

              <strong id="blinkitJoined">
                Today
              </strong>

            </div>

            <div class="blinkit-profile-row">

              <div>
                <i class="fa-solid fa-shield-halved"></i>
                <span>Account Status</span>
              </div>

              <strong class="blinkit-verified">
                Verified
              </strong>

            </div>

          </div>

          <!-- LOCATION -->

          <div class="blinkit-profile-location">

            <div class="blinkit-location-icon">
              <i class="fa-solid fa-location-dot"></i>
            </div>

            <div>

              <small>
                Delivery Location
              </small>

              <p id="blinkitProfileLocation">
                Location not set
              </p>

            </div>

            <button
              id="blinkitChangeLocation"
            >
              Change
            </button>

          </div>

          <!-- ACTIONS -->

          <div class="blinkit-profile-actions">

            <button
              class="blinkit-settings-btn"
              id="blinkitAccountSettings"
            >
              <i class="fa-solid fa-gear"></i>
              Account Settings
            </button>

            <button
              class="blinkit-logout-btn"
              id="blinkitLogout"
            >
              <i class="fa-solid fa-right-from-bracket"></i>
              Logout
            </button>

          </div>

        </div>

      </div>
    `;

    document.body.insertAdjacentHTML(
      "beforeend",
      profileHTML
    );
  }

  /* =========================================================
     PROFILE CSS
     ========================================================= */

  function createProfileStyles() {
    if (
      $("#blinkitProfileCSS")
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "blinkitProfileCSS";

    style.textContent = `
      .blinkit-name-group{
        margin-bottom:15px;
      }

      .blinkit-name-group span{
        background:#eee;
        padding:10px;
        color:#555;
        display:flex;
        align-items:center;
        justify-content:center;
      }

      .blinkit-name-group input{
        flex:1;
        padding:10px;
        border:none;
        outline:none;
      }

      /* PROFILE OVERLAY */

      .blinkit-profile-overlay{
        position:fixed;
        inset:0;
        z-index:999999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        background:rgba(0,0,0,.58);
        backdrop-filter:blur(9px);
        opacity:0;
        visibility:hidden;
        transition:.3s ease;
      }

      .blinkit-profile-overlay.active{
        opacity:1;
        visibility:visible;
      }

      /* MODAL */

      .blinkit-profile-modal{
        width:100%;
        max-width:440px;
        background:#fff;
        border-radius:24px;
        overflow:hidden;
        box-shadow:
          0 30px 80px rgba(0,0,0,.3);
        transform:
          scale(.92)
          translateY(20px);
        transition:
          .35s cubic-bezier(.2,.8,.2,1);
        position:relative;
      }

      .blinkit-profile-overlay.active
      .blinkit-profile-modal{
        transform:
          scale(1)
          translateY(0);
      }

      /* CLOSE */

      .blinkit-profile-close{
        position:absolute;
        top:15px;
        right:15px;
        width:36px;
        height:36px;
        border:none;
        border-radius:50%;
        background:#fff;
        box-shadow:
          0 3px 12px rgba(0,0,0,.1);
        font-size:16px;
        z-index:5;
        transition:.25s;
        cursor:pointer;
      }

      .blinkit-profile-close:hover{
        transform:rotate(90deg);
        background:#f5f5f5;
      }

      /* HEADER */

      .blinkit-profile-header{
        display:flex;
        align-items:center;
        gap:17px;
        padding:32px 25px 25px;
        background:
          linear-gradient(
            135deg,
            #f5fff2,
            #fff
          );
        border-bottom:1px solid #eee;
      }

      .blinkit-profile-avatar{
        width:72px;
        height:72px;
        flex-shrink:0;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        background:
          linear-gradient(
            135deg,
            #2d7e05,
            #67a928
          );
        color:#fff;
        font-size:29px;
        font-weight:800;
        border:4px solid #fff;
        box-shadow:
          0 8px 22px rgba(45,126,5,.25);
      }

      .blinkit-profile-user{
        min-width:0;
      }

      .blinkit-profile-name{
        display:flex;
        align-items:center;
        gap:6px;
      }

      .blinkit-profile-name h2{
        margin:0;
        font-size:22px;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      .blinkit-profile-name span{
        width:17px;
        height:17px;
        flex-shrink:0;
        border-radius:50%;
        background:#2878f0;
        color:#fff;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:8px;
      }

      .blinkit-profile-user p{
        margin:5px 0;
        font-size:13px;
        color:#666;
      }

      .blinkit-profile-user small{
        color:#2d7e05;
        font-size:10px;
        font-weight:700;
      }

      .blinkit-profile-user small i{
        font-size:6px;
      }

      /* STATS */

      .blinkit-profile-stats{
        display:grid;
        grid-template-columns:
          repeat(3,1fr);
        gap:10px;
        padding:18px 22px;
      }

      .blinkit-profile-stats div{
        padding:12px 5px;
        text-align:center;
        border:1px solid #eee;
        border-radius:13px;
        background:#fff;
      }

      .blinkit-profile-stats i{
        display:block;
        color:#2d7e05;
        margin-bottom:5px;
      }

      .blinkit-profile-stats span{
        display:block;
        color:#888;
        font-size:10px;
      }

      .blinkit-profile-stats strong{
        display:block;
        margin-top:2px;
        font-size:15px;
      }

      /* BODY */

      .blinkit-profile-body{
        padding:0 22px;
      }

      .blinkit-profile-row{
        min-height:43px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        border-bottom:1px solid #f0f0f0;
        gap:12px;
      }

      .blinkit-profile-row div{
        display:flex;
        align-items:center;
        gap:9px;
        color:#777;
        font-size:12px;
        min-width:0;
      }

      .blinkit-profile-row div i{
        width:17px;
        flex-shrink:0;
      }

      .blinkit-profile-row strong{
        max-width:190px;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        font-size:12px;
        color:#222;
      }

      .blinkit-verified{
        color:#2d7e05 !important;
      }

      /* LOCATION */

      .blinkit-profile-location{
        margin:18px 22px;
        padding:13px;
        border-radius:14px;
        background:#f7f7f7;
        display:flex;
        align-items:center;
        gap:10px;
      }

      .blinkit-location-icon{
        width:38px;
        height:38px;
        flex-shrink:0;
        border-radius:11px;
        background:#fff;
        display:flex;
        align-items:center;
        justify-content:center;
        color:#2d7e05;
      }

      .blinkit-profile-location div:nth-child(2){
        min-width:0;
        flex:1;
      }

      .blinkit-profile-location small{
        display:block;
        font-size:10px;
        color:#888;
      }

      .blinkit-profile-location p{
        margin:3px 0 0;
        font-size:11px;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      .blinkit-profile-location button{
        border:none;
        background:#fff;
        color:#2d7e05;
        font-size:11px;
        font-weight:bold;
        padding:7px 10px;
        border-radius:7px;
        cursor:pointer;
      }

      /* ACTIONS */

      .blinkit-profile-actions{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
        padding:0 22px 22px;
      }

      .blinkit-profile-actions button{
        height:43px;
        border-radius:11px;
        font-weight:700;
        font-size:11px;
        transition:.2s;
        cursor:pointer;
      }

      .blinkit-settings-btn{
        border:1px solid #ddd;
        background:#f7f7f7;
        color:#222;
      }

      .blinkit-logout-btn{
        border:1px solid #ffd7d4;
        background:#fff3f2;
        color:#d93025;
      }

      .blinkit-profile-actions button:hover{
        transform:translateY(-1px);
      }

      @media(max-width:575px){

        .blinkit-profile-overlay{
          align-items:flex-end;
          padding:10px;
        }

        .blinkit-profile-modal{
          max-height:92vh;
          overflow-y:auto;
          border-radius:
            22px 22px 14px 14px;
        }

        .blinkit-profile-header{
          padding:25px 18px 20px;
        }

        .blinkit-profile-avatar{
          width:62px;
          height:62px;
          font-size:24px;
        }

        .blinkit-profile-name h2{
          font-size:19px;
        }

        .blinkit-profile-stats{
          padding:14px;
        }

        .blinkit-profile-body{
          padding:0 15px;
        }

        .blinkit-profile-location{
          margin:15px;
        }

        .blinkit-profile-actions{
          padding:0 15px 18px;
        }

        .blinkit-profile-row strong{
          max-width:145px;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }

  /* =========================================================
     14. LOGIN SYSTEM
     ========================================================= */

  function initializeLogin() {
    const overlay =
      $("#loginOverlay");

    const openButton =
      $("#openLogin");

    const closeButton =
      $("#closeOverlay");

    const form =
      $("#loginForm");

    const mobile =
      $("#mobile");

    const name =
      $("#userName");

    const continueBtn =
      $("#continueBtn");

    if (!overlay) return;

    /*
     * Make sure dynamically restored
     * login form has the name field.
     */
    ensureNameField();

    const finalName =
      $("#userName");

    const finalMobile =
      $("#mobile");

    const finalButton =
      $("#continueBtn");

    openButton?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        const loggedIn =
          localStorage.getItem(
            STORAGE.LOGGED
          ) === "true";

        const account =
          getAccount();

        if (
          loggedIn &&
          account
        ) {
          openBlinkitProfile();
          return;
        }

        overlay.style.display =
          "block";

        document.body.classList.add(
          "blinkit-lock"
        );

        setTimeout(() => {
          $("#userName")?.focus();
        }, 100);
      }
    );

    closeButton?.addEventListener(
      "click",
      closeLogin
    );

    overlay.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          overlay
        ) {
          closeLogin();
        }
      }
    );

    function validateLogin() {

      const nameValue =
        finalName?.value.trim() ||
        "";

      const mobileValue =
        finalMobile?.value.trim() ||
        "";

      const validName =
        nameValue.length >= 2 &&
        /^[A-Za-z\s.'-]+$/.test(
          nameValue
        );

      const validMobile =
        /^[6-9]\d{9}$/.test(
          mobileValue
        );

      const valid =
        validName &&
        validMobile;

      if (finalButton) {

        finalButton.disabled =
          !valid;

        finalButton.classList.toggle(
          "active",
          valid
        );
      }
    }

    finalName?.addEventListener(
      "input",
      () => {

        finalName.value =
          finalName.value
            .replace(
              /[^A-Za-z\s.'-]/g,
              ""
            )
            .slice(0, 40);

        validateLogin();
      }
    );

    finalMobile?.addEventListener(
      "input",
      () => {

        finalMobile.value =
          finalMobile.value
            .replace(/\D/g, "")
            .slice(0, 10);

        validateLogin();
      }
    );

    form?.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        const nameValue =
          $("#userName")
            ?.value
            .trim() ||
          "";

        const mobileValue =
          $("#mobile")
            ?.value
            .trim() ||
          "";

        if (
          nameValue.length < 2 ||
          !/^[A-Za-z\s.'-]+$/.test(
            nameValue
          )
        ) {

          showToast(
            "Please enter your name",
            "error"
          );

          $("#userName")?.focus();

          return;
        }

        if (
          !/^[6-9]\d{9}$/.test(
            mobileValue
          )
        ) {

          showToast(
            "Enter a valid 10-digit mobile number",
            "error"
          );

          $("#mobile")?.focus();

          return;
        }

        /*
         * Save temporary details
         * before OTP screen.
         */
        sessionStorage.setItem(
          "blinkitPendingName",
          nameValue
        );

        sessionStorage.setItem(
          "blinkitPendingMobile",
          mobileValue
        );

        generateOTP(
          mobileValue
        );
      }
    );

    /*
     * Initial state.
     */
    validateLogin();
  }

  /* =========================================================
     GENERATE OTP
     ========================================================= */

  function generateOTP(
    mobile
  ) {
    generatedOTP =
      String(
        Math.floor(
          1000 +
          Math.random() *
          9000
        )
      );

    sessionStorage.setItem(
      STORAGE.OTP,
      generatedOTP
    );

    sessionStorage.setItem(
      "blinkitOTPTime",
      String(Date.now())
    );

    showOTPBox(
      mobile
    );

    showToast(
      `Demo OTP: ${generatedOTP}`,
      "info",
      "Verification code"
    );

    startOTPCountdown();
  }

  /* =========================================================
     OTP SCREEN
     ========================================================= */

  function showOTPBox(
    mobile
  ) {
    const overlayContent =
      $(".overlay-content");

    if (!overlayContent) return;

    overlayContent.innerHTML = `
      <button
        type="button"
        id="otpBack"
        style="
          float:left;
          border:0;
          background:none;
          font-size:18px;
          cursor:pointer;
        "
      >
        <i class="fa-solid fa-arrow-left"></i>
      </button>

      <span
        id="otpClose"
        class="close"
      >
        &times;
      </span>

      <div style="clear:both"></div>

      <div class="logo">
        blinkit
      </div>

      <div class="tagline">
        India’s last minute app
      </div>

      <div class="heading">
        Verify your number
      </div>

      <p style="
        font-size:12px;
        color:#777;
        margin-bottom:18px;
      ">
        Enter the 4-digit OTP sent to
        <strong>
          +91 ${escapeHTML(mobile)}
        </strong>
      </p>

      <form id="otpForm">

        <input
          id="otpInput"
          type="text"
          inputmode="numeric"
          maxlength="4"
          autocomplete="one-time-code"
          placeholder="Enter OTP"
          style="
            width:100%;
            padding:13px;
            border:1px solid #ccc;
            border-radius:8px;
            text-align:center;
            letter-spacing:8px;
            font-size:18px;
            outline:none;
          "
        >

        <button
          class="btn active"
          type="submit"
          style="margin-top:12px"
        >
          Verify & Continue
        </button>

      </form>

      <button
        id="resendOTP"
        type="button"
        style="
          margin-top:15px;
          border:0;
          background:none;
          color:#2e7d32;
          font-size:12px;
          cursor:pointer;
        "
      >
        Resend OTP
      </button>

      <div
        id="otpTimer"
        style="
          font-size:11px;
          color:#888;
          margin-top:6px;
        "
      ></div>
    `;

    $("#otpInput")
      ?.addEventListener(
        "input",
        event => {

          event.target.value =
            event.target.value
              .replace(/\D/g, "")
              .slice(0, 4);
        }
      );

    $("#otpClose")
      ?.addEventListener(
        "click",
        closeLogin
      );

    $("#otpBack")
      ?.addEventListener(
        "click",
        restoreLoginForm
      );

    $("#otpForm")
      ?.addEventListener(
        "submit",
        event => {

          event.preventDefault();

          verifyOTP(
            mobile,
            $("#otpInput")
              ?.value
              .trim()
          );
        }
      );

    $("#resendOTP")
      ?.addEventListener(
        "click",
        () => {

          if (
            resendSeconds > 0
          ) {

            showToast(
              `Wait ${resendSeconds}s before requesting another OTP`,
              "info"
            );

            return;
          }

          generateOTP(
            mobile
          );
        }
      );

    $("#otpInput")
      ?.focus();
  }

  /* =========================================================
     OTP TIMER
     ========================================================= */

  function startOTPCountdown() {

    clearInterval(
      otpTimer
    );

    resendSeconds = 30;

    const timer =
      $("#otpTimer");

    const resend =
      $("#resendOTP");

    if (timer) {
      timer.textContent =
        `Resend available in ${resendSeconds}s`;
    }

    if (resend) {
      resend.style.opacity =
        ".5";
    }

    otpTimer =
      setInterval(
        () => {

          resendSeconds--;

          const currentTimer =
            $("#otpTimer");

          const currentResend =
            $("#resendOTP");

          if (currentTimer) {

            currentTimer.textContent =
              resendSeconds > 0
                ? `Resend available in ${resendSeconds}s`
                : "You can resend the OTP now";
          }

          if (
            currentResend
          ) {

            currentResend.style.opacity =
              resendSeconds > 0
                ? ".5"
                : "1";
          }

          if (
            resendSeconds <= 0
          ) {

            clearInterval(
              otpTimer
            );
          }

        },
        1000
      );
  }

  /* =========================================================
     VERIFY OTP
     
     IMPORTANT:
     Account saving happens AFTER OTP is correct.
     It never blocks OTP verification.
     ========================================================= */

  function verifyOTP(
    mobile,
    enteredOTP
  ) {
    const savedOTP =
      sessionStorage.getItem(
        STORAGE.OTP
      );

    if (
      !/^\d{4}$/.test(
        enteredOTP
      )
    ) {

      showToast(
        "Enter the 4-digit OTP",
        "error"
      );

      return;
    }

    if (!savedOTP) {

      showToast(
        "OTP expired. Please request a new OTP.",
        "error"
      );

      return;
    }

    if (
      enteredOTP !== savedOTP
    ) {

      showToast(
        "Incorrect OTP",
        "error"
      );

      return;
    }

    /* =====================================================
       OTP VERIFIED
    ===================================================== */

    const pendingName =
      sessionStorage.getItem(
        "blinkitPendingName"
      ) ||
      "Blinkit User";

    const oldAccount =
      getAccount();

    const now =
      new Date().toISOString();

    const account = {
      name:
        pendingName,

      mobile:
        mobile,

      createdAt:
        oldAccount?.createdAt ||
        now,

      lastLogin:
        now
    };

    /*
     * PROFESSIONAL ACCOUNT
     */
    saveAccount(
      account
    );

    /*
     * MAIN LOGIN STATE
     */
    localStorage.setItem(
      STORAGE.LOGGED,
      "true"
    );

    localStorage.setItem(
      STORAGE.MOBILE,
      mobile
    );

    writeJSON(
      STORAGE.USER,
      {
        name:
          pendingName,

        mobile:
          mobile,

        loginTime:
          now
      }
    );

    /*
     * SESSION CLEANUP
     */
    sessionStorage.removeItem(
      STORAGE.OTP
    );

    sessionStorage.removeItem(
      "blinkitOTPTime"
    );

    sessionStorage.removeItem(
      "blinkitPendingName"
    );

    sessionStorage.removeItem(
      "blinkitPendingMobile"
    );

    clearInterval(
      otpTimer
    );

    /*
     * SUCCESS
     */
    closeLogin();

    updateLoginButton();

    showToast(
      `Welcome ${pendingName}!`,
      "success",
      "Login successful"
    );

    vibrate(
      [30, 50, 30]
    );
  }

  /* =========================================================
     RESTORE LOGIN FORM
     ========================================================= */

  function restoreLoginForm() {
    const overlayContent =
      $(".overlay-content");

    if (!overlayContent) {
      return;
    }

    overlayContent.innerHTML = `
      <span
        id="closeOverlay"
        class="close"
      >
        &times;
      </span>

      <div class="logo">
        blinkit
      </div>

      <div class="tagline">
        India’s last minute app
      </div>

      <div class="heading">
        Log in or Sign up
      </div>

      <form id="loginForm">

        <!-- NAME -->

        <div class="input-group blinkit-name-group">

          <span>
            <i class="fa-solid fa-user"></i>
          </span>

          <input
            type="text"
            id="userName"
            placeholder="Enter your name"
            autocomplete="name"
            maxlength="40"
          >

        </div>

        <!-- MOBILE -->

        <div class="input-group">

          <span>
            +91
          </span>

          <input
            id="mobile"
            type="tel"
            maxlength="10"
            placeholder="Enter mobile number"
            autocomplete="tel"
          >

        </div>

        <button
          type="submit"
          class="btn"
          id="continueBtn"
          disabled
        >
          Continue
        </button>

      </form>

      <div class="terms">

        By continuing, you agree to our
        <a href="#">
          Terms
        </a>,

        <a href="#">
          Privacy Policy
        </a>

        and

        <a href="#">
          Conditions
        </a>.

      </div>
    `;

    initializeLogin();

    $("#userName")
      ?.focus();
  }

  function closeLogin() {
    const overlay =
      $("#loginOverlay");

    if (!overlay) return;

    overlay.style.display =
      "none";

    document.body.classList.remove(
      "blinkit-lock"
    );

    clearInterval(
      otpTimer
    );
  }

  /* =========================================================
     LOGIN BUTTON
     ========================================================= */

  function updateLoginButton() {
    const button =
      $("#openLogin");

    if (!button) return;

    const loggedIn =
      localStorage.getItem(
        STORAGE.LOGGED
      ) === "true";

    const account =
      getAccount();

    if (
      loggedIn &&
      account
    ) {

      const firstName =
        account.name
          ?.trim()
          ?.split(/\s+/)[0] ||
        "Account";

      button.innerHTML = `
        <i class="fa-solid fa-user"></i>
        ${escapeHTML(firstName)}
      `;

    } else {

      button.innerHTML = `
        <i class="fa-solid fa-user"></i>
        Login
      `;
    }
  }

  /* =========================================================
     PROFESSIONAL ACCOUNT PROFILE
     ========================================================= */

  function openBlinkitProfile() {

    const account =
      getAccount();

    if (!account) {

      showToast(
        "Please login first",
        "error"
      );

      return;
    }

    createProfileModal();

    const overlay =
      $("#blinkitProfileOverlay");

    if (!overlay) return;

    const name =
      account.name ||
      "Blinkit User";

    const mobile =
      account.mobile ||
      "";

    /*
     * BASIC DETAILS
     */

    $("#blinkitProfileName")
      .textContent =
      name;

    $("#blinkitFullName")
      .textContent =
      name;

    $("#blinkitProfileMobile")
      .textContent =
      "+91 " + mobile;

    $("#blinkitFullMobile")
      .textContent =
      "+91 " + mobile;

    /*
     * AVATAR
     */

    $("#blinkitProfileAvatar")
      .textContent =
      name
        .charAt(0)
        .toUpperCase();

    /*
     * ORDERS
     */

    const storedOrders =
      readJSON(
        STORAGE.ORDERS,
        []
      );

    $("#blinkitProfileOrders")
      .textContent =
      Array.isArray(
        storedOrders
      )
        ? storedOrders.length
        : 0;

    /*
     * CART
     */

    const storedCart =
      readJSON(
        STORAGE.CART,
        []
      );

    const storedCartCount =
      Array.isArray(
        storedCart
      )
        ? storedCart.reduce(
            (sum, item) =>
              sum +
              Number(
                item.qty || 1
              ),
            0
          )
        : 0;

    $("#blinkitProfileCart")
      .textContent =
      storedCartCount;

    /*
     * WISHLIST
     */

    const storedWishlist =
      readJSON(
        STORAGE.WISHLIST,
        []
      );

    $("#blinkitProfileWishlist")
      .textContent =
      Array.isArray(
        storedWishlist
      )
        ? storedWishlist.length
        : 0;

    /*
     * MEMBER SINCE
     */

    const joined =
      $("#blinkitJoined");

    if (
      joined &&
      account.createdAt
    ) {

      const date =
        new Date(
          account.createdAt
        );

      if (
        !Number.isNaN(
          date.getTime()
        )
      ) {

        joined.textContent =
          date.toLocaleDateString(
            "en-IN",
            {
              day:
                "2-digit",

              month:
                "short",

              year:
                "numeric"
            }
          );
      }
    }

    /*
     * LOCATION
     */

    const savedLocation =
      readJSON(
        STORAGE.LOCATION,
        null
      );

    $("#blinkitProfileLocation")
      .textContent =
      savedLocation?.address ||
      savedLocation?.city ||
      "Location not set";

    /*
     * OPEN
     */

    overlay.classList.add(
      "active"
    );

    document.body.style.overflow =
      "hidden";
  }

  function closeBlinkitProfile() {

    const overlay =
      $("#blinkitProfileOverlay");

    overlay?.classList.remove(
      "active"
    );

    document.body.style.overflow =
      "";
  }

  /* =========================================================
     ACCOUNT SAVE FUNCTION
     
     This function is safe to call.
     It DOES NOT block OTP verification.
     ========================================================= */

  window.blinkitSaveAccount =
    function () {

      const name =
        $("#userName")
          ?.value
          ?.trim() ||

        sessionStorage.getItem(
          "blinkitPendingName"
        ) ||

        getAccount()?.name ||

        "Blinkit User";

      const mobile =
        $("#mobile")
          ?.value
          ?.trim() ||

        sessionStorage.getItem(
          "blinkitPendingMobile"
        ) ||

        localStorage.getItem(
          STORAGE.MOBILE
        ) ||

        "";

      if (
        !/^[6-9]\d{9}$/.test(
          mobile
        )
      ) {
        return false;
      }

      const oldAccount =
        getAccount();

      const now =
        new Date().toISOString();

      saveAccount({
        name,
        mobile,

        createdAt:
          oldAccount?.createdAt ||
          now,

        lastLogin:
          now
      });

      return true;
    };

  /* =========================================================
     PROFILE EVENTS
     ========================================================= */

  function initializeProfileEvents() {

    $("#blinkitProfileClose")
      ?.addEventListener(
        "click",
        closeBlinkitProfile
      );

    $("#blinkitProfileOverlay")
      ?.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            event.currentTarget
          ) {
            closeBlinkitProfile();
          }
        }
      );

    $("#blinkitChangeLocation")
      ?.addEventListener(
        "click",
        () => {

          closeBlinkitProfile();

          setTimeout(() => {
            detectLocation();
          }, 200);
        }
      );

    $("#blinkitAccountSettings")
      ?.addEventListener(
        "click",
        () => {

          showToast(
            "Account settings are coming soon",
            "info",
            "Settings"
          );
        }
      );

    $("#blinkitLogout")
      ?.addEventListener(
        "click",
        logoutAccount
      );
  }

  /* =========================================================
     ACCOUNT BUTTON
     ========================================================= */

  function initializeAccountButton() {

    const accountButton =
      $("#openLogin");

    if (!accountButton) {
      return;
    }

    /*
     * Capture phase ensures profile
     * opens before old login handler.
     */
    accountButton.addEventListener(
      "click",
      event => {

        const account =
          getAccount();

        const loggedIn =
          localStorage.getItem(
            STORAGE.LOGGED
          ) === "true";

        if (
          loggedIn &&
          account
        ) {

          event.preventDefault();

          event.stopImmediatePropagation();

          openBlinkitProfile();
        }

      },
      true
    );
  }

  /* =========================================================
     LOGOUT
     ========================================================= */

  function logoutAccount() {

    localStorage.removeItem(
      ACCOUNT_KEY
    );

    localStorage.removeItem(
      STORAGE.LOGGED
    );

    localStorage.removeItem(
      STORAGE.MOBILE
    );

    localStorage.removeItem(
      STORAGE.USER
    );

    sessionStorage.removeItem(
      "blinkitLoggedIn"
    );

    sessionStorage.removeItem(
      "blinkitMobile"
    );

    sessionStorage.removeItem(
      "blinkitPendingName"
    );

    sessionStorage.removeItem(
      "blinkitPendingMobile"
    );

    sessionStorage.removeItem(
      STORAGE.OTP
    );

    closeBlinkitProfile();

    updateLoginButton();

    showToast(
      "Logged out successfully",
      "success",
      "Account"
    );
  }

  /* =========================================================
     15. LOCATION ENGINE
     ========================================================= */

  function initializeLocation() {

    const locationArea =
      $(".headerAdd");

    locationArea?.addEventListener(
      "click",
      detectLocation
    );

    const saved =
      readJSON(
        STORAGE.LOCATION,
        null
      );

    if (saved) {
      updateLocationUI(
        saved
      );
    }
  }

  function detectLocation() {

    if (
      !navigator.geolocation
    ) {

      showToast(
        "Location is not supported by your browser",
        "error"
      );

      return;
    }

    showToast(
      "Detecting your location...",
      "info"
    );

    navigator.geolocation.getCurrentPosition(
      async position => {

        const lat =
          position.coords.latitude;

        const lng =
          position.coords.longitude;

        const location = {
          lat,
          lng,

          address:
            `Detected location (${lat.toFixed(3)}, ${lng.toFixed(3)})`
        };

        writeJSON(
          STORAGE.LOCATION,
          location
        );

        updateLocationUI(
          location
        );

        /*
         * Refresh profile location
         * if profile is open.
         */
        if (
          $("#blinkitProfileOverlay")
        ) {

          $("#blinkitProfileLocation")
            .textContent =
            location.address;
        }

        showToast(
          "Delivery location updated",
          "success"
        );
      },

      error => {

        let message =
          "Unable to detect location";

        if (
          error.code === 1
        ) {
          message =
            "Please allow location permission";
        }

        showToast(
          message,
          "error"
        );
      },

      {
        enableHighAccuracy:
          true,

        timeout:
          10000,

        maximumAge:
          60000
      }
    );
  }

  function updateLocationUI(
    location
  ) {

    const subtitle =
      $(".headerAdd p");

    if (subtitle) {

      subtitle.textContent =
        location.address ||
        "Location detected ✓";
    }

    if (
      $("#cartLocationText")
    ) {

      $("#cartLocationText")
        .textContent =
        location.address ||
        "Location detected ✓";
    }
  }

  /* =========================================================
     16. COUPON ENGINE
     ========================================================= */

  function applyCoupon() {

    const input =
      $("#couponInput");

    if (!input) return;

    const code =
      input.value
        .trim()
        .toUpperCase();

    const message =
      $("#couponMessage");

    if (!code) {

      message.textContent =
        "Enter a coupon code";

      message.style.color =
        "#e53935";

      return;
    }

    const coupon =
      COUPONS[code];

    if (!coupon) {

      message.textContent =
        "Invalid coupon code";

      message.style.color =
        "#e53935";

      return;
    }

    const subtotal =
      cartSubtotal();

    if (
      subtotal < coupon.min
    ) {

      message.textContent =
        `Add ${money(
          coupon.min -
          subtotal
        )} more to use this coupon`;

      message.style.color =
        "#e53935";

      return;
    }

    appliedCoupon = {
      code
    };

    writeJSON(
      STORAGE.COUPON,
      appliedCoupon
    );

    message.textContent =
      `${coupon.label} applied`;

    message.style.color =
      "#2d7e05";

    showToast(
      `${code} applied successfully`,
      "success",
      "Coupon applied"
    );

    updateCartUI();
  }

  /* =========================================================
     17. CHECKOUT ENGINE
     ========================================================= */

  function checkout() {

    if (!cart.length) {

      showToast(
        "Your cart is empty",
        "error"
      );

      return;
    }

    const loggedIn =
      localStorage.getItem(
        STORAGE.LOGGED
      ) === "true";

    if (!loggedIn) {

      showToast(
        "Please login before checkout",
        "error"
      );

      closeCart();

      $("#openLogin")
        ?.click();

      return;
    }

    openCheckoutModal();
  }

  function openCheckoutModal() {

    if (
      $("#checkoutModal")
    ) {

      $("#checkoutModal")
        .style.display =
        "flex";

      return;
    }

    const subtotal =
      cartSubtotal();

    const delivery =
      getDeliveryFee(
        subtotal
      );

    const discount =
      getDiscount(
        subtotal
      );

    const total =
      getGrandTotal();

    const modal =
      document.createElement(
        "div"
      );

    modal.id =
      "checkoutModal";

    modal.innerHTML = `
      <div class="checkout-overlay"></div>

      <div class="checkout-card">

        <button
          class="checkout-close"
          id="checkoutClose"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="checkout-title">

          <span>
            Quick checkout
          </span>

          <h2>
            Complete your order
          </h2>

        </div>

        <div class="checkout-step active">

          <span>
            1
          </span>

          <div>

            <strong>
              Delivery address
            </strong>

            <p id="checkoutAddress">
              ${
                readJSON(
                  STORAGE.LOCATION,
                  null
                )?.address ||
                "Use detected location"
              }
            </p>

          </div>

        </div>

        <div class="checkout-step">

          <span>
            2
          </span>

          <div style="flex:1">

            <strong>
              Payment method
            </strong>

            <div class="payment-options">

              <label>

                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked
                >

                <span>
                  <i class="fa-solid fa-money-bill"></i>
                  Cash on Delivery
                </span>

              </label>

              <label>

                <input
                  type="radio"
                  name="payment"
                  value="upi"
                >

                <span>
                  <i class="fa-solid fa-mobile-screen"></i>
                  UPI
                </span>

              </label>

              <label>

                <input
                  type="radio"
                  name="payment"
                  value="card"
                >

                <span>
                  <i class="fa-solid fa-credit-card"></i>
                  Card
                </span>

              </label>

            </div>

          </div>

        </div>

        <div class="checkout-summary">

          <div>
            <span>Items</span>
            <b>${money(subtotal)}</b>
          </div>

          <div>
            <span>Delivery</span>

            <b>
              ${
                delivery === 0
                  ? "FREE"
                  : money(delivery)
              }
            </b>

          </div>

          ${
            discount > 0
              ? `
                <div>
                  <span>
                    Discount
                  </span>

                  <b>
                    -${money(discount)}
                  </b>
                </div>
              `
              : ""
          }

          <div class="checkout-total">

            <span>
              Total
            </span>

            <strong>
              ${money(total)}
            </strong>

          </div>

        </div>

        <button
          id="placeOrderBtn"
          class="place-order-btn"
        >
          Place order · ${money(total)}
        </button>

      </div>
    `;

    document.body.appendChild(
      modal
    );

    addCheckoutStyles();

    $("#checkoutClose")
      ?.addEventListener(
        "click",
        closeCheckout
      );

    $(".checkout-overlay", modal)
      ?.addEventListener(
        "click",
        closeCheckout
      );

    $("#placeOrderBtn")
      ?.addEventListener(
        "click",
        placeOrder
      );

    document.body.classList.add(
      "blinkit-lock"
    );
  }

  function addCheckoutStyles() {

    if (
      $("#blinkitCheckoutStyles")
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "blinkitCheckoutStyles";

    style.textContent = `
      #checkoutModal{
        position:fixed;
        inset:0;
        z-index:999999;
        display:flex;
        align-items:center;
        justify-content:center;
      }

      .checkout-overlay{
        position:absolute;
        inset:0;
        background:rgba(0,0,0,.48);
        backdrop-filter:blur(5px);
      }

      .checkout-card{
        position:relative;
        z-index:2;
        width:min(460px,calc(100% - 30px));
        max-height:90vh;
        overflow:auto;
        background:#fff;
        border-radius:20px;
        padding:23px;
        box-shadow:
          0 25px 80px rgba(0,0,0,.25);
        animation:checkoutIn .35s ease;
      }

      @keyframes checkoutIn{
        from{
          opacity:0;
          transform:
            translateY(25px)
            scale(.97);
        }

        to{
          opacity:1;
          transform:none;
        }
      }

      .checkout-close{
        position:absolute;
        right:15px;
        top:15px;
        width:34px;
        height:34px;
        border:0;
        border-radius:50%;
        background:#f5f5f5;
        cursor:pointer;
      }

      .checkout-title small{
        color:#777;
      }

      .checkout-title h2{
        margin-top:4px;
        font-size:22px;
      }

      .checkout-step{
        display:flex;
        gap:12px;
        padding:16px 0;
        border-bottom:1px solid #eee;
      }

      .checkout-step > span{
        width:28px;
        height:28px;
        border-radius:50%;
        background:#edf7e9;
        color:#2d7e05;
        display:grid;
        place-items:center;
        font-size:12px;
        font-weight:bold;
        flex-shrink:0;
      }

      .checkout-step strong{
        font-size:13px;
      }

      .checkout-step p{
        font-size:11px;
        color:#777;
        margin-top:4px;
      }

      .payment-options{
        display:flex;
        flex-direction:column;
        gap:7px;
        margin-top:10px;
      }

      .payment-options label{
        cursor:pointer;
      }

      .payment-options label > span{
        display:flex;
        align-items:center;
        gap:8px;
        padding:10px;
        border:1px solid #eee;
        border-radius:9px;
        font-size:11px;
      }

      .payment-options input{
        display:none;
      }

      .payment-options input:checked + span{
        border-color:#2d7e05;
        background:#f4faef;
        color:#2d7e05;
      }

      .checkout-summary{
        margin-top:15px;
        padding:14px;
        border-radius:12px;
        background:#fafafa;
      }

      .checkout-summary > div{
        display:flex;
        justify-content:space-between;
        padding:5px 0;
        font-size:12px;
      }

      .checkout-total{
        border-top:1px dashed #ddd;
        margin-top:7px;
        padding-top:11px !important;
        font-size:16px !important;
      }

      .place-order-btn{
        width:100%;
        border:0;
        margin-top:14px;
        padding:14px;
        border-radius:11px;
        background:#2d7e05;
        color:#fff;
        font-weight:bold;
        cursor:pointer;
      }
    `;

    document.head.appendChild(
      style
    );
  }

  function closeCheckout() {

    $("#checkoutModal")
      ?.remove();

    document.body.classList.remove(
      "blinkit-lock"
    );
  }

  function placeOrder() {

    if (!cart.length) {
      return;
    }

    const total =
      getGrandTotal();

    const payment =
      $("input[name='payment']:checked")
        ?.value ||
      "cod";

    const orderId =
      "BLK" +
      Date.now()
        .toString()
        .slice(-8);

    const order = {

      id:
        orderId,

      date:
        new Date().toISOString(),

      items:
        [...cart],

      subtotal:
        cartSubtotal(),

      delivery:
        getDeliveryFee(),

      discount:
        getDiscount(),

      total,

      payment,

      status:
        "Confirmed"
    };

    orders.unshift(
      order
    );

    orders =
      orders.slice(
        0,
        20
      );

    writeJSON(
      STORAGE.ORDERS,
      orders
    );

    cart = [];

    appliedCoupon =
      null;

    localStorage.removeItem(
      STORAGE.COUPON
    );

    saveCart();

    closeCheckout();

    closeCart();

    updateCartUI();

    showOrderSuccess(
      order
    );
  }

  function showOrderSuccess(
    order
  ) {

    const modal =
      document.createElement(
        "div"
      );

    modal.id =
      "orderSuccessModal";

    modal.innerHTML = `
      <div style="
        position:fixed;
        inset:0;
        z-index:1000000;
        background:rgba(0,0,0,.48);
        display:grid;
        place-items:center;
        padding:20px;
      ">

        <div style="
          width:min(400px,100%);
          background:#fff;
          border-radius:22px;
          padding:28px;
          text-align:center;
          box-shadow:
            0 25px 80px rgba(0,0,0,.25);
          animation:checkoutIn .35s ease;
        ">

          <div style="
            width:72px;
            height:72px;
            margin:auto;
            border-radius:50%;
            background:#eaf7e5;
            color:#2d7e05;
            display:grid;
            place-items:center;
            font-size:30px;
          ">
            <i class="fa-solid fa-check"></i>
          </div>

          <h2 style="
            margin-top:15px;
            font-size:21px;
          ">
            Order placed!
          </h2>

          <p style="
            margin-top:7px;
            color:#777;
            font-size:12px;
          ">
            Your groceries are being prepared
            for fast delivery.
          </p>

          <div style="
            margin:18px 0;
            padding:13px;
            background:#fafafa;
            border-radius:12px;
            font-size:12px;
          ">

            <div>
              Order ID:
              <strong>
                ${escapeHTML(order.id)}
              </strong>
            </div>

            <div style="margin-top:6px">
              Total:
              <strong>
                ${money(order.total)}
              </strong>
            </div>

          </div>

          <button
            id="successDone"
            style="
              width:100%;
              padding:13px;
              border:0;
              border-radius:10px;
              background:#2d7e05;
              color:#fff;
              font-weight:bold;
              cursor:pointer;
            "
          >
            Continue shopping
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(
      modal
    );

    $("#successDone")
      ?.addEventListener(
        "click",
        () => {
          modal.remove();
        }
      );
  }

  /* =========================================================
     18. ORDER HISTORY
     ========================================================= */

  function createOrderHistoryButton() {

    const headerButtons =
      $(".headerbtn");

    if (!headerButtons) {
      return;
    }

    if (
      $("#orderHistoryButton")
    ) {
      return;
    }

    const button =
      document.createElement(
        "button"
      );

    button.id =
      "orderHistoryButton";

    button.innerHTML = `
      <i class="fa-solid fa-clock-rotate-left"></i>
      Orders
    `;

    button.addEventListener(
      "click",
      openOrderHistory
    );

    headerButtons.insertBefore(
      button,
      getCartButton()
    );
  }

  function openOrderHistory() {

    if (!orders.length) {

      showToast(
        "No previous orders found",
        "info"
      );

      return;
    }

    const modal =
      document.createElement(
        "div"
      );

    modal.innerHTML = `
      <div style="
        position:fixed;
        inset:0;
        z-index:100000;
        background:rgba(0,0,0,.45);
        display:flex;
        justify-content:center;
        align-items:center;
        padding:20px;
      ">

        <div style="
          width:min(500px,100%);
          max-height:85vh;
          overflow:auto;
          background:#fff;
          border-radius:18px;
          padding:20px;
          box-shadow:
            0 25px 80px rgba(0,0,0,.2);
        ">

          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:15px;
          ">

            <div>

              <small style="
                color:#777
              ">
                Your activity
              </small>

              <h2 style="
                font-size:21px
              ">
                Order history
              </h2>

            </div>

            <button
              id="closeOrders"
              style="
                border:0;
                width:35px;
                height:35px;
                border-radius:50%;
                cursor:pointer;
              "
            >
              ×
            </button>

          </div>

          ${orders.map(order => `
            <div style="
              border:1px solid #eee;
              border-radius:13px;
              padding:13px;
              margin-bottom:10px;
            ">

              <div style="
                display:flex;
                justify-content:space-between;
              ">

                <strong style="
                  font-size:12px
                ">
                  ${escapeHTML(order.id)}
                </strong>

                <span style="
                  color:#2d7e05;
                  font-size:11px;
                  font-weight:bold;
                ">
                  ${escapeHTML(order.status)}
                </span>

              </div>

              <p style="
                font-size:10px;
                color:#777;
                margin-top:5px;
              ">
                ${
                  new Date(
                    order.date
                  ).toLocaleString()
                }
              </p>

              <div style="
                margin-top:9px;
                font-size:11px;
              ">
                ${
                  order.items
                    .map(item =>
                      `${escapeHTML(
                        item.name
                      )} × ${item.qty}`
                    )
                    .join(", ")
                }
              </div>

              <div style="
                display:flex;
                justify-content:space-between;
                margin-top:10px;
                font-size:12px;
              ">

                <span>
                  ${escapeHTML(
                    String(
                      order.payment ||
                      "COD"
                    ).toUpperCase()
                  )}
                </span>

                <strong>
                  ${money(order.total)}
                </strong>

              </div>

            </div>
          `).join("")}

        </div>

      </div>
    `;

    document.body.appendChild(
      modal
    );

    $("#closeOrders")
      ?.addEventListener(
        "click",
        () => modal.remove()
      );
  }

  /* =========================================================
     19. CATEGORY CLICK FILTER
     ========================================================= */

  function initializeCategories() {

    $$(".categoryItems")
      .forEach(item => {

        item.addEventListener(
          "click",
          () => {

            const image =
              $("img", item);

            const alt =
              image?.alt?.trim();

            if (!alt) {

              const index =
                $$(".categoryItems")
                  .indexOf(item);

              const sections =
                $$(".productSection");

              sections[
                Math.min(
                  index,
                  sections.length - 1
                )
              ]?.scrollIntoView({
                behavior:
                  "smooth"
              });

              return;
            }

            const input =
              $("#searchInput");

            if (input) {

              input.value =
                alt;

              performSearch(
                alt
              );
            }

            showToast(
              `Searching ${alt}`,
              "info"
            );
          }
        );
      });
  }

  /* =========================================================
     20. KEYBOARD SHORTCUTS
     ========================================================= */

  function initializeKeyboardShortcuts() {

    document.addEventListener(
      "keydown",
      event => {

        if (
          event.target.matches(
            "input, textarea"
          )
        ) {
          return;
        }

        if (
          event.key === "/" &&
          !event.ctrlKey &&
          !event.metaKey
        ) {

          event.preventDefault();

          $("#searchInput")
            ?.focus();
        }

        if (
          event.key.toLowerCase() ===
            "c" &&
          !event.ctrlKey &&
          !event.metaKey
        ) {

          openCart();
        }

        if (
          event.key ===
          "Escape"
        ) {

          closeCart();

          closeLogin();

          closeCheckout();

          closeBlinkitProfile();
        }
      }
    );
  }

  /* =========================================================
     21. IMAGE LOADING
     ========================================================= */

  function initializeImageLoading() {

    $$("img")
      .forEach(img => {

        img.loading =
          img.loading ||
          "lazy";

        img.addEventListener(
          "error",
          () => {

            img.style.opacity =
              ".35";

          },
          {
            once:true
          }
        );
      });
  }

  /* =========================================================
     22. WELCOME MESSAGE
     ========================================================= */

  function welcomeMessage() {

    if (
      sessionStorage.getItem(
        STORAGE.WELCOME
      )
    ) {
      return;
    }

    sessionStorage.setItem(
      STORAGE.WELCOME,
      "true"
    );

    setTimeout(() => {

      showToast(
        "Fresh groceries delivered fast 🚀",
        "success",
        "Welcome"
      );

    }, 1200);
  }

  /* =========================================================
     23. CART BUTTON INITIALIZATION
     ========================================================= */

  function initializeCartButton() {

    createCartDrawer();

    const button =
      getCartButton();

    if (!button) return;

    if (
      button.dataset.cartInitialized
    ) {
      return;
    }

    button.dataset.cartInitialized =
      "true";

    button.addEventListener(
      "click",
      event => {

        event.preventDefault();

        openCart();
      }
    );
  }

  /* =========================================================
     24. SMART PRODUCT CLEANUP
     ========================================================= */

  function normalizeMalformedProductText() {

    $$(".productItems")
      .forEach(card => {

        const content =
          $(".productContent", card);

        if (!content) return;

        $$("p", content)
          .forEach(p => {

            p.textContent =
              p.textContent
                .replace(
                  /10\s*Mins\s*/gi,
                  ""
                )
                .trim();
          });

        const price =
          $(".btn-price-outer b", card);

        if (price) {

          price.textContent =
            price.textContent
              .replace(
                /10\s*Mins/gi,
                ""
              )
              .trim();
        }
      });
  }

  /* =========================================================
     25. ONLINE/OFFLINE
     ========================================================= */

  function initializeNetworkStatus() {

    const update = () => {

      if (!navigator.onLine) {

        showToast(
          "You are offline. Cart data is still saved.",
          "error",
          "Offline mode"
        );

      } else {

        showToast(
          "Connection restored",
          "success"
        );
      }
    };

    window.addEventListener(
      "offline",
      update
    );

    window.addEventListener(
      "online",
      update
    );
  }

  /* =========================================================
     26. START APPLICATION
     ========================================================= */

  normalizeMalformedProductText();

  /*
   * ACCOUNT UI MUST BE CREATED
   * BEFORE LOGIN EVENTS.
   */
  createProfileModal();

  createProfileStyles();

  initializeAddButtons();

  initializeCartButton();

  initializeSearch();

  initializeSeeAll();

  initializeLogin();

  initializeAccountButton();

  initializeProfileEvents();

  initializeLocation();

  initializeProductCards();

  initializeCategories();

  initializeKeyboardShortcuts();

  initializeImageLoading();

  initializeNetworkStatus();

  addWishlistButtons();

  createOrderHistoryButton();

  updateCartUI();

  updateLoginButton();

  welcomeMessage();

  console.log(
    "%c Blinkit Clone Advanced Engine Loaded ",
    "background:#2d7e05;color:#fff;padding:6px 10px;border-radius:6px;font-weight:bold;"
  );

  console.log(
    `Products: ${getAllProducts().length}`
  );

  console.log(
    `Cart items: ${cartCount()}`
  );

  const existingAccount =
    getAccount();

  if (
    existingAccount &&
    localStorage.getItem(
      STORAGE.LOGGED
    ) === "true"
  ) {

    console.log(
      `Logged in as: ${existingAccount.name}`
    );
  }

});
// protection


(function () {
    "use strict";

    /* Disable right click */
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });

    /* Disable common text/image dragging */
    document.addEventListener("dragstart", function (e) {
        e.preventDefault();
    });

    /* Disable text selection */
    document.addEventListener("selectstart", function (e) {
        e.preventDefault();
    });

    /* Disable copy */
    document.addEventListener("copy", function (e) {
        e.preventDefault();
    });

    /* Disable cut */
    document.addEventListener("cut", function (e) {
        e.preventDefault();
    });

    /* Disable common developer shortcuts */
    document.addEventListener("keydown", function (e) {

        // F12
        if (e.key === "F12") {
            e.preventDefault();
            return false;
        }

        // Ctrl + Shift + I
        if (
            e.ctrlKey &&
            e.shiftKey &&
            e.key.toLowerCase() === "i"
        ) {
            e.preventDefault();
            return false;
        }

        // Ctrl + Shift + J
        if (
            e.ctrlKey &&
            e.shiftKey &&
            e.key.toLowerCase() === "j"
        ) {
            e.preventDefault();
            return false;
        }

        // Ctrl + Shift + C
        if (
            e.ctrlKey &&
            e.shiftKey &&
            e.key.toLowerCase() === "c"
        ) {
            e.preventDefault();
            return false;
        }

        // Ctrl + U
        if (
            e.ctrlKey &&
            e.key.toLowerCase() === "u"
        ) {
            e.preventDefault();
            return false;
        }

        // Ctrl + S
        if (
            e.ctrlKey &&
            e.key.toLowerCase() === "s"
        ) {
            e.preventDefault();
            return false;
        }

        // Ctrl + C
        if (
            e.ctrlKey &&
            e.key.toLowerCase() === "c"
        ) {
            e.preventDefault();
            return false;
        }
    });

    /* Prevent image dragging */
    document.querySelectorAll("img").forEach(function (img) {
        img.setAttribute("draggable", "false");
        img.addEventListener("dragstart", function (e) {
            e.preventDefault();
        });
    });

})();
