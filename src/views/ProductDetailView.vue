<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Toast from '../components/Toast.vue'

import {
  ref,
  onMounted
} from 'vue'

import {
  useRoute
} from 'vue-router'

import {
  useCartStore
} from '../stores/cart'

const route = useRoute()

const cart = useCartStore()

const toastRef = ref(null)

const product = ref(null)

const loading = ref(true)

const errorMessage = ref('')

const quantity = ref(1)

// LOAD PRODUCT
async function loadProduct() {

  try {

    loading.value = true

    const { getWhere } = await import('../lib/api.js')

    const rows = await getWhere('products', 'id', route.params.id)

    if (!rows.length) {

      throw new Error('Product not found')
    }

    product.value = rows[0]

  } catch (error) {

    console.log(error)

    errorMessage.value =
      'Failed to load product.'

  } finally {

    loading.value = false
  }
}

onMounted(() => {

  loadProduct()
})

// ADD TO CART
function addToCart() {

  if (!product.value) {

    return
  }

  for (

    let i = 0;

    i < quantity.value;

    i++

  ) {

    cart.addToCart(
      product.value
    )
  }

  toastRef.value
    .showToastMessage(
      `${quantity.value} item(s) added to cart!`,
      'success'
    )
}
</script>

<template>
  <div>

    <Navbar />

    <!-- LOADING -->
    <div
      v-if="loading"
      class="product-status-box"
    >

      Loading product...

    </div>

    <!-- ERROR -->
    <div
      v-else-if="errorMessage"
      class="product-error-box"
    >

      {{ errorMessage }}

    </div>

    <!-- PRODUCT -->
    <div
      v-else-if="product"
      class="
        product-detail-container
      "
    >

      <div
        class="
          product-detail-card
        "
      >

        <!-- IMAGE -->
        <div
          class="
            product-image-section
          "
        >

          <img
            :src="
              product.image ||
              'https://via.placeholder.com/500'
            "
            alt="Product Image"
            class="
              product-image
            "
          />

        </div>

        <!-- INFO -->
        <div
          class="
            product-info-section
          "
        >

          <!-- NAME -->
          <h2
            class="
              product-name
            "
          >

            {{ product.name }}

          </h2>

          <!-- PRICE -->
          <p
            class="
              product-price
            "
          >

            RM

            {{
              Number(
                product.price
              ).toFixed(2)
            }}

          </p>

          <!-- CATEGORY -->
          <div
            class="
              product-category
            "
          >

            {{ product.category }}

          </div>

          <!-- FEATURES -->
          <div
            class="
              product-features
            "
          >

            <div
              class="
                product-feature-item
              "
            >

              Stock:
              {{ product.stock }}

            </div>

            <div
              class="
                product-feature-item
              "
            >

              PC Hardware

            </div>

            <div
              class="
                product-feature-item
              "
            >

              High Performance

            </div>

          </div>

          <!-- DETAILS -->
          <div
            class="
              product-details-box
            "
          >

            <h3
              class="
                product-details-title
              "
            >

              Product Details

            </h3>

            <p
              class="
                product-details-text
              "
            >

              {{
                product.details
              }}

            </p>

          </div>

          <!-- QUANTITY -->
          <div
            class="
              product-quantity-section
            "
          >

            <p
              class="
                product-quantity-label
              "
            >

              Quantity

            </p>

            <div
              class="
                product-quantity-box
              "
            >

              <button
                @click="
                  quantity > 1
                  ? quantity--
                  : 1
                "
              >

                −

              </button>

              <span>

                {{ quantity }}

              </span>

              <button
                @click="
                  quantity++
                "
              >

                +

              </button>

            </div>

          </div>

          <!-- BUTTON -->
          <button
            class="
              product-add-btn
            "
            @click="addToCart"
          >

            🛒 Add
            {{ quantity }}
            to Cart

          </button>

        </div>

      </div>

    </div>

    <!-- NOT FOUND -->
    <p
      v-else
      class="
        product-not-found
      "
    >

      Product not found

    </p>

    <Toast ref="toastRef" />

    <Footer />

  </div>
</template>

<style scoped>
body {

  margin: 0;

  font-family: Arial, sans-serif;

  background:
    linear-gradient(
      135deg,
      #0f172a,
      #111827 50%,
      #172554
    );

  overflow-x: hidden;
}

/* STATUS */
.product-status-box,
.product-error-box {

  margin: 40px;

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.96),
      rgba(15,23,42,0.96)
    );

  padding: 30px;

  border-radius: 20px;

  border:
    1px solid rgba(255,255,255,0.06);

  box-shadow:
    0 10px 24px rgba(0,0,0,0.18);

  font-size: 18px;

  color: white;
}

.product-error-box {

  color: #f87171;
}

/* PAGE */
.product-detail-container {

  width: 100%;

  max-width: 1450px;

  margin: 0 auto;

  padding: 45px 30px;

  box-sizing: border-box;
}

