<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const order = ref(null)

const loading = ref(true)

const errorMessage = ref('')

// LOAD ORDER
async function loadOrder() {

  try {

    loading.value = true

    const { getWhere } = await import('../lib/api.js')

    const rows = await getWhere('orders', 'id', route.params.id)

    if (!rows.length) {

      throw new Error('Order not found')
    }

    order.value = rows[0]

  } catch (error) {

    console.log(error)

    errorMessage.value =
      'Failed to load order.'

  } finally {

    loading.value = false
  }
}

onMounted(() => {
  loadOrder()
})
</script>

<template>
  <div>

    <AdminNavbar />

    <div class="admin-order-details-container">

      <!-- LOADING -->
      <div
        v-if="loading"
        class="status-box"
      >
        Loading order details...
      </div>

      <!-- ERROR -->
      <div
        v-else-if="errorMessage"
        class="error-box"
      >
        {{ errorMessage }}
      </div>

      <!-- ORDER -->
      <div v-else-if="order">

        <!-- HEADER -->
        <div class="admin-order-header">

          <h1>
            Order #{{ order.id }}
          </h1>

          <p>
            Manage customer order information
          </p>

        </div>

        <!-- ORDER INFO -->
        <div class="admin-order-info-card">

          <div class="admin-order-info-grid">

            <!-- ORDER ID -->
            <div class="admin-order-info-item">

              <span class="label">
                Order ID
              </span>

              <span class="value">
                #{{ order.id }}
              </span>

            </div>

            <!-- CUSTOMER -->
            <div class="admin-order-info-item">

              <span class="label">
                Customer
              </span>

              <span class="value">
                {{ order.userEmail }}
              </span>

            </div>

            <!-- ADDRESS -->
            <div class="admin-order-info-item">

              <span class="label">
                Address
              </span>

              <span class="value">
                {{ order.address }}
              </span>

            </div>

            <!-- PAYMENT -->
            <div class="admin-order-info-item">

              <span class="label">
                Payment
              </span>

              <span class="value">
                {{ order.paymentMethod }}
              </span>

            </div>

            <!-- STATUS -->
            <div class="admin-order-info-item">

              <span class="label">
                Status
              </span>

              <span
                class="status-badge"
                :class="
                  order.status?.toLowerCase()
                "
              >
                {{ order.status }}
              </span>

            </div>

            <!-- TOTAL -->
            <div class="admin-order-info-item">

              <span class="label">
                Total
              </span>

              <span class="total-price">

                RM
                {{
                  Number(
                    order.total || 0
                  ).toFixed(2)
                }}

              </span>

            </div>

          </div>

        </div>

        <!-- PRODUCTS -->
        <div class="admin-order-products">

          <div
            class="admin-order-product-card"
            v-for="
              item in order.items || []
            "
            :key="item.id"
          >

            <!-- IMAGE -->
            <img
              :src="
                item.image ||
                'https://via.placeholder.com/200'
              "
              class="admin-order-product-image"
            />

            <!-- DETAILS -->
            <div
              class="
                admin-order-product-details
              "
            >

              <h3>
                {{ item.name }}
              </h3>

              <p>

                <strong>
                  Price:
                </strong>

                RM
                {{
                  Number(
                    item.price || 0
                  ).toFixed(2)
                }}

              </p>

              <p>

                <strong>
                  Quantity:
                </strong>

                {{ item.quantity }}

              </p>

              <p class="subtotal">

                <strong>
                  Subtotal:
                </strong>

                RM
                {{

                  (
                    Number(
                      item.price || 0
                    ) *

                    Number(
                      item.quantity || 0
                    )

                  ).toFixed(2)

                }}

              </p>

            </div>

          </div>

        </div>

      </div>

      <!-- EMPTY -->
      <div
        v-else
        class="status-box"
      >
        Order not found.
      </div>

    </div>

  </div>
</template>

<style scoped>

