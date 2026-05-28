<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Toast from '../components/Toast.vue'

import { ref } from 'vue'

import { useRouter } from 'vue-router'

import { useCartStore } from '../stores/cart'

const router = useRouter()

const cart = useCartStore()

const toastRef = ref(null)

const user = ref(
  JSON.parse(
    localStorage.getItem('user')
  )
)

const checkingOut = ref(false)

// CHECKOUT
function checkout() {

  // LOGIN CHECK
  if (!user.value) {

    toastRef.value
      .showToastMessage(
        'Please login first',
        'error'
      )

    return
  }

  // EMPTY CART CHECK
  if (cart.items.length === 0) {

    toastRef.value
      .showToastMessage(
        'Cart is empty',
        'error'
      )

    return
  }

  // GO TO CHECKOUT PAGE
  router.push('/checkout')
}
</script>

<template>
  <div>

    <Navbar />

    <div class="cart-container">

      <!-- TITLE -->
      <h2 class="cart-title">
        Your Cart
      </h2>

      <!-- EMPTY -->
      <div
        v-if="
          cart.items.length === 0
        "
        class="cart-empty"
      >

        <p>
          🛒 Your cart is empty
        </p>

      </div>

      <!-- CART -->
      <div
        v-else
        class="cart-layout"
      >

        <!-- LEFT -->
        <div class="cart-items">

          <div
            class="
              cart-product-card
            "
            v-for="
              item in cart.items
            "
            :key="item.id"
          >

            <!-- IMAGE -->
            <img
              :src="item.image"
              class="
                cart-product-image
              "
            />

            <!-- INFO -->
            <div
              class="
                cart-product-info
              "
            >

              <h3
                class="
                  cart-product-name
                "
              >

                {{ item.name }}

              </h3>

              <p
                class="
                  cart-product-price
                "
              >

                RM

                {{
                  Number(
                    item.price
                  ).toFixed(2)
                }}

              </p>

              <!-- QTY -->
              <div
                class="
                  cart-qty-box
                "
              >

                <button
                  class="
                    cart-qty-btn
                  "
                  @click="
                    cart.decreaseQty(
                      item.id
                    )
                  "
                >
                  -
                </button>

                <span
                  class="
                    cart-qty-number
                  "
                >

                  {{
                    item.quantity
                  }}

                </span>

                <button
                  class="
                    cart-qty-btn
                  "
                  @click="
                    cart.increaseQty(
                      item.id
                    )
                  "
                >
                  +
                </button>

              </div>

              <!-- SUBTOTAL -->
              <p
                class="
                  cart-subtotal
                "
              >

                Subtotal: RM

                {{

                  (
                    item.price *
                    item.quantity
                  ).toFixed(2)

                }}

              </p>

            </div>

            <!-- REMOVE -->
            <button
              class="
                cart-remove-btn
              "
              @click="
                cart.removeFromCart(
                  item.id
                )
              "
            >
              ✖
            </button>

          </div>

        </div>

        <!-- RIGHT -->
        <div class="cart-summary">

          <h3>
            Order Summary
          </h3>

          <!-- PRODUCTS -->
          <div
            v-for="
              item in cart.items
            "
            :key="item.id"
            class="summary-item"
          >

            <div>

              {{
                item.name
              }}

              ×

              {{
                item.quantity
              }}

            </div>

            <div>

              RM

              {{

                (
                  item.price *
                  item.quantity
                ).toFixed(2)

              }}

            </div>

          </div>

          <hr class="summary-divider" />

          <!-- SUBTOTAL -->
          <div
            class="
              cart-summary-row
            "
          >

            <span>
              Subtotal
            </span>

            <span>

              RM

              {{
                Number(
                  cart.totalPrice
                ).toFixed(2)
              }}

            </span>

          </div>

          <div
            class="
              cart-summary-row
            "
          >

            <span>
              Shipping
            </span>

            <span>
              RM 10.00
            </span>

          </div>

          <div
            class="
              cart-summary-total
            "
          >

            Total: RM

            {{

              (
                cart.totalPrice + 10
              ).toFixed(2)

            }}

          </div>

          <!-- CHECKOUT -->
          <button
            class="
              cart-checkout-btn
            "
            @click="checkout"
            :disabled="
              checkingOut
            "
          >

            Checkout

          </button>

          <!-- CONTINUE -->
          <router-link
            to="/products"
          >

            <button
              class="
                cart-continue-btn
              "
            >

              Continue Shopping

            </button>

          </router-link>

        </div>

      </div>

    </div>

    <Toast ref="toastRef" />

    <Footer />

  </div>
</template>

<style scoped>

/* CONTAINER */
.cart-container {

  width: 100%;

  max-width: 1450px;

  margin: 0 auto;

  padding: 40px;

  box-sizing: border-box;
}

/* TITLE */
.cart-title {

  font-size: 52px;

  font-weight: 800;

  margin-bottom: 35px;

  color: #f8fafc;

  letter-spacing: -0.5px;
}

/* EMPTY */
.cart-empty {

  background:
    linear-gradient(
      145deg,
      #1e293b,
      #162032
    );

  border:
    1px solid rgba(148,163,184,0.10);

  border-radius: 24px;

  padding: 80px 40px;

  text-align: center;

  box-shadow:
    0 10px 28px rgba(0,0,0,0.20);
}

.cart-empty p {

  font-size: 26px;

  color: #94a3b8;

  margin: 0;
}

/* LAYOUT */
.cart-layout {

  display: grid;

  grid-template-columns:
    2fr 1fr;

  gap: 28px;

  align-items: start;
}

/* ITEMS */
.cart-items {

  display: flex;

  flex-direction: column;

  gap: 20px;
}

