<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user   = ref(JSON.parse(localStorage.getItem('user')))
const orders = ref([])
const loading = ref(true)



async function loadOrders() {
  if (!user.value) { router.push('/login'); return }
  try {
    loading.value = true
    const { getWhere } = await import('../lib/api.js')
    orders.value = await getWhere('orders', 'userEmail', user.value.email)
  } catch (e) { console.log(e) }
  finally { loading.value = false }
}

onMounted(loadOrders)
</script>

<template>
  <div class="orders-page">
    <Navbar />

    <main class="orders-main section-inner">

      <!-- Header -->
      <div class="orders-header">
        <span class="kicker">Account</span>
        <h1 class="orders-title">Order <span class="grad-text">History</span></h1>
        <p class="orders-sub">Track all your purchases in one place.</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="state-box glass">
        <div class="loader" />
        <p>Loading your orders…</p>
      </div>

      <!-- Empty -->
      <div v-else-if="orders.length === 0" class="state-box glass">
        <div class="empty-icon">📦</div>
        <h2 class="empty-title">No orders yet</h2>
        <p class="empty-desc">You haven't placed any orders. Start building your dream PC!</p>
        <button class="btn-primary" @click="router.push('/products')">Shop Now</button>
      </div>

      <!-- Orders list -->
      <div v-else class="orders-list">
        <div
          v-for="(order, i) in orders"
          :key="order.id"
          class="order-card glass"
        >
          <!-- Order header -->
          <div class="order-top">
            <div class="order-meta">
              <p class="order-id">Order <span class="grad-text-blue">#{{ order.id }}</span></p>
              <p class="order-email">{{ order.userEmail }}</p>
            </div>
            <span :class="['status-badge', `s-${order.status?.toLowerCase()}`]">{{ order.status }}</span>
          </div>

          <!-- Items -->
          <div class="order-items">
            <div v-for="item in order.items" :key="item.id" class="order-item">
              <div class="item-img-wrap">
                <img :src="item.image" :alt="item.name" class="item-img" />
              </div>
              <div class="item-info">
                <p class="item-name">{{ item.name }}</p>
                <p class="item-qty">Qty: {{ item.quantity }}</p>
              </div>
              <p class="item-price">RM {{ (item.price * item.quantity).toFixed(2) }}</p>
            </div>
          </div>

          <!-- Footer row -->
          <div class="order-footer">
            <div class="order-meta-row">
              <span class="meta-pill">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="3" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 3V2a2 2 0 0 1 4 0v1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                {{ order.paymentMethod }}
              </span>
              <span class="meta-pill">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 5 4-5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                {{ order.shippingMethod }}
              </span>
              <span class="meta-pill" v-if="order.address || order.shippingAddress">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1C4.067 1 2.5 2.567 2.5 4.5 2.5 7 6 11 6 11s3.5-4 3.5-6.5C9.5 2.567 7.933 1 6 1z" stroke="currentColor" stroke-width="1.2"/><circle cx="6" cy="4.5" r="1" fill="currentColor"/></svg>
                {{ order.address || order.shippingAddress }}
              </span>
            </div>
            <div class="order-right">
              <p class="order-total grad-text">RM {{ Number(order.total).toFixed(2) }}</p>
              <button class="print-btn" @click="window.print()">🖨 Print</button>
            </div>
          </div>
        </div>
      </div>

    </main>

    <Footer />
  </div>
</template>

