<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Toast from '../components/Toast.vue'

import {
  ref,
  computed
} from 'vue'

import {
  useRouter
} from 'vue-router'

import {
  useCartStore
} from '../stores/cart'

const router = useRouter()

const cart = useCartStore()

const toastRef = ref(null)

const recipientName = ref('')

const phoneNumber = ref('')

const shippingAddress = ref('')

const shippingMethod = ref('standard')

const paymentMethod = ref('cod')

// SHIPPING COST
const shippingCost = computed(() => {

  return shippingMethod.value ===
    'express'

    ? 25

    : 10
})

// TOTAL
const total = computed(() => {

  return cart.totalPrice +
    shippingCost.value
})

// PLACE ORDER
async function placeOrder() {

  if (
    !recipientName.value ||
    !phoneNumber.value ||
    !shippingAddress.value
  ) {

    toastRef.value
      .showToastMessage(
        'Please complete all fields',
        'error'
      )

    return
  }

  // BUILD ORDER OBJECT
  const user = JSON.parse(
    localStorage.getItem('user')
  )

  const order = {
    userEmail: user?.email ?? '',
    recipientName: recipientName.value,
    phoneNumber: phoneNumber.value,
    shippingAddress: shippingAddress.value,
    shippingMethod: shippingMethod.value,
    paymentMethod: paymentMethod.value,
    items: cart.items.map(i => ({
      id: i.id,
      name: i.name,
      image: i.image,
      price: i.price,
      quantity: i.quantity
    })),
    total: total.value,
    status: 'Pending',
    date: new Date().toISOString()
  }

  try {

    // SAVE TO BACKEND
    const { create } = await import('../lib/api.js')

    await create('orders', order)

    toastRef.value
      .showToastMessage(
        'Order placed successfully!',
        'success'
      )

    // CLEAR CART
    cart.items = []

    // REDIRECT
    setTimeout(() => {

      router.push('/')

    }, 1500)

  } catch (err) {

    toastRef.value
      .showToastMessage(
        'Failed to place order. Please try again.',
        'error'
      )
  }
}
</script>

<template>
  <div>

    <Navbar />

    <div class="checkout-container">

      <!-- LEFT -->
      <div class="checkout-form">

        <h1>
          Checkout
        </h1>

        <!-- NAME -->
        <div class="form-group">

          <label>
            Recipient Name
          </label>

          <input
            v-model="
              recipientName
            "
            type="text"
            placeholder="
              Enter recipient name
            "
          />

        </div>

        <!-- PHONE -->
        <div class="form-group">

          <label>
            Phone Number
          </label>

          <input
            v-model="
              phoneNumber
            "
            type="text"
            placeholder="
              Enter phone number
            "
          />

        </div>

        <!-- ADDRESS -->
        <div class="form-group">

          <label>
            Shipping Address
          </label>

          <textarea
            v-model="
              shippingAddress
            "
            rows="5"
            placeholder="
              Enter shipping address
            "
          ></textarea>

        </div>

        <!-- SHIPPING -->
        <div class="form-group">

          <label>
            Shipping Method
          </label>

          <select
            v-model="
              shippingMethod
            "
          >

            <option value="standard">
              Standard Shipping
              (RM 10)
            </option>

            <option value="express">
              Express Shipping
              (RM 25)
            </option>

          </select>

        </div>

        <!-- PAYMENT -->
        <div class="form-group">

          <label>
            Payment Method
          </label>

          <select
            v-model="
              paymentMethod
            "
          >

            <option value="cod">
              Cash On Delivery
            </option>

            <option value="card">
              Credit / Debit Card
            </option>

            <option value="online">
              Online Banking
            </option>

            <option value="ewallet">
              E-Wallet
            </option>

          </select>

        </div>

      </div>

      <!-- RIGHT -->
      <div class="summary-box">

        <h2>
          Order Summary
        </h2>

        <!-- PRODUCTS -->
        <div
          v-for="
            item in cart.items
          "
          :key="item.id"
          class="summary-product"
        >

          <!-- IMAGE -->
          <img
            :src="item.image"
            class="summary-image"
          />

          <!-- INFO -->
          <div class="summary-info">

            <h4>
              {{ item.name }}
            </h4>

            <p>

              Quantity:
              {{ item.quantity }}

            </p>

            <p>

              RM

              {{

                (
                  item.price *
                  item.quantity
                ).toFixed(2)

              }}

            </p>

          </div>

        </div>

        <hr />

        <!-- SUBTOTAL -->
        <div class="summary-row">

          <span>
            Subtotal
          </span>

          <span>

            RM

            {{
              cart.totalPrice
                .toFixed(2)
            }}

          </span>

        </div>

        <!-- SHIPPING -->
        <div class="summary-row">

          <span>
            Shipping
          </span>

          <span>

            RM

            {{
              shippingCost
                .toFixed(2)
            }}

          </span>

        </div>

        <!-- TOTAL -->
        <div class="summary-total">

          <span>
            Total
          </span>

          <span>

            RM

            {{
              total.toFixed(2)
            }}

          </span>

        </div>

        <!-- BUTTON -->
        <button
          class="
            place-order-btn
          "
          @click="
            placeOrder
          "
        >

          Place Order

        </button>

      </div>

    </div>

    <Toast ref="toastRef" />

    <Footer />

  </div>