/* CARD */
.cart-product-card {

  display: flex;

  align-items: center;

  gap: 24px;

  background:
    linear-gradient(
      145deg,
      #1e293b,
      #162032
    );

  padding: 22px;

  border-radius: 20px;

  border:
    1px solid rgba(148,163,184,0.10);

  box-shadow:
    0 8px 24px rgba(0,0,0,0.18);

  transition: 0.32s cubic-bezier(0.4,0,0.2,1);
}

.cart-product-card:hover {

  transform: translateY(-4px);

  border-color: rgba(59,130,246,0.22);

  box-shadow:
    0 14px 34px rgba(0,0,0,0.26);
}

/* IMAGE */
.cart-product-image {

  width: 150px;

  height: 150px;

  object-fit: contain;

  border-radius: 16px;

  background:
    radial-gradient(
      circle at center,
      rgba(59,130,246,0.07),
      rgba(15,23,42,0.70) 70%
    );

  padding: 14px;

  flex-shrink: 0;
}

/* INFO */
.cart-product-info {

  flex: 1;
}

/* NAME */
.cart-product-name {

  font-size: 24px;

  margin-bottom: 10px;

  color: #f1f5f9;

  font-weight: 700;
}

/* PRICE */
.cart-product-price {

  color: #93c5fd;

  font-size: 22px;

  font-weight: 800;

  margin-bottom: 14px;
}

/* QTY */
.cart-qty-box {

  display: flex;

  align-items: center;

  gap: 14px;

  margin-bottom: 14px;
}

/* BUTTON */
.cart-qty-btn {

  width: 38px;

  height: 38px;

  border: none;

  border-radius: 10px;

  background:
    linear-gradient(135deg, #2563eb, #3b82f6);

  color: white;

  font-size: 18px;

  font-weight: 700;

  cursor: pointer;

  transition: 0.25s;

  display: flex;

  align-items: center;

  justify-content: center;
}

.cart-qty-btn:hover {

  transform: translateY(-2px);

  box-shadow:
    0 6px 14px rgba(37,99,235,0.28);
}

/* QTY NUMBER */
.cart-qty-number {

  font-size: 20px;

  font-weight: 700;

  color: #f1f5f9;

  min-width: 24px;

  text-align: center;
}

/* SUBTOTAL */
.cart-subtotal {

  font-size: 16px;

  font-weight: 600;

  color: #94a3b8;
}

/* REMOVE */
.cart-remove-btn {

  width: 44px;

  height: 44px;

  border: none;

  border-radius: 12px;

  background:
    linear-gradient(135deg, #f87171, #ef4444);

  color: white;

  font-size: 16px;

  cursor: pointer;

  transition: 0.25s;

  flex-shrink: 0;

  display: flex;

  align-items: center;

  justify-content: center;
}

.cart-remove-btn:hover {

  transform: translateY(-2px);

  box-shadow:
    0 6px 14px rgba(239,68,68,0.28);
}

/* SUMMARY */
.cart-summary {

  background:
    linear-gradient(
      145deg,
      #1e293b,
      #162032
    );

  padding: 28px;

  border-radius: 20px;

  border:
    1px solid rgba(148,163,184,0.10);

  box-shadow:
    0 8px 28px rgba(0,0,0,0.20);

  position: sticky;

  top: 100px;
}

/* SUMMARY TITLE */
.cart-summary h3 {

  font-size: 28px;

  font-weight: 800;

  margin-bottom: 28px;

  color: #f8fafc;
}

/* SUMMARY ITEM */
.summary-item {

  display: flex;

  justify-content: space-between;

  margin-bottom: 12px;

  font-size: 14px;

  color: #94a3b8;
}

/* DIVIDER */
.summary-divider {

  border: none;

  border-top:
    1px solid rgba(148,163,184,0.14);

  margin: 20px 0;
}

/* SUMMARY ROW */
.cart-summary-row {

  display: flex;

  justify-content: space-between;

  margin-bottom: 14px;

  font-size: 17px;

  color: #cbd5e1;
}

/* TOTAL */
.cart-summary-total {

  margin: 24px 0;

  padding-top: 20px;

  border-top:
    1px solid rgba(59,130,246,0.22);

  font-size: 30px;

  font-weight: 800;

  color: #93c5fd;
}

/* BUTTONS */
.cart-checkout-btn,
.cart-continue-btn {

  width: 100%;

  padding: 15px;

  border: none;

  border-radius: 14px;

  font-size: 16px;

  font-weight: 700;

  cursor: pointer;

  transition: 0.25s;
}

/* CHECKOUT */
.cart-checkout-btn {

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );

  color: white;

  margin-bottom: 12px;
}

.cart-checkout-btn:hover {

  transform: translateY(-2px);

  box-shadow:
    0 10px 22px rgba(37,99,235,0.30);
}

/* CONTINUE */
.cart-continue-btn {

  background:
    rgba(255,255,255,0.07);

  border:
    1px solid rgba(148,163,184,0.16);

  color: #cbd5e1;
}

.cart-continue-btn:hover {

  background:
    rgba(255,255,255,0.11);

  color: #f1f5f9;
}

/* DISABLED */
button:disabled {

  opacity: 0.5;

  cursor: not-allowed;
}

/* MOBILE */
@media (max-width: 992px) {

  .cart-layout {

    grid-template-columns: 1fr;
  }

  .cart-summary {

    position: relative;

    top: 0;
  }
}

@media (max-width: 768px) {

  .cart-container {

    padding: 20px;
  }

  .cart-title {

    font-size: 38px;
  }

  .cart-product-card {

    flex-direction: column;

    align-items: flex-start;
  }

  .cart-product-image {

    width: 100%;

    height: 200px;
  }

  .cart-remove-btn {

    width: 100%;

    height: 42px;
  }

  .cart-summary {

    padding: 22px;
  }
}
</style>