<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Toast from '../components/Toast.vue'
import PcViewer3D from '../components/PcViewer3D.vue'

import {
  ref,
  computed,
  onMounted
} from 'vue'

import {
  useCartStore
} from '../stores/cart'

import {
  useRouter
} from 'vue-router'

const cart = useCartStore()
const router = useRouter()
const toastRef = ref(null)
const products = ref([])
const loading = ref(true)
const errorMessage = ref('')
const selectedParts = ref({})

const buildCategories = [
  { key: 'motherboard', label: 'Motherboard' },
  { key: 'processor', label: 'Processor' },
  { key: 'ram', label: 'RAM' },
  { key: 'gpu', label: 'Graphics Card' },
  { key: 'storage', label: 'Storage' },
  { key: 'psu', label: 'Power Supply' },
  { key: 'cooler', label: 'CPU Cooler' },
  { key: 'casing', label: 'PC Case' },
  { key: 'rgb', label: 'RGB/Fans' }
]

function getProductsByCategory(category) {
  return products.value.filter(product => product.category === category)
}

function getSelectedProduct(category) {
  const id = selectedParts.value[category]

  if (!id) return null

  return products.value.find(product => product.id === id)
}

function getCpuPlatform(product) {
  if (!product) return ''

  const name = product.name.toLowerCase()

  if (name.includes('9900') || name.includes('9950') || name.includes('9700')) {
    return 'amd-am5'
  }

  if (name.includes('5950')) {
    return 'amd-am4'
  }

  if (name.includes('ultra')) {
    return 'intel-lga1851'
  }

  if (name.includes('14900') || name.includes('14700') || name.includes('12600')) {
    return 'intel-lga1700'
  }

  return ''
}

function getMotherboardPlatform(product) {
  if (!product) return ''

  const name = product.name.toLowerCase()

  if (name.includes('z890')) {
    return 'intel-lga1851'
  }

  if (name.includes('b850') || name.includes('x870') || name.includes('b650')) {
    return 'amd-am5'
  }

  return ''
}

function getGpuTier(product) {
  if (!product || product.category !== 'gpu') return 0

  const name = product.name.toLowerCase()

  if (name.includes('5090') || name.includes('pro 6000')) return 5
  if (name.includes('4090') || name.includes('5080')) return 4
  if (name.includes('9070') || name.includes('7900')) return 3
  if (name.includes('9060') || name.includes('5060')) return 2

  return 1
}

function getCpuTier(product) {
  if (!product || product.category !== 'processor') return 0

  const name = product.name.toLowerCase()

  if (name.includes('9950') || name.includes('14900')) return 5
  if (name.includes('9900') || name.includes('5950') || name.includes('14700')) return 4
  if (name.includes('9700') || name.includes('ultra 7')) return 3
  if (name.includes('12600')) return 2

  return 1
}

function getPsuWatts(product) {
  if (!product) return 0

  const match = product.name.match(/(\d{3,4})w/i)

  return match ? Number(match[1]) : 0
}

function getRecommendedPsuWatts() {
  const gpuTier = getGpuTier(getSelectedProduct('gpu'))
  const cpuTier = getCpuTier(getSelectedProduct('processor'))

  if (gpuTier >= 5 || cpuTier >= 5) return 1000
  if (gpuTier >= 4 || cpuTier >= 4) return 850
  if (gpuTier >= 3 || cpuTier >= 3) return 750

  return 650
}

function isCompatible(product) {
  const selectedCpu = getSelectedProduct('processor')
  const selectedMotherboard = getSelectedProduct('motherboard')
  const selectedGpu = getSelectedProduct('gpu')

  if (product.category === 'processor' && selectedMotherboard) {
    return getCpuPlatform(product) === getMotherboardPlatform(selectedMotherboard)
  }

  if (product.category === 'motherboard' && selectedCpu) {
    return getMotherboardPlatform(product) === getCpuPlatform(selectedCpu)
  }

  if (product.category === 'psu') {
    return getPsuWatts(product) >= getRecommendedPsuWatts()
  }

  if (product.category === 'cooler' && getCpuTier(selectedCpu) >= 4) {
    return Number(product.price || 0) >= 700
  }

  if (product.category === 'casing' && getGpuTier(selectedGpu) >= 4) {
    return Number(product.price || 0) >= 350
  }

  return true
}

function getScore(product) {
  let score = 100000 - Number(product.price || 0)
  const name = product.name.toLowerCase()

  if (product.category === 'motherboard' && (name.includes('x870') || name.includes('b850') || name.includes('z890'))) {
    score += 3500
  }

  if (product.category === 'ram' && name.includes('cl30')) score += 2500
  if (product.category === 'storage' && name.includes('990')) score += 1800
  if (product.category === 'psu') score += getPsuWatts(product)
  if (product.category === 'cooler' && Number(product.price || 0) >= 700) score += 1800
  if (product.category === 'casing' && Number(product.price || 0) >= 350) score += 1200

  return score
}

function getRecommendations(category) {
  return getProductsByCategory(category)
    .filter(product => product.id !== selectedParts.value[category])
    .filter(isCompatible)
    .sort((a, b) => getScore(b) - getScore(a))
    .slice(0, 3)
}

