<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import { ref, onMounted } from 'vue'

const totalProducts = ref(0)
const totalOrders = ref(0)
const totalUsers = ref(0)
const totalIncome = ref(0)

const latestProducts = ref([])
const latestOrders = ref([])

const loading = ref(true)
const errorMessage = ref('')

// LOAD DASHBOARD DATA
async function loadDashboard() {

  try {

    loading.value = true

    const { getAll } = await import('../lib/api.js')

    const [
      products,
      orders,
      users
    ] = await Promise.all([
      getAll('products'),
      getAll('orders'),
      getAll('users')
    ])

    // TOTAL COUNTS
    totalProducts.value =
      products.length

    totalOrders.value =
      orders.length

    totalUsers.value =
      users.length

    // LATEST ITEMS
    latestProducts.value =
      products.slice(-4).reverse()

    latestOrders.value =
      orders.slice(-4).reverse()

    // TOTAL INCOME
    totalIncome.value =
      orders.reduce(

        (sum, order) =>

          sum + Number(order.total || 0),

        0
      )

  } catch (error) {

    console.log(error)

    errorMessage.value =
      'Failed to load dashboard data.'

  } finally {

    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div>

    <AdminNavbar />

    <div class="admin-dashboard-container">

      <div class="admin-dashboard-wrapper">

        <!-- LOADING -->
        <div
          v-if="loading"
          class="loading-box"
        >
          Loading dashboard...
        </div>

        <!-- ERROR -->
        <div
          v-else-if="errorMessage"
          class="error-box"
        >
          {{ errorMessage }}
        </div>

        <!-- DASHBOARD -->
        <div v-else>

          <!-- HEADER -->
          <div class="dashboard-header">

            <h1>
              Welcome back, Admin 👋
            </h1>

            <p>
              Monitor your PC hardware store performance
            </p>

          </div>

          <!-- QUICK ACTIONS -->
          <div class="quick-actions">

            <router-link
              to="/admin/products"
              class="action-btn"
            >
              ➕ Add Product
            </router-link>

            <router-link
              to="/admin/orders"
              class="action-btn"
            >
              🖨 Print Labels
            </router-link>

            <router-link
              to="/admin/homepage"
              class="action-btn"
            >
              🖼 Update Banner
            </router-link>

          </div>

          <!-- STATS -->
          <div class="stats-grid">

            <!-- PRODUCTS -->
            <div class="admin-dashboard-card">

              <div class="dashboard-icon">
                📦
              </div>

              <h2>
                Products
              </h2>

              <p>
                {{ totalProducts }} Items
              </p>

            </div>

            <!-- ORDERS -->
            <div class="admin-dashboard-card">

              <div class="dashboard-icon">
                🛒
              </div>

              <h2>
                Orders
              </h2>

              <p>
                {{ totalOrders }} Orders
              </p>

            </div>

            <!-- USERS -->
            <div class="admin-dashboard-card">

              <div class="dashboard-icon">
                👥
              </div>

              <h2>
                Users
              </h2>

              <p>
                {{ totalUsers }} Users
              </p>

            </div>

            <!-- REVENUE -->
            <div class="admin-dashboard-card">

              <div class="dashboard-icon">
                💰
              </div>

              <h2>
                Revenue
              </h2>

              <p>
                RM {{ totalIncome.toFixed(2) }}
              </p>

            </div>

          </div>

          <!-- LOWER SECTION -->
          <div class="bottom-grid">

            <!-- PRODUCTS -->
            <div class="admin-activity-card">

              <h2>
                🖥 Latest Products
              </h2>

              <div
                v-if="latestProducts.length === 0"
                class="empty-state"
              >
                No products yet
              </div>

              <div
                v-for="product in latestProducts"
                :key="product.id"
                class="activity-item"
              >

                {{ product.name }}

              </div>

            </div>

            <!-- ORDERS -->
            <div class="admin-activity-card">

              <h2>
                🛒 Latest Orders
              </h2>

              <div
                v-if="latestOrders.length === 0"
                class="empty-state"
              >
                No orders yet
              </div>

              <div
                v-for="order in latestOrders"
                :key="order.id"
                class="activity-item"
              >

                <span>
                  Order #{{ order.id }}
                </span>

                <span class="order-total">
                  RM {{ Number(order.total).toFixed(2) }}
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>

/* CONTAINER */
.admin-dashboard-container {

  margin-left: 260px;

  padding: 40px;

  min-height: 100vh;

  background:
    linear-gradient(
      to bottom,
      #0f172a,
      #111827
    );

  box-sizing: border-box;
}

/* WRAPPER */
.admin-dashboard-wrapper {

  width: 100%;

  max-width: 1400px;

  margin: 0 auto;
}

/* HEADER */
.dashboard-header {

  margin-bottom: 28px;
}

.dashboard-header h1 {

  font-size: 48px;

  font-weight: 800;

  margin-bottom: 10px;

  color: #f8fafc;

  letter-spacing: -0.5px;
}

.dashboard-header p {

  font-size: 17px;

  color: #94a3b8;
}

/* QUICK ACTIONS */
.quick-actions {

  display: flex;

  gap: 14px;

  flex-wrap: wrap;

  margin-bottom: 36px;
}

/* BUTTON */
.action-btn {

  padding: 13px 22px;

  border-radius: 12px;

  background:
    linear-gradient(135deg, #2563eb, #3b82f6);

  color: white;

  font-size: 15px;

  font-weight: 700;

  text-decoration: none;

  transition: 0.25s;

  display: inline-flex;

  align-items: center;

  gap: 8px;

  box-shadow:
    0 6px 16px rgba(37,99,235,0.22);
}

.action-btn:hover {

  transform: translateY(-2px);

  box-shadow:
    0 10px 22px rgba(37,99,235,0.32);
}

/* STATS GRID */
.stats-grid {

  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 22px;

  margin-top: 30px;
}

/* DASHBOARD CARD */
.admin-dashboard-card {

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.97),
      rgba(15,23,42,0.97)
    );

  border-radius: 20px;

  padding: 28px 24px;

  border:
    1px solid rgba(148,163,184,0.10);

  box-shadow:
    0 8px 24px rgba(0,0,0,0.22);

  transition: 0.30s cubic-bezier(0.4,0,0.2,1);

  position: relative;

  overflow: hidden;

  min-height: 200px;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: center;

  text-align: center;
}

/* TOP ACCENT */
.admin-dashboard-card::before {

  content: '';

  position: absolute;

  top: 0;

  left: 0;

  width: 100%;

  height: 3px;

  background:
    linear-gradient(
      to right,
      #2563eb,
      #7c3aed
    );
}

.admin-dashboard-card:hover {

  transform: translateY(-5px);

  border-color: rgba(59,130,246,0.22);

  box-shadow:
    0 16px 38px rgba(0,0,0,0.30);
}

/* ICON */
.dashboard-icon {

  font-size: 48px;

  margin-bottom: 16px;
}

/* TITLE */
.admin-dashboard-card h2 {

  font-size: 26px;

  font-weight: 700;

  margin-bottom: 10px;

  color: #94a3b8;
}

/* TEXT */
.admin-dashboard-card p {

  font-size: 32px;

  font-weight: 800;

  color: #93c5fd;

  margin: 0;
}

/* LOWER GRID */
.bottom-grid {

  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 22px;

  margin-top: 28px;
}

/* ACTIVITY CARD */
.admin-activity-card {

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.97),
      rgba(15,23,42,0.97)
    );

  border-radius: 20px;

  padding: 26px;

  border:
    1px solid rgba(148,163,184,0.10);

  box-shadow:
    0 8px 24px rgba(0,0,0,0.20);
}

