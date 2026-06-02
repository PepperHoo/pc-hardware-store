<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import { ref, onMounted, computed } from 'vue'

const bannerImages    = ref([])
const hotSelling      = ref([])
const latestProducts  = ref([])
const loading         = ref(true)
const saving          = ref(false)
const successMessage  = ref('')
const errorMessage    = ref('')
const homepageId      = ref(null)
const MAX_BANNERS     = 3
const MAX_HOT_SELLING = 6
const MAX_LATEST      = 6

const bannerSlotsLeft = computed(() => Math.max(0, MAX_BANNERS - bannerImages.value.length))
const canAddBanner    = computed(() => bannerImages.value.length < MAX_BANNERS)
const canAddHot       = computed(() => hotSelling.value.length < MAX_HOT_SELLING)
const canAddLatest    = computed(() => latestProducts.value.length < MAX_LATEST)

async function loadHomepage() {
  try {
    loading.value = true
    const { getAll } = await import('../lib/api.js')
    const rows = await getAll('homepage')
    const data = rows[0] || {}
    homepageId.value    = data.id ?? null
    bannerImages.value  = data.banners || []
    hotSelling.value    = data.hotSelling || []
    latestProducts.value = data.latestProducts || []
  } catch (e) {
    console.log(e); errorMessage.value = 'Failed to load homepage data.'
  } finally { loading.value = false }
}

onMounted(loadHomepage)

async function saveHomepage() {
  try {
    saving.value = true; successMessage.value = ''; errorMessage.value = ''
    const { update } = await import('../lib/api.js')
    await update('homepage', homepageId.value, { banners: bannerImages.value, hotSelling: hotSelling.value, latestProducts: latestProducts.value })
    successMessage.value = 'Homepage updated successfully!'
  } catch (e) {
    console.log(e); errorMessage.value = 'Failed to update homepage.'
  } finally { saving.value = false }
}

async function handleBannerUpload(e) {
  const files = [...e.target.files]; if (!files.length) return
  if (!canAddBanner.value) {
    errorMessage.value = `Maximum ${MAX_BANNERS} homepage banners allowed.`
    e.target.value = ''
    return
  }
  const { uploadImage } = await import('../lib/api.js')
  const acceptedFiles = files.slice(0, bannerSlotsLeft.value)
  if (files.length > acceptedFiles.length) {
    errorMessage.value = `Only ${MAX_BANNERS} banners are allowed. Extra files were skipped.`
  }
  for (const file of acceptedFiles) {
    try { bannerImages.value.push(await uploadImage('images', file, 'banners')) }
    catch (err) { errorMessage.value = 'Banner upload failed: '+err.message }
  }
  e.target.value = ''
}
async function handleHotSellingUpload(e, i) {
  const file = e.target.files[0]; if (!file) return
  try { const { uploadImage } = await import('../lib/api.js'); hotSelling.value[i].image = await uploadImage('images', file, 'hot-selling') }
  catch (err) { errorMessage.value = 'Upload failed: '+err.message }
}
async function handleLatestUpload(e, i) {
  const file = e.target.files[0]; if (!file) return
  try { const { uploadImage } = await import('../lib/api.js'); latestProducts.value[i].image = await uploadImage('images', file, 'latest-products') }
  catch (err) { errorMessage.value = 'Upload failed: '+err.message }
}

function removeBanner(i)              { bannerImages.value.splice(i, 1) }
function removeHotSellingImage(i)     { hotSelling.value[i].image = '' }
function removeLatestProductImage(i)  { latestProducts.value[i].image = '' }
function addHotSellingProduct()       {
  if (!canAddHot.value) { errorMessage.value = `Maximum ${MAX_HOT_SELLING} hot selling products allowed.`; return }
  hotSelling.value.push({ name: '', image: '' })
}
function removeHotSellingProduct(i)   { hotSelling.value.splice(i, 1) }
function addLatestProduct()           {
  if (!canAddLatest.value) { errorMessage.value = `Maximum ${MAX_LATEST} latest products allowed.`; return }
  latestProducts.value.push({ name: '', image: '' })
}
function removeLatestProduct(i)       { latestProducts.value.splice(i, 1) }
</script>

