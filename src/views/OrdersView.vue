<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

import {
  ref,
  onMounted
} from 'vue'

import {
  useRouter
} from 'vue-router'

const router = useRouter()

const user = ref(
  JSON.parse(
    localStorage.getItem('user')
  )
)

const orders = ref([])

const loading = ref(true)

// LOAD ORDERS
async function loadOrders() {

  // NOT LOGIN
  if (!user.value) {

    router.push('/login')

    return
  }

  try {

    loading.value = true

    const { getWhere } = await import('../lib/api.js')

    // FETCH USER ORDERS
    orders.value = await getWhere(
      'orders',
      'userEmail',
      user.value.email
    )

  } catch (error) {

    console.log(error)
  }

  finally {

    loading.value = false
  }
}

onMounted(() => {

  loadOrders()
})
</script>

<template>
  <div>

    <Navbar />

    <!-- PAGE -->
    <div
      class="
        orders-page-container
      "
    >

      <!-- TITLE -->
      <div
        class="
          orders-header
        "
      >

        <h1>
          📦 Order History
        </h1>

        <p>
          View all your previous orders
        </p>

      </div>

      <!-- LOADING -->
      <div
        v-if="loading"
        class="
          orders-empty-box
        "
      >

        Loading orders...

      </div>

      <!-- EMPTY -->
      <div
        v-else-if="
          orders.length === 0
        "
        class="
          orders-empty-box
        "
      >

        No orders found.

      </div>

      <!-- ORDERS -->
      <div
        v-else
        class="
          orders-grid
        "
      >

        <div
          class="
            order-card
          "
          v-for="
            order in orders
          "
          :key="order.id"
        >

          <!-- TOP -->
          <div
            class="
              order-top
            "
          >

            <div>

              <h2>
                Order
                #{{ order.id }}
              </h2>

              <p>
                {{
                  order.userEmail
                }}
              </p>

            </div>

            <!-- STATUS -->
            <div
              :class="[
                'order-status',
                `status-${order.status?.toLowerCase()}`
              ]"
            >

              {{
                order.status
              }}

            </div>

          </div>

          <!-- ITEMS -->
          <div
            class="
              order-items
            "
          >

            <div
              class="
                order-item
              "
              v-for="
                item in order.items
              "
              :key="item.id"
            >

              <img
                :src="item.image"
                class="
                  order-item-image
                "
              />

              <div
                class="
                  order-item-info
                "
              >

                <h4>
                  {{ item.name }}
                </h4>

                <p>

                  Quantity:
                  {{ item.quantity }}

                </p>

              </div>

              <div
                class="
                  order-item-price
                "
              >

                RM

                {{

                  (
                    item.price *
                    item.quantity
                  ).toFixed(2)

                }}

              </div>

            </div>

          </div>

          <!-- SUMMARY -->
          <div
            class="
              order-summary
            "
          >

            <div>

              <strong>
                Payment:
              </strong>

              {{
                order.paymentMethod
              }}

            </div>

            <div>

              <strong>
                Shipping:
              </strong>

              {{
                order.shippingMethod
              }}

            </div>

          </div>

          <!-- ADDRESS -->
          <div
            class="
              order-address
            "
          >

            <strong>
              Address:
            </strong>

            {{
              order.address
            }}

          </div>

          <!-- TOTAL -->
          <div
            class="
              order-total
            "
          >

            Total:
            RM
            {{

              Number(
                order.total
              ).toFixed(2)

            }}

          </div>

        </div>

      </div>

    </div>

    <Footer />

  </div>
</template>

<style scoped>

/* PAGE */
.orders-page-container {

  width: 100%;

  max-width: 1400px;

  margin: 0 auto;

  padding: 40px;

  box-sizing: border-box;
}

/* HEADER */
.orders-header {

  margin-bottom: 35px;
}

.orders-header h1 {

  font-size: 52px;

  font-weight: 800;

  color: #f8fafc;

  margin-bottom: 10px;

  letter-spacing: -0.5px;
}

.orders-header p {

  color: #94a3b8;

  font-size: 18px;
}

/* EMPTY */
.orders-empty-box {

  background:
    linear-gradient(
      145deg,
      #1e293b,
      #162032
    );

  border:
    1px solid rgba(148,163,184,0.12);

  border-radius: 24px;

  padding: 60px;

  text-align: center;

  font-size: 22px;

  color: #94a3b8;

  box-shadow:
    0 8px 24px rgba(0,0,0,0.22);
}

/* GRID */
.orders-grid {

  display: grid;

  gap: 28px;
}

