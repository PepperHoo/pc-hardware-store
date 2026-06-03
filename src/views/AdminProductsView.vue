<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import Toast from '../components/Toast.vue'
import { ref, onMounted, computed } from 'vue'
import { useCurrencyStore } from '../stores/currency'

const products = ref([])
const currencyStore = useCurrencyStore()
const name = ref(''); const price = ref(''); const stock = ref('')
const category = ref(''); const image = ref(''); const details = ref('')
const editingId = ref(null); const showEditModal = ref(false)
const editName = ref(''); const editPrice = ref(''); const editStock = ref('')
const editCategory = ref(''); const editImage = ref(''); const editDetails = ref('')
const selectedCategory = ref('all')
const toastRef = ref(null)
const uploadingImage = ref(false); const uploadingEditImage = ref(false)

const categories = ['processor','motherboard','gpu','ram','storage','psu','cooler','casing','rgb']

async function loadProducts() {
  const { getAll } = await import('../lib/api.js')
  products.value = await getAll('products')
}
onMounted(() => {
  currencyStore.fetchRates()
  loadProducts()
})

async function addProduct() {
  if (!name.value || !price.value || !category.value) {
    toastRef.value.showToastMessage('Please fill all required fields', 'error'); return
  }
  try {
    const { create } = await import('../lib/api.js')
    await create('products', {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,7),
      name: name.value, price: Number(price.value), stock: Number(stock.value||0),
      category: category.value, image: image.value, description: details.value
    })
    toastRef.value.showToastMessage('Product added!', 'success')
    name.value=''; price.value=''; stock.value=''; category.value=''; image.value=''; details.value=''
    loadProducts()
  } catch (err) {
    toastRef.value.showToastMessage('Failed to add product: '+err.message, 'error')
  }
}

async function removeProduct(id) {
  const { remove } = await import('../lib/api.js')
  await remove('products', id)
  toastRef.value.showToastMessage('Product removed!', 'success')
  loadProducts()
}

function startEdit(p) {
  editingId.value=p.id; editName.value=p.name; editPrice.value=p.price
  editStock.value=p.stock; editCategory.value=p.category; editImage.value=p.image
  editDetails.value=p.details||p.description||''; showEditModal.value=true
}
function closeModal() { showEditModal.value=false; editingId.value=null }

async function updateProduct(id) {
  try {
    const { update } = await import('../lib/api.js')
    await update('products', id, { name: editName.value, price: Number(editPrice.value), stock: Number(editStock.value), category: editCategory.value, image: editImage.value, description: editDetails.value })
    editingId.value=null; showEditModal.value=false; loadProducts()
    toastRef.value.showToastMessage('Product updated!', 'success')
  } catch (err) { toastRef.value.showToastMessage('Failed to update: '+err.message, 'error') }
}

async function handleImageUpload(e) {
  const file = e.target.files[0]; if (!file) return
  try { uploadingImage.value=true; const { uploadImage } = await import('../lib/api.js'); image.value = await uploadImage('images', file, 'products') }
  catch (err) { toastRef.value.showToastMessage('Upload failed', 'error') }
  finally { uploadingImage.value=false }
}
async function handleEditImageUpload(e) {
  const file = e.target.files[0]; if (!file) return
  try { uploadingEditImage.value=true; const { uploadImage } = await import('../lib/api.js'); editImage.value = await uploadImage('images', file, 'products') }
  catch (err) { toastRef.value.showToastMessage('Upload failed', 'error') }
  finally { uploadingEditImage.value=false }
}

const filteredProducts = computed(() =>
  selectedCategory.value === 'all' ? products.value : products.value.filter(p => p.category === selectedCategory.value)
)
const lowStockCount = computed(() => products.value.filter(p => p.stock <= 5).length)
</script>

