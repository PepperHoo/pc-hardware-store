<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar       from '../components/Navbar.vue'
import Footer       from '../components/Footer.vue'
import Toast        from '../components/Toast.vue'
import SkeletonCard from '../components/SkeletonCard.vue'
import { useCartStore }     from '../stores/cart'
import { useWishlistStore } from '../stores/wishlist'
import { useCompareStore }  from '../stores/compare'
import { useCurrencyStore } from '../stores/currency'
import { useScrollAnimation } from '../composables/useScrollAnimation'
import { useCardTilt } from '../composables/useCardTilt'

const route    = useRoute()
const router   = useRouter()
const cart     = useCartStore()
const wishlist = useWishlistStore()
const compare  = useCompareStore()
const currency = useCurrencyStore()
const tilt     = useCardTilt(7)
const toastRef = ref(null)
const user     = JSON.parse(localStorage.getItem('user') || 'null')
useScrollAnimation()

const products         = ref([])
const loading          = ref(true)
const errorMessage     = ref('')
const currentPage      = ref(1)
const productsPerPage  = 12
const selectedCategory = ref('')
const sortOption       = ref('')
const search           = ref('')
const quantities       = ref({})
const viewMode         = ref('grid') // 'grid' | 'list'

const categoryList = [
  { value: '',            label: 'All Products',  color: '#94a3b8' },
  { value: 'processor',  label: 'Processors',    color: '#3b82f6' },
  { value: 'motherboard',label: 'Motherboards',  color: '#8b5cf6' },
  { value: 'gpu',        label: 'Graphics Cards',color: '#f59e0b' },
  { value: 'ram',        label: 'RAM',           color: '#a855f7' },
  { value: 'storage',    label: 'Storage',       color: '#06b6d4' },
  { value: 'psu',        label: 'Power Supply',  color: '#ef4444' },
  { value: 'cooler',     label: 'CPU Cooler',    color: '#38bdf8' },
  { value: 'casing',     label: 'PC Case',       color: '#64748b' },
  { value: 'rgb',        label: 'RGB / Fans',    color: '#ec4899' },
]

// Sync route params / query → reactive refs
watch(() => route.query.search,    v => { search.value = v || '' },          { immediate: true })
watch(() => route.params.category, v => { selectedCategory.value = v || '' }, { immediate: true })

// Update route when category changes
watch(selectedCategory, v => {
  router.push(v ? { path: `/products/${v}`, query: route.query } : { path: '/products', query: route.query })
})

// Reset page on filter change
watch([selectedCategory, sortOption, search], () => { currentPage.value = 1 })

const filteredProducts = computed(() => {
  let res = [...products.value]
  if (search.value)            res = res.filter(p => p.name.toLowerCase().includes(search.value.toLowerCase()))
  if (selectedCategory.value)  res = res.filter(p => p.category === selectedCategory.value)
  if (sortOption.value === 'name-asc')  res.sort((a, b) => a.name.localeCompare(b.name))
  if (sortOption.value === 'name-desc') res.sort((a, b) => b.name.localeCompare(a.name))
  if (sortOption.value === 'low-high')  res.sort((a, b) => a.price - b.price)
  if (sortOption.value === 'high-low')  res.sort((a, b) => b.price - a.price)
  return res
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * productsPerPage
  return filteredProducts.value.slice(start, start + productsPerPage)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredProducts.value.length / productsPerPage))
)

const pageTitle = computed(() => {
  const cat = categoryList.find(c => c.value === selectedCategory.value)
  return cat ? cat.label : 'All Products'
})

function increaseQty(id) { quantities.value[id] = (quantities.value[id] || 1) + 1 }
function decreaseQty(id) { if (quantities.value[id] > 1) quantities.value[id]-- }

function addToCart(product) {
  const qty = quantities.value[product.id] || 1
  for (let i = 0; i < qty; i++) cart.addToCart(product)
  toastRef.value.showToastMessage(`${qty} × ${product.name} added to cart!`, 'success')
}

