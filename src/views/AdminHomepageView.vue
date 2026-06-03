<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import { ref, onMounted, computed } from 'vue'
import { useCurrencyStore } from '../stores/currency'

const currencyStore   = useCurrencyStore()
const hotSelling      = ref([])
const latestProducts  = ref([])
const loading         = ref(true)
const saving          = ref(false)
const successMessage  = ref('')
const errorMessage    = ref('')
const homepageId      = ref(null)
const showProductModal = ref(false)
const modalMode       = ref('add')
const modalListType   = ref('hot')
const modalIndex      = ref(null)
const modalUploading  = ref(false)
const modalProduct    = ref(blankProduct())

const MAX_HOT_SELLING = 6
const MAX_LATEST      = 6
const categories = ['processor','motherboard','gpu','ram','storage','psu','cooler','casing','rgb']

const canAddHot    = computed(() => hotSelling.value.length < MAX_HOT_SELLING)
const canAddLatest = computed(() => latestProducts.value.length < MAX_LATEST)
const modalTitle   = computed(() => {
  const listName = modalListType.value === 'hot' ? 'Hot Selling Product' : 'Latest Product'
  return `${modalMode.value === 'edit' ? 'Edit' : 'Add'} ${listName}`
})

function blankProduct() {
  return {
    id: '',
    name: '',
    price: '',
    category: '',
    image: '',
    description: '',
  }
}

function generateProductId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function getList(type) {
  return type === 'hot' ? hotSelling : latestProducts
}

function getLimit(type) {
  return type === 'hot' ? MAX_HOT_SELLING : MAX_LATEST
}

function listLabel(type) {
  return type === 'hot' ? 'hot selling products' : 'latest products'
}

function displayCategory(value) {
  if (!value) return 'Component'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function hasPrice(value) {
  return value !== '' && value !== null && value !== undefined && !Number.isNaN(Number(value))
}

function productForForm(product = {}) {
  return {
    id: product.id || '',
    name: product.name || '',
    price: product.price ?? '',
    category: product.category || '',
    image: product.image || '',
    description: product.description || product.details || '',
  }
}

function productForSave(product) {
  return {
    id: product.id || generateProductId(),
    name: String(product.name || '').trim(),
    price: Number(product.price || 0),
    category: product.category || 'component',
    image: product.image || '',
    description: product.description || '',
  }
}

async function loadHomepage() {
  try {
    loading.value = true
    const { getAll } = await import('../lib/api.js')
    const rows = await getAll('homepage')
    const data = rows[0] || {}
    homepageId.value = data.id ?? null
    hotSelling.value = Array.isArray(data.hotSelling) ? data.hotSelling : []
    latestProducts.value = Array.isArray(data.latestProducts) ? data.latestProducts : []
  } catch (e) {
    console.log(e)
    errorMessage.value = 'Failed to load homepage data.'
  } finally {
    loading.value = false
  }
}

async function saveHomepage() {
  try {
    saving.value = true
    successMessage.value = ''
    errorMessage.value = ''
    const { update, create } = await import('../lib/api.js')
    const payload = {
      hotSelling: hotSelling.value,
      latestProducts: latestProducts.value,
    }

    if (homepageId.value) {
      await update('homepage', homepageId.value, payload)
    } else {
      const id = 'homepage'
      await create('homepage', { id, ...payload })
      homepageId.value = id
    }

    successMessage.value = 'Homepage products updated successfully!'
  } catch (e) {
    console.log(e)
    errorMessage.value = 'Failed to update homepage products.'
  } finally {
    saving.value = false
  }
}

function openAddProduct(type) {
  const targetList = getList(type)
  if (targetList.value.length >= getLimit(type)) {
    errorMessage.value = `Maximum ${getLimit(type)} ${listLabel(type)} allowed.`
    return
  }

  modalMode.value = 'add'
  modalListType.value = type
  modalIndex.value = null
  modalProduct.value = blankProduct()
  showProductModal.value = true
}

function openEditProduct(type, index) {
  const targetList = getList(type)
  modalMode.value = 'edit'
  modalListType.value = type
  modalIndex.value = index
  modalProduct.value = productForForm(targetList.value[index])
  showProductModal.value = true
}

function closeProductModal() {
  showProductModal.value = false
  modalUploading.value = false
  modalIndex.value = null
  modalProduct.value = blankProduct()
}

async function handleModalImageUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    modalUploading.value = true
    const { uploadImage } = await import('../lib/api.js')
    const folder = modalListType.value === 'hot' ? 'hot-selling' : 'latest-products'
    modalProduct.value.image = await uploadImage('images', file, folder)
  } catch (err) {
    errorMessage.value = 'Upload failed: ' + err.message
  } finally {
    modalUploading.value = false
    event.target.value = ''
  }
}

