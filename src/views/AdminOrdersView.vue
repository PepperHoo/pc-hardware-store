<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import Toast from '../components/Toast.vue'
import { ref, onMounted, computed } from 'vue'

const orders = ref([])
const loading = ref(true)
const errorMessage = ref('')
const savingOrderId = ref(null)
const deletingOrderId = ref(null)
const toastRef = ref(null)

async function loadOrders() {
  try {
    loading.value = true
    const { getAll } = await import('../lib/api.js')
    orders.value = await getAll('orders')
  } catch (e) {
    console.log(e); errorMessage.value = 'Failed to load orders.'
  } finally { loading.value = false }
}

onMounted(loadOrders)

async function updateStatus(order) {
  try {
    savingOrderId.value = order.id
    const { update } = await import('../lib/api.js')
    await update('orders', order.id, { status: order.status })
    toastRef.value.showToastMessage('Order updated!', 'success')
  } catch (e) {
    toastRef.value.showToastMessage('Failed to update order', 'error')
  } finally { savingOrderId.value = null }
}

async function deleteOrder(id) {
  try {
    deletingOrderId.value = id
    const { remove } = await import('../lib/api.js')
    await remove('orders', id)
    orders.value = orders.value.filter(o => o.id !== id)
    toastRef.value.showToastMessage('Order deleted!', 'success')
  } catch (e) {
    toastRef.value.showToastMessage('Failed to delete order', 'error')
  } finally { deletingOrderId.value = null }
}

const totalRevenue    = computed(() => orders.value.reduce((s,o) => s+Number(o.total||0),0).toFixed(2))
const pendingOrders   = computed(() => orders.value.filter(o => o.status==='Pending').length)
const deliveredOrders = computed(() => orders.value.filter(o => o.status==='Delivered').length)
</script>

