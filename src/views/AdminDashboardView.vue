<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import { ref, computed, onMounted, nextTick } from 'vue'

const totalProducts  = ref(0)
const totalOrders    = ref(0)
const totalUsers     = ref(0)
const totalIncome    = ref(0)
const latestProducts = ref([])
const latestOrders   = ref([])
const allOrders      = ref([])
const allProducts    = ref([])
const loading        = ref(true)
const errorMessage   = ref('')

// Chart canvas refs
const revenueCanvas  = ref(null)
const statusCanvas   = ref(null)
const categoryCanvas = ref(null)

async function loadDashboard() {
  try {
    loading.value = true
    const { getAll } = await import('../lib/api.js')
    const [products, orders, users] = await Promise.all([getAll('products'), getAll('orders'), getAll('users')])
    totalProducts.value  = products.length
    totalOrders.value    = orders.length
    totalUsers.value     = users.length
    totalIncome.value    = orders.reduce((s, o) => s + Number(o.total || 0), 0)
    latestProducts.value = products.slice(-5).reverse()
    latestOrders.value   = orders.slice(-5).reverse()
    allOrders.value      = orders
    allProducts.value    = products
    await nextTick()
    buildCharts()
  } catch (e) {
    console.log(e)
    errorMessage.value = 'Failed to load dashboard data.'
  } finally {
    loading.value = false
  }
}

function buildCharts() {
  if (typeof window === 'undefined') return
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
  script.onload = () => renderCharts()
  if (window.Chart) { renderCharts(); return }
  document.head.appendChild(script)
}

