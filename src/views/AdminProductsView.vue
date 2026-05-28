<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import Toast from '../components/Toast.vue'

import {
  ref,
  onMounted,
  computed
} from 'vue'

const products = ref([])

const name = ref('')
const price = ref('')
const stock = ref('')
const category = ref('')
const image = ref('')
const details = ref('')

const editingId = ref(null)

const showEditModal = ref(false)

const editName = ref('')
const editPrice = ref('')
const editStock = ref('')
const editCategory = ref('')
const editImage = ref('')
const editDetails = ref('')

const selectedCategory = ref('all')

const toastRef = ref(null)

// FETCH PRODUCTS
async function loadProducts() {

  const { getAll } = await import('../lib/api.js')

  products.value = await getAll('products')
}

onMounted(() => {
  loadProducts()
})

// ADD PRODUCT
async function addProduct() {

  if (
    !name.value ||
    !price.value ||
    !category.value ||
    !image.value
  ) {

    toastRef.value
      .showToastMessage(
        'Please fill all fields',
        'error'
      )

    return
  }

  const newProduct = {

    name: name.value,

    price: Number(price.value),

    stock: Number(stock.value || 0),

    category: category.value,

    image: image.value,

    details: details.value
  }

  // Generate a unique id for the product
  newProduct.id =
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7)

  const { create } = await import('../lib/api.js')

  await create('products', newProduct)

  toastRef.value
    .showToastMessage(
      'Product added successfully!',
      'success'
    )

  name.value = ''
  price.value = ''
  stock.value = ''
  category.value = ''
  image.value = ''
  details.value = ''

  loadProducts()
}

// REMOVE PRODUCT
async function removeProduct(id) {

  const { remove } = await import('../lib/api.js')

  await remove('products', id)

  toastRef.value
    .showToastMessage(
      'Product removed successfully!',
      'success'
    )

  loadProducts()
}

// START EDIT
function startEdit(product) {

  editingId.value =
    product.id

  editName.value =
    product.name

  editPrice.value =
    product.price

  editStock.value =
    product.stock

  editCategory.value =
    product.category

  editImage.value =
    product.image

  editDetails.value =
    product.details

  showEditModal.value = true
}

// CLOSE MODAL
function closeModal() {

  showEditModal.value = false

  editingId.value = null
}

// UPDATE PRODUCT
async function updateProduct(id) {

  const updatedProduct = {

    name: editName.value,

    price: Number(
      editPrice.value
    ),

    stock: Number(
      editStock.value
    ),

    category:
      editCategory.value,

    image: editImage.value,

    details:
      editDetails.value
  }

  const { update } = await import('../lib/api.js')

  await update('products', id, updatedProduct)

  editingId.value = null

  showEditModal.value = false

  loadProducts()

  toastRef.value
    .showToastMessage(
      'Product updated successfully!',
      'success'
    )
}

// IMAGE UPLOAD
function handleImageUpload(event) {

  const file =
    event.target.files[0]

  if (!file) return

  const reader =
    new FileReader()

  reader.onload = () => {

    image.value =
      reader.result
  }

  reader.readAsDataURL(file)
}

// EDIT IMAGE
function handleEditImageUpload(
  event
) {

  const file =
    event.target.files[0]

  if (!file) return

  const reader =
    new FileReader()

  reader.onload = () => {

    editImage.value =
      reader.result
  }

  reader.readAsDataURL(file)
}

// FILTER
const filteredProducts =
  computed(() => {

    if (
      selectedCategory.value
      === 'all'
    ) {

      return products.value
    }

    return products.value
      .filter(product =>

        product.category ===
        selectedCategory.value
      )
  })

// LOW STOCK COUNT
const lowStockCount =
  computed(() => {

    return products.value
      .filter(product =>

        product.stock <= 5

      ).length
  })
</script>