/* CARD */
.product-detail-card {

  display: flex;

  gap: 50px;

  align-items: flex-start;

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.96),
      rgba(15,23,42,0.96)
    );

  border-radius: 24px;

  padding: 40px;

  border:
    1px solid rgba(255,255,255,0.06);

  box-shadow:
    0 12px 28px rgba(0,0,0,0.22);

  overflow: hidden;
}

/* IMAGE */
.product-image-section {

  flex: 1;

  display: flex;

  justify-content: center;

  align-items: center;

  background:
    radial-gradient(
      circle at center,
      rgba(59,130,246,0.10),
      rgba(15,23,42,0.85)
    );

  border-radius: 20px;

  padding: 30px;

  min-height: 520px;
}

.product-image {

  width: 100%;

  max-width: 500px;

  height: 500px;

  object-fit: contain;

  transition: 0.35s;
}

.product-image:hover {

  transform: scale(1.03);
}

/* INFO */
.product-info-section {

  flex: 1.2;

  display: flex;

  flex-direction: column;
}

/* NAME */
.product-name {

  font-size: 50px;

  font-weight: 800;

  color: #f8fafc;

  margin-bottom: 20px;

  line-height: 1.2;
}

/* PRICE */
.product-price {

  font-size: 38px;

  font-weight: 800;

  color: #93c5fd;

  margin-bottom: 25px;
}

/* CATEGORY */
.product-category {

  display: inline-block;

  width: fit-content;

  padding: 10px 18px;

  border-radius: 999px;

  background:
    rgba(59,130,246,0.12);

  border:
    1px solid rgba(59,130,246,0.16);

  color: #bfdbfe;

  font-size: 13px;

  font-weight: 700;

  margin-bottom: 35px;

  text-transform: capitalize;
}

/* FEATURES */
.product-features {

  display: flex;

  flex-wrap: wrap;

  gap: 15px;

  margin-bottom: 35px;
}

.product-feature-item {

  padding: 10px 16px;

  background:
    rgba(255,255,255,0.06);

  color: #cbd5e1;

  border-radius: 12px;

  border:
    1px solid rgba(255,255,255,0.06);

  font-size: 14px;

  font-weight: 700;
}

/* DETAILS */
.product-details-box {

  background:
    rgba(255,255,255,0.04);

  border-radius: 18px;

  padding: 28px;

  margin-bottom: 35px;

  border:
    1px solid rgba(255,255,255,0.06);
}

.product-details-title {

  font-size: 28px;

  margin-bottom: 18px;

  color: #f8fafc;
}

.product-details-text {

  font-size: 16px;

  line-height: 1.9;

  color: #cbd5e1;

  white-space: pre-line;
}

/* QUANTITY */
.product-quantity-section {

  margin-bottom: 30px;
}

.product-quantity-label {

  font-size: 18px;

  font-weight: 700;

  color: #f8fafc;

  margin-bottom: 16px;
}

.product-quantity-box {

  display: flex;

  align-items: center;

  gap: 18px;
}

.product-quantity-box button {

  width: 52px;

  height: 52px;

  border: none;

  border-radius: 14px;

  background:
    rgba(255,255,255,0.06);

  color: #93c5fd;

  font-size: 26px;

  font-weight: bold;

  cursor: pointer;

  transition: 0.3s;
}

.product-quantity-box button:hover {

  background: #2563eb;

  color: white;

  transform: translateY(-2px);
}

.product-quantity-box span {

  min-width: 40px;

  text-align: center;

  font-size: 22px;

  font-weight: bold;

  color: white;
}

/* BUTTON */
.product-add-btn {

  width: fit-content;

  padding: 16px 36px;

  border: none;

  border-radius: 14px;

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );

  color: white;

  font-size: 17px;

  font-weight: 700;

  cursor: pointer;

  transition: 0.3s;

  box-shadow:
    0 10px 20px rgba(37,99,235,0.20);
}

.product-add-btn:hover {

  transform: translateY(-2px);

  box-shadow:
    0 14px 28px rgba(37,99,235,0.28);
}

/* NOT FOUND */
.product-not-found {

  text-align: center;

  margin-top: 100px;

  font-size: 28px;

  color: #94a3b8;
}

/* TABLET */
@media (max-width: 992px) {

  .product-detail-card {

    flex-direction: column;

    padding: 28px;
  }

  .product-image-section {

    width: 100%;

    min-height: auto;
  }

  .product-image {

    height: 350px;
  }

  .product-name {

    font-size: 40px;
  }
}

/* MOBILE */
@media (max-width: 768px) {

  .product-detail-container {

    padding: 20px;
  }

  .product-detail-card {

    border-radius: 20px;

    gap: 30px;
  }

  .product-image {

    height: 260px;
  }

  .product-name {

    font-size: 30px;
  }

  .product-price {

    font-size: 28px;
  }

  .product-details-title {

    font-size: 24px;
  }

  .product-details-text {

    font-size: 15px;
  }

  .product-add-btn {

    width: 100%;
  }

  .product-quantity-box {

    justify-content: center;
  }
}
</style>