function renderCharts() {
  const Chart = window.Chart

  // ── Revenue by month (last 6 months) ───────────────────────────────
  const now     = new Date()
  const months  = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { label: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }
  })
  const revenueByMonth = months.map(m =>
    allOrders.value
      .filter(o => { const d = new Date(o.date || o.created_at || 0); return d.getFullYear() === m.year && d.getMonth() === m.month })
      .reduce((s, o) => s + Number(o.total || 0), 0)
  )

  if (revenueCanvas.value) {
    new Chart(revenueCanvas.value, {
      type: 'line',
      data: {
        labels: months.map(m => m.label),
        datasets: [{
          label: 'Revenue (RM)',
          data: revenueByMonth,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.1)',
          borderWidth: 2, tension: 0.4, fill: true,
          pointBackgroundColor: '#3b82f6', pointRadius: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 12 } } } },
        scales: {
          x: { ticks: { color: '#475569' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#475569', callback: v => 'RM ' + v }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    })
  }

  // ── Orders by status ────────────────────────────────────────────────
  const statuses = ['Pending', 'Processing', 'Shipping', 'Delivered', 'Rejected']
  const statusCounts = statuses.map(s => allOrders.value.filter(o => o.status === s).length)

  if (statusCanvas.value) {
    new Chart(statusCanvas.value, {
      type: 'doughnut',
      data: {
        labels: statuses,
        datasets: [{
          data: statusCounts,
          backgroundColor: ['rgba(245,158,11,0.8)','rgba(59,130,246,0.8)','rgba(139,92,246,0.8)','rgba(16,185,129,0.8)','rgba(239,68,68,0.8)'],
          borderColor: '#030712', borderWidth: 3,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 16 } } }
      }
    })
  }

  // ── Products by category ────────────────────────────────────────────
  const categories = ['processor','motherboard','gpu','ram','storage','psu','cooler','casing']
  const catCounts  = categories.map(c => allProducts.value.filter(p => p.category === c).length)
  const catColors  = ['rgba(59,130,246,0.8)','rgba(139,92,246,0.8)','rgba(245,158,11,0.8)','rgba(168,85,247,0.8)','rgba(6,182,212,0.8)','rgba(239,68,68,0.8)','rgba(56,189,248,0.8)','rgba(148,163,184,0.8)']

  if (categoryCanvas.value) {
    new Chart(categoryCanvas.value, {
      type: 'bar',
      data: {
        labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
        datasets: [{ label: 'Products', data: catCounts, backgroundColor: catColors, borderRadius: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#475569' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#475569', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    })
  }
}

onMounted(loadDashboard)
</script>

<template>
  <div class="admin-page">
    <AdminNavbar />

    <main class="admin-main">

      <div v-if="loading" class="state-screen">
        <div class="loader" /><p>Loading dashboard…</p>
      </div>
      <div v-else-if="errorMessage" class="state-screen">
        <p class="err">{{ errorMessage }}</p>
      </div>

      <div v-else>
        <!-- Header -->
        <div class="page-header">
          <div>
            <span class="kicker">Admin Panel</span>
            <h1 class="page-title">Dashboard <span class="grad-text">Overview</span></h1>
            <p class="page-sub">Monitor your PC hardware store performance in real time.</p>
          </div>
          <div class="quick-actions">
            <router-link to="/admin/products" class="qa-btn">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1v13M1 7.5h13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              Add Product
            </router-link>
            <router-link to="/admin/orders" class="qa-btn qa-secondary">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="2" width="13" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M4 6h7M4 9h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              View Orders
            </router-link>
            <router-link to="/admin/homepage" class="qa-btn qa-secondary">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 7L7.5 1 14 7v7H9V9H6v5H1V7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
              Edit Homepage
            </router-link>
          </div>
        </div>

        <!-- Stat cards -->
        <div class="stats-grid">
          <div class="stat-card glass">
            <div class="stat-icon" style="background:rgba(59,130,246,0.15);color:#3b82f6">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="5" width="18" height="13" rx="2.5" stroke="currentColor" stroke-width="1.8"/><rect x="5" y="9" width="5" height="3" rx="1" fill="currentColor" opacity=".6"/><rect x="12" y="9" width="6" height="3" rx="1" fill="currentColor" opacity=".6"/></svg>
            </div>
            <div class="stat-body">
              <p class="stat-label">Products</p>
              <p class="stat-val grad-text-blue">{{ totalProducts }}</p>
              <p class="stat-hint">Total inventory items</p>
            </div>
          </div>
          <div class="stat-card glass">
            <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:#f59e0b">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M2 2h3l2.5 9h9l2-6H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="19" r="1.5" fill="currentColor"/><circle cx="16" cy="19" r="1.5" fill="currentColor"/></svg>
            </div>
            <div class="stat-body">
              <p class="stat-label">Orders</p>
              <p class="stat-val" style="color:#fcd34d">{{ totalOrders }}</p>
              <p class="stat-hint">All time orders</p>
            </div>
          </div>
          <div class="stat-card glass">
            <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:#10b981">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="7" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M2 20c0-4.418 4.03-8 9-8s9 3.582 9 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </div>
            <div class="stat-body">
              <p class="stat-label">Users</p>
              <p class="stat-val" style="color:#6ee7b7">{{ totalUsers }}</p>
              <p class="stat-hint">Registered accounts</p>
            </div>
          </div>
          <div class="stat-card glass">
            <div class="stat-icon" style="background:rgba(139,92,246,0.15);color:#8b5cf6">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M11 6v10M8 8.5C8 7.12 9.34 6 11 6s3 1.12 3 2.5c0 1.5-1.5 2-3 2.5-1.5.5-3 1-3 2.5C8 14.88 9.34 16 11 16s3-1.12 3-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
            <div class="stat-body">
              <p class="stat-label">Revenue</p>
              <p class="stat-val grad-text">RM {{ totalIncome.toFixed(0) }}</p>
              <p class="stat-hint">Total sales income</p>
            </div>
          </div>
        </div>

        <!-- Charts row -->
        <div class="charts-row">
          <!-- Revenue line chart -->
          <div class="chart-card glass">
            <h3 class="chart-title">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 11 5 6l3 3 5-7" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Revenue (Last 6 Months)
            </h3>
            <div class="chart-wrap"><canvas ref="revenueCanvas" /></div>
          </div>

          <!-- Status doughnut -->
          <div class="chart-card glass">
            <h3 class="chart-title">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#f59e0b" stroke-width="1.5"/><path d="M7 7l4-4" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/></svg>
              Orders by Status
            </h3>
            <div class="chart-wrap chart-wrap--sm"><canvas ref="statusCanvas" /></div>
          </div>
        </div>

        <!-- Category bar chart -->
        <div class="chart-card glass" style="margin-bottom:24px">
          <h3 class="chart-title">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="7" width="2" height="6" rx="1" fill="#8b5cf6"/><rect x="5" y="4" width="2" height="9" rx="1" fill="#3b82f6"/><rect x="9" y="2" width="2" height="11" rx="1" fill="#10b981"/></svg>
            Products by Category
          </h3>
          <div class="chart-wrap"><canvas ref="categoryCanvas" /></div>
        </div>

        <!-- Bottom grid -->
        <div class="bottom-grid">
          <div class="activity-card glass">
            <h2 class="ac-title">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="#3b82f6" stroke-width="1.5"/><rect x="3" y="6" width="4" height="2" rx=".5" fill="#3b82f6" opacity=".6"/><rect x="9" y="6" width="5" height="2" rx=".5" fill="#8b5cf6" opacity=".6"/></svg>
              Latest Products
            </h2>
            <div v-if="latestProducts.length === 0" class="ac-empty">No products yet.</div>
            <div v-for="p in latestProducts" :key="p.id" class="ac-row">
              <div class="ac-dot" style="background:#3b82f6" />
              <span class="ac-name">{{ p.name }}</span>
              <span class="ac-price">RM {{ Number(p.price).toFixed(0) }}</span>
            </div>
          </div>

          <div class="activity-card glass">
            <h2 class="ac-title">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="2" stroke="#f59e0b" stroke-width="1.5"/><path d="M4 6h8M4 9h5" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/></svg>
              Latest Orders
            </h2>
            <div v-if="latestOrders.length === 0" class="ac-empty">No orders yet.</div>
            <div v-for="o in latestOrders" :key="o.id" class="ac-row">
              <div class="ac-dot" style="background:#f59e0b" />
              <span class="ac-name">Order #{{ o.id }}</span>
              <span class="ac-price" style="color:#fcd34d">RM {{ Number(o.total).toFixed(0) }}</span>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
.admin-page { display: flex; background: #030712; min-height: 100vh; }
.admin-main { margin-left: 256px; flex: 1; padding: 48px 40px; box-sizing: border-box; max-width: calc(100vw - 256px); }

.state-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; color: #475569; }
.loader { width: 40px; height: 40px; border-radius: 50%; border: 3px solid rgba(59,130,246,0.2); border-top-color: #3b82f6; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.err { color: #f87171; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 24px; margin-bottom: 32px; }
.page-title { font-family: 'Orbitron', sans-serif; font-size: clamp(28px,4vw,52px); font-weight: 900; color: #f1f5f9; margin: 14px 0 8px; line-height: 1.1; }
.page-sub { color: #475569; font-size: 15px; margin: 0; }
.quick-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; padding-top: 20px; }
.qa-btn { display: inline-flex; align-items: center; gap: 7px; padding: 11px 18px; border-radius: 12px; background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; font-size: 13px; font-weight: 700; text-decoration: none; transition: all 0.3s; }
.qa-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(37,99,235,0.35); }
.qa-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; }
.qa-secondary:hover { background: rgba(255,255,255,0.09); color: #f1f5f9; box-shadow: none; }

.stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; margin-bottom: 24px; }
.stat-card { display: flex; align-items: center; gap: 18px; padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.07); transition: transform 0.3s, border-color 0.3s; }
.stat-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.12); }
.stat-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-body { flex: 1; }
.stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #334155; margin: 0 0 4px; }
.stat-val { font-family: 'Orbitron', sans-serif; font-size: 28px; font-weight: 900; margin: 0 0 4px; }
.stat-hint { font-size: 11px; color: #334155; margin: 0; }

/* Charts */
.charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px; }
.chart-card { padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.07); }
.chart-title { display: flex; align-items: center; gap: 8px; font-family: 'Orbitron', sans-serif; font-size: 12px; font-weight: 800; color: #94a3b8; margin: 0 0 20px; letter-spacing: 0.08em; text-transform: uppercase; }
.chart-wrap { height: 220px; position: relative; }
.chart-wrap--sm { height: 200px; }

/* Activity */
.bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.activity-card { padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.07); }
.ac-title { display: flex; align-items: center; gap: 8px; font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 800; color: #f1f5f9; margin: 0 0 20px; letter-spacing: 0.05em; }
.ac-empty { color: #334155; font-size: 14px; padding: 12px 0; }
.ac-row { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); margin-bottom: 8px; transition: background 0.2s; }
.ac-row:hover { background: rgba(255,255,255,0.05); }
.ac-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.ac-name { flex: 1; font-size: 13px; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ac-price { font-size: 13px; font-weight: 700; color: #60a5fa; flex-shrink: 0; }

@media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2,1fr); } .charts-row { grid-template-columns: 1fr; } }
@media (max-width: 900px) { .bottom-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .admin-main { margin-left: 0; padding: 20px; max-width: 100%; } .page-header { flex-direction: column; } }
</style>