<template>
  <div>

    <AdminNavbar />

    <!-- CONTAINER -->
    <div class="admin-products-container">

      <!-- HEADER -->
      <div class="admin-products-header">

        <h1>
          Product Inventory
        </h1>

        <p>
          Manage PC hardware components
        </p>

      </div>

      <!-- SUMMARY -->
      <div class="admin-products-summary-grid">

        <div
          class="
            admin-products-summary-card
            admin-products-blue
          "
        >

          <h2>
            📦 Products
          </h2>

          <p>
            {{ products.length }}
          </p>

        </div>

        <div
          class="
            admin-products-summary-card
            admin-products-red
          "
        >

          <h2>
            ⚠ Low Stock
          </h2>

          <p>
            {{ lowStockCount }}
          </p>

        </div>

      </div>

      <!-- ADD PRODUCT -->
      <div class="admin-products-form">

        <h2>
          ➕ Add New Product
        </h2>

        <input
          v-model="name"
          placeholder="Product Name"
        />

        <input
          v-model="price"
          type="number"
          placeholder="Price"
        />

        <input
          v-model="stock"
          type="number"
          placeholder="Stock Quantity"
        />

        <select v-model="category">

          <option value="">
            Select Category
          </option>

          <option value="processor">
            Processor
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

        </select>

        <input
          type="file"
          accept="image/*"
          @change="
            handleImageUpload
          "
        />

        <!-- IMAGE PREVIEW -->
        <img
          v-if="image"
          :src="image"
          class="
            admin-products-preview-image
          "
        />

        <textarea
          v-model="details"
          placeholder="
            Product Details
          "
        ></textarea>

        <button
          @click="addProduct"
        >
          Add Product
        </button>

      </div>

      <!-- FILTER -->
      <div
        class="
          admin-products-filter-box
        "
      >

        <select
          v-model="
            selectedCategory
          "
        >

          <option value="all">
            All Categories
          </option>

          <option value="processor">
            Processor
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

        </select>

      </div>

      <!-- PRODUCTS -->
      <div
        class="
          admin-products-grid
        "
      >

        <div
          class="
            admin-products-card
          "
          v-for="
            product in
            filteredProducts
          "
          :key="product.id"
        >

          <!-- IMAGE -->
          <img
            :src="product.image"
            class="
              admin-products-image
            "
          />

          <!-- NAME -->
          <h2>
            {{ product.name }}
          </h2>

          <!-- PRICE -->
          <p
            class="
              admin-products-price
            "
          >
            RM {{ product.price }}
          </p>

          <!-- STOCK -->
          <div
            class="
              admin-products-stock
            "
          >

            Stock:
            {{ product.stock }}

            <span
              v-if="
                product.stock <= 5
              "
              class="
                admin-products-low-stock
              "
            >
              LOW
            </span>

          </div>

          <!-- CATEGORY -->
          <div
            class="
              admin-products-category
            "
          >
            {{ product.category }}
          </div>

          <!-- DETAILS -->
          <div
            class="
              admin-products-details
            "
          >
            {{ product.details }}
          </div>

          <!-- ACTIONS -->
          <div
            class="
              admin-products-actions
            "
          >

            <!-- EDIT -->
            <button
              class="
                admin-products-edit-btn
              "
              @click="
                startEdit(product)
              "
            >
              Edit
            </button>

            <!-- DELETE -->
            <button
              class="
                admin-products-delete-btn
              "
              @click="
                removeProduct(
                  product.id
                )
              "
            >
              Remove
            </button>

          </div>

        </div>

      </div>

      <!-- EDIT MODAL -->
      <div
        v-if="showEditModal"
        class="
          edit-modal-overlay
        "
      >

        <div class="edit-modal">

          <h2>
            Edit Product
          </h2>

          <img
            :src="editImage"
            class="
              admin-products-image
            "
          />

          <input
            type="file"
            accept="image/*"
            @change="
              handleEditImageUpload
            "
          />

          <input
            v-model="editName"
            placeholder="
              Product Name
            "
          />

          <input
            type="number"
            v-model="editPrice"
            placeholder="Price"
          />

          <input
            type="number"
            v-model="editStock"
            placeholder="Stock"
          />

          <select
            v-model="
              editCategory
            "
          >

            <option value="processor">
              Processor
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

          </select>

          <textarea
            v-model="editDetails"
            placeholder="
              Product Details
            "
          ></textarea>

          <div class="modal-actions">

            <button
              class="
                admin-products-save-btn
              "
              @click="
                updateProduct(
                  editingId
                )
              "
            >
              Save
            </button>

            <button
              class="
                admin-products-delete-btn
              "
              @click="closeModal"
            >
              Cancel
            </button>

          </div>

        </div>

      </div>

    </div>

    <Toast ref="toastRef" />

  </div>
