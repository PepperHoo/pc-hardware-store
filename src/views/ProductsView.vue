<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Toast from '../components/Toast.vue'

import {
  ref,
  computed,
  watch,
  onMounted
} from 'vue'

import {
  useRoute,
  useRouter
} from 'vue-router'

import {
  useCartStore
} from '../stores/cart'

const route = useRoute()

const router = useRouter()

const cart = useCartStore()

const toastRef = ref(null)

const products = ref([])

const loading = ref(true)

const errorMessage = ref('')

const currentPage = ref(1)

const productsPerPage = 12

const selectedCategory = ref('')

const sortOption = ref('')

const search = ref('')

const quantities = ref({})

// LOAD SEARCH
watch(

  () => route.query.search,

  (newSearch) => {

    search.value =
      newSearch || ''
  },

  { immediate: true }
)

// CATEGORY WATCH
watch(

  () => route.params.category,

  (newCategory) => {

    selectedCategory.value =
      newCategory || ''
  },

  { immediate: true }
)

// UPDATE ROUTE
watch(

  selectedCategory,

  (newCategory) => {

    if (newCategory) {

      router.push({

        path:
          `/products/${newCategory}`,

        query: route.query
      })

    } else {

      router.push({

        path: '/products',

        query: route.query
      })
    }
  }
)

// FILTER PRODUCTS
const filteredProducts = computed(() => {

  let result = [
    ...products.value
  ]

  // SEARCH
  if (search.value) {

    result = result.filter(

      product =>

        product.name
          .toLowerCase()
          .includes(
            search.value
              .toLowerCase()
          )
    )
  }

  // CATEGORY
  if (
    selectedCategory.value
  ) {

    result = result.filter(

      product =>

        product.category ===
        selectedCategory.value
    )
  }

  // SORT
  if (
    sortOption.value ===
    'name-asc'
  ) {

    result.sort((a, b) =>

      a.name.localeCompare(
        b.name
      )
    )
  }

  if (
    sortOption.value ===
    'name-desc'
  ) {

    result.sort((a, b) =>

      b.name.localeCompare(
        a.name
      )
    )
  }

  if (
    sortOption.value ===
    'low-high'
  ) {

    result.sort((a, b) =>

      a.price - b.price
    )
  }

  if (
    sortOption.value ===
    'high-low'
  ) {

    result.sort((a, b) =>

      b.price - a.price
    )
  }

  return result
})

// PAGINATION
const paginatedProducts =
  computed(() => {

    const start =

      (
        currentPage.value - 1
      )

      * productsPerPage

    const end =

      start + productsPerPage

    return filteredProducts.value
      .slice(start, end)
  })

// TOTAL PAGES
const totalPages =
  computed(() => {

    return Math.max(

      1,

      Math.ceil(

        filteredProducts.value
          .length

        /

        productsPerPage
      )
    )
  })

// RESET PAGE
watch(

  [
    selectedCategory,
    sortOption,
    search
  ],

  () => {

    currentPage.value = 1
  }
)

// QUANTITY
function increaseQuantity(id) {

  if (!quantities.value[id]) {

    quantities.value[id] = 1
  }

  quantities.value[id]++
}

function decreaseQuantity(id) {

  if (

    quantities.value[id] > 1

  ) {

    quantities.value[id]--
  }
}

// ADD TO CART
function addToCart(product) {

  const quantity =

    quantities.value[product.id]
    || 1

  for (

    let i = 0;

    i < quantity;

    i++
  ) {

    cart.addToCart(product)
  }

  toastRef.value
    .showToastMessage(

      `${quantity} item(s) added to cart!`,

      'success'
    )
}

// LOAD PRODUCTS
onMounted(async () => {

  try {

    loading.value = true

    const { getAll } = await import('../lib/api.js')

    products.value = await getAll('products')

    products.value.forEach(
      product => {

        quantities.value[
          product.id
        ] = 1
      }
    )

  } catch (error) {

    console.log(error)

    errorMessage.value =
      'Failed to load products.'

  } finally {

    loading.value = false
  }
})
</script>