<template>
  <div class="admin-page">
    <AdminNavbar />

    <main class="admin-main">
      <!-- Header -->
      <div class="page-header">
        <span class="kicker">Admin</span>
        <h1 class="page-title">Product <span class="grad-text">Inventory</span></h1>
        <p class="page-sub">Add, edit, and manage PC hardware components.</p>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-pill glass">
          <div class="sp-icon" style="color:#60a5fa">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="4" width="16" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="4" y="8" width="4" height="2" rx=".5" fill="currentColor" opacity=".6"/><rect x="10" y="8" width="5" height="2" rx=".5" fill="currentColor" opacity=".6"/></svg>
          </div>
          <div><p class="sp-label">Total Products</p><p class="sp-val" style="color:#93c5fd">{{ products.length }}</p></div>
        </div>
        <div class="stat-pill glass">
          <div class="sp-icon" style="color:#fca5a5">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v6M9 13v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1.5"/></svg>
          </div>
          <div><p class="sp-label">Low Stock</p><p class="sp-val" style="color:#fca5a5">{{ lowStockCount }}</p></div>
        </div>
      </div>

      <!-- Two-col layout -->
      <div class="products-layout">

        <!-- Add form -->
        <div class="add-form glass">
          <h2 class="form-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/></svg>
            Add New Product
          </h2>

          <div class="field-group">
            <label class="field-label">Product Name *</label>
            <input v-model="name" placeholder="e.g. NVIDIA RTX 5090" class="field-input" />
          </div>
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Price (MYR) *</label>
              <input v-model="price" type="number" placeholder="0.00" class="field-input" />
            </div>
            <div class="field-group">
              <label class="field-label">Stock Qty</label>
              <input v-model="stock" type="number" placeholder="0" class="field-input" />
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Category *</label>
            <select v-model="category" class="field-input">
              <option value="">Select category</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat.charAt(0).toUpperCase()+cat.slice(1) }}</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Product Image</label>
            <label class="upload-label">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v8M3 6l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              {{ uploadingImage ? 'Uploading…' : 'Upload Image' }}
              <input type="file" accept="image/*" @change="handleImageUpload" hidden />
            </label>
            <img v-if="image" :src="image" class="preview-img" />
          </div>
          <div class="field-group">
            <label class="field-label">Description</label>
            <textarea v-model="details" placeholder="Product details…" class="field-input field-textarea" rows="3" />
          </div>
          <button class="btn-add" @click="addProduct">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Add Product
          </button>
        </div>

        <!-- Right: filter + grid -->
        <div class="products-right">
          <!-- Filter -->
          <div class="filter-bar glass">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 3h13M3 7h9M5 11h5" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/></svg>
            <select v-model="selectedCategory" class="filter-select">
              <option value="all">All Categories</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat.charAt(0).toUpperCase()+cat.slice(1) }}</option>
            </select>
            <span class="filter-count">{{ filteredProducts.length }} products</span>
          </div>

          <!-- Product cards -->
          <div class="product-grid">
            <div v-for="(product, i) in filteredProducts" :key="product.id" class="product-card glass" :class="`stagger-${Math.min(i+1,6)}`">
              <div class="prod-img-wrap">
                <img :src="product.image" :alt="product.name" class="prod-img" />
              </div>
              <div class="prod-info">
                <span class="prod-cat">{{ product.category }}</span>
                <p class="prod-name">{{ product.name }}</p>
                <p class="prod-price">{{ currencyStore.format(product.price) }}</p>
                <div class="prod-stock" :class="product.stock <= 5 ? 'low' : 'ok'">
                  <span class="stock-dot" />
                  Stock: {{ product.stock }}
                </div>
              </div>
              <div class="prod-actions">
                <button class="btn-edit" @click="startEdit(product)">Edit</button>
                <button class="btn-del"  @click="removeProduct(product.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Edit modal -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card glass">
          <div class="modal-header">
            <h2 class="modal-title">Edit Product</h2>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="field-group">
            <label class="field-label">Name</label>
            <input v-model="editName" class="field-input" />
          </div>
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Price (MYR)</label>
              <input v-model="editPrice" type="number" class="field-input" />
            </div>
            <div class="field-group">
              <label class="field-label">Stock</label>
              <input v-model="editStock" type="number" class="field-input" />
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Category</label>
            <select v-model="editCategory" class="field-input">
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat.charAt(0).toUpperCase()+cat.slice(1) }}</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Image</label>
            <label class="upload-label">
              {{ uploadingEditImage ? 'Uploading…' : 'Upload New Image' }}
              <input type="file" accept="image/*" @change="handleEditImageUpload" hidden />
            </label>
            <img v-if="editImage" :src="editImage" class="preview-img" />
          </div>
          <div class="field-group">
            <label class="field-label">Description</label>
            <textarea v-model="editDetails" class="field-input field-textarea" rows="3" />
          </div>
          <div class="modal-actions">
            <button class="btn-ghost" @click="closeModal">Cancel</button>
            <button class="btn-add" @click="updateProduct(editingId)">Save Changes</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Toast ref="toastRef" />
  </div>