function toggleWishlist(product) {
  if (!user) { toastRef.value.showToastMessage('Please login to save items', 'error'); return }
  const added = wishlist.toggle(product, user.email)
  toastRef.value.showToastMessage(added ? '❤️ Added to wishlist!' : 'Removed from wishlist', 'success')
}

onMounted(async () => {
  try {
    const { getAll } = await import('../lib/api.js')
    products.value = await getAll('products')
    products.value.forEach(p => { quantities.value[p.id] = 1 })
  } catch (e) {
    errorMessage.value = 'Failed to load products.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <Navbar />

    <!-- Loading -->
    <div v-if="loading" class="state-box">
      <div class="spinner" /><p>Loading products…</p>
    </div>

    <!-- Error -->
    <div v-else-if="errorMessage" class="state-box state-box--error">
      <p>{{ errorMessage }}</p>
    </div>

    <!-- Main -->
    <div v-else class="products-layout section-inner">

      <!-- ── SIDEBAR ─────────────────────────────────────────────────── -->
      <aside class="sidebar">
        <div class="sidebar-card">
          <h3 class="sidebar-heading">Categories</h3>
          <nav class="cat-list">
            <button
              v-for="cat in categoryList" :key="cat.value"
              class="cat-btn"
              :class="{ active: selectedCategory === cat.value }"
              @click="selectedCategory = cat.value"
            >
              <span class="cat-dot" :style="{ background: cat.color }" />
              {{ cat.label }}
              <span class="cat-count">
                {{ cat.value ? products.filter(p => p.category === cat.value).length : products.length }}
              </span>
            </button>
          </nav>

          <div class="sidebar-divider" />

          <h3 class="sidebar-heading">Sort By</h3>
          <div class="sort-list">
            <button v-for="opt in [
              { value: '',          label: 'Default' },
              { value: 'low-high',  label: 'Price: Low → High' },
              { value: 'high-low',  label: 'Price: High → Low' },
              { value: 'name-asc',  label: 'Name: A → Z' },
              { value: 'name-desc', label: 'Name: Z → A' },
            ]" :key="opt.value"
              class="sort-btn" :class="{ active: sortOption === opt.value }"
              @click="sortOption = opt.value"
            >{{ opt.label }}</button>
          </div>
        </div>
      </aside>

      <!-- ── CONTENT ────────────────────────────────────────────────── -->
      <div class="content">

        <!-- Page header -->
        <div class="content-header">
          <div>
            <h1 class="page-title">{{ pageTitle }}</h1>
            <p class="result-count">{{ filteredProducts.length }} products</p>
          </div>

          <!-- Search + view toggle -->
          <div class="header-controls">
            <div class="search-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input v-model="search" class="search-input" placeholder="Search products…" />
              <button v-if="search" class="search-clear" @click="search = ''">✕</button>
            </div>
            <div class="view-toggle">
              <button class="view-btn" :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>
              </button>
              <button class="view-btn" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Skeleton loading -->
        <div v-if="loading" :class="viewMode === 'grid' ? 'p-grid' : 'p-list'">
          <SkeletonCard v-for="n in 12" :key="n" />
        </div>

        <!-- Products grid -->
        <div v-else-if="paginatedProducts.length" :class="viewMode === 'grid' ? 'p-grid' : 'p-list'">
          <div
            v-for="(product, i) in paginatedProducts" :key="product.id"
            class="p-card tilt-card reveal" :class="`stagger-${(i % 4) + 1}`"
            @mousemove="tilt.onMove" @mouseleave="tilt.onLeave"
          >
            <div class="card-shine" />

            <!-- Low stock badge -->
            <div v-if="product.stock > 0 && product.stock <= 5" class="low-stock-badge">
              <span class="ls-dot" />Only {{ product.stock }} left!
            </div>
            <div v-else-if="product.stock === 0" class="out-of-stock-badge">Out of Stock</div>

            <!-- Wishlist + Compare quick buttons -->
            <div class="card-quick-actions">
              <button class="quick-btn" :class="{ active: wishlist.isWishlisted(product.id) }" @click.stop="toggleWishlist(product)" title="Wishlist">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" :fill="wishlist.isWishlisted(product.id) ? '#f87171' : 'none'" :stroke="wishlist.isWishlisted(product.id) ? '#f87171' : 'currentColor'"/></svg>
              </button>
              <button class="quick-btn" :class="{ active: compare.isAdded(product.id) }" @click.stop="compare.toggle(product)" title="Compare">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M1 8h14M10 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              </button>
            </div>

            <!-- Image -->
            <div class="p-img-wrap" @click="router.push(`/product/${product.id}`)">
              <img :src="product.image" :alt="product.name" class="p-img" />
            </div>

            <!-- Body -->
            <div class="p-body">
              <span class="p-tag">{{ product.category }}</span>
              <h3 class="p-name" @click="router.push(`/product/${product.id}`)">{{ product.name }}</h3>
              <p class="p-price">RM {{ Number(product.price).toFixed(2) }}</p>
              <p class="p-price-converted">{{ currency.format(product.price) }}</p>

              <!-- Quantity -->
              <div class="qty-row">
                <button class="qty-btn" @click="decreaseQty(product.id)">−</button>
                <span class="qty-val">{{ quantities[product.id] || 1 }}</span>
                <button class="qty-btn" @click="increaseQty(product.id)">+</button>
              </div>

              <!-- Actions -->
              <div class="p-actions">
                <button class="btn-ghost" @click="router.push(`/product/${product.id}`)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Details
                </button>
                <button class="btn-primary" @click="addToCart(product)" :disabled="product.stock === 0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  {{ product.stock === 0 ? 'Sold Out' : 'Add to Cart' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else class="empty-state">
          <div class="empty-icon">⬡</div>
          <h3>No products found</h3>
          <p>Try adjusting your search or filters</p>
          <button class="btn-primary" @click="search = ''; selectedCategory = ''">Clear filters</button>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage--">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          <button
            v-for="p in totalPages" :key="p"
            class="pg-num" :class="{ active: p === currentPage }"
            @click="currentPage = p"
          >{{ p }}</button>

          <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage++">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

      </div>
    </div>

    <Toast ref="toastRef" />
    <Footer />
  </div>
</template>

<style scoped>
.page { background: #030712; min-height: 100vh; color: #f1f5f9; }

/* State boxes */
.state-box {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 16px; min-height: 50vh; color: #475569;
}
.state-box--error { color: #ef4444; }
.spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(59,130,246,0.15); border-top-color: #3b82f6;
  border-radius: 50%; animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg) } }

/* Layout */
.products-layout {
  display: grid; grid-template-columns: 260px 1fr;
  gap: 32px; padding-top: 48px; padding-bottom: 80px;
  align-items: start;
}

/* ── SIDEBAR ─────────────────────────────────────────────────────────── */
.sidebar { position: sticky; top: 80px; }
.sidebar-card {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px; padding: 24px; overflow: hidden;
}
.sidebar-heading {
  font-family: 'Orbitron', sans-serif;
  font-size: 10px; font-weight: 800;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: #334155; margin: 0 0 14px;
}
.sidebar-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 20px 0; }