</template>

<style scoped>
body {

  margin: 0;

  font-family: Arial, sans-serif;

  background: #0f172a;
}

/* CONTAINER */
.admin-products-container {

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

/* HEADER */
.admin-products-header {

  margin-bottom: 35px;
}

.admin-products-header h1 {

  font-size: 52px;

  margin-bottom: 10px;

  color: #f8fafc;

  font-weight: 800;

  letter-spacing: -0.5px;
}

.admin-products-header p {

  color: #94a3b8;

  font-size: 18px;
}

/* SUMMARY */
.admin-products-summary-grid {

  display: grid;

  grid-template-columns:
    repeat(auto-fit, minmax(240px,1fr));

  gap: 24px;

  margin-bottom: 35px;
}

/* CARD */
.admin-products-summary-card {

  padding: 28px;

  border-radius: 22px;

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

.admin-products-summary-card:hover {

  transform: translateY(-4px);

  box-shadow:
    0 14px 34px rgba(0,0,0,0.30);
}

.admin-products-summary-card h2 {

  margin-bottom: 10px;

  font-size: 18px;

  font-weight: 600;
}

.admin-products-summary-card p {

  font-size: 44px;

  font-weight: 800;

  margin: 0;
}

/* COLORS */
.admin-products-blue {

  border-left: 4px solid #3b82f6;
}

.admin-products-blue h2 { color: #93c5fd; }
.admin-products-blue p  { color: #bfdbfe; }

.admin-products-red {

  border-left: 4px solid #ef4444;
}

.admin-products-red h2 { color: #fca5a5; }
.admin-products-red p  { color: #fecaca; }

/* FORM */
.admin-products-form {

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.97),
      rgba(15,23,42,0.97)
    );

  border:
    1px solid rgba(148,163,184,0.10);

  padding: 28px;

  border-radius: 24px;

  display: grid;

  gap: 16px;

  margin-bottom: 35px;

  box-shadow:
    0 8px 24px rgba(0,0,0,0.22);
}

/* INPUT */
.admin-products-form input,
.admin-products-form select,
.admin-products-form textarea,
.edit-modal input,
.edit-modal select,
.edit-modal textarea {

  width: 100%;

  padding: 14px;

  border-radius: 12px;

  border:
    1px solid rgba(148,163,184,0.18);

  background:
    rgba(255,255,255,0.06);

  color: #f1f5f9;

  font-size: 15px;

  box-sizing: border-box;

  outline: none;

  transition: 0.3s;
}

.admin-products-form input:focus,
.admin-products-form select:focus,
.admin-products-form textarea:focus,
.edit-modal input:focus,
.edit-modal select:focus,
.edit-modal textarea:focus {

  border-color: #3b82f6;

  box-shadow:
    0 0 0 3px rgba(59,130,246,0.14);
}

/* BUTTON */
.admin-products-form button {

  padding: 15px;

  border: none;

  border-radius: 12px;

  background:
    linear-gradient(135deg, #2563eb, #3b82f6);

  color: white;

  font-size: 16px;

  font-weight: bold;

  cursor: pointer;

  transition: 0.25s;
}

.admin-products-form button:hover {

  transform: translateY(-2px);

  box-shadow:
    0 10px 22px rgba(59,130,246,0.32);
}

/* FILTER */
.admin-products-filter-box {

  margin-bottom: 30px;
}

.admin-products-filter-box select {

  padding: 14px;

  border-radius: 12px;

  border:
    1px solid rgba(148,163,184,0.18);

  background:
    rgba(255,255,255,0.06);

  color: #f1f5f9;

  font-size: 15px;

  min-width: 240px;

  transition: 0.3s;
}

.admin-products-filter-box select:focus {

  border-color: #3b82f6;

  box-shadow:
    0 0 0 3px rgba(59,130,246,0.14);
}

/* GRID */
.admin-products-grid {

  display: grid;

  grid-template-columns:
    repeat(auto-fit, minmax(340px,1fr));

  gap: 28px;
}

/* CARD */
.admin-products-card {

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.97),
      rgba(15,23,42,0.97)
    );

  border:
    1px solid rgba(148,163,184,0.10);

  border-radius: 24px;

  padding: 24px;

  box-shadow:
    0 8px 24px rgba(0,0,0,0.22);

  display: flex;

  flex-direction: column;

  gap: 18px;

  transition: 0.30s cubic-bezier(0.4,0,0.2,1);
}

.admin-products-card:hover {

  transform: translateY(-4px);

  border-color: rgba(59,130,246,0.22);

  box-shadow:
    0 16px 38px rgba(0,0,0,0.30);
}

/* IMAGE */
.admin-products-image {

  width: 100%;

  height: 240px;

  object-fit: contain;

  border-radius: 18px;

  background:
    radial-gradient(
      circle at center,
      rgba(59,130,246,0.07),
      rgba(15,23,42,0.70) 70%
    );

  padding: 15px;
}

/* PREVIEW */
.admin-products-preview-image {

  width: 200px;

  border-radius: 14px;
}

/* PRICE */
.admin-products-price {

  font-size: 24px;

  font-weight: bold;

  color: #93c5fd;
}

/* STOCK */
.admin-products-stock {

  font-weight: bold;

  color: #cbd5e1;

  display: flex;

  gap: 10px;
}

/* LOW STOCK */
.admin-products-low-stock {

  background: rgba(239,68,68,0.14);

  color: #fca5a5;

  border: 1px solid rgba(239,68,68,0.28);

  padding: 5px 12px;

  border-radius: 999px;

  font-size: 12px;

  font-weight: bold;
}

/* CATEGORY */
.admin-products-category {

  width: fit-content;

  background: rgba(59,130,246,0.13);

  color: #93c5fd;

  border: 1px solid rgba(59,130,246,0.24);

  padding: 7px 14px;

  border-radius: 999px;

  font-size: 13px;

  font-weight: bold;
}

/* DETAILS */
.admin-products-details {

  color: #94a3b8;

  line-height: 1.7;
}

/* ACTIONS */
.admin-products-actions {

  display: flex;

  gap: 12px;

  margin-top: auto;
}

/* BUTTONS */
.admin-products-edit-btn,
.admin-products-save-btn,
.admin-products-delete-btn {

  flex: 1;

  padding: 13px;

  border: none;

  border-radius: 12px;

  color: white;

  font-weight: bold;

  cursor: pointer;

  transition: 0.25s;
}

.admin-products-edit-btn:hover,
.admin-products-save-btn:hover,
.admin-products-delete-btn:hover {

  transform: translateY(-2px);
}

/* COLORS */
.admin-products-edit-btn {

  background:
    linear-gradient(135deg, #d97706, #f59e0b);
}

.admin-products-edit-btn:hover {

  box-shadow:
    0 8px 18px rgba(245,158,11,0.30);
}

.admin-products-save-btn {

  background:
    linear-gradient(135deg, #059669, #10b981);
}

.admin-products-save-btn:hover {

  box-shadow:
    0 8px 18px rgba(16,185,129,0.30);
}

.admin-products-delete-btn {

  background:
    linear-gradient(135deg, #dc2626, #ef4444);
}

.admin-products-delete-btn:hover {

  box-shadow:
    0 8px 18px rgba(239,68,68,0.28);
}

/* MODAL OVERLAY */
.edit-modal-overlay {

  position: fixed;

  inset: 0;

  background: rgba(0,0,0,0.65);

  display: flex;

  justify-content: center;

  align-items: center;

  z-index: 9999;

  padding: 20px;
}

/* MODAL */
.edit-modal {

  width: 100%;

  max-width: 650px;

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.99),
      rgba(15,23,42,0.99)
    );

  border:
    1px solid rgba(148,163,184,0.14);

  border-radius: 28px;

  padding: 30px;

  display: flex;

  flex-direction: column;

  gap: 18px;

  box-shadow:
    0 24px 56px rgba(0,0,0,0.50);

  animation: modalPop 0.22s cubic-bezier(0.4,0,0.2,1);
}

/* MODAL ACTIONS */
.modal-actions {

  display: flex;

  gap: 14px;
}

/* MOBILE */
@media (max-width: 768px) {

  .admin-products-container {

    margin-left: 0;

    padding: 20px;
  }

  .admin-products-grid {

    grid-template-columns: 1fr;
  }

  .admin-products-actions,
  .modal-actions {

    flex-direction: column;
  }

  .admin-products-filter-box select {

    width: 100%;
  }
}
</style>