function selectPart(product) {
  selectedParts.value = {
    ...selectedParts.value,
    [product.category]: product.id
  }
}

function clearPart(category) {
  const nextParts = {
    ...selectedParts.value
  }

  delete nextParts[category]
  selectedParts.value = nextParts
}

function addBuildToCart() {
  const selectedProducts = buildCategories
    .map(category => getSelectedProduct(category.key))
    .filter(Boolean)

  selectedProducts.forEach(product => {
    cart.addToCart(product)
  })

  toastRef.value.showToastMessage(
    `${selectedProducts.length} selected component(s) added to cart!`,
    'success'
  )

  router.push('/cart')
}

const totalPrice = computed(() => {
  return buildCategories.reduce((total, category) => {
    const product = getSelectedProduct(category.key)

    return total + Number(product?.price || 0)
  }, 0)
})

const selectedCount = computed(() => {
  return buildCategories.filter(category => getSelectedProduct(category.key)).length
})

const remainingCategories = computed(() => {
  return buildCategories.filter(category => !getSelectedProduct(category.key))
})

const buildStatus = computed(() => {
  if (selectedCount.value === 0) {
    return 'Start by selecting a motherboard to receive compatible component recommendations.'
  }

  if (selectedCount.value === buildCategories.length) {
    return 'Your build is complete and ready to add to cart.'
  }

  return `${remainingCategories.value.length} component type(s) still need to be selected.`
})