<template>
  <div class="admin-page">
    <AdminNavbar />

    <main class="admin-main">
      <div v-if="loading" class="state-screen"><div class="loader" /><p>Loading orders…</p></div>
      <div v-else-if="errorMessage" class="state-screen"><p class="err">{{ errorMessage }}</p></div>

      <div v-else>
        <!-- Header -->
        <div class="page-header">
          <span class="kicker">Admin</span>
          <h1 class="page-title">Order <span class="grad-text">Management</span></h1>
          <p class="page-sub">Monitor and update all customer purchases.</p>
        </div>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-pill glass">
            <div class="sp-icon" style="color:#60a5fa">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 2h2.5l2 7h7l1.5-4H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/><circle cx="14" cy="16" r="1.5" fill="currentColor"/></svg>
            </div>
            <div><p class="sp-label">Total Orders</p><p class="sp-val" style="color:#93c5fd">{{ orders.length }}</p></div>
          </div>
          <div class="stat-pill glass">
            <div class="sp-icon" style="color:#fcd34d">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 5v4l2.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
            <div><p class="sp-label">Pending</p><p class="sp-val" style="color:#fcd34d">{{ pendingOrders }}</p></div>
          </div>
          <div class="stat-pill glass">
            <div class="sp-icon" style="color:#6ee7b7">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l4 4 8-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div><p class="sp-label">Delivered</p><p class="sp-val" style="color:#6ee7b7">{{ deliveredOrders }}</p></div>
          </div>
          <div class="stat-pill glass">
            <div class="sp-icon" style="color:#c4b5fd">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 5v8M6.5 7.5C6.5 6.12 7.62 5 9 5s2.5.95 2.5 2.5c0 1.5-1.5 1.8-2.5 2.5-1 .7-2.5 1.2-2.5 3h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            </div>
            <div><p class="sp-label">Revenue</p><p class="sp-val grad-text">RM {{ totalRevenue }}</p></div>
          </div>
        </div>

        <!-- Table -->
        <div class="table-card glass">
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="orders.length === 0"><td colspan="6" class="empty-row">No orders found.</td></tr>
                <tr v-for="order in orders" :key="order.id">
                  <td><span class="order-id">#{{ order.id }}</span></td>
                  <td><span class="customer-email">{{ order.userEmail }}</span></td>
                  <td><span class="items-count">{{ order.items?.length || 0 }} items</span></td>
                  <td><span class="price-val">RM {{ Number(order.total||0).toFixed(2) }}</span></td>
                  <td>
                    <div class="status-cell">
                      <span :class="['status-badge', `s-${order.status?.toLowerCase()}`]">{{ order.status }}</span>
                      <select v-model="order.status" class="status-select">
                        <option>Pending</option>
                        <option>Processing</option>
                        <option>Shipping</option>
                        <option>Delivered</option>
                        <option>Rejected</option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <div class="action-btns">
                      <router-link :to="`/admin/orders/${order.id}`" class="btn-view">View</router-link>
                      <button class="btn-save" @click="updateStatus(order)" :disabled="savingOrderId===order.id">
                        {{ savingOrderId===order.id ? '…' : 'Save' }}
                      </button>
                      <button class="btn-del" @click="deleteOrder(order.id)" :disabled="deletingOrderId===order.id">
                        {{ deletingOrderId===order.id ? '…' : 'Del' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

    <Toast ref="toastRef" />
  </div>
</template>

<style scoped>
.admin-page { display: flex; background: #030712; min-height: 100vh; }
.admin-main { margin-left: 256px; flex: 1; padding: 48px 40px; box-sizing: border-box; }

.state-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; color: #475569; }
.loader { width: 40px; height: 40px; border-radius: 50%; border: 3px solid rgba(59,130,246,0.2); border-top-color: #3b82f6; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.err { color: #f87171; }

.page-header { margin-bottom: 36px; }
.page-title { font-family: 'Orbitron', sans-serif; font-size: clamp(26px,4vw,48px); font-weight: 900; color: #f1f5f9; margin: 12px 0 8px; line-height: 1.1; }
.page-sub { color: #475569; font-size: 15px; margin: 0; }

/* Stats row */
.stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
.stat-pill { display: flex; align-items: center; gap: 14px; padding: 18px 20px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.07); }
.sp-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sp-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #334155; margin: 0 0 4px; }
.sp-val { font-family: 'Orbitron', sans-serif; font-size: 22px; font-weight: 900; margin: 0; }

/* Table */
.table-card { border-radius: 24px; border: 1px solid rgba(255,255,255,0.07); overflow: hidden; }
.table-scroll { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table thead tr { background: rgba(59,130,246,0.07); border-bottom: 1px solid rgba(255,255,255,0.07); }
.data-table thead th { padding: 16px 18px; text-align: left; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #475569; }
.data-table tbody tr { border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.2s; }
.data-table tbody tr:hover { background: rgba(59,130,246,0.04); }
.data-table td { padding: 16px 18px; vertical-align: middle; }
.empty-row { text-align: center; color: #334155; padding: 48px !important; }

.order-id { font-family: 'Orbitron', sans-serif; font-size: 12px; font-weight: 700; color: #60a5fa; }
.customer-email { font-size: 13px; color: #cbd5e1; }
.items-count { font-size: 13px; color: #64748b; }
.price-val { font-size: 14px; font-weight: 700; color: #60a5fa; }

.status-cell { display: flex; flex-direction: column; gap: 8px; }
.status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.s-pending   { background: rgba(245,158,11,0.15); color: #fcd34d; border: 1px solid rgba(245,158,11,0.3); }
.s-processing{ background: rgba(59,130,246,0.15); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3); }
.s-shipping  { background: rgba(139,92,246,0.15); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.3); }
.s-delivered { background: rgba(16,185,129,0.15); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.3); }
.s-rejected  { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }

.status-select {
  padding: 7px 10px; border-radius: 10px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: #f1f5f9; font-size: 12px; cursor: pointer; outline: none; width: 130px;
}

.action-btns { display: flex; gap: 6px; }
.btn-view, .btn-save, .btn-del {
  padding: 7px 12px; border-radius: 9px; border: none;
  font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center;
}
.btn-view { background: rgba(16,185,129,0.15); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.25); }
.btn-view:hover { background: rgba(16,185,129,0.25); }
.btn-save { background: rgba(59,130,246,0.15); color: #93c5fd; border: 1px solid rgba(59,130,246,0.25); }
.btn-save:hover { background: rgba(59,130,246,0.25); }
.btn-del  { background: rgba(239,68,68,0.12); color: #fca5a5; border: 1px solid rgba(239,68,68,0.2); }
.btn-del:hover  { background: rgba(239,68,68,0.22); }
button:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 1100px) { .stats-row { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 768px)  { .admin-main { margin-left: 0; padding: 20px; } }
</style>