<template>
  <div>

    <Navbar />

    <!-- LOADING -->
    <div
      v-if="loading"
      class="products-status-box"
    >
      Loading products...
    </div>

    <!-- ERROR -->
    <div
      v-else-if="errorMessage"
      class="products-error-box"
    >
      {{ errorMessage }}
    </div>

    <!-- PAGE -->
    <div
      v-else
      class="
        products-page-container
      "
    >

      <!-- TITLE -->
      <h2
        class="
          products-page-title
        "
      >

        {{
          selectedCategory
            ? selectedCategory
                .toUpperCase()
            : route.params.category
              ? route.params
                  .category
                  .toUpperCase()
              : 'All Products'
        }}

      </h2>

      <!-- FILTER -->
      <div
        class="
          products-filter-bar
        "
      >

        <!-- SEARCH -->
        <input

          v-model="search"

          placeholder="
            Search products...
          "

          class="
            products-search-input
          "
        />

        <!-- CATEGORY -->
        <select
          v-model="
            selectedCategory
          "
        >

          <option value="">
            All Categories
          </option>

          <option value="processor">
            CPU
          </option>

          <option value="motherboard">
            Motherboard
          </option>

          <option value="gpu">
            GPU
          </option>

          <option value="ram">
            RAM
          </option>

          <option value="storage">
            Storage
          </option>

          <option value="psu">
            PSU
          </option>

          <option value="cooler">
            Cooler
          </option>

          <option value="casing">
            PC Casing
          </option>

          <option value="rgb">
            RGB Lighting
          </option>

        </select>

        <!-- SORT -->
        <div
          class="
            products-sort-box
          "
        >

          <label>
            Sort by
          </label>

          <select
            v-model="sortOption"
          >

            <option value="">
              Default
            </option>

            <option value="name-asc">
              Name (A → Z)
            </option>

            <option value="name-desc">
              Name (Z → A)
            </option>

            <option value="low-high">
              Price (Low → High)
            </option>

            <option value="high-low">
              Price (High → Low)
            </option>

          </select>

        </div>

      </div>

      <!-- RESULT -->
      <div class="products-result-count">

        Showing
        {{ filteredProducts.length }}
        products

      </div>

      <!-- GRID -->
      <div
        class="
          products-grid
        "
      >

        <div
          class="
            products-card
          "
          v-for="
            product in
            paginatedProducts
          "
          :key="product.id"
        >

          <!-- IMAGE -->
          <div
            class="
              products-image-wrapper
            "
          >

            <img
              :src="product.image"
              class="
                products-image
              "
            />

          </div>

          <!-- INFO -->
          <div
            class="
              products-info
            "
          >

            <!-- CATEGORY -->
            <div
              class="
                products-category
              "
            >

              {{
                product.category
              }}

            </div>

            <!-- NAME -->
            <h3
              class="
                products-name
              "
            >

              {{
                product.name
              }}

            </h3>

            <!-- PRICE -->
            <p
              class="
                products-price
              "
            >

              RM

              {{
                Number(
                  product.price
                ).toFixed(2)
              }}

            </p>

            <!-- QUANTITY -->
            <div
              class="
                products-quantity-box
              "
            >

              <button
                @click="
                  decreaseQuantity(
                    product.id
                  )
                "
              >

                −

              </button>

              <span>

                {{
                  quantities[
                    product.id
                  ]
                }}

              </span>

              <button
                @click="
                  increaseQuantity(
                    product.id
                  )
                "
              >

                +

              </button>

            </div>

            <!-- ACTIONS -->
            <div
              class="
                products-actions
              "
            >

              <!-- VIEW -->
              <router-link
                :to="
                  `/product/${product.id}`
                "
                class="
                  products-view-link
                "
              >

                <button
                  class="
                    products-view-btn
                  "
                >

                  👁 View

                </button>

              </router-link>

              <!-- ADD -->
              <button
                class="
                  products-add-btn
                "
                @click="
                  addToCart(
                    product
                  )
                "
              >

                🛒 Add To Cart

              </button>

            </div>

          </div>

        </div>

      </div>

      <!-- EMPTY -->
      <div
        v-if="
          filteredProducts.length
          === 0
        "
        class="
          products-empty
        "
      >

        No products found.

      </div>

      <!-- PAGINATION -->
      <div
        class="
          products-pagination
        "
      >

        <button
          @click="
            currentPage--
          "
          :disabled="
            currentPage === 1
          "
        >

          Prev

        </button>

        <span>

          Page
          {{ currentPage }}
          of
          {{ totalPages }}

        </span>

        <button
          @click="
            currentPage++
          "
          :disabled="
            currentPage ===
            totalPages
          "
        >

          Next

        </button>

      </div>

    </div>

    <Toast ref="toastRef" />

    <Footer />

  </div>