.admin-activity-card h2 {

  margin-bottom: 20px;

  font-size: 24px;

  font-weight: 700;

  color: #f1f5f9;
}

/* ITEM */
.activity-item {

  background:
    rgba(59,130,246,0.08);

  border:
    1px solid rgba(59,130,246,0.14);

  color: #93c5fd;

  padding: 14px 18px;

  border-radius: 12px;

  margin-bottom: 10px;

  display: flex;

  justify-content: space-between;

  align-items: center;

  font-weight: 600;

  font-size: 15px;

  transition: 0.2s;
}

.activity-item:hover {

  background: rgba(59,130,246,0.13);
}

/* ORDER TOTAL */
.order-total {

  font-weight: 800;

  color: #bfdbfe;
}

/* EMPTY */
.empty-state {

  color: #94a3b8;

  padding: 14px 0;

  font-size: 15px;
}

/* LOADING / ERROR */
.loading-box,
.error-box {

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.97),
      rgba(15,23,42,0.97)
    );

  border:
    1px solid rgba(148,163,184,0.10);

  padding: 30px;

  border-radius: 20px;

  text-align: center;

  font-size: 18px;

  color: #94a3b8;
}

.error-box {

  color: #f87171;

  border-color: rgba(248,113,113,0.20);
}

/* RESPONSIVE */
@media (max-width: 1200px) {

  .stats-grid {

    grid-template-columns:
      repeat(2, 1fr);
  }
}

@media (max-width: 768px) {

  .admin-dashboard-container {

    margin-left: 0;

    padding: 20px;
  }

  .dashboard-header h1 {

    font-size: 34px;
  }

  .stats-grid,
  .bottom-grid {

    grid-template-columns: 1fr;
  }

  .quick-actions {

    flex-direction: column;
  }

  .action-btn {

    width: 100%;

    justify-content: center;
  }
}
</style>