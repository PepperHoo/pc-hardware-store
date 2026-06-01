<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Toast from '../components/Toast.vue'
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '../stores/cart'
import { useRouter } from 'vue-router'

const cart   = useCartStore()
const router = useRouter()
const toastRef  = ref(null)
const products  = ref([])
const loading   = ref(true)
const errorMsg  = ref('')
const selectedParts = ref({})



const buildCategories = [
  { key: 'motherboard', label: 'Motherboard',   icon: '🔲', color: '#3b82f6' },
  { key: 'processor',   label: 'Processor',      icon: '⚡', color: '#8b5cf6' },
  { key: 'ram',         label: 'RAM',            icon: '💾', color: '#06b6d4' },
  { key: 'gpu',         label: 'Graphics Card',  icon: '🎮', color: '#10b981' },
  { key: 'storage',     label: 'Storage',        icon: '💿', color: '#f59e0b' },
  { key: 'psu',         label: 'Power Supply',   icon: '🔋', color: '#ef4444' },
  { key: 'cooler',      label: 'CPU Cooler',     icon: '❄️', color: '#60a5fa' },
  { key: 'casing',      label: 'PC Case',        icon: '🖥️', color: '#a78bfa' },
  { key: 'rgb',         label: 'RGB / Fans',     icon: '✨', color: '#f472b6' },
]

function getProductsByCategory(cat) { return products.value.filter(p => p.category === cat) }
function getSelectedProduct(cat)    { const id = selectedParts.value[cat]; return id ? products.value.find(p => p.id === id) : null }

function getCpuPlatform(p) {
  if (!p) return ''
  const n = p.name.toLowerCase()
  if (n.includes('9900') || n.includes('9950') || n.includes('9700')) return 'amd-am5'
  if (n.includes('5950')) return 'amd-am4'
  if (n.includes('ultra'))  return 'intel-lga1851'
  if (n.includes('14900') || n.includes('14700') || n.includes('12600')) return 'intel-lga1700'
  return ''
}
function getMotherboardPlatform(p) {
  if (!p) return ''
  const n = p.name.toLowerCase()
  if (n.includes('z890')) return 'intel-lga1851'
  if (n.includes('b850') || n.includes('x870') || n.includes('b650')) return 'amd-am5'
  return ''
}
function getGpuTier(p) {
  if (!p || p.category !== 'gpu') return 0
  const n = p.name.toLowerCase()
  if (n.includes('5090') || n.includes('pro 6000')) return 5
  if (n.includes('4090') || n.includes('5080'))     return 4
  if (n.includes('9070') || n.includes('7900'))     return 3
  if (n.includes('9060') || n.includes('5060'))     return 2
  return 1
}
function getCpuTier(p) {
  if (!p || p.category !== 'processor') return 0
  const n = p.name.toLowerCase()
  if (n.includes('9950') || n.includes('14900'))  return 5
  if (n.includes('9900') || n.includes('5950') || n.includes('14700')) return 4
  if (n.includes('9700') || n.includes('ultra 7')) return 3
  if (n.includes('12600')) return 2
  return 1
}
function getPsuWatts(p) { if (!p) return 0; const m = p.name.match(/(\d{3,4})w/i); return m ? Number(m[1]) : 0 }
function getRecommendedPsuWatts() {
  const g = getGpuTier(getSelectedProduct('gpu')), c = getCpuTier(getSelectedProduct('processor'))
  if (g >= 5 || c >= 5) return 1000
  if (g >= 4 || c >= 4) return 850
  if (g >= 3 || c >= 3) return 750
  return 650
}
function isCompatible(p) {
  const cpu = getSelectedProduct('processor'), mb = getSelectedProduct('motherboard'), gpu = getSelectedProduct('gpu')
  if (p.category === 'processor'   && mb)  return getCpuPlatform(p) === getMotherboardPlatform(mb)
  if (p.category === 'motherboard' && cpu) return getMotherboardPlatform(p) === getCpuPlatform(cpu)
  if (p.category === 'psu')    return getPsuWatts(p) >= getRecommendedPsuWatts()
  if (p.category === 'cooler'  && getCpuTier(cpu) >= 4) return Number(p.price || 0) >= 700
  if (p.category === 'casing'  && getGpuTier(gpu) >= 4) return Number(p.price || 0) >= 350
  return true
}
function getScore(p) {
  let s = 100000 - Number(p.price || 0)
  const n = p.name.toLowerCase()
  if (p.category === 'motherboard' && (n.includes('x870') || n.includes('b850') || n.includes('z890'))) s += 3500
  if (p.category === 'ram'     && n.includes('cl30')) s += 2500
  if (p.category === 'storage' && n.includes('990'))  s += 1800
  if (p.category === 'psu')    s += getPsuWatts(p)
  if (p.category === 'cooler'  && Number(p.price || 0) >= 700) s += 1800
  if (p.category === 'casing'  && Number(p.price || 0) >= 350) s += 1200
  return s
}
function getRecommendations(cat) {
  return getProductsByCategory(cat).filter(p => p.id !== selectedParts.value[cat]).filter(isCompatible).sort((a,b) => getScore(b)-getScore(a)).slice(0, 3)
}
function selectPart(p) { selectedParts.value = { ...selectedParts.value, [p.category]: p.id } }
function clearPart(cat) { const n = { ...selectedParts.value }; delete n[cat]; selectedParts.value = n }