onMounted(async () => {
  try {
    loading.value = true

    const { getAll } = await import('../lib/api.js')

    products.value = await getAll('products')
  } catch (error) {
    console.log(error)
    errorMessage.value = 'Failed to load PC builder.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <Navbar />

    <div
      v-if="loading"
      class="builder-status-box"
    >
      Loading PC builder...
    </div>

    <div
      v-else-if="errorMessage"
      class="builder-error-box"
    >
      {{ errorMessage }}
    </div>

    <main
      v-else
      class="builder-page"
    >
      <section class="builder-header">
        <div>
          <p class="builder-kicker">
            Custom PC Builder
          </p>

          <h1>
            Build a compatible PC starting with a motherboard
          </h1>

          <p class="builder-subtitle">
            Start by selecting a motherboard. The builder will suggest compatible processors and remaining components that fit your platform.
          </p>
        </div>

        <div class="builder-summary">
          <span>
            {{ selectedCount }}/{{ buildCategories.length }} selected
          </span>

          <strong>
            RM {{ totalPrice.toFixed(2) }}
          </strong>

          <button
            @click="addBuildToCart"
            :disabled="selectedCount === 0"
          >
            Add Build To Cart
          </button>
        </div>
      </section>

      <section class="builder-layout">
        <aside class="builder-sidebar">
          <PcViewer3D :selected-parts="selectedParts" />

          <div class="builder-panel">
          <h2>
            Selected Build
          </h2>

          <p class="builder-status-text">
            {{ buildStatus }}
          </p>

          <div class="selected-list">
            <div
              v-for="category in buildCategories"
              :key="category.key"
              class="selected-row"
            >
              <div>
                <span>
                  {{ category.label }}
                </span>

                <strong>
                  {{
                    getSelectedProduct(category.key)?.name ||
                    'Not selected'
                  }}
                </strong>
              </div>

              <button
                v-if="getSelectedProduct(category.key)"
                @click="clearPart(category.key)"
                aria-label="Remove component"
              >
                x
              </button>
            </div>
          </div>
          </div>
        </aside>

        <section class="builder-content">
          <div
            v-for="category in buildCategories"
            :key="category.key"
            class="builder-category"
          >
            <div class="category-heading">
              <h2>
                {{ category.label }}
              </h2>

              <p>
                {{
                  getSelectedProduct(category.key)
                    ? 'Selected component'
                    : 'Compatible suggestions'
                }}
              </p>
            </div>

            <div
              v-if="getSelectedProduct(category.key)"
              class="component-card selected-card"
            >
              <img
                :src="getSelectedProduct(category.key).image"
                :alt="getSelectedProduct(category.key).name"
              />

              <div>
                <span class="component-category">
                  Selected
                </span>

                <h3>
                  {{ getSelectedProduct(category.key).name }}
                </h3>

                <p>
                  RM {{ Number(getSelectedProduct(category.key).price).toFixed(2) }}
                </p>
              </div>

              <button @click="clearPart(category.key)">
                Change
              </button>
            </div>

            <div
              v-else
              class="recommendation-grid"
            >
              <button
                v-for="product in getRecommendations(category.key)"
                :key="product.id"
                class="component-card suggestion-card"
                @click="selectPart(product)"
              >
                <img
                  :src="product.image"
                  :alt="product.name"
                />

                <span class="component-category">
                  Recommended
                </span>

                <h3>
                  {{ product.name }}
                </h3>

                <p>
                  RM {{ Number(product.price).toFixed(2) }}
                </p>
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>

    <Toast ref="toastRef" />
    <Footer />
  </div>
</template>

<style scoped>
.builder-page {
  max-width: 1500px;
  margin: 0 auto;
  padding: 38px;
  color: #f8fafc;
}

.builder-status-box,
.builder-error-box {
  margin: 40px;
  padding: 30px;
  border-radius: 18px;
  background:
    linear-gradient(
      145deg,
      #111827,
      #0b1020
    );
  border:
    1px solid rgba(59,130,246,0.22);
  box-shadow: 0 18px 40px rgba(0,0,0,0.28);
  font-size: 18px;
}

.builder-error-box {
  color: #dc2626;
}

.builder-header {
  display: flex;
  justify-content: space-between;
  gap: 28px;
  align-items: flex-end;
  margin-bottom: 32px;
}

.builder-kicker {
  margin: 0 0 10px;
  color: #93c5fd;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0;
}

.builder-header h1 {
  max-width: 850px;
  margin: 0;
  font-size: 46px;
  line-height: 1.15;
}

.builder-subtitle {
  max-width: 760px;
  margin: 16px 0 0;
  color: #cbd5e1;
  font-size: 18px;
  line-height: 1.7;
}

.builder-summary {
  min-width: 280px;
  padding: 22px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background:
    linear-gradient(
      145deg,
      #1e293b,
      #162032
    );
  border:
    1px solid rgba(59,130,246,0.22);
  box-shadow: 0 22px 48px rgba(0,0,0,0.32);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.builder-summary span {
  color: #94a3b8;
  font-weight: 700;
}

.builder-summary strong {
  font-size: 30px;
  color: #93c5fd;
}

.builder-summary button,
.selected-row button,
.selected-card button {
  border: none;
  border-radius: 8px;
  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );
  color: white;
  font-weight: 800;
  cursor: pointer;
}

.builder-summary button {
  height: 48px;
}

.builder-summary button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.builder-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 28px;
  align-items: start;
}

.builder-sidebar {
  position: sticky;
  top: 92px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.builder-panel {
  padding: 24px;
  border-radius: 14px;
  background:
    linear-gradient(
      145deg,
      #1e293b,
      #162032
    );
  border:
    1px solid rgba(59,130,246,0.22);
  box-shadow: 0 20px 44px rgba(0,0,0,0.28);
}

.builder-panel h2,
.category-heading h2 {
  margin: 0;
  font-size: 24px;
}

.builder-status-text {
  color: #cbd5e1;
  line-height: 1.6;
}

.selected-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selected-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(148,163,184,0.14);
  border-radius: 10px;
  background:
    rgba(30,41,59,0.70);
}

.selected-row span {
  display: block;
  margin-bottom: 6px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 800;
}

.selected-row strong {
  display: block;
  font-size: 14px;
  line-height: 1.45;
}

.selected-row button {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  background: #ef4444;
  color: white;
}

.builder-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.builder-category {
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background:
    linear-gradient(
      145deg,
      #1e293b,
      #162032
    );
  border:
    1px solid rgba(59,130,246,0.18);
  box-shadow: 0 20px 42px rgba(0,0,0,0.24);
}

.category-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 18px;
}

.category-heading p {
  margin: 0;
  color: #94a3b8;
  font-weight: 700;
}

.recommendation-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.component-card {
  border: 1px solid rgba(148,163,184,0.14);
  border-radius: 14px;
  background:
    linear-gradient(160deg, #1e293b, #162032);
  text-align: left;
}

.suggestion-card {
  min-height: 360px;
  padding: 16px;
  cursor: pointer;
  transition: 0.25s;
}

.suggestion-card:hover {
  transform: translateY(-4px);
  border-color: rgba(59,130,246,0.60);
  box-shadow: 0 18px 36px rgba(59,130,246,0.22);
}

.component-card img {
  width: 100%;
  height: 170px;
  object-fit: contain;
  margin-bottom: 14px;
}

.component-category {
  display: inline-flex;
  margin-bottom: 10px;
  padding: 7px 10px;
  border-radius: 8px;
  background: rgba(59,130,246,0.14);
  color: #93c5fd;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.component-card h3 {
  min-height: 64px;
  margin: 0 0 12px;
  color: #f8fafc;
  font-size: 18px;
  line-height: 1.35;
}

.component-card p {
  margin: 0;
  color: #93c5fd;
  font-size: 21px;
  font-weight: 900;
}

.selected-card {
  display: grid;
  grid-template-columns: 180px 1fr auto;
  gap: 20px;
  align-items: center;
  padding: 18px;
}

.selected-card img {
  height: 150px;
  margin: 0;
}

.selected-card h3 {
  min-height: auto;
}

.selected-card button {
  padding: 13px 22px;
}

@media (max-width: 1200px) {
  .builder-layout {
    grid-template-columns: 1fr;
  }

  .builder-sidebar {
    position: static;
  }
}

@media (max-width: 1100px) {
  .builder-header {
    display: grid;
    grid-template-columns: 1fr;
  }

  .recommendation-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .builder-page {
    padding: 22px;
  }

  .builder-header h1 {
    font-size: 32px;
  }

  .builder-summary {
    min-width: 0;
  }

  .recommendation-grid,
  .selected-card {
    grid-template-columns: 1fr;
  }

  .category-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
