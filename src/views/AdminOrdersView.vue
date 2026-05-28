<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import Toast from '../components/Toast.vue'

import {
  ref,
  onMounted,
  computed
} from 'vue'

const orders = ref([])

const loading = ref(true)

const errorMessage = ref('')

const savingOrderId = ref(null)

const deletingOrderId = ref(null)

const toastRef = ref(null)

// LOAD ORDERS
async function loadOrders() {

  try {

    loading.value = true

    const { getAll } = await import('../lib/api.js')

    orders.value = await getAll('orders')

  } catch (error) {

    console.log(error)

    errorMessage.value =
      'Failed to load orders.'

  } finally {

    loading.value = false
  }
}

onMounted(() => {
  loadOrders()
})

// UPDATE STATUS
async function updateStatus(order) {

  try {

    savingOrderId.value =
      order.id

    const { update } = await import('../lib/api.js')

    await update('orders', order.id, { status: order.status })

    toastRef.value
      .showToastMessage(
        'Order updated successfully!',
        'success'
      )

  } catch (error) {

    console.log(error)

    toastRef.value
      .showToastMessage(
        'Failed to update order',
        'error'
      )

  } finally {

    savingOrderId.value = null
  }
}

// DELETE ORDER
async function deleteOrder(id) {

  try {

    deletingOrderId.value = id

    const { remove } = await import('../lib/api.js')

    await remove('orders', id)

    orders.value =
      orders.value.filter(

        order =>
          order.id !== id

      )

    toastRef.value
      .showToastMessage(
        'Order deleted successfully!',
        'success'
      )

  } catch (error) {

    console.log(error)

    toastRef.value
      .showToastMessage(
        'Failed to delete order',
        'error'
      )

  } finally {

    deletingOrderId.value = null
  }
}

// TOTAL REVENUE
const totalRevenue = computed(() => {

  return orders.value
    .reduce(

      (sum, order) =>

        sum +
        Number(order.total || 0),

      0
    )
    .toFixed(2)
})

// PENDING COUNT
const pendingOrders = computed(() => {

  return orders.value.filter(

    order =>

      order.status ===
      'Pending'

  ).length
})

// DELIVERED COUNT
const deliveredOrders = computed(() => {

  return orders.value.filter(

    order =>

      order.status ===
      'Delivered'

  ).length
})

// STATUS CLASS
function getStatusClass(status) {

  return status
    ?.toLowerCase() || ''
}
</script>

<template>
  <div>

    <AdminNavbar />

    <div class="admin-orders-container">

      <!-- LOADING -->
      <div
        v-if="loading"
        class="status-box"
      >
        Loading orders...
      </div>

      <!-- ERROR -->
      <div
        v-else-if="errorMessage"
        class="error-box"
      >
        {{ errorMessage }}
      </div>

      <!-- MAIN -->
      <div v-else>

        <!-- HEADER -->
        <div class="admin-orders-header">

          <h1>
            Order Management
          </h1>

          <p>
            Monitor and manage customer purchases
          </p>

        </div>

        <!-- SUMMARY -->
        <div
          class="
            admin-orders-stats-grid
          "
        >

          <!-- TOTAL -->
          <div
            class="
              admin-orders-stat-card
              blue
            "
          >

            <div
              class="
                admin-orders-stat-icon
              "
            >
              🛒
            </div>

            <div>

              <h3>
                Total Orders
              </h3>

              <p>
                {{ orders.length }}
              </p>

            </div>

          </div>

          <!-- PENDING -->
          <div
            class="
              admin-orders-stat-card
              orange
            "
          >

            <div
              class="
                admin-orders-stat-icon
              "
            >
              ⏳
            </div>

            <div>

              <h3>
                Pending
              </h3>

              <p>
                {{ pendingOrders }}
              </p>

            </div>

          </div>

          <!-- DELIVERED -->
          <div
            class="
              admin-orders-stat-card
              green
            "
          >

            <div
              class="
                admin-orders-stat-icon
              "
            >
              ✅
            </div>

            <div>

              <h3>
                Delivered
              </h3>

              <p>
                {{ deliveredOrders }}
              </p>

            </div>

          </div>

          <!-- REVENUE -->
          <div
            class="
              admin-orders-stat-card
              purple
            "
          >

            <div
              class="
                admin-orders-stat-icon
              "
            >
              💰
            </div>

            <div>

              <h3>
                Revenue
              </h3>

              <p>
                RM {{ totalRevenue }}
              </p>

            </div>

          </div>

        </div>

        <!-- TABLE -->
        <div
          class="
            admin-orders-table-container
          "
        >

          <table
            class="admin-orders-table"
          >

            <thead>

              <tr>

                <th>
                  Order ID
                </th>

                <th>
                  Customer
                </th>

                <th>
                  Items
                </th>

                <th>
                  Total
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              <!-- EMPTY -->
              <tr
                v-if="
                  orders.length === 0
                "
              >

                <td
                  colspan="6"
                  class="empty-row"
                >
                  No orders found
                </td>

              </tr>

              <!-- ORDERS -->
              <tr
                v-for="
                  order in orders
                "
                :key="order.id"
              >

                <!-- ID -->
                <td>
                  #{{ order.id }}
                </td>

                <!-- EMAIL -->
                <td
                  class="
                    admin-orders-email
                  "
                >
                  {{ order.userEmail }}
                </td>

                <!-- ITEMS -->
                <td>

                  {{
                    order.items?.length || 0
                  }}

                </td>

                <!-- TOTAL -->
                <td
                  class="
                    admin-orders-total-price
                  "
                >

                  RM

                  {{
                    Number(
                      order.total || 0
                    ).toFixed(2)
                  }}

                </td>

                <!-- STATUS -->
                <td>

                  <div
                    class="
                      admin-orders-status-wrapper
                    "
                  >

                    <div
                      class="
                        admin-orders-status-badge
                      "
                      :class="
                        getStatusClass(
                          order.status
                        )
                      "
                    >

                      {{ order.status }}

                    </div>

                    <select
                      v-model="
                        order.status
                      "
                    >

                      <option>
                        Pending
                      </option>

                      <option>
                        Processing
                      </option>

                      <option>
                        Shipping
                      </option>

                      <option>
                        Delivered
                      </option>

                      <option>
                        Rejected
                      </option>

                    </select>

                  </div>

                </td>

                <!-- ACTIONS -->
                <td>

                  <div
                    class="
                      admin-orders-actions
                    "
                  >

                    <!-- VIEW -->
                    <router-link
                      :to="
                        `/admin/orders/${order.id}`
                      "
                    >

                      <button
                        class="
                          admin-orders-view-btn
                        "
                      >
                        View
                      </button>

                    </router-link>

                    <!-- SAVE -->
                    <button
                      class="
                        admin-orders-save-btn
                      "
                      @click="
                        updateStatus(order)
                      "
                      :disabled="
                        savingOrderId ===
                        order.id
                      "
                    >

                      {{

                        savingOrderId ===
                        order.id

                          ? 'Saving...'

                          : 'Save'

                      }}

                    </button>

                    <!-- DELETE -->
                    <button
                      class="
                        admin-orders-delete-btn
                      "
                      @click="
                        deleteOrder(order.id)
                      "
                      :disabled="
                        deletingOrderId ===
                        order.id
                      "
                    >

                      {{

                        deletingOrderId ===
                        order.id

                          ? 'Deleting...'

                          : 'Delete'

                      }}

                    </button>

                  </div>

                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </div>

    </div>

    <Toast ref="toastRef" />

  </div>