function addBuildToCart() {
  const parts = buildCategories.map(c => getSelectedProduct(c.key)).filter(Boolean)
  parts.forEach(p => cart.addToCart(p))
  toastRef.value.showToastMessage(`${parts.length} component(s) added to cart!`, 'success')
  router.push('/cart')
}

const totalPrice    = computed(() => buildCategories.reduce((t,c) => t + Number(getSelectedProduct(c.key)?.price || 0), 0))
const selectedCount = computed(() => buildCategories.filter(c => getSelectedProduct(c.key)).length)
const buildComplete = computed(() => selectedCount.value === buildCategories.length)
const buildStatus   = computed(() => {
  if (selectedCount.value === 0) return 'Start by selecting a motherboard.'
  if (buildComplete.value)       return 'Build complete — ready to add to cart!'
  return `${buildCategories.length - selectedCount.value} component(s) remaining.`
})

onMounted(async () => {
  try {
    const { getAll } = await import('../lib/api.js')
    products.value = await getAll('products')
  } catch (e) { console.log(e); errorMsg.value = 'Failed to load PC builder.' }
  finally { loading.value = false }
})
</script>

<template>
  <div class="builder-page">
    <Navbar />

    <!-- Loading -->
    <div v-if="loading" class="state-screen">
      <div class="state-loader" />
      <p>Loading PC Builder…</p>
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="state-screen">
      <p class="error-text">{{ errorMsg }}</p>
    </div>

    <!-- Main -->
    <main v-else class="builder-main section-inner">

      <!-- Header -->
      <div class="builder-header">
        <div>
          <span class="kicker">Custom Build</span>
          <h1 class="builder-title">PC <span class="grad-text">Builder</span></h1>
          <p class="builder-sub">
            Pick a motherboard first — the builder will intelligently suggest compatible components for your platform.
          </p>
        </div>

        <!-- Summary card -->
        <div class="summary-card glass">
          <div class="summary-progress">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: (selectedCount / buildCategories.length * 100) + '%' }" />
            </div>
            <span class="progress-text">{{ selectedCount }}/{{ buildCategories.length }} selected</span>
          </div>

          <p class="summary-status">{{ buildStatus }}</p>

          <div class="summary-price">
            <span class="price-label">Build Total</span>
            <span class="price-val grad-text">RM {{ totalPrice.toFixed(2) }}</span>
          </div>

          <button class="add-build-btn" @click="addBuildToCart" :disabled="selectedCount === 0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2h2l2 7h6l1.5-4H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="7" cy="13" r="1.2" fill="currentColor"/>
              <circle cx="12" cy="13" r="1.2" fill="currentColor"/>
            </svg>
            Add Build to Cart
          </button>
        </div>
      </div>

      <!-- Layout -->
      <div class="builder-layout">

        <!-- Sidebar -->
        <aside class="builder-sidebar">
          <!-- Selected parts list -->
          <div class="parts-panel glass">
            <h2 class="parts-title">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="#3b82f6"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="#8b5cf6"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="#10b981"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="#f59e0b"/></svg>
              Your Build
            </h2>

            <div class="parts-list">
              <div v-for="cat in buildCategories" :key="cat.key" class="part-row">
                <span class="part-icon" :style="{ color: cat.color }">{{ cat.icon }}</span>
                <div class="part-info">
                  <p class="part-cat">{{ cat.label }}</p>
                  <p class="part-name" :class="getSelectedProduct(cat.key) ? 'selected' : 'empty'">
                    {{ getSelectedProduct(cat.key)?.name || 'Not selected' }}
                  </p>
                </div>
                <button v-if="getSelectedProduct(cat.key)" class="clear-btn" @click="clearPart(cat.key)" title="Remove">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <!-- Component columns -->
        <section class="builder-content">
          <div
            v-for="(cat, i) in buildCategories"
            :key="cat.key"
            class="cat-section glass"
          >
            <!-- Category header -->
            <div class="cat-header">
              <div class="cat-label">
                <span class="cat-icon" :style="{ background: cat.color + '22', color: cat.color }">{{ cat.icon }}</span>
                <div>
                  <h2 class="cat-title">{{ cat.label }}</h2>
                  <p class="cat-hint">{{ getSelectedProduct(cat.key) ? 'Selected — click Change to swap' : 'Choose a component below' }}</p>
                </div>
              </div>
              <span v-if="getSelectedProduct(cat.key)" class="cat-badge selected-badge">Selected</span>
              <span v-else class="cat-badge suggest-badge">Suggestions</span>
            </div>

            <!-- Selected state -->
            <div v-if="getSelectedProduct(cat.key)" class="selected-card">
              <div class="sc-img-wrap">
                <img :src="getSelectedProduct(cat.key).image" :alt="getSelectedProduct(cat.key).name" class="sc-img" />
              </div>
              <div class="sc-info">
                <p class="sc-name">{{ getSelectedProduct(cat.key).name }}</p>
                <p class="sc-price">RM {{ Number(getSelectedProduct(cat.key).price).toFixed(2) }}</p>
              </div>
              <button class="change-btn" @click="clearPart(cat.key)">Change</button>
            </div>

            <!-- Recommendation grid -->
            <div v-else class="reco-grid">
              <div v-if="getRecommendations(cat.key).length === 0" class="no-reco">
                No compatible components found for this category yet.
              </div>
              <button
                v-for="p in getRecommendations(cat.key)"
                :key="p.id"
                class="reco-card tilt-card"
                @click="selectPart(p)"
              >
                <div class="card-shine" />
                <div class="reco-img-wrap">
                  <img :src="p.image" :alt="p.name" class="reco-img" />
                </div>
                <span class="reco-badge">Recommended</span>
                <p class="reco-name">{{ p.name }}</p>
                <p class="reco-price">RM {{ Number(p.price).toFixed(2) }}</p>
                <div class="reco-add">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  Select
                </div>
              </button>
            </div>
          </div>
        </section>

      </div>
    </main>

    <Toast ref="toastRef" />
    <Footer />
  </div>