<template>
  <div class="admin-page">
    <AdminNavbar />

    <main class="admin-main">
      <!-- Loading -->
      <div v-if="loading" class="state-screen"><div class="loader" /><p>Loading homepage data…</p></div>

      <div v-else>
        <!-- Header -->
        <div class="page-header">
          <span class="kicker">Admin</span>
          <h1 class="page-title">Homepage <span class="grad-text">Editor</span></h1>
          <p class="page-sub">Manage banners, hot selling products, and featured listings.</p>
        </div>

        <!-- Alert messages -->
        <div v-if="successMessage" class="alert-box success">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="#6ee7b7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="alert-box error">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 5v4M8 11v1" stroke="#fca5a5" stroke-width="2" stroke-linecap="round"/><circle cx="8" cy="8" r="6.5" stroke="#fca5a5" stroke-width="1.5"/></svg>
          {{ errorMessage }}
        </div>

        <!-- Banner section -->
        <div class="section-card glass stagger-1">
          <div class="section-header">
            <div>
              <h2 class="section-title">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="#3b82f6" stroke-width="1.5"/><path d="M1 7h14" stroke="#3b82f6" stroke-width="1.5"/></svg>
                Homepage Banners
              </h2>
              <p class="section-sub">Slideshow images shown at the top of the homepage.</p>
              <p class="limit-text">{{ bannerImages.length }}/{{ MAX_BANNERS }} banners used</p>
            </div>
          </div>

          <div v-if="bannerImages.length === 0" class="empty-state">
            <p class="empty-icon">🖼️</p>
            <p>No banner images yet. Upload some below.</p>
          </div>
          <div v-else class="img-grid">
            <div v-for="(img, i) in bannerImages" :key="i" class="img-card">
              <img :src="img" class="img-preview" />
              <div class="img-footer">
                <span class="img-label">Slide {{ i+1 }}</span>
                <button class="btn-remove" @click="removeBanner(i)">Remove</button>
              </div>
            </div>
          </div>

          <label class="upload-zone">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 4v12M6 10l6-6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 20h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            <p>{{ canAddBanner ? 'Click to upload banner images' : 'Banner limit reached' }}</p>
            <span>{{ canAddBanner ? `${bannerSlotsLeft} slot(s) remaining` : `Maximum ${MAX_BANNERS} banners` }}</span>
            <input type="file" accept="image/*" multiple @change="handleBannerUpload" :disabled="!canAddBanner" hidden />
          </label>
        </div>

        <!-- Hot Selling -->
        <div class="section-card glass stagger-2">
          <div class="section-header">
            <div>
              <h2 class="section-title">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1C5 5 2 7 2 10a6 6 0 0 0 12 0c0-3-3-5-6-9z" stroke="#f59e0b" stroke-width="1.5" stroke-linejoin="round"/></svg>
                Hot Selling Products
              </h2>
              <p class="section-sub">Featured products displayed on the homepage.</p>
              <p class="limit-text">{{ hotSelling.length }}/{{ MAX_HOT_SELLING }} products used</p>
            </div>
            <button class="btn-add" @click="addHotSellingProduct" :disabled="!canAddHot">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              Add Product
            </button>
          </div>

          <div v-if="hotSelling.length === 0" class="empty-state">
            <p class="empty-icon">🔥</p><p>No hot selling products added yet.</p>
          </div>
          <div v-else class="product-edit-grid">
            <div v-for="(p, i) in hotSelling" :key="i" class="product-edit-card">
              <img v-if="p.image" :src="p.image" class="pe-img" />
              <input v-model="p.name" placeholder="Product name" class="pe-input" />
              <label class="mini-upload">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 2v7M3 6l3.5-4 3.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M1.5 11h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                Upload Image
                <input type="file" accept="image/*" @change="handleHotSellingUpload($event, i)" hidden />
              </label>
              <div class="pe-actions">
                <button v-if="p.image" class="btn-sm-remove" @click="removeHotSellingImage(i)">Clear Image</button>
                <button class="btn-sm-del" @click="removeHotSellingProduct(i)">Delete</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Latest Products -->
        <div class="section-card glass stagger-3">
          <div class="section-header">
            <div>
              <h2 class="section-title">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#10b981" stroke-width="1.5"/><path d="M8 5v3l2 2" stroke="#10b981" stroke-width="1.5" stroke-linecap="round"/></svg>
                Latest Products
              </h2>
              <p class="section-sub">New arrivals displayed on the homepage.</p>
              <p class="limit-text">{{ latestProducts.length }}/{{ MAX_LATEST }} products used</p>
            </div>
            <button class="btn-add" @click="addLatestProduct" :disabled="!canAddLatest">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              Add Product
            </button>
          </div>

          <div v-if="latestProducts.length === 0" class="empty-state">
            <p class="empty-icon">🆕</p><p>No latest products added yet.</p>
          </div>
          <div v-else class="product-edit-grid">
            <div v-for="(p, i) in latestProducts" :key="i" class="product-edit-card">
              <img v-if="p.image" :src="p.image" class="pe-img" />
              <input v-model="p.name" placeholder="Product name" class="pe-input" />
              <label class="mini-upload">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 2v7M3 6l3.5-4 3.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M1.5 11h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                Upload Image
                <input type="file" accept="image/*" @change="handleLatestUpload($event, i)" hidden />
              </label>
              <div class="pe-actions">
                <button v-if="p.image" class="btn-sm-remove" @click="removeLatestProductImage(i)">Clear Image</button>
                <button class="btn-sm-del" @click="removeLatestProduct(i)">Delete</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Save button -->
        <button class="save-btn" @click="saveHomepage" :disabled="saving">
          <svg v-if="!saving" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 9l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div v-else class="mini-spin" />
          {{ saving ? 'Saving…' : 'Save Homepage' }}
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-page { display: flex; background: #030712; min-height: 100vh; }
.admin-main { margin-left: 256px; flex: 1; padding: 48px 40px; box-sizing: border-box; }

.state-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; color: #475569; }
.loader { width: 40px; height: 40px; border-radius: 50%; border: 3px solid rgba(59,130,246,0.2); border-top-color: #3b82f6; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.page-header { margin-bottom: 36px; }
.page-title { font-family: 'Orbitron', sans-serif; font-size: clamp(26px,4vw,48px); font-weight: 900; color: #f1f5f9; margin: 12px 0 8px; line-height: 1.1; }
.page-sub { color: #475569; font-size: 15px; margin: 0; }

.alert-box { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-radius: 14px; font-size: 14px; margin-bottom: 16px; }
.alert-box.success { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); color: #6ee7b7; }
.alert-box.error   { background: rgba(239,68,68,0.1);  border: 1px solid rgba(239,68,68,0.2);  color: #fca5a5; }

.section-card { padding: 28px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.07); margin-bottom: 20px; }
.section-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
.section-title { display: flex; align-items: center; gap: 8px; font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 800; color: #f1f5f9; margin: 0 0 6px; letter-spacing: 0.04em; }
.section-sub { font-size: 13px; color: #475569; margin: 0; }
.limit-text {
  display: inline-flex;
  margin: 10px 0 0;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(59,130,246,0.10);
  border: 1px solid rgba(59,130,246,0.20);
  color: #93c5fd;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.empty-state { text-align: center; padding: 32px; border: 2px dashed rgba(255,255,255,0.08); border-radius: 16px; margin-bottom: 20px; }
.empty-icon { font-size: 40px; margin: 0 0 8px; }
.empty-state p { color: #334155; font-size: 14px; margin: 0; }

/* Banner images */
.img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 16px; margin-bottom: 20px; }
.img-card { border-radius: 16px; overflow: hidden; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); }
.img-preview { width: 100%; height: 160px; object-fit: cover; display: block; }
.img-footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; }
.img-label { font-size: 12px; color: #60a5fa; font-weight: 700; }
.btn-remove { padding: 6px 12px; border-radius: 8px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-remove:hover { background: rgba(239,68,68,0.2); }

.upload-zone {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  padding: 32px; border: 2px dashed rgba(59,130,246,0.25); border-radius: 18px;
  color: #3b82f6; cursor: pointer; transition: all 0.3s; text-align: center;
}
.upload-zone:hover { background: rgba(59,130,246,0.05); border-color: rgba(59,130,246,0.5); }
.upload-zone:has(input:disabled) { opacity: 0.55; cursor: not-allowed; border-style: solid; }
.upload-zone p { font-size: 14px; font-weight: 600; margin: 0; }
.upload-zone span { font-size: 12px; color: #334155; }

/* Product edit grid */
.product-edit-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 16px; }
.product-edit-card { padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); }
.pe-img { width: 100%; height: 120px; object-fit: contain; border-radius: 10px; background: radial-gradient(circle, rgba(59,130,246,0.06), rgba(3,7,18,0.5)); padding: 8px; box-sizing: border-box; margin-bottom: 10px; }
.pe-input { width: 100%; padding: 10px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #f1f5f9; font-size: 13px; outline: none; box-sizing: border-box; margin-bottom: 10px; }
.pe-input:focus { border-color: #3b82f6; }
.pe-input::placeholder { color: #334155; }
.mini-upload { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 10px; background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.18); color: #60a5fa; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-bottom: 10px; }
.mini-upload:hover { background: rgba(59,130,246,0.15); }
.pe-actions { display: flex; gap: 8px; }
.btn-sm-remove { flex: 1; padding: 7px; border-radius: 9px; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #fcd34d; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-sm-remove:hover { background: rgba(245,158,11,0.2); }
.btn-sm-del { flex: 1; padding: 7px; border-radius: 9px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15); color: #fca5a5; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-sm-del:hover { background: rgba(239,68,68,0.18); }

.btn-add { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: 12px; background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; border: none; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.3s; flex-shrink: 0; }
.btn-add:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(37,99,235,0.35); }
.btn-add:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

:global(:root[data-theme="light"]) .limit-text {
  background: rgba(14,116,144,0.10);
  border-color: rgba(14,116,144,0.22);
  color: #0f766e;
}

.save-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 16px 24px; border-radius: 16px; background: linear-gradient(135deg, #1d4ed8, #3b82f6); color: white; border: none; font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 800; letter-spacing: 0.05em; cursor: pointer; transition: all 0.3s; margin-top: 8px; }
.save-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 36px rgba(29,78,216,0.4); }
.save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.mini-spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; animation: spin 0.8s linear infinite; }

@media (max-width: 768px) { .admin-main { margin-left: 0; padding: 20px; } .section-header { flex-direction: column; } }
</style>