/* CARD */
.order-card {

  background:
    linear-gradient(
      145deg,
      #1e293b,
      #162032
    );

  border:
    1px solid rgba(148,163,184,0.12);

  border-radius: 24px;

  padding: 30px;

  box-shadow:
    0 8px 24px rgba(0,0,0,0.22);

  transition: 0.30s cubic-bezier(0.4,0,0.2,1);
}

.order-card:hover {

  border-color: rgba(59,130,246,0.28);

  box-shadow:
    0 14px 36px rgba(0,0,0,0.28);
}

/* TOP */
.order-top {

  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 20px;

  margin-bottom: 28px;

  padding-bottom: 20px;

  border-bottom:
    1px solid rgba(148,163,184,0.12);
}

.order-top h2 {

  margin: 0;

  font-size: 30px;

  font-weight: 800;

  color: #f1f5f9;
}

.order-top p {

  margin-top: 8px;

  color: #64748b;

  font-size: 14px;
}

/* STATUS BADGE */
.order-status {

  padding: 8px 18px;

  border-radius: 999px;

  font-size: 12px;

  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.05em;
}

/* STATUS COLORS — dark translucent */
.status-pending {

  background: rgba(245,158,11,0.14);

  color: #fcd34d;

  border: 1px solid rgba(245,158,11,0.28);
}

.status-processing {

  background: rgba(59,130,246,0.14);

  color: #93c5fd;

  border: 1px solid rgba(59,130,246,0.28);
}

.status-shipping {

  background: rgba(139,92,246,0.14);

  color: #c4b5fd;

  border: 1px solid rgba(139,92,246,0.28);
}

.status-delivered {

  background: rgba(16,185,129,0.14);

  color: #6ee7b7;

  border: 1px solid rgba(16,185,129,0.28);
}

.status-rejected {

  background: rgba(239,68,68,0.14);

  color: #fca5a5;

  border: 1px solid rgba(239,68,68,0.28);
}

/* ITEMS */
.order-items {

  display: flex;

  flex-direction: column;

  gap: 14px;

  margin-bottom: 28px;
}

/* ITEM ROW */
.order-item {

  display: flex;

  align-items: center;

  gap: 18px;

  background:
    rgba(255,255,255,0.04);

  border:
    1px solid rgba(148,163,184,0.10);

  padding: 16px 18px;

  border-radius: 16px;

  transition: 0.20s;
}

.order-item:hover {

  background:
    rgba(59,130,246,0.06);

  border-color:
    rgba(59,130,246,0.20);
}

/* IMAGE */
.order-item-image {

  width: 80px;

  height: 80px;

  object-fit: contain;

  background:
    radial-gradient(
      circle at center,
      rgba(59,130,246,0.07),
      rgba(15,23,42,0.70) 70%
    );

  border-radius: 12px;

  padding: 10px;

  flex-shrink: 0;
}

/* INFO */
.order-item-info {

  flex: 1;
}

.order-item-info h4 {

  margin: 0 0 8px;

  font-size: 17px;

  font-weight: 700;

  color: #f1f5f9;
}

.order-item-info p {

  margin: 0;

  color: #64748b;

  font-size: 14px;
}

/* PRICE */
.order-item-price {

  font-size: 19px;

  font-weight: 800;

  color: #93c5fd;
}

/* SUMMARY */
.order-summary {

  display: flex;

  justify-content: space-between;

  gap: 20px;

  margin-bottom: 16px;

  color: #94a3b8;

  font-size: 15px;
}

.order-summary strong {

  color: #cbd5e1;
}

/* ADDRESS */
.order-address {

  margin-bottom: 24px;

  color: #94a3b8;

  font-size: 15px;

  line-height: 1.7;
}

.order-address strong {

  color: #cbd5e1;
}

/* TOTAL */
.order-total {

  padding-top: 20px;

  border-top:
    1px solid rgba(59,130,246,0.18);

  font-size: 28px;

  font-weight: 800;

  color: #93c5fd;
}

/* MOBILE */
@media (max-width: 768px) {

  .orders-page-container {

    padding: 20px;
  }

  .orders-header h1 {

    font-size: 36px;
  }

  .order-top {

    flex-direction: column;

    align-items: flex-start;
  }

  .order-item {

    flex-direction: column;

    align-items: flex-start;
  }

  .order-item-image {

    width: 100%;

    height: 200px;
  }

  .order-summary {

    flex-direction: column;
  }

  .order-total {

    font-size: 22px;
  }
}
</style>