<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Toast from '../components/Toast.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useCurrencyStore } from '../stores/currency'

const router = useRouter()
const cart   = useCartStore()
const currency = useCurrencyStore()
const toastRef = ref(null)
const user   = ref(JSON.parse(localStorage.getItem('user')))
const checkingOut = ref(false)
const shippingCost = 10

function formatMoney(value) {
  return currency.format(value)
}

onMounted(() => {
  currency.fetchRates()
})

function checkout() {
  if (!user.value) {
    toastRef.value.showToastMessage('Please login first', 'error')
    return
  }
  if (cart.items.length === 0) {
    toastRef.value.showToastMessage('Cart is empty', 'error')
    return
  }
  router.push('/checkout')
}
</script>

<template>
  <div class="cart-page">
    <Navbar />

    <main class="cart-main section-inner">

      <!-- Page header -->
      <div class="cart-header">
        <span class="kicker">Shopping</span>
        <h1 class="cart-title">
          Your <span class="grad-text">Cart</span>
        </h1>
        <p class="cart-subtitle">
          {{ cart.items.length }} item{{ cart.items.length !== 1 ? 's' : '' }} ready for checkout
        </p>
      </div>

      <!-- Empty state -->
      <div v-if="cart.items.length === 0" class="empty-state">
        <div class="empty-icon">🛒</div>
        <h2 class="empty-title">Your cart is empty</h2>
        <p class="empty-desc">Looks like you haven't added anything yet. Explore our catalog and find your perfect build.</p>
        <button class="btn-primary" @click="router.push('/products')">Browse Products</button>
      </div>

      <!-- Cart layout -->
      <div v-else class="cart-layout">

        <!-- Left: items -->
        <div class="cart-items">
          <div
            v-for="(item, i) in cart.items"
            :key="item.id"
            class="cart-card glass tilt-card"
          >
            <div class="card-shine" />

            <!-- Image -->
            <div class="item-img-wrap">
              <img :src="item.image" :alt="item.name" class="item-img" />
            </div>

            <!-- Info -->
            <div class="item-info">
              <p class="item-category">{{ item.category || 'PC Component' }}</p>
              <h3 class="item-name">{{ item.name }}</h3>
              <p class="item-price">{{ formatMoney(item.price) }}</p>

              <!-- Qty row -->
              <div class="qty-row">
                <button class="qty-btn" @click="cart.decreaseQty(item.id)">−</button>
                <span class="qty-num">{{ item.quantity }}</span>
                <button class="qty-btn" @click="cart.increaseQty(item.id)">+</button>
                <span class="item-subtotal">= {{ formatMoney(item.price * item.quantity) }}</span>
              </div>
            </div>

            <!-- Remove -->
            <button class="remove-btn" @click="cart.removeFromCart(item.id)" title="Remove">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Right: summary -->
        <div class="cart-summary glass">
          <div class="card-shine" />

          <h3 class="summary-title">Order Summary</h3>

          <!-- Item list -->
          <div class="summary-lines">
            <div v-for="item in cart.items" :key="item.id" class="summary-line">
              <span class="line-name">{{ item.name }} <span class="line-qty">×{{ item.quantity }}</span></span>
              <span class="line-price">{{ formatMoney(item.price * item.quantity) }}</span>
            </div>
          </div>

          <div class="summary-divider" />

          <div class="summary-row">
            <span>Subtotal</span>
            <span>{{ formatMoney(cart.totalPrice) }}</span>
          </div>
          <div class="summary-row">
            <span>Shipping</span>
            <span class="ship-badge">{{ formatMoney(shippingCost) }}</span>
          </div>

          <div class="summary-total">
            <span>Total</span>
            <span class="total-amount grad-text">{{ formatMoney(cart.totalPrice + shippingCost) }}</span>
          </div>

          <button class="btn-primary btn-checkout" @click="checkout" :disabled="checkingOut">
            <span>Proceed to Checkout</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <button class="btn-ghost" @click="router.push('/products')">Continue Shopping</button>

          <!-- Trust badges -->
          <div class="trust-row">
            <span class="trust-item">🔒 Secure</span>
            <span class="trust-item">⚡ Fast</span>
            <span class="trust-item">✅ Genuine</span>
          </div>
        </div>
      </div>
    </main>

    <Toast ref="toastRef" />
    <Footer />
  </div>
</template>