function saveProductModal() {
  if (!String(modalProduct.value.name || '').trim()) {
    errorMessage.value = 'Please enter a product name.'
    return
  }

  const targetList = getList(modalListType.value)
  const product = productForSave(modalProduct.value)

  if (modalMode.value === 'edit' && modalIndex.value !== null) {
    targetList.value.splice(modalIndex.value, 1, product)
  } else {
    if (targetList.value.length >= getLimit(modalListType.value)) {
      errorMessage.value = `Maximum ${getLimit(modalListType.value)} ${listLabel(modalListType.value)} allowed.`
      return
    }
    targetList.value.push(product)
  }

  successMessage.value = ''
  errorMessage.value = ''
  closeProductModal()
}

function removeHotSellingProduct(index) {
  hotSelling.value.splice(index, 1)
}

function removeLatestProduct(index) {
  latestProducts.value.splice(index, 1)
}

onMounted(() => {
  currencyStore.fetchRates()
  loadHomepage()
})
</script>

<template>
  <div class="admin-page">
    <AdminNavbar />

    <main class="admin-main">
      <div v-if="loading" class="state-screen">
        <div class="loader" />
        <p>Loading homepage data...</p>
      </div>

      <div v-else>
        <div class="page-header">
          <span class="kicker">Admin</span>
          <h1 class="page-title">Homepage <span class="grad-text">Editor</span></h1>
          <p class="page-sub">Manage hot selling products and latest homepage listings.</p>
        </div>

        <div v-if="successMessage" class="alert-box success">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="#6ee7b7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="alert-box error">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 5v4M8 11v1" stroke="#fca5a5" stroke-width="2" stroke-linecap="round"/><circle cx="8" cy="8" r="6.5" stroke="#fca5a5" stroke-width="1.5"/></svg>
          {{ errorMessage }}
        </div>

        <section class="section-card glass stagger-1">
          <div class="section-header">
            <div>
              <h2 class="section-title">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1C5 5 2 7 2 10a6 6 0 0 0 12 0c0-3-3-5-6-9z" stroke="#f59e0b" stroke-width="1.5" stroke-linejoin="round"/></svg>
                Hot Selling Products
              </h2>
              <p class="section-sub">Featured products displayed on the homepage.</p>
              <p class="limit-text">{{ hotSelling.length }}/{{ MAX_HOT_SELLING }} products used</p>
            </div>
            <button class="btn-add" @click="openAddProduct('hot')" :disabled="!canAddHot">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              Add Product
            </button>
          </div>

          <div v-if="hotSelling.length === 0" class="empty-state">
            <p>No hot selling products added yet.</p>
          </div>
          <div v-else class="product-edit-grid">
            <article v-for="(product, index) in hotSelling" :key="product.id || index" class="product-edit-card">
              <div class="pe-img-wrap">
                <img v-if="product.image" :src="product.image" :alt="product.name" class="pe-img" />
                <span v-else class="pe-placeholder">No Image</span>
              </div>
              <div class="pe-copy">
                <span class="pe-category">{{ displayCategory(product.category) }}</span>
                <h3 class="pe-name">{{ product.name || 'Unnamed product' }}</h3>
                <p v-if="hasPrice(product.price)" class="pe-price">{{ currencyStore.format(product.price) }}</p>
                <p class="pe-description">{{ product.description || 'No description added.' }}</p>
              </div>
              <div class="pe-actions">
                <button class="btn-sm-edit" @click="openEditProduct('hot', index)">Edit</button>
                <button class="btn-sm-del" @click="removeHotSellingProduct(index)">Delete</button>
              </div>
            </article>
          </div>
        </section>

        <section class="section-card glass stagger-2">
          <div class="section-header">
            <div>
              <h2 class="section-title">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#10b981" stroke-width="1.5"/><path d="M8 5v3l2 2" stroke="#10b981" stroke-width="1.5" stroke-linecap="round"/></svg>
                Latest Products
              </h2>
              <p class="section-sub">New arrivals displayed on the homepage.</p>
              <p class="limit-text">{{ latestProducts.length }}/{{ MAX_LATEST }} products used</p>
            </div>
            <button class="btn-add" @click="openAddProduct('latest')" :disabled="!canAddLatest">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              Add Product
            </button>
          </div>

          <div v-if="latestProducts.length === 0" class="empty-state">
            <p>No latest products added yet.</p>
          </div>
          <div v-else class="product-edit-grid">
            <article v-for="(product, index) in latestProducts" :key="product.id || index" class="product-edit-card">
              <div class="pe-img-wrap">
                <img v-if="product.image" :src="product.image" :alt="product.name" class="pe-img" />
                <span v-else class="pe-placeholder">No Image</span>
              </div>
              <div class="pe-copy">
                <span class="pe-category">{{ displayCategory(product.category) }}</span>
                <h3 class="pe-name">{{ product.name || 'Unnamed product' }}</h3>
                <p v-if="hasPrice(product.price)" class="pe-price">{{ currencyStore.format(product.price) }}</p>
                <p class="pe-description">{{ product.description || 'No description added.' }}</p>
              </div>
              <div class="pe-actions">
                <button class="btn-sm-edit" @click="openEditProduct('latest', index)">Edit</button>
                <button class="btn-sm-del" @click="removeLatestProduct(index)">Delete</button>
              </div>
            </article>
          </div>
        </section>

        <button class="save-btn" @click="saveHomepage" :disabled="saving">
          <svg v-if="!saving" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 9l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div v-else class="mini-spin" />
          {{ saving ? 'Saving...' : 'Save Homepage Products' }}
        </button>
      </div>
    </main>

    <Teleport to="body">
      <div v-if="showProductModal" class="modal-overlay" @click.self="closeProductModal">
        <div class="modal-card glass">
          <div class="modal-header">
            <div>
              <span class="modal-kicker">{{ modalMode === 'edit' ? 'Edit' : 'Add' }}</span>
              <h2 class="modal-title">{{ modalTitle }}</h2>
            </div>
            <button class="modal-close" type="button" @click="closeProductModal">x</button>
          </div>

          <div class="modal-grid">
            <div class="field-group">
              <label class="field-label">Product Name *</label>
              <input v-model="modalProduct.name" class="field-input" placeholder="e.g. RTX 5070 Ti" />
            </div>
            <div class="field-group">
              <label class="field-label">Price (MYR)</label>
              <input v-model="modalProduct.price" class="field-input" type="number" min="0" placeholder="0.00" />
            </div>
            <div class="field-group">
              <label class="field-label">Category</label>
              <select v-model="modalProduct.category" class="field-input">
                <option value="">Select category</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ displayCategory(cat) }}</option>
              </select>
            </div>
            <div class="field-group">
              <label class="field-label">Product Image</label>
              <label class="upload-label">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v8M3 6l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                {{ modalUploading ? 'Uploading...' : 'Upload Image' }}
                <input type="file" accept="image/*" @change="handleModalImageUpload" hidden />
              </label>
            </div>
            <div class="field-group modal-full">
              <label class="field-label">Description</label>
              <textarea v-model="modalProduct.description" class="field-input field-textarea" rows="4" placeholder="Short homepage product description..." />
            </div>
            <div class="modal-full modal-image-preview">
              <img v-if="modalProduct.image" :src="modalProduct.image" alt="Product preview" />
              <span v-else>No image selected</span>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-ghost" type="button" @click="closeProductModal">Cancel</button>
            <button class="btn-add modal-save" type="button" @click="saveProductModal">
              {{ modalMode === 'edit' ? 'Save Changes' : 'Add Product' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-page { display: flex; background: #030712; min-height: 100vh; }
.admin-main { margin-left: 256px; flex: 1; padding: 48px 40px; box-sizing: border-box; }

.state-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; color: #475569; }
.loader { width: 40px; height: 40px; border-radius: 50%; border: 3px solid rgba(59,130,246,0.2); border-top-color: #3b82f6; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.page-header { margin-bottom: 12px; }
.page-title { font-family: 'Orbitron', sans-serif; font-size: clamp(22px,2.5vw,34px); font-weight: 900; color: #f1f5f9; margin: 6px 0 4px; line-height: 1.08; }
.page-sub { color: #475569; font-size: 12px; margin: 0; }

.alert-box { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 12px; font-size: 12px; margin-bottom: 12px; }
.alert-box.success { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); color: #6ee7b7; }
.alert-box.error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5; }

.section-card { padding: 16px !important; border-radius: 14px; border: 1px solid rgba(255,255,255,0.07); margin-bottom: 12px; }
.section-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.section-title { display: flex; align-items: center; gap: 7px; font-family: 'Orbitron', sans-serif; font-size: 13px !important; font-weight: 800; color: #f1f5f9; margin: 0 0 4px; letter-spacing: 0.04em; }
.section-sub { font-size: 12px; color: #475569; margin: 0; }
.limit-text {
  display: inline-flex;
  margin: 6px 0 0;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(59,130,246,0.10);
  border: 1px solid rgba(59,130,246,0.20);
  color: #93c5fd;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.empty-state { padding: 18px; border: 1px dashed rgba(96,165,250,0.18); border-radius: 12px; color: #64748b; font-size: 12px; }
.empty-state p { margin: 0; }

.product-edit-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
.product-edit-card { display: flex; flex-direction: column; min-height: 250px; overflow: hidden; border-radius: 13px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); }
.pe-img-wrap { height: 105px; display: grid; place-items: center; background: radial-gradient(circle, rgba(59,130,246,0.09), rgba(3,7,18,0.55) 70%); padding: 10px; box-sizing: border-box; }
.pe-img { width: 100%; height: 100%; object-fit: contain; }
.pe-placeholder { color: #475569; font-size: 11px; font-weight: 700; }
.pe-copy { padding: 10px 12px; flex: 1; }
.pe-category { display: inline-flex; margin-bottom: 6px; color: #60a5fa; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.pe-name { margin: 0 0 5px; color: #f8fafc; font-size: 12px; font-weight: 800; line-height: 1.25; }
.pe-price { margin: 0 0 7px; color: #93c5fd; font-size: 13px; font-weight: 800; }
.pe-description { margin: 0; color: #64748b; font-size: 11px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pe-actions { display: flex; gap: 8px; padding: 0 12px 12px; }

.btn-add,
.modal-save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 11px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  border: none;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.25s;
  flex-shrink: 0;
}
.btn-add:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(37,99,235,0.30); }
.btn-add:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
.btn-sm-edit,
.btn-sm-del {
  flex: 1;
  padding: 8px 10px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-sm-edit { background: rgba(59,130,246,0.10); border: 1px solid rgba(59,130,246,0.22); color: #60a5fa; }
.btn-sm-del { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.18); color: #fca5a5; }

.save-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
  color: white;
  border: none;
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s;
}
.save-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 36px rgba(29,78,216,0.35); }
.save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.mini-spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; animation: spin 0.8s linear infinite; }

.modal-overlay { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(2,6,23,0.72); backdrop-filter: blur(8px); }
.modal-card { width: min(720px, 100%); max-height: min(760px, calc(100vh - 40px)); overflow: auto; padding: 22px !important; border-radius: 18px; border: 1px solid rgba(96,165,250,0.16); }
.modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.modal-kicker { color: #60a5fa; font-size: 10px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
.modal-title { color: #f8fafc; font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 900; margin: 4px 0 0; }
.modal-close { width: 34px; height: 34px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #cbd5e1; font-size: 16px; cursor: pointer; }
.modal-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.modal-full { grid-column: 1 / -1; }
.field-group { min-width: 0; }
.field-label { display: block; font-size: 10px; font-weight: 800; color: #64748b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.08em; }
.field-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  color: #f8fafc;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
  color-scheme: dark;
}
.field-input:focus { border-color: rgba(96,165,250,0.58); box-shadow: 0 0 0 2px rgba(59,130,246,0.12); }
.field-input::placeholder { color: #475569; }
.field-input option { background: #111827; color: #f8fafc; }
.field-textarea { resize: vertical; min-height: 96px; }
.upload-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(59,130,246,0.22);
  background: rgba(59,130,246,0.10);
  color: #60a5fa;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
.modal-image-preview { min-height: 130px; display: grid; place-items: center; border-radius: 12px; border: 1px dashed rgba(96,165,250,0.20); background: rgba(15,23,42,0.28); color: #64748b; font-size: 12px; }
.modal-image-preview img { max-width: 100%; max-height: 180px; object-fit: contain; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
.btn-ghost { padding: 10px 16px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.04); color: #94a3b8; font-size: 12px; font-weight: 800; cursor: pointer; }

:global(:root[data-theme="light"]) .field-input {
  background: rgba(255,255,255,0.96) !important;
  border-color: rgba(71,85,105,0.20) !important;
  color: #172033 !important;
  color-scheme: light;
}
:global(:root[data-theme="light"]) .field-input::placeholder {
  color: #94a3b8 !important;
}
:global(:root[data-theme="light"]) .field-input option {
  background: #ffffff !important;
  color: #172033 !important;
}
:global(:root[data-theme="light"]) .modal-overlay {
  background: rgba(15,23,42,0.34);
}
:global(:root[data-theme="light"]) .modal-title,
:global(:root[data-theme="light"]) .pe-name {
  color: #172033 !important;
}
:global(:root[data-theme="light"]) .product-edit-card {
  background: rgba(255,255,255,0.70) !important;
  border-color: rgba(148,163,184,0.26) !important;
}
:global(:root[data-theme="light"]) .modal-image-preview {
  background: rgba(241,245,249,0.66) !important;
}

@media (max-width: 900px) {
  .product-edit-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 768px) {
  .admin-main { margin-left: 0; padding: 20px; }
  .section-header { flex-direction: column; }
  .btn-add { width: 100%; }
  .modal-grid { grid-template-columns: 1fr; }
}

@media (max-width: 520px) {
  .admin-main { padding: 16px 12px; }
  .section-card { padding: 14px 12px !important; }
  .product-edit-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .product-edit-card {
    min-height: 220px;
    border-radius: 12px;
  }
  .pe-img-wrap {
    height: 88px;
    padding: 7px;
  }
  .pe-copy {
    padding: 8px;
  }
  .pe-category {
    margin-bottom: 4px;
    font-size: 9px;
  }
  .pe-name {
    min-height: 32px;
    font-size: 10px;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .pe-price {
    font-size: 11px;
  }
  .pe-description {
    font-size: 10px;
    -webkit-line-clamp: 2;
  }
  .pe-actions {
    gap: 6px;
    padding: 0 8px 8px;
  }
  .btn-sm-edit,
  .btn-sm-del {
    min-height: 32px;
    padding: 6px 4px;
    font-size: 10px;
  }
  .modal-actions { flex-direction: column; }
  .modal-save,
  .btn-ghost { width: 100%; justify-content: center; }
}

@media (max-width: 360px) {
  .product-edit-grid { gap: 8px; }
  .pe-img-wrap { height: 80px; }
  .btn-sm-edit,
  .btn-sm-del { font-size: 9px; }
}
</style>