</template>

<style scoped>
.admin-page { display: flex; background: #030712; min-height: 100vh; }
.admin-main { margin-left: 256px; flex: 1; padding: 48px 40px; box-sizing: border-box; }

.page-header { margin-bottom: 12px; }
.page-title { font-family: 'Orbitron', sans-serif; font-size: clamp(22px,2.5vw,34px); font-weight: 900; color: #f1f5f9; margin: 6px 0 4px; line-height: 1.08; }
.page-sub { color: #475569; font-size: 12px; margin: 0; }

.stats-row { display: flex; gap: 10px; margin-bottom: 12px; }
.stat-pill { display: flex; align-items: center; gap: 9px; padding: 10px 12px !important; border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); }
.sp-icon { width: 30px; height: 30px; border-radius: 9px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sp-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #334155; margin: 0 0 4px; }
.sp-val { font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 900; margin: 0; }

/* Layout */
.products-layout { display: grid; grid-template-columns: 300px 1fr; gap: 12px; align-items: start; }
.products-right { display: flex; flex-direction: column; gap: 10px; }

/* Form */
.add-form { padding: 12px !important; border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); position: sticky; top: 20px; }
.form-title { display: flex; align-items: center; gap: 7px; font-family: 'Orbitron', sans-serif; font-size: 11px !important; font-weight: 800; color: #f1f5f9; margin: 0 0 10px; letter-spacing: 0.05em; }
.field-group { margin-bottom: 8px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field-label { display: block; font-size: 10px; font-weight: 600; color: #475569; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
.field-input {
  width: 100%; padding: 8px 10px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 9px; color: #f1f5f9; font-size: 12px; outline: none;
  transition: all 0.2s; box-sizing: border-box; font-family: inherit;
  color-scheme: dark;
}
.field-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.field-input::placeholder { color: #334155; }
.field-input option {
  background: #111827;
  color: #f8fafc;
}
select.field-input,
.filter-select {
  appearance: none;
  background-color: #111827;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' fill='none' stroke='%2393c5fd' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}
select.field-input option,
.filter-select option {
  background-color: #111827 !important;
  color: #f8fafc !important;
}
select.field-input option:checked,
.filter-select option:checked {
  background-color: #2563eb !important;
  color: #ffffff !important;
}
.field-textarea { resize: vertical; min-height: 54px; }

.upload-label {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 10px; border-radius: 9px;
  background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);
  color: #60a5fa; font-size: 11px; font-weight: 600; cursor: pointer;
  transition: all 0.2s; margin-bottom: 6px;
}
.upload-label:hover { background: rgba(59,130,246,0.18); }
.preview-img { width: 100%; max-height: 70px; object-fit: contain; border-radius: 8px; background: rgba(255,255,255,0.03); padding: 6px; box-sizing: border-box; }

.btn-add {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 8px 12px; border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white; border: none; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.3s;
}
.btn-add:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(37,99,235,0.35); }

/* Filter bar */
.filter-bar {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px !important;
  border-radius: 11px; border: 1px solid rgba(255,255,255,0.07);
}
.filter-select {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: #f1f5f9;
  font-size: 13px;
  padding: 8px 12px;
  outline: none;
  cursor: pointer;
  flex: 1;
  color-scheme: dark;
}
.filter-select option {
  background: #111827;
  color: #f8fafc;
}
select.field-input,
.filter-select {
  background-color: #111827;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' fill='none' stroke='%2393c5fd' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: right 12px center !important;
}
select.field-input option,
.filter-select option {
  background-color: #111827 !important;
  color: #f8fafc !important;
}
.filter-count { font-size: 12px; color: #334155; flex-shrink: 0; }

/* Product grid */
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px,1fr)); gap: 10px; }
.product-card { border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); overflow: hidden; transition: border-color 0.3s; }
.product-card:hover { border-color: rgba(59,130,246,0.25); }
.prod-img-wrap { height: 76px !important; background: radial-gradient(circle, rgba(59,130,246,0.07), rgba(3,7,18,0.5) 70%); display: flex; align-items: center; justify-content: center; padding: 8px; box-sizing: border-box; }
.prod-img { max-width: 100%; max-height: 100%; object-fit: contain; }
.prod-info { padding: 8px 10px !important; }
.prod-cat { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #3b82f6; }
.prod-name { font-size: 11px; font-weight: 700; color: #f1f5f9; margin: 3px 0 4px; line-height: 1.25; }
.prod-price { font-size: 13px; font-weight: 800; color: #60a5fa; margin: 0 0 5px; }
.prod-stock { display: flex; align-items: center; gap: 5px; font-size: 10px; }
.prod-stock.ok  { color: #6ee7b7; }
.prod-stock.low { color: #fca5a5; }
.stock-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.prod-actions { display: flex; gap: 6px; padding: 0 10px 8px !important; }
.btn-edit { flex: 1; padding: 6px; border-radius: 8px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); color: #60a5fa; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-edit:hover { background: rgba(59,130,246,0.2); }
.btn-del  { flex: 1; padding: 6px; border-radius: 8px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15); color: #fca5a5; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-del:hover  { background: rgba(239,68,68,0.18); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
.modal-card { width: 100%; max-width: 560px; padding: 36px; border-radius: 28px; border: 1px solid rgba(255,255,255,0.1); animation: pop 0.3s cubic-bezier(0.16,1,0.3,1) both; }
@keyframes pop { from { opacity:0; transform: scale(0.92) translateY(20px); } to { opacity:1; transform: scale(1) translateY(0); } }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-title { font-family: 'Orbitron', sans-serif; font-size: 16px; font-weight: 800; color: #f1f5f9; margin: 0; }
.modal-close { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); border: none; color: #64748b; cursor: pointer; font-size: 15px; transition: all 0.2s; }
.modal-close:hover { background: rgba(255,255,255,0.1); color: #f1f5f9; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.btn-ghost { padding: 11px 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #64748b; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-ghost:hover { background: rgba(255,255,255,0.09); color: #94a3b8; }

@media (max-width: 1100px) { .products-layout { grid-template-columns: 1fr; } .add-form { position: relative; top: 0; } }
@media (max-width: 768px)  { .admin-main { margin-left: 0; padding: 20px; } }
@media (max-width: 640px) {
  .admin-main { padding: 16px 12px; }
  .stats-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .filter-bar { align-items: center; }
  .filter-select { min-width: 0; font-size: 12px; }
  .filter-count { font-size: 11px; white-space: nowrap; }
  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .prod-img-wrap { height: 86px !important; padding: 6px; }
  .prod-info { padding: 8px !important; }
  .prod-cat { font-size: 9px; }
  .prod-name {
    min-height: 34px;
    font-size: 10px;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .prod-price { font-size: 12px; }
  .prod-stock { font-size: 9px; }
  .prod-actions {
    gap: 5px;
    padding: 0 8px 8px !important;
  }
  .btn-edit,
  .btn-del {
    min-height: 32px;
    padding: 6px 4px;
    font-size: 10px;
  }
}

@media (max-width: 360px) {
  .product-grid { gap: 8px; }
  .prod-img-wrap { height: 78px !important; }
  .btn-edit,
  .btn-del { font-size: 9px; }
}

:global(:root[data-theme="light"]) .field-input,
:global(:root[data-theme="light"]) .filter-select {
  background: rgba(255,255,255,0.94) !important;
  border-color: rgba(71,85,105,0.20) !important;
  color: #172033 !important;
  color-scheme: light;
}

:global(:root[data-theme="light"]) select.field-input,
:global(:root[data-theme="light"]) .filter-select {
  background-color: #ffffff !important;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' fill='none' stroke='%23172333' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: right 12px center !important;
  color: #172033 !important;
}

:global(:root[data-theme="light"]) .field-input::placeholder {
  color: #94a3b8 !important;
}

:global(:root[data-theme="light"]) .field-input option,
:global(:root[data-theme="light"]) .filter-select option {
  background: #ffffff !important;
  color: #172033 !important;
}

:global(:root[data-theme="light"]) .field-input option:checked,
:global(:root[data-theme="light"]) .filter-select option:checked {
  background: #dbeafe !important;
  color: #1d4ed8 !important;
}
</style>