</template>

<style scoped>

/* PAGE */
.products-page-container {

  width: 100%;

  max-width: 1500px;

  margin: 0 auto;

  padding: 40px;

  box-sizing: border-box;
}

/* TITLE */
.products-page-title {

  font-size: 52px;

  font-weight: 800;

  margin-bottom: 30px;

  color: #f8fafc;

  letter-spacing: -0.5px;
}

/* FILTER */
.products-filter-bar {

  display: flex;

  flex-wrap: wrap;

  align-items: center;

  gap: 18px;

  margin-bottom: 30px;

  padding: 22px;

  background:
    linear-gradient(
      145deg,
      #2563eb,
      #1d55d4
    );

  border-radius: 20px;

  border:
    1px solid rgba(59,130,246,0.50);

  box-shadow:
    0 8px 28px rgba(0,0,0,0.20);
}

/* SEARCH */
.products-search-input {

  flex: 1;

  min-width: 260px;

  height: 52px;

  padding: 0 20px;

  border:
    1px solid rgba(148,163,184,0.18);

  border-radius: 14px;

  background:
    rgba(255,255,255,0.06);

  color: #f8fafc;

  font-size: 15px;

  outline: none;

  transition: 0.3s;
}

.products-search-input:focus {

  border-color: #3b82f6;

  box-shadow:
    0 0 0 3px rgba(59,130,246,0.14);
}

/* SELECT */
.products-filter-bar select {

  height: 52px;

  min-width: 190px;

  padding: 0 18px;

  border:
    1px solid rgba(148,163,184,0.18);

  border-radius: 14px;

  background:
    rgba(255,255,255,0.06);

  color: #f8fafc;

  font-size: 15px;

  cursor: pointer;
}

/* SORT */
.products-sort-box {

  display: flex;

  align-items: center;

  gap: 12px;

  font-size: 15px;

  font-weight: 600;

  color: #94a3b8;
}

/* RESULT */
.products-result-count {

  margin-bottom: 28px;

  color: #94a3b8;

  font-weight: 600;

  font-size: 14px;

  letter-spacing: 0.02em;
}

/* GRID */
.products-grid {

  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(300px,1fr)
    );

  gap: 28px;
}

/* CARD */
.products-card {

  background:
    linear-gradient(
      145deg,
      #2563eb,
      #1d55d4
    );

  border-radius: 20px;

  overflow: hidden;

  border:
    1px solid rgba(59,130,246,0.50);

  box-shadow:
    0 8px 24px rgba(0,0,0,0.22),
    0 0 0 1px rgba(59,130,246,0.05) inset;

  transition: 0.32s cubic-bezier(0.4,0,0.2,1);

  display: flex;

  flex-direction: column;
}

.products-card:hover {

  transform: translateY(-6px);

  border-color: rgba(59,130,246,0.24);

  box-shadow:
    0 18px 40px rgba(0,0,0,0.28),
    0 0 0 1px rgba(59,130,246,0.10);
}

/* IMAGE */
.products-image-wrapper {

  width: 100%;

  height: 240px;

  background:
    radial-gradient(
      circle at center,
      rgba(59,130,246,0.07),
      rgba(15,23,42,0.70) 70%
    );

  display: flex;

  justify-content: center;

  align-items: center;

  overflow: hidden;
}

.products-image {

  width: 100%;

  height: 100%;

  object-fit: contain;

  padding: 20px;

  transition: 0.4s;
}

.products-card:hover
.products-image {

  transform: scale(1.05);
}

/* INFO */
.products-info {

  padding: 22px 24px 24px;

  display: flex;

  flex-direction: column;

  flex: 1;
}

/* CATEGORY */
.products-category {

  width: fit-content;

  padding: 6px 14px;

  border-radius: 999px;

  background:
    rgba(59,130,246,0.13);

  color: #93c5fd;

  font-size: 11px;

  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.06em;

  border:
    1px solid rgba(59,130,246,0.20);

  margin-bottom: 14px;
}