</template>

<style scoped>

/* CONTAINER */
.admin-orders-container {

  margin-left: 260px;

  min-height: 100vh;

  padding: 40px;

  background:
    linear-gradient(
      to bottom,
      #0f172a,
      #111827
    );

  box-sizing: border-box;
}

/* HEADER */
.admin-orders-header {

  margin-bottom: 32px;
}

.admin-orders-header h1 {

  font-size: 48px;

  font-weight: 800;

  margin-bottom: 10px;

  color: #f8fafc;

  letter-spacing: -0.5px;
}

.admin-orders-header p {

  color: #94a3b8;

  font-size: 17px;
}

/* STATS GRID */
.admin-orders-stats-grid {

  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(240px,1fr)
    );

  gap: 20px;

  margin-bottom: 32px;
}

/* STAT CARD */
.admin-orders-stat-card {

  display: flex;

  align-items: center;

  gap: 20px;

  border-radius: 18px;

  padding: 24px 28px;

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.97),
      rgba(15,23,42,0.97)
    );

  border:
    1px solid rgba(148,163,184,0.10);

  box-shadow:
    0 8px 24px rgba(0,0,0,0.22);

  transition: 0.30s cubic-bezier(0.4,0,0.2,1);
}

.admin-orders-stat-card:hover {

  transform: translateY(-4px);

  box-shadow:
    0 14px 34px rgba(0,0,0,0.30);
}

/* ICON */
.admin-orders-stat-icon {

  font-size: 42px;

  flex-shrink: 0;
}

/* TEXT */
.admin-orders-stat-card h3 {

  font-size: 14px;

  font-weight: 600;

  text-transform: uppercase;

  letter-spacing: 0.06em;

  margin-bottom: 6px;
}

.admin-orders-stat-card p {

  font-size: 36px;

  font-weight: 800;

  margin: 0;
}

/* STAT CARD ACCENT COLORS */
.blue {

  border-left: 4px solid #3b82f6;
}