.cat-list { display: flex; flex-direction: column; gap: 2px; }
.cat-btn {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 12px; border-radius: 10px;
  background: none; border: none; cursor: pointer;
  color: #475569; font-size: 13px; font-weight: 600;
  text-align: left; transition: all 0.2s;
}
.cat-btn:hover { background: rgba(255,255,255,0.04); color: #94a3b8; }
.cat-btn.active { background: rgba(59,130,246,0.1); color: #93c5fd; }
.cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.cat-count {
  margin-left: auto; font-size: 11px; font-weight: 700;
  color: #1e293b; background: rgba(255,255,255,0.06);
  padding: 2px 7px; border-radius: 10px;
}
.cat-btn.active .cat-count { color: #60a5fa; background: rgba(59,130,246,0.12); }

.sort-list { display: flex; flex-direction: column; gap: 2px; }
.sort-btn {
  width: 100%; padding: 9px 12px; border-radius: 10px;
  background: none; border: none; cursor: pointer;
  color: #475569; font-size: 12px; font-weight: 600;
  text-align: left; transition: all 0.2s;
}
.sort-btn:hover { background: rgba(255,255,255,0.04); color: #94a3b8; }
.sort-btn.active { background: rgba(59,130,246,0.1); color: #60a5fa; }

/* ── CONTENT ──────────────────────────────────────────────────────────── */
.content-header {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 20px; flex-wrap: wrap; margin-bottom: 32px;
}
.page-title {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(24px, 4vw, 40px);
  font-weight: 900; margin: 0 0 6px; color: #f1f5f9;
}
.result-count { font-size: 13px; color: #334155; margin: 0; font-weight: 600; }

.header-controls { display: flex; align-items: center; gap: 10px; }

.search-box {
  display: flex; align-items: center; gap: 8px;
  padding: 0 14px; height: 40px; min-width: 220px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
  transition: border-color 0.2s;
}
.search-box:focus-within { border-color: rgba(59,130,246,0.4); }
.search-box svg { color: #334155; flex-shrink: 0; }
.search-input { flex: 1; background: none; border: none; outline: none; color: #f1f5f9; font-size: 13px; }
.search-input::placeholder { color: #334155; }
.search-clear { background: none; border: none; color: #475569; cursor: pointer; font-size: 12px; padding: 0 2px; }
.search-clear:hover { color: #f1f5f9; }

.view-toggle { display: flex; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
.view-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; background: none; border: none;
  cursor: pointer; color: #334155; transition: all 0.2s;
}
.view-btn:hover  { color: #94a3b8; background: rgba(255,255,255,0.04); }
.view-btn.active { color: #60a5fa; background: rgba(59,130,246,0.1); }

/* ── GRID / LIST ──────────────────────────────────────────────────────── */
.p-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.p-list { display: flex; flex-direction: column; gap: 14px; }

/* ── CARD ─────────────────────────────────────────────────────────────── */
.p-card {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px; overflow: hidden;
  display: flex; flex-direction: column;
  transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
  position: relative;
}

/* Low stock / out of stock badges */
.low-stock-badge {
  position: absolute; top: 10px; left: 10px; z-index: 10;
  display: flex; align-items: center; gap: 5px;
  background: rgba(245,158,11,0.2); border: 1px solid rgba(245,158,11,0.4);
  color: #fcd34d; font-size: 10px; font-weight: 800;
  padding: 4px 10px; border-radius: 20px; letter-spacing: 0.04em;
}
.ls-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #fcd34d;
  animation: pulse 1.5s ease infinite;
}
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
.out-of-stock-badge {
  position: absolute; top: 10px; left: 10px; z-index: 10;
  background: rgba(239,68,68,0.18); border: 1px solid rgba(239,68,68,0.35);
  color: #fca5a5; font-size: 10px; font-weight: 800;
  padding: 4px 10px; border-radius: 20px; letter-spacing: 0.04em;
}

/* Quick action buttons on card hover */
.card-quick-actions {
  position: absolute; top: 10px; right: 10px; z-index: 10;
  display: flex; flex-direction: column; gap: 6px;
  opacity: 0; transform: translateX(6px);
  transition: all 0.25s ease;
}
.p-card:hover .card-quick-actions { opacity: 1; transform: translateX(0); }
.quick-btn {
  width: 30px; height: 30px; border-radius: 8px;
  background: rgba(3,7,18,0.75); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.1);
  color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.quick-btn:hover, .quick-btn.active { background: rgba(59,130,246,0.2); color: #60a5fa; border-color: rgba(59,130,246,0.3); }

/* Currency sub-price */
.p-price-converted { font-size: 11px; color: #475569; margin: -4px 0 8px; }
.p-card:hover {
  border-color: rgba(59,130,246,0.22);
  box-shadow: 0 24px 56px rgba(0,0,0,0.45), 0 0 0 1px rgba(59,130,246,0.08);
}

/* List mode card */
.p-list .p-card {
  flex-direction: row; align-items: center; border-radius: 16px;
}
.p-list .p-img-wrap { width: 140px; height: 120px; flex-shrink: 0; border-radius: 0; }
.p-list .p-body    { flex: 1; }

.p-img-wrap {
  background: radial-gradient(circle at 50% 60%, rgba(59,130,246,0.07), #080d1a 72%);
  display: flex; align-items: center; justify-content: center;
  height: 200px; cursor: pointer; overflow: hidden;
}
.p-img {
  max-height: 160px; max-width: 90%; object-fit: contain;
  transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
}
.p-card:hover .p-img { transform: scale(1.07) translateY(-4px); }

.p-body { padding: 18px 20px 20px; display: flex; flex-direction: column; flex: 1; }

.p-tag {
  display: inline-block; padding: 3px 10px; border-radius: 6px;
  background: rgba(59,130,246,0.1); color: #60a5fa;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; margin-bottom: 10px; width: fit-content;
}
.p-name {
  font-size: 14px; font-weight: 700; color: #e2e8f0;
  line-height: 1.45; margin: 0 0 10px; cursor: pointer;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  transition: color 0.2s;
}
.p-name:hover { color: #93c5fd; }
.p-price {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px; font-weight: 800; color: #60a5fa; margin: 0 0 14px;
}

/* Qty */
.qty-row { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.qty-btn {
  width: 32px; height: 32px; border-radius: 9px; border: none;
  background: rgba(59,130,246,0.1); color: #60a5fa;
  font-size: 18px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.qty-btn:hover { background: #3b82f6; color: white; }
.qty-val { font-size: 15px; font-weight: 700; min-width: 24px; text-align: center; color: #e2e8f0; }

/* Actions */
.p-actions { display: flex; gap: 8px; margin-top: auto; }
.btn-ghost {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 14px; border-radius: 10px; flex: 0 0 auto;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: #64748b; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.btn-ghost:hover { background: rgba(255,255,255,0.08); color: #cbd5e1; }
.btn-primary {
  display: flex; align-items: center; gap: 6px;
  flex: 1; padding: 10px 16px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white; font-size: 12px; font-weight: 700;
  cursor: pointer; justify-content: center; transition: all 0.25s;
}
.btn-primary:hover { box-shadow: 0 8px 20px rgba(59,130,246,0.35); transform: translateY(-1px); }

/* Empty */
.empty-state {
  text-align: center; padding: 80px 20px;
  border: 1px dashed rgba(255,255,255,0.07); border-radius: 20px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.empty-icon { font-size: 48px; opacity: 0.2; }
.empty-state h3 { font-family: 'Orbitron', sans-serif; font-size: 18px; color: #334155; margin: 0; }
.empty-state p  { color: #1e293b; font-size: 14px; margin: 0; }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 52px; }
.pg-btn {
  width: 38px; height: 38px; border-radius: 10px; border: none;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.pg-btn:hover:not(:disabled) { background: rgba(255,255,255,0.08); color: #f1f5f9; }
.pg-btn:disabled { opacity: 0.25; cursor: not-allowed; }
.pg-num {
  width: 38px; height: 38px; border-radius: 10px; border: none;
  background: rgba(255,255,255,0.04); color: #475569;
  font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.pg-num:hover  { background: rgba(255,255,255,0.08); color: #f1f5f9; }
.pg-num.active { background: #3b82f6; color: white; box-shadow: 0 6px 16px rgba(59,130,246,0.35); }

/* Responsive */
@media (max-width: 900px) {
  .products-layout { grid-template-columns: 1fr; }
  .sidebar { position: static; }
  .p-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .p-grid { grid-template-columns: 1fr; }
  .p-list .p-card { flex-direction: column; }
  .p-list .p-img-wrap { width: 100%; height: 180px; }
}
</style>