/* CONTAINER */
.admin-order-details-container {

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
.admin-order-header {

  margin-bottom: 30px;
}

.admin-order-header h1 {

  font-size: 50px;

  font-weight: 800;

  margin-bottom: 10px;

  color: #f8fafc;

  letter-spacing: -0.5px;
}

.admin-order-header p {

  color: #94a3b8;

  font-size: 18px;
}

/* INFO CARD */
.admin-order-info-card {

  background:
    linear-gradient(
      145deg,
      #1e293b,
      #162032
    );

  border:
    1px solid rgba(148,163,184,0.12);

  border-radius: 22px;

  padding: 30px;

  margin-bottom: 35px;

  box-shadow:
    0 8px 28px rgba(0,0,0,0.22);
}

/* INFO GRID */
.admin-order-info-grid {

  display: grid;

  grid-template-columns:
    repeat(auto-fit, minmax(250px, 1fr));

  gap: 25px;
}

/* INFO ITEM */
.admin-order-info-item {

  display: flex;

  flex-direction: column;

  gap: 8px;
}

/* LABEL */
.label {

  color: #64748b;

  font-size: 13px;

  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.06em;
}

/* VALUE */
.value {

  color: #f1f5f9;

  font-size: 18px;

  font-weight: 600;
}

/* TOTAL */
.total-price {

  color: #93c5fd;

  font-size: 24px;

  font-weight: 800;
}

/* STATUS BADGE */
.status-badge {

  width: fit-content;

  padding: 7px 16px;

  border-radius: 999px;

  font-size: 13px;

  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.04em;
}

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

/* PRODUCTS */
.admin-order-products {

  display: grid;

  gap: 20px;
}

/* PRODUCT CARD */
.admin-order-product-card {

  display: flex;

  gap: 25px;

  align-items: center;

  background:
    linear-gradient(
      145deg,
      #1e293b,
      #162032
    );

  border:
    1px solid rgba(148,163,184,0.12);

  padding: 25px;

  border-radius: 20px;

  box-shadow:
    0 8px 24px rgba(0,0,0,0.20);

  transition: 0.30s cubic-bezier(0.4,0,0.2,1);
}

.admin-order-product-card:hover {

  transform: translateY(-4px);

  border-color: rgba(59,130,246,0.28);

  box-shadow:
    0 14px 34px rgba(0,0,0,0.28);
}

/* IMAGE */
.admin-order-product-image {

  width: 200px;

  height: 200px;

  object-fit: contain;

  border-radius: 18px;

  background:
    radial-gradient(
      circle at center,
      rgba(59,130,246,0.07),
      rgba(15,23,42,0.70) 70%
    );

  padding: 15px;

  flex-shrink: 0;
}

/* DETAILS */
.admin-order-product-details {

  flex: 1;
}

.admin-order-product-details h3 {

  font-size: 28px;

  font-weight: 700;

  margin-bottom: 16px;

  color: #f1f5f9;
}

.admin-order-product-details p {

  margin-bottom: 10px;

  font-size: 17px;

  color: #94a3b8;
}

.admin-order-product-details p strong {

  color: #cbd5e1;
}

/* SUBTOTAL */
.subtotal {

  color: #93c5fd !important;

  font-weight: 700;

  font-size: 19px;
}

/* STATUS / ERROR BOX */
.status-box,
.error-box {

  background:
    linear-gradient(
      145deg,
      #1e293b,
      #162032
    );

  border:
    1px solid rgba(148,163,184,0.12);

  padding: 28px;

  border-radius: 18px;

  box-shadow:
    0 8px 24px rgba(0,0,0,0.20);

  font-size: 18px;

  color: #94a3b8;
}

.error-box {

  color: #f87171;
}

/* MOBILE */
@media (max-width: 768px) {

  .admin-order-details-container {

    margin-left: 0;

    padding: 20px;
  }

  .admin-order-header h1 {

    font-size: 36px;
  }

  .admin-order-product-card {

    flex-direction: column;

    text-align: center;
  }

  .admin-order-product-image {

    width: 160px;

    height: 160px;
  }

  .admin-order-product-details h3 {

    font-size: 24px;
  }
}
</style>