</template>

<style scoped>
.builder-page { background: #030712; min-height: 100vh; }

/* State screens */
.state-screen {
  min-height: 80vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 20px;
  color: #475569; font-size: 18px;
}
.state-loader {
  width: 44px; height: 44px; border-radius: 50%;
  border: 3px solid rgba(59,130,246,0.2); border-top-color: #3b82f6;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.error-text { color: #f87171; }

/* Main */
.builder-main { padding-top: 120px; padding-bottom: 100px; }

/* Header */
.builder-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 32px; margin-bottom: 52px; flex-wrap: wrap;
}
.builder-title {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(36px, 5vw, 68px); font-weight: 900; color: #f1f5f9;
  margin: 14px 0 10px; line-height: 1.05;
}
.builder-sub { color: #475569; font-size: 15px; max-width: 560px; line-height: 1.7; margin: 0; }

/* Summary card */
.summary-card {
  min-width: 280px; max-width: 340px; padding: 24px;
  border-radius: 24px; border: 1px solid rgba(255,255,255,0.07);
  display: flex; flex-direction: column; gap: 16px; flex-shrink: 0;
}
.summary-progress { display: flex; flex-direction: column; gap: 8px; }
.progress-track { height: 6px; border-radius: 99px; background: rgba(255,255,255,0.06); overflow: hidden; }
.progress-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #2563eb, #8b5cf6); transition: width 0.5s cubic-bezier(0.16,1,0.3,1); }
.progress-text { font-size: 12px; color: #475569; font-weight: 600; }
.summary-status { font-size: 13px; color: #64748b; margin: 0; line-height: 1.5; }
.summary-price { display: flex; justify-content: space-between; align-items: baseline; }
.price-label { font-size: 13px; color: #475569; font-weight: 600; }
.price-val { font-family: 'Orbitron', sans-serif; font-size: 24px; font-weight: 900; }
.add-build-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 13px 20px; border-radius: 14px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white; border: none;
  font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0.06em;
  cursor: pointer; transition: all 0.3s;
}
.add-build-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(37,99,235,0.4); }
.add-build-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* Layout */
.builder-layout { display: grid; grid-template-columns: 360px 1fr; gap: 24px; align-items: start; }

/* Sidebar */
.builder-sidebar { position: sticky; top: 92px; display: flex; flex-direction: column; gap: 20px; }


.parts-panel { padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.07); }
.parts-title {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Orbitron', sans-serif; font-size: 12px; font-weight: 800;
  color: #94a3b8; margin: 0 0 16px; letter-spacing: 0.08em; text-transform: uppercase;
}
.parts-list { display: flex; flex-direction: column; gap: 8px; }
.part-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 12px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
  transition: border-color 0.2s;
}
.part-row:has(.selected) { border-color: rgba(59,130,246,0.2); }
.part-icon { font-size: 16px; flex-shrink: 0; width: 22px; text-align: center; }
.part-info { flex: 1; min-width: 0; }
.part-cat  { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #334155; margin: 0 0 2px; }
.part-name { font-size: 12px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.part-name.selected { color: #f1f5f9; font-weight: 600; }
.part-name.empty    { color: #334155; }
.clear-btn {
  width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
  color: #f87171; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.clear-btn:hover { background: rgba(239,68,68,0.22); }

/* Builder content */
.builder-content { display: flex; flex-direction: column; gap: 16px; }

.cat-section {
  padding: 24px; border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.07);
}

/* Category header */
.cat-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 20px; }
.cat-label { display: flex; align-items: center; gap: 14px; }
.cat-icon {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}
.cat-title { font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 800; color: #f1f5f9; margin: 0 0 2px; }
.cat-hint  { font-size: 12px; color: #475569; margin: 0; }
.cat-badge {
  padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.08em; flex-shrink: 0;
}
.selected-badge { background: rgba(16,185,129,0.15); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.3); }
.suggest-badge  { background: rgba(59,130,246,0.12); color: #93c5fd; border: 1px solid rgba(59,130,246,0.25); }

/* Selected card */
.selected-card {
  display: grid; grid-template-columns: 120px 1fr auto;
  gap: 20px; align-items: center;
  padding: 16px; border-radius: 16px;
  background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.15);
}
.sc-img-wrap {
  width: 120px; height: 100px; border-radius: 12px;
  background: radial-gradient(circle, rgba(59,130,246,0.08), rgba(3,7,18,0.5) 70%);
  padding: 10px; box-sizing: border-box;
  display: flex; align-items: center; justify-content: center;
}
.sc-img { width: 100%; height: 100%; object-fit: contain; }
.sc-name { font-size: 15px; font-weight: 700; color: #f1f5f9; margin: 0 0 6px; line-height: 1.4; }
.sc-price { font-size: 18px; font-weight: 800; color: #34d399; margin: 0; }
.change-btn {
  padding: 10px 18px; border-radius: 12px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s; white-space: nowrap;
}
.change-btn:hover { background: rgba(255,255,255,0.1); color: #f1f5f9; }

/* Reco grid */
.reco-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.no-reco { color: #334155; font-size: 14px; padding: 20px 0; grid-column: 1/-1; text-align: center; }

.reco-card {
  position: relative; overflow: hidden;
  padding: 16px; border-radius: 18px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  text-align: left; cursor: pointer;
  transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), border-color 0.3s, box-shadow 0.3s;
  display: flex; flex-direction: column; gap: 8px;
}
.reco-card:hover {
  border-color: rgba(59,130,246,0.4);
  box-shadow: 0 16px 40px rgba(59,130,246,0.15);
}
.reco-img-wrap {
  width: 100%; height: 130px; border-radius: 12px;
  background: radial-gradient(circle, rgba(59,130,246,0.07), rgba(3,7,18,0.5) 70%);
  padding: 12px; box-sizing: border-box;
  display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
}
.reco-img { width: 100%; height: 100%; object-fit: contain; }
.reco-badge {
  display: inline-block; padding: 3px 8px; border-radius: 20px;
  background: rgba(59,130,246,0.12); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2);
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  align-self: flex-start;
}
.reco-name { font-size: 13px; font-weight: 700; color: #f1f5f9; margin: 0; line-height: 1.4; flex: 1; }
.reco-price { font-size: 17px; font-weight: 900; color: #60a5fa; margin: 0; }
.reco-add {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; color: #3b82f6;
  text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px;
}

/* Responsive */
@media (max-width: 1200px) {
  .builder-layout { grid-template-columns: 1fr; }
  .builder-sidebar { position: relative; top: 0; }
}
@media (max-width: 900px) {
  .builder-header { flex-direction: column; }
  .summary-card { max-width: 100%; }
  .reco-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .reco-grid { grid-template-columns: 1fr; }
  .selected-card { grid-template-columns: 1fr; text-align: center; justify-items: center; }
  .cat-header { flex-direction: column; align-items: flex-start; }
}
</style>