.blue h3 { color: #93c5fd; }
.blue p  { color: #bfdbfe; }

.orange {

  border-left: 4px solid #f59e0b;
}

.orange h3 { color: #fcd34d; }
.orange p  { color: #fde68a; }

.green {

  border-left: 4px solid #10b981;
}

.green h3 { color: #6ee7b7; }
.green p  { color: #a7f3d0; }

.purple {

  border-left: 4px solid #8b5cf6;
}

.purple h3 { color: #c4b5fd; }
.purple p  { color: #ddd6fe; }

/* TABLE CONTAINER */
.admin-orders-table-container {

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.97),
      rgba(15,23,42,0.97)
    );

  border:
    1px solid rgba(148,163,184,0.10);

  border-radius: 20px;

  padding: 20px;

  box-shadow:
    0 8px 24px rgba(0,0,0,0.22);

  overflow-x: auto;
}

/* TABLE */
.admin-orders-table {

  width: 100%;

  border-collapse: separate;

  border-spacing: 0;
}

/* HEADER */
.admin-orders-table thead tr {

  background:
    rgba(59,130,246,0.10);
}

.admin-orders-table thead th {

  color: #93c5fd;

  padding: 16px 18px;

  text-align: center;

  font-size: 13px;

  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.06em;
}

/* ROW */
.admin-orders-table tbody tr {

  border-bottom:
    1px solid rgba(148,163,184,0.08);

  transition: 0.2s;
}

.admin-orders-table tbody tr:hover {

  background:
    rgba(59,130,246,0.05);
}

/* CELL */
.admin-orders-table td {

  padding: 20px 16px;

  text-align: center;

  vertical-align: middle;

  color: #cbd5e1;
}

/* EMPTY */
.empty-row {

  color: #94a3b8;

  font-size: 17px;

  padding: 50px;
}

/* EMAIL */
.admin-orders-email {

  font-weight: 600;

  color: #f1f5f9;
}

/* TOTAL */
.admin-orders-total-price {

  color: #93c5fd;

  font-size: 17px;

  font-weight: 700;
}

/* STATUS WRAPPER */
.admin-orders-status-wrapper {

  display: flex;

  flex-direction: column;

  align-items: center;

  gap: 10px;
}

/* BADGE */
.admin-orders-status-badge {

  min-width: 110px;

  padding: 7px 14px;

  border-radius: 999px;

  font-size: 12px;

  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.04em;
}

/* STATUS COLORS — dark variants */
.pending {

  background: rgba(245,158,11,0.14);

  color: #fcd34d;

  border: 1px solid rgba(245,158,11,0.28);
}

.processing {

  background: rgba(59,130,246,0.14);

  color: #93c5fd;

  border: 1px solid rgba(59,130,246,0.28);
}

.shipping {

  background: rgba(139,92,246,0.14);

  color: #c4b5fd;

  border: 1px solid rgba(139,92,246,0.28);
}

.delivered {

  background: rgba(16,185,129,0.14);

  color: #6ee7b7;

  border: 1px solid rgba(16,185,129,0.28);
}

.rejected {

  background: rgba(239,68,68,0.14);

  color: #fca5a5;

  border: 1px solid rgba(239,68,68,0.28);
}

/* SELECT */
select {

  width: 130px;

  padding: 9px 12px;

  border-radius: 10px;

  border:
    1px solid rgba(148,163,184,0.18);

  background:
    rgba(255,255,255,0.06);

  color: #f1f5f9;

  cursor: pointer;

  outline: none;

  font-size: 13px;
}

/* ACTIONS */
.admin-orders-actions {

  display: flex;

  justify-content: center;

  align-items: center;

  gap: 10px;

  flex-wrap: wrap;
}

.admin-orders-actions a {

  text-decoration: none;
}

/* BUTTONS */
.admin-orders-view-btn,
.admin-orders-save-btn,
.admin-orders-delete-btn {

  min-width: 48px;

  height: 26px;

  padding: 0 8px;

  border: none;

  border-radius: 6px;

  color: white;

  font-size: 11px;

  font-weight: 700;

  cursor: pointer;

  display: flex;

  align-items: center;

  justify-content: center;

  transition: 0.25s;
}

.admin-orders-view-btn {

  background:
    linear-gradient(135deg, #059669, #10b981);
}

.admin-orders-save-btn {

  background:
    linear-gradient(135deg, #2563eb, #3b82f6);
}

.admin-orders-delete-btn {

  background:
    linear-gradient(135deg, #dc2626, #ef4444);
}

.admin-orders-view-btn:hover,
.admin-orders-save-btn:hover,
.admin-orders-delete-btn:hover {

  transform: translateY(-2px);

  filter: brightness(1.08);
}

/* DISABLED */
button:disabled {

  opacity: 0.5;

  cursor: not-allowed;

  transform: none !important;
}

/* STATUS / ERROR BOX */
.status-box,
.error-box {

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.97),
      rgba(15,23,42,0.97)
    );

  border:
    1px solid rgba(148,163,184,0.10);

  padding: 28px;

  border-radius: 20px;

  font-size: 18px;

  color: #94a3b8;
}

.error-box {

  color: #f87171;
}

/* MOBILE */
@media (max-width: 768px) {

  .admin-orders-container {

    margin-left: 0;

    padding: 20px;
  }

  .admin-orders-header h1 {

    font-size: 34px;
  }

  .admin-orders-stats-grid {

    grid-template-columns: 1fr;
  }

  .admin-orders-table td {

    padding: 16px 10px;
  }

  .admin-orders-actions {

    flex-direction: column;
  }

  .admin-orders-view-btn,
  .admin-orders-save-btn,
  .admin-orders-delete-btn {

    width: 100%;
  }

  select {

    width: 100%;
  }
}
</style>