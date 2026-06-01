<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route  = useRoute()
const router = useRouter()
const order  = ref(null)
const loading = ref(true)
const errorMessage = ref('')

async function loadOrder() {
  try {
    loading.value = true
    const { getWhere } = await import('../lib/api.js')
    const rows = await getWhere('orders', 'id', route.params.id)
    if (!rows.length) throw new Error('Order not found')
    order.value = rows[0]
  } catch (e) {
    console.log(e)
    errorMessage.value = 'Failed to load order.'
  } finally {
    loading.value = false
  }
}

onMounted(loadOrder)
</script>

<template>
  <div class="admin-page">
    <AdminNavbar />

    <main class="admin-main">

      <!-- Loading -->
      <div v-if="loading" class="state-screen">
        <div class="loader" /><p>Loading order…</p>
      </div>

      <!-- Error -->
      <div v-else-if="errorMessage" class="state-screen">
        <p class="err">{{ errorMessage }}</p>
        <button class="back-btn" @click="router.push('/admin/orders')">← Back to Orders</button>
      </div>

      <!-- Order not found -->
      <div v-else-if="!order" class="state-screen">
        <p class="err">Order not found.</p>
        <button class="back-btn" @click="router.push('/admin/orders')">← Back to Orders</button>
      </div>

      <!-- Order detail -->
      <div v-else>

        <!-- Header -->
        <div class="page-header">
          <div>
            <button class="breadcrumb-btn" @click="router.push('/admin/orders')">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              All Orders
            </button>
            <span class="kicker" style="margin-top:12px">Order Detail</span>
            <h1 class="page-title">
              Order <span class="grad-text">#{{ order.id }}</span>
            </h1>
            <p class="page-sub">Full breakdown of customer order and purchased items.</p>
          </div>
          <span :class="['status-badge-lg', `s-${order.status?.toLowerCase()}`]">{{ order.status }}</span>
        </div>

        <!-- Info grid -->
        <div class="info-card glass">
          <h2 class="card-title">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="2" width="13" height="11" rx="2" stroke="#3b82f6" stroke-width="1.5"/><path d="M4 6h7M4 9h4" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/></svg>
            Order Information
          </h2>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Order ID</span>
              <span class="info-val mono">{{ order.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Customer Email</span>
              <span class="info-val">{{ order.userEmail }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Recipient</span>
              <span class="info-val">{{ order.recipientName || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Phone</span>
              <span class="info-val">{{ order.phoneNumber || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Shipping Address</span>
              <span class="info-val">{{ order.address || order.shippingAddress || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Payment Method</span>
              <span class="info-val">{{ order.paymentMethod || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Shipping Method</span>
              <span class="info-val">{{ order.shippingMethod || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Order Status</span>
              <span :class="['status-badge', `s-${order.status?.toLowerCase()}`]">{{ order.status }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Order Total</span>
              <span class="info-val total-val grad-text">RM {{ Number(order.total || 0).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="items-section">
          <h2 class="section-heading">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2h2.5l2 7.5h7l1.5-4.5H5" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7.5" cy="13" r="1.5" fill="#f59e0b"/><circle cx="13" cy="13" r="1.5" fill="#f59e0b"/></svg>
            Ordered Items ({{ (order.items || []).length }})
          </h2>

          <div class="items-list">
            <div
              v-for="(item, i) in (order.items || [])"
              :key="item.id || i"
              class="item-card glass"
              :class="`stagger-${Math.min(i+1,6)}`"
            >
              <!-- Image -->
              <div class="item-img-wrap">
                <img
                  :src="item.image || 'https://via.placeholder.com/200'"
                  :alt="item.name"
                  class="item-img"
                />
              </div>

              <!-- Details -->
              <div class="item-details">
                <p class="item-name">{{ item.name }}</p>

                <div class="item-stats">
                  <div class="stat-row">
                    <span class="stat-key">Unit Price</span>
                    <span class="stat-val">RM {{ Number(item.price || 0).toFixed(2) }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-key">Quantity</span>
                    <span class="stat-val">× {{ item.quantity }}</span>
                  </div>
                  <div class="stat-row subtotal-row">
                    <span class="stat-key">Subtotal</span>
                    <span class="stat-val subtotal-val grad-text">
                      RM {{ (Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Qty badge -->
              <div class="qty-badge">{{ item.quantity }}</div>
            </div>
          </div>
        </div>

        <!-- Total summary bar -->
        <div class="total-bar glass">
          <div class="total-bar-inner">
            <div class="total-row">
              <span>Items ({{ (order.items || []).length }})</span>
              <span>RM {{ Number(order.total || 0).toFixed(2) }}</span>
            </div>
            <div class="total-divider" />
            <div class="total-row total-final">
              <span>Order Total</span>
              <span class="grad-text">RM {{ Number(order.total || 0).toFixed(2) }}</span>
            </div>
          </div>

          <button class="back-full-btn" @click="router.push('/admin/orders')">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Back to Orders
          </button>
          <button class="print-btn" @click="window.print()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="4" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M4 4V2.5A.5.5 0 0 1 4.5 2h5a.5.5 0 0 1 .5.5V4" stroke="currentColor" stroke-width="1.4"/><path d="M4 9h6M4 11h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            Print Receipt
          </button>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-page { display: flex; background: #030712; min-height: 100vh; }
.admin-main { margin-left: 256px; flex: 1; padding: 48px 40px; box-sizing: border-box; }

/* States */
.state-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 20px; color: #475569; font-size: 16px; }
.loader { width: 42px; height: 42px; border-radius: 50%; border: 3px solid rgba(59,130,246,0.2); border-top-color: #3b82f6; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.err { color: #f87171; }
.back-btn { padding: 10px 20px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.back-btn:hover { background: rgba(255,255,255,0.09); }

/* Header */
.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 40px; flex-wrap: wrap; }
.breadcrumb-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #475569; font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; margin-bottom: 10px; transition: color 0.2s; }
.breadcrumb-btn:hover { color: #60a5fa; }
.page-title { font-family: 'Orbitron', sans-serif; font-size: clamp(26px,4vw,52px); font-weight: 900; color: #f1f5f9; margin: 10px 0 8px; line-height: 1.1; }
.page-sub { color: #475569; font-size: 15px; margin: 0; }

/* Large status badge in header */
.status-badge-lg {
  padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.08em; flex-shrink: 0; margin-top: 48px;
}

/* Status badge (small) */
.status-badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.s-pending   { background: rgba(245,158,11,0.15); color: #fcd34d; border: 1px solid rgba(245,158,11,0.3); }
.s-processing{ background: rgba(59,130,246,0.15); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3); }
.s-shipping  { background: rgba(139,92,246,0.15); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.3); }
.s-delivered { background: rgba(16,185,129,0.15); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.3); }
.s-rejected  { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }

/* Info card */
.info-card { padding: 28px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.07); margin-bottom: 28px; }
.card-title { display: flex; align-items: center; gap: 8px; font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 800; color: #f1f5f9; margin: 0 0 24px; letter-spacing: 0.05em; }
.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.info-item { display: flex; flex-direction: column; gap: 6px; padding: 16px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); }
.info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #334155; }
.info-val { font-size: 14px; font-weight: 600; color: #f1f5f9; word-break: break-all; }
.info-val.mono { font-family: monospace; font-size: 12px; color: #60a5fa; }
.total-val { font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 900; }

/* Items section */
.items-section { margin-bottom: 24px; }
.section-heading { display: flex; align-items: center; gap: 8px; font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 800; color: #f1f5f9; margin: 0 0 16px; letter-spacing: 0.05em; }
.items-list { display: flex; flex-direction: column; gap: 14px; }

.item-card {
  position: relative; display: flex; align-items: center; gap: 24px;
  padding: 20px; border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.07);
  transition: border-color 0.3s;
}
.item-card:hover { border-color: rgba(59,130,246,0.25); }

.item-img-wrap {
  width: 110px; height: 110px; flex-shrink: 0; border-radius: 16px;
  background: radial-gradient(circle, rgba(59,130,246,0.08), rgba(3,7,18,0.6) 70%);
  padding: 12px; box-sizing: border-box;
  display: flex; align-items: center; justify-content: center;
}
.item-img { width: 100%; height: 100%; object-fit: contain; }

.item-details { flex: 1; }
.item-name { font-size: 17px; font-weight: 700; color: #f1f5f9; margin: 0 0 14px; }

.item-stats { display: flex; flex-direction: column; gap: 8px; }
.stat-row { display: flex; align-items: center; justify-content: space-between; }
.stat-key { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: #334155; }
.stat-val { font-size: 14px; font-weight: 700; color: #cbd5e1; }
.subtotal-row { padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); margin-top: 4px; }
.subtotal-val { font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 900; }

.qty-badge {
  position: absolute; top: 14px; right: 16px;
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white; font-size: 12px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}

/* Total bar */
.total-bar {
  padding: 24px 28px; border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.07);
  display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap;
}
.total-bar-inner { flex: 1; min-width: 200px; }
.total-row { display: flex; justify-content: space-between; align-items: center; font-size: 15px; color: #64748b; padding: 6px 0; }
.total-final { font-size: 18px; font-weight: 800; color: #f1f5f9; padding-top: 12px; }
.total-final .grad-text { font-family: 'Orbitron', sans-serif; font-size: 22px; font-weight: 900; }
.total-divider { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 8px 0; }

.back-full-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 22px; border-radius: 14px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
  color: #64748b; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
  flex-shrink: 0;
}
.back-full-btn:hover { background: rgba(255,255,255,0.09); color: #94a3b8; }

.print-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 22px; border-radius: 14px;
  background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25);
  color: #6ee7b7; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
  flex-shrink: 0;
}
.print-btn:hover { background: rgba(16,185,129,0.18); }

/* ── Print styles ────────────────────────────────────────────── */
@media print {
  .admin-page { display: block !important; }
  .admin-sidebar, .back-full-btn, .print-btn, .breadcrumb-btn { display: none !important; }
  .admin-main { margin-left: 0 !important; padding: 20px !important; }
  .page-title { font-size: 24px !important; color: #000 !important; }
  .grad-text  { color: #000 !important; background: none !important; -webkit-text-fill-color: #000 !important; }
  .info-card, .item-card, .total-bar { background: #fff !important; border: 1px solid #ddd !important; border-radius: 8px !important; box-shadow: none !important; }
  .info-item { background: #f9f9f9 !important; border: 1px solid #eee !important; }
  .info-label { color: #666 !important; }
  .info-val   { color: #000 !important; }
  .status-badge-lg, .status-badge { border: 1px solid #999 !important; color: #333 !important; background: #eee !important; }
  .item-name, .section-heading, .card-title, .total-final { color: #000 !important; }
  .total-bar-inner span { color: #000 !important; }
  * { print-color-adjust: exact !important; }
}

/* Responsive */
@media (max-width: 1024px) { .info-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 768px)  {
  .admin-main { margin-left: 0; padding: 20px; }
  .info-grid { grid-template-columns: 1fr; }
  .item-card { flex-direction: column; align-items: flex-start; }
  .item-img-wrap { width: 100%; height: 160px; }
  .page-header { flex-direction: column; }
  .status-badge-lg { margin-top: 0; }
}
</style>