<style scoped>
.orders-page { background: #030712; min-height: 100vh; }
.orders-main { padding-top: 130px; padding-bottom: 100px; }

/* Header */
.orders-header { margin-bottom: 52px; }
.orders-title {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(32px, 5vw, 60px); font-weight: 900; color: #f1f5f9;
  margin: 14px 0 10px; line-height: 1.1;
}
.orders-sub { color: #475569; font-size: 16px; }

/* State boxes */
.state-box {
  padding: 80px 40px; border-radius: 28px;
  border: 1px solid rgba(255,255,255,0.06);
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 16px;
}
.loader {
  width: 40px; height: 40px; border-radius: 50%;
  border: 3px solid rgba(59,130,246,0.2); border-top-color: #3b82f6;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.state-box p { color: #475569; font-size: 16px; margin: 0; }
.empty-icon { font-size: 64px; opacity: 0.6; }
.empty-title { font-family: 'Orbitron', sans-serif; font-size: 24px; color: #f1f5f9; margin: 0; }
.empty-desc { color: #475569; font-size: 15px; max-width: 380px; margin: 0; line-height: 1.7; }

/* Orders list */
.orders-list { display: flex; flex-direction: column; gap: 24px; }

.order-card {
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.06);
  padding: 28px;
  transition: border-color 0.3s;
}
.order-card:hover { border-color: rgba(59,130,246,0.25); }

/* Top */
.order-top {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding-bottom: 20px; margin-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.order-id { font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 800; color: #f1f5f9; margin: 0 0 4px; }
.order-email { font-size: 13px; color: #475569; margin: 0; }

/* Status */
.status-badge {
  padding: 5px 12px; border-radius: 20px;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  flex-shrink: 0;
}
.s-pending   { background: rgba(245,158,11,0.15); color: #fcd34d; border: 1px solid rgba(245,158,11,0.3); }
.s-processing{ background: rgba(59,130,246,0.15); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3); }
.s-shipping  { background: rgba(139,92,246,0.15); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.3); }
.s-delivered { background: rgba(16,185,129,0.15); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.3); }
.s-rejected  { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }

/* Items */
.order-items { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.order-item {
  display: flex; align-items: center; gap: 16px;
  padding: 14px 16px; border-radius: 16px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
  transition: background 0.2s;
}
.order-item:hover { background: rgba(59,130,246,0.05); }

.item-img-wrap {
  width: 64px; height: 64px; flex-shrink: 0;
  border-radius: 12px;
  background: radial-gradient(circle, rgba(59,130,246,0.08), rgba(3,7,18,0.6) 70%);
  padding: 8px; box-sizing: border-box;
  display: flex; align-items: center; justify-content: center;
}
.item-img { width: 100%; height: 100%; object-fit: contain; }
.item-info { flex: 1; }
.item-name { font-size: 15px; font-weight: 700; color: #f1f5f9; margin: 0 0 4px; }
.item-qty  { font-size: 13px; color: #475569; margin: 0; }
.item-price { font-size: 16px; font-weight: 800; color: #60a5fa; flex-shrink: 0; }

/* Footer */
.order-footer {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
  gap: 16px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05);
}
.order-meta-row { display: flex; gap: 8px; flex-wrap: wrap; }
.meta-pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 20px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
  font-size: 12px; color: #64748b;
}
.order-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
.order-total { font-family: 'Orbitron', sans-serif; font-size: 22px; font-weight: 900; margin: 0; }
.print-btn { padding: 6px 14px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.print-btn:hover { background: rgba(255,255,255,0.09); color: #94a3b8; }

@media print {
  .orders-header, .state-box, .print-btn { display: none !important; }
  .orders-page { background: #fff !important; }
  .order-card  { background: #fff !important; border: 1px solid #ddd !important; box-shadow: none !important; page-break-inside: avoid; margin-bottom: 24px; }
  .order-id, .order-email { color: #000 !important; }
  .item-name, .item-qty { color: #000 !important; }
  .item-price, .order-total { color: #000 !important; background: none !important; -webkit-text-fill-color: #000 !important; }
  .status-badge { border: 1px solid #999 !important; color: #333 !important; background: #eee !important; }
  * { print-color-adjust: exact !important; }
}

/* Buttons */
.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white; border: none; border-radius: 14px;
  font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.3s;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(37,99,235,0.35); }

/* Responsive */
@media (max-width: 640px) {
  .order-top { flex-direction: column; gap: 12px; }
  .order-item { flex-direction: column; align-items: flex-start; }
  .item-img-wrap { width: 100%; height: 140px; }
  .order-footer { flex-direction: column; align-items: flex-start; }
}
</style>