/* NAME */
.products-name {

  font-size: 22px;

  font-weight: 700;

  color: #f1f5f9;

  line-height: 1.4;

  margin-bottom: 14px;

  min-height: 64px;
}

/* PRICE */
.products-price {

  font-size: 30px;

  font-weight: 800;

  color: #93c5fd;

  margin-bottom: 20px;
}

/* QUANTITY */
.products-quantity-box {

  display: flex;

  justify-content: center;

  align-items: center;

  gap: 16px;

  margin-bottom: 20px;
}

.products-quantity-box button {

  width: 40px;

  height: 40px;

  border: none;

  border-radius: 12px;

  background:
    rgba(59,130,246,0.14);

  color: #93c5fd;

  font-size: 22px;

  font-weight: bold;

  cursor: pointer;

  transition: 0.25s;

  display: flex;

  align-items: center;

  justify-content: center;
}

.products-quantity-box button:hover {

  background:
    linear-gradient(135deg, #2563eb, #3b82f6);

  color: white;

  transform: scale(1.06);
}

.products-quantity-box span {

  font-size: 18px;

  font-weight: 700;

  min-width: 24px;

  text-align: center;

  color: #f1f5f9;
}

/* ACTIONS */
.products-actions {

  display: flex;

  gap: 12px;

  margin-top: auto;
}

.products-view-link {

  width: 34%;
}

/* VIEW BUTTON */
.products-view-btn {

  width: 100%;

  height: 50px;

  border: 1px solid rgba(148,163,184,0.18);

  border-radius: 14px;

  background:
    rgba(255,255,255,0.06);

  color: #cbd5e1;

  font-size: 14px;

  font-weight: 600;

  cursor: pointer;

  transition: 0.25s;
}

.products-view-btn:hover {

  background:
    rgba(255,255,255,0.10);

  border-color: rgba(148,163,184,0.28);

  color: #f1f5f9;
}

/* ADD BUTTON */
.products-add-btn {

  flex: 1;

  height: 50px;

  border: none;

  border-radius: 14px;

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );

  color: white;

  font-size: 15px;

  font-weight: 700;

  cursor: pointer;

  transition: 0.25s;
}

.products-add-btn:hover {

  transform: translateY(-2px);

  box-shadow:
    0 10px 24px rgba(37,99,235,0.30);
}

/* EMPTY */
.products-empty {

  margin-top: 60px;

  background:
    linear-gradient(
      145deg,
      #2563eb,
      #1d55d4
    );

  border:
    1px solid rgba(148,163,184,0.10);

  border-radius: 20px;

  padding: 70px 20px;

  text-align: center;

  color: #94a3b8;

  font-size: 22px;
}

/* PAGINATION */
.products-pagination {

  margin-top: 50px;

  display: flex;

  justify-content: center;

  align-items: center;

  gap: 20px;
}

.products-pagination button {

  padding: 12px 28px;

  border: none;

  border-radius: 12px;

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );

  color: white;

  font-weight: 700;

  cursor: pointer;

  transition: 0.25s;
}

.products-pagination button:hover {

  transform: translateY(-2px);

  box-shadow:
    0 8px 18px rgba(37,99,235,0.28);
}

.products-pagination button:disabled {

  opacity: 0.35;

  cursor: not-allowed;

  transform: none;

  box-shadow: none;
}

.products-pagination span {

  font-weight: 600;

  color: #94a3b8;
}

/* STATUS */
.products-status-box,
.products-error-box {

  margin: 40px;

  background:
    linear-gradient(
      145deg,
      #2563eb,
      #1d55d4
    );

  padding: 30px;

  border-radius: 18px;

  border:
    1px solid rgba(148,163,184,0.10);

  font-size: 18px;

  color: #94a3b8;
}

.products-error-box {

  color: #f87171;
}

/* MOBILE */
@media (max-width: 768px) {

  .products-page-container {

    padding: 20px;
  }

  .products-page-title {

    font-size: 36px;
  }

  .products-filter-bar {

    flex-direction: column;

    align-items: stretch;
  }

  .products-sort-box {

    flex-direction: column;

    align-items: stretch;
  }

  .products-grid {

    grid-template-columns: 1fr;
  }

  .products-actions {

    flex-direction: column;
  }

  .products-view-link {

    width: 100%;
  }
}
</style>