</template>

<style scoped>

/* CONTAINER */
.checkout-container {

  max-width: 1400px;

  margin: 40px auto;

  padding: 0 20px 60px;

  display: grid;

  grid-template-columns:
    2fr 1fr;

  gap: 30px;
}

/* FORM PANEL — dark slate */
.checkout-form {

  background:
    linear-gradient(
      145deg,
      #1e293b,
      #0f172a
    );

  border:
    1px solid rgba(148,163,184,0.12);

  border-top:
    3px solid #3b82f6;

  border-radius: 24px;

  padding: 32px;

  box-shadow:
    0 10px 30px rgba(0,0,0,0.30);
}

/* SUMMARY PANEL — deep navy with blue tint */
.summary-box {

  background:
    linear-gradient(
      145deg,
      #0f172a,
      #111827
    );

  border:
    1px solid rgba(59,130,246,0.18);

  border-top:
    3px solid #6366f1;

  border-radius: 24px;

  padding: 32px;

  box-shadow:
    0 10px 30px rgba(0,0,0,0.36),
    0 0 0 1px rgba(99,102,241,0.08) inset;
}

/* TITLES */
.checkout-form h1 {

  margin-bottom: 28px;

  font-size: 36px;

  font-weight: 800;

  color: #f8fafc;

  letter-spacing: -0.5px;
}

.summary-box h2 {

  margin-bottom: 24px;

  font-size: 26px;

  font-weight: 700;

  color: #f1f5f9;
}

/* FORM */
.form-group {

  margin-bottom: 22px;
}

.form-group label {

  display: block;

  margin-bottom: 10px;

  font-weight: 600;

  font-size: 14px;

  color: #cbd5e1;

  letter-spacing: 0.03em;
}

.form-group input,
.form-group textarea,
.form-group select {

  width: 100%;

  padding: 14px 16px;

  border-radius: 14px;

  border:
    1px solid rgba(148,163,184,0.18);

  background:
    rgba(255,255,255,0.05);

  color: #f1f5f9;

  font-size: 15px;

  outline: none;

  box-sizing: border-box;

  transition: 0.3s;
}

.form-group input::placeholder,
.form-group textarea::placeholder {

  color: rgba(203,213,225,0.45);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {

  border-color: #3b82f6;

  background:
    rgba(59,130,246,0.07);

  box-shadow:
    0 0 0 3px rgba(59,130,246,0.14);
}

/* SUMMARY PRODUCT */
.summary-product {

  display: flex;

  gap: 14px;

  margin-bottom: 18px;

  padding-bottom: 18px;

  border-bottom:
    1px solid rgba(148,163,184,0.10);
}

/* IMAGE */
.summary-image {

  width: 75px;

  height: 75px;

  object-fit: contain;

  background:
    radial-gradient(
      circle at center,
      rgba(59,130,246,0.07),
      rgba(15,23,42,0.70) 70%
    );

  border-radius: 12px;

  padding: 8px;

  flex-shrink: 0;
}

/* INFO */
.summary-info {

  flex: 1;
}

.summary-info h4 {

  margin: 0 0 6px;

  font-size: 15px;

  font-weight: 600;

  color: #f1f5f9;
}

.summary-info p {

  margin: 4px 0;

  color: #94a3b8;

  font-size: 14px;
}

/* HR */
hr {

  border: none;

  border-top:
    1px solid rgba(148,163,184,0.10);

  margin: 10px 0;
}

/* SUMMARY ROWS */
.summary-row,
.summary-total {

  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-top: 16px;
}

.summary-row {

  color: #94a3b8;

  font-size: 15px;
}

.summary-row span:last-child {

  color: #cbd5e1;

  font-weight: 600;
}

.summary-total {

  font-size: 26px;

  font-weight: 800;

  margin-top: 24px;

  padding-top: 16px;

  border-top:
    1px solid rgba(148,163,184,0.12);
}

.summary-total span:first-child {

  color: #f1f5f9;
}

.summary-total span:last-child {

  color: #93c5fd;
}

/* BUTTON */
.place-order-btn {

  width: 100%;

  margin-top: 28px;

  height: 56px;

  border: none;

  border-radius: 16px;

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );

  color: white;

  font-size: 16px;

  font-weight: 700;

  cursor: pointer;

  transition: 0.25s cubic-bezier(0.4,0,0.2,1);

  box-shadow:
    0 6px 18px rgba(37,99,235,0.28);

  letter-spacing: 0.02em;
}

.place-order-btn:hover {

  transform: translateY(-2px);

  box-shadow:
    0 12px 28px rgba(37,99,235,0.38);
}

/* MOBILE */
@media (max-width: 900px) {

  .checkout-container {

    grid-template-columns: 1fr;

    padding: 0 16px 40px;
  }

  .checkout-form h1 {

    font-size: 28px;
  }
}
</style>