<style scoped>
.cart-page { background: #030712; min-height: 100vh; }

.cart-main {
  padding-top: 140px;
  padding-bottom: 100px;
}

/* Header */
.cart-header { margin-bottom: 56px; }
.cart-title {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(36px, 5vw, 64px);
  font-weight: 900;
  color: #f1f5f9;
  margin: 16px 0 10px;
  line-height: 1.1;
}
.cart-subtitle { color: #475569; font-size: 16px; }

/* Empty */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 100px 40px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 32px;
}
.empty-icon { font-size: 72px; margin-bottom: 24px; opacity: 0.6; }
.empty-title { font-family: 'Orbitron', sans-serif; font-size: 28px; color: #f1f5f9; margin: 0 0 12px; }
.empty-desc { color: #475569; font-size: 15px; max-width: 420px; line-height: 1.7; margin: 0 0 32px; }

/* Layout */
.cart-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 32px;
  align-items: start;
}

/* Cart items */
.cart-items { display: flex; flex-direction: column; gap: 20px; }

.cart-card {
  position: relative;
  display: flex; align-items: center; gap: 24px;
  padding: 24px;
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.06);
  overflow: hidden;
  transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), border-color 0.3s;
}
.cart-card:hover { border-color: rgba(59,130,246,0.3); }

/* Image */
.item-img-wrap {
  width: 120px; height: 120px; flex-shrink: 0;
  background: radial-gradient(circle at center, rgba(59,130,246,0.08), rgba(3,7,18,0.6) 70%);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  padding: 12px; box-sizing: border-box;
}
.item-img { width: 100%; height: 100%; object-fit: contain; }

/* Info */
.item-info { flex: 1; min-width: 0; }
.item-category { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #3b82f6; margin: 0 0 6px; }
.item-name { font-size: 18px; font-weight: 700; color: #f1f5f9; margin: 0 0 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-price { font-size: 20px; font-weight: 800; color: #60a5fa; margin: 0 0 14px; }

/* Qty */
.qty-row { display: flex; align-items: center; gap: 10px; }
.qty-btn {
  width: 34px; height: 34px; border-radius: 10px;
  background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3);
  color: #93c5fd; font-size: 18px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.qty-btn:hover { background: rgba(59,130,246,0.3); color: white; }
.qty-num { font-size: 16px; font-weight: 700; color: #f1f5f9; min-width: 24px; text-align: center; }
.item-subtotal { font-size: 14px; color: #64748b; margin-left: 6px; }

/* Remove */
.remove-btn {
  width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
  color: #f87171; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.remove-btn:hover { background: rgba(239,68,68,0.25); color: #fca5a5; }

/* Summary */
.cart-summary {
  position: sticky; top: 100px;
  padding: 32px;
  border-radius: 28px;
  border: 1px solid rgba(255,255,255,0.07);
  overflow: hidden;
}
.summary-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px; font-weight: 800; color: #f1f5f9; margin: 0 0 24px;
}

/* Summary lines */
.summary-lines { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.summary-line { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
.line-name { color: #64748b; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.line-qty { color: #475569; }
.line-price { color: #94a3b8; flex-shrink: 0; }

.summary-divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 20px 0; }

.summary-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 15px; color: #94a3b8; margin-bottom: 12px;
}
.ship-badge { font-size: 13px; color: #64748b; }

.summary-total {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 0; border-top: 1px solid rgba(59,130,246,0.2);
  margin: 16px 0 24px;
  font-size: 16px; font-weight: 700; color: #94a3b8;
}
.total-amount { font-size: 26px; font-weight: 900; }

/* Buttons */
.btn-primary {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 15px 24px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white; border: none; border-radius: 14px;
  font-size: 15px; font-weight: 700; cursor: pointer;
  transition: all 0.3s; margin-bottom: 12px;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(37,99,235,0.35); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.btn-checkout { font-family: 'Orbitron', sans-serif; font-size: 13px; letter-spacing: 0.05em; }

.btn-ghost {
  display: block; width: 100%; padding: 13px 24px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: #64748b; border-radius: 14px; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.2s; text-align: center;
}
.btn-ghost:hover { background: rgba(255,255,255,0.08); color: #94a3b8; }

/* Trust */
.trust-row { display: flex; gap: 8px; justify-content: center; margin-top: 20px; flex-wrap: wrap; }
.trust-item { font-size: 11px; color: #334155; padding: 4px 10px; border-radius: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }

/* Light mode */
:global(:root[data-theme="light"]) .qty-num {
  color: #0f172a !important;
  opacity: 1 !important;
  font-weight: 800;
}

/* Responsive */
@media (max-width: 1024px) {
  .cart-layout { grid-template-columns: 1fr; }
  .cart-summary { position: relative; top: 0; }
}
@media (max-width: 640px) {
  .cart-main { padding-top: 100px; }
  .cart-card { flex-direction: column; align-items: flex-start; }
  .item-img-wrap { width: 100%; height: 180px; }
  .item-name { white-space: normal; }
}
</style>
