<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar          from '../components/Navbar.vue'
import Footer          from '../components/Footer.vue'
import Toast           from '../components/Toast.vue'
import ProductReviews  from '../components/ProductReviews.vue'
import ProductModelViewer from '../components/ProductModelViewer.vue'
import { useCartStore }        from '../stores/cart'
import { useWishlistStore }    from '../stores/wishlist'
import { useCompareStore }     from '../stores/compare'
import { useCurrencyStore }    from '../stores/currency'
import { useCardTilt }         from '../composables/useCardTilt'
import { useRecentlyViewed }   from '../composables/useRecentlyViewed'

const route    = useRoute()
const router   = useRouter()
const cart     = useCartStore()
const wishlist = useWishlistStore()
const compare  = useCompareStore()
const currency = useCurrencyStore()
const tilt     = useCardTilt(6)
const { addProduct, getProducts } = useRecentlyViewed()
const toastRef = ref(null)

const product      = ref(null)
const loading      = ref(true)
const errorMessage = ref('')
const quantity     = ref(1)
const imgZoomed    = ref(false)
const recentlyViewed = ref([])

const user = JSON.parse(localStorage.getItem('user') || 'null')

const isWishlisted = computed(() => product.value ? wishlist.isWishlisted(product.value.id) : false)
const isCompared   = computed(() => product.value ? compare.isAdded(product.value.id) : false)

async function loadProduct() {
  try {
    const { getWhere } = await import('../lib/api.js')
    const rows = await getWhere('products', 'id', route.params.id)
    if (!rows.length) throw new Error('Not found')
    product.value = rows[0]
    addProduct(product.value)
    recentlyViewed.value = getProducts().filter(p => p.id !== product.value.id).slice(0, 4)
  } catch (e) {
    errorMessage.value = 'Product not found.'
  } finally {
    loading.value = false
  }
}

function addToCart() {
  if (!product.value) return
  for (let i = 0; i < quantity.value; i++) cart.addToCart(product.value)
  toastRef.value.showToastMessage(`${quantity.value} × ${product.value.name} added to cart!`, 'success')
}

function toggleWishlist() {
  if (!user) { toastRef.value.showToastMessage('Please login to save items', 'error'); return }
  const added = wishlist.toggle(product.value, user.email)
  toastRef.value.showToastMessage(added ? 'Added to wishlist!' : 'Removed from wishlist', 'success')
}

function toggleCompare() {
  compare.toggle(product.value)
  toastRef.value.showToastMessage(isCompared.value ? 'Removed from comparison' : 'Added to comparison', 'success')
}

onMounted(loadProduct)
</script>

<template>
  <div class="page">
    <Navbar />

    <!-- Loading -->
    <div v-if="loading" class="state-box">
      <div class="spinner" /><p>Loading product…</p>
    </div>

    <!-- Error -->
    <div v-else-if="errorMessage" class="state-box state-box--error">
      <p>{{ errorMessage }}</p>
      <button class="btn-back" @click="router.back()">← Go back</button>
    </div>

    <!-- Product -->
    <div v-else-if="product" class="detail-wrap section-inner">

      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <button @click="router.push('/')">Home</button>
        <span>›</span>
        <button @click="router.push('/products')">Products</button>
        <span>›</span>
        <button @click="router.push(`/products/${product.category}`)">{{ product.category }}</button>
        <span>›</span>
        <span class="bc-current">{{ product.name }}</span>
      </nav>

      <!-- Main layout -->
      <div class="detail-grid">

        <!-- ── IMAGE PANEL ─────────────────────────────────────────── -->
        <div
          class="img-panel tilt-card"
          @mousemove="tilt.onMove"
          @mouseleave="tilt.onLeave"
          @click="imgZoomed = !imgZoomed"
        >
          <div class="card-shine" />
          <div class="img-bg" />
          <img
            :src="product.image"
            :alt="product.name"
            class="detail-img"
            :class="{ zoomed: imgZoomed }"
          />
          <div class="img-hint">{{ imgZoomed ? 'Click to shrink' : 'Click to zoom' }}</div>

          <!-- Floating badges -->
          <div class="img-badge img-badge--stock" v-if="product.stock > 0">
            <span class="badge-dot" />
            In Stock ({{ product.stock }})
          </div>
          <div class="img-badge img-badge--cat">{{ product.category }}</div>
        </div>

        <!-- ── INFO PANEL ──────────────────────────────────────────── -->
        <div class="info-panel">

          <!-- Category + stock -->
          <div class="info-tags">
            <span class="tag-cat">{{ product.category }}</span>
            <span class="tag-stock" :class="product.stock > 0 ? 'in' : 'out'">
              {{ product.stock > 0 ? `${product.stock} in stock` : 'Out of stock' }}
            </span>
          </div>

          <!-- Name -->
          <h1 class="detail-name">{{ product.name }}</h1>

          <!-- Price -->
          <div class="price-row">
            <span class="detail-price">{{ currency.format(product.price) }}</span>
            <span class="price-note">Inclusive of SST</span>
          </div>

          <!-- Feature chips -->
          <div class="feature-chips">
            <span class="chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Official Warranty
            </span>
            <span class="chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Genuine Product
            </span>
            <span class="chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Fast Shipping
            </span>
          </div>

          <!-- Description -->
          <div v-if="product.description || product.details" class="detail-desc">
            <h3 class="desc-heading">Product Details</h3>
            <p class="desc-text">{{ product.description || product.details }}</p>
          </div>

          <!-- Quantity -->
          <div class="qty-section">
            <label class="qty-label">Quantity</label>
            <div class="qty-row">
              <button class="qty-btn" @click="quantity > 1 ? quantity-- : null">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/></svg>
              </button>
              <span class="qty-val">{{ quantity }}</span>
              <button class="qty-btn" @click="quantity++">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </div>

          <!-- Total -->
          <div class="total-row">
            <span class="total-label">Total</span>
            <span class="total-val">{{ currency.format(Number(product.price) * quantity) }}</span>
          </div>

          <!-- Actions -->
          <div class="detail-actions">
            <button v-if="product.stock === 0" class="btn-sold-out" disabled>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              Sold Out
            </button>
            <button v-else class="btn-cart" @click="addToCart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              Add {{ quantity }} to Cart
            </button>
            <button class="btn-wishlist" @click="toggleWishlist" :class="{ wishlisted: isWishlisted }">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" :fill="isWishlisted ? '#f87171' : 'none'" :stroke="isWishlisted ? '#f87171' : 'currentColor'"/></svg>
            </button>
            <button class="btn-compare-tog" @click="toggleCompare" :class="{ comparing: isCompared }">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 9h16M12 5l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="btn-back-ghost" @click="router.back()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>
          </div>

        </div>
      </div>

      <!-- 3D Model Preview -->
      <ProductModelViewer :product="product" />

      <!-- Reviews -->
      <ProductReviews :product-id="String(product.id)" />

      <!-- Recently Viewed -->
      <div v-if="recentlyViewed.length" class="recently-viewed">
        <h2 class="rv-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#60a5fa" stroke-width="1.5"/><path d="M8 5v3l2 1.5" stroke="#60a5fa" stroke-width="1.5" stroke-linecap="round"/></svg>
          Recently Viewed
        </h2>
        <div class="rv-grid">
          <div
            v-for="p in recentlyViewed" :key="p.id"
            class="rv-card glass"
            @click="router.push(`/product/${p.id}`)"
          >
            <div class="rv-img-wrap">
              <img :src="p.image" :alt="p.name" class="rv-img" />
            </div>
            <p class="rv-name">{{ p.name }}</p>
            <p class="rv-price">{{ currency.format(p.price) }}</p>
          </div>
        </div>
      </div>

    </div>

    <Toast ref="toastRef" />
    <Footer />
  </div>
</template>

<style scoped>
.page { background: #030712; min-height: 100vh; color: #f1f5f9; }

/* State */
.state-box {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 16px; min-height: 60vh; color: #475569;
}
.state-box--error { color: #ef4444; }
.spinner {
  width: 42px; height: 42px;
  border: 3px solid rgba(59,130,246,0.15); border-top-color: #3b82f6;
  border-radius: 50%; animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg) } }

/* Wrapper */
.detail-wrap { padding-top: 40px; padding-bottom: 80px; }

/* Breadcrumb */
.breadcrumb {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin-bottom: 36px; font-size: 13px;
}
.breadcrumb button {
  background: none; border: none; color: #334155; cursor: pointer;
  font-size: 13px; padding: 0; transition: color 0.2s;
}
.breadcrumb button:hover { color: #60a5fa; }
.breadcrumb span { color: #1e293b; }
.bc-current { color: #94a3b8; font-weight: 600; }

/* Grid */
.detail-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 52px; align-items: start;
}

/* ── Image Panel ────────────────────────────────────────────────────── */
.img-panel {
  position: relative; border-radius: 24px; overflow: hidden;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.07);
  aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
  cursor: zoom-in; transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
}
.img-panel:hover { border-color: rgba(59,130,246,0.2); box-shadow: 0 32px 72px rgba(0,0,0,0.5); }
.img-bg {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 55%, rgba(59,130,246,0.1), transparent 70%);
  pointer-events: none;
}
.detail-img {
  position: relative; z-index: 1;
  max-width: 80%; max-height: 80%;
  object-fit: contain; transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
}
.detail-img.zoomed { transform: scale(1.3); cursor: zoom-out; }
.img-panel:not(.zoomed):hover .detail-img:not(.zoomed) { transform: scale(1.06); }

.img-hint {
  position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
  font-size: 11px; color: #1e293b; letter-spacing: 0.06em;
  background: rgba(0,0,0,0.4); padding: 4px 10px; border-radius: 20px;
  pointer-events: none; white-space: nowrap;
}

.img-badge {
  position: absolute; display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700;
}
.img-badge--stock {
  top: 16px; left: 16px;
  background: rgba(34,197,94,0.12); color: #4ade80;
  border: 1px solid rgba(34,197,94,0.2);
}
.badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; animation: pulse 1.8s ease infinite; }
@keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(1.4); } }
.img-badge--cat {
  top: 16px; right: 16px;
  background: rgba(59,130,246,0.12); color: #60a5fa;
  border: 1px solid rgba(59,130,246,0.2);
  text-transform: capitalize;
}

/* ── Info Panel ─────────────────────────────────────────────────────── */
.info-panel { display: flex; flex-direction: column; gap: 0; }

.info-tags { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.tag-cat {
  padding: 5px 14px; border-radius: 20px;
  background: rgba(59,130,246,0.1); color: #60a5fa;
  font-size: 11px; font-weight: 700; text-transform: capitalize;
  border: 1px solid rgba(59,130,246,0.2);
}
.tag-stock {
  padding: 5px 14px; border-radius: 20px;
  font-size: 11px; font-weight: 700;
}
.tag-stock.in  { background: rgba(34,197,94,0.1); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
.tag-stock.out { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }

.detail-name {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(22px, 3.5vw, 38px);
  font-weight: 900; line-height: 1.2;
  color: #f1f5f9; margin: 0 0 24px;
}

.price-row { display: flex; align-items: baseline; gap: 12px; margin-bottom: 24px; }
.detail-price {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 900; color: #60a5fa;
}
.price-note { font-size: 12px; color: #334155; }

.feature-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }
.chip {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  color: #64748b; font-size: 12px; font-weight: 600;
}
.chip svg { color: #22c55e; flex-shrink: 0; }

.detail-desc {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px; padding: 24px; margin-bottom: 28px;
}
.desc-heading {
  font-family: 'Orbitron', sans-serif;
  font-size: 12px; font-weight: 800; letter-spacing: 0.1em;
  text-transform: uppercase; color: #334155; margin: 0 0 14px;
}
.desc-text { font-size: 14px; color: #64748b; line-height: 1.8; margin: 0; white-space: pre-line; }

.qty-section { margin-bottom: 20px; }
.qty-label { display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 10px; letter-spacing: 0.06em; text-transform: uppercase; }
.qty-row { display: flex; align-items: center; gap: 0; width: fit-content; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; }
.qty-btn {
  width: 44px; height: 44px; background: rgba(255,255,255,0.04); border: none;
  color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.qty-btn:hover { background: rgba(59,130,246,0.12); color: #60a5fa; }
.qty-val {
  min-width: 52px; text-align: center; font-size: 16px; font-weight: 800; color: #f1f5f9;
  border-left: 1px solid rgba(255,255,255,0.06); border-right: 1px solid rgba(255,255,255,0.06);
  padding: 0 4px;
}

.total-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-radius: 14px;
  background: rgba(59,130,246,0.05);
  border: 1px solid rgba(59,130,246,0.12); margin-bottom: 28px;
}
.total-label { font-size: 13px; font-weight: 700; color: #475569; }
.total-val { font-family: 'Orbitron', sans-serif; font-size: 22px; font-weight: 900; color: #60a5fa; }

.detail-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.btn-cart {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 16px 28px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white; font-family: 'Orbitron', sans-serif;
  font-size: 13px; font-weight: 700; letter-spacing: 0.04em;
  cursor: pointer; transition: all 0.3s;
  box-shadow: 0 10px 28px rgba(59,130,246,0.3);
}
.btn-cart:hover { transform: translateY(-2px); box-shadow: 0 16px 38px rgba(59,130,246,0.45); }

.btn-sold-out {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 16px 28px; border-radius: 14px; border: 1px solid rgba(239,68,68,0.3);
  background: rgba(239,68,68,0.08);
  color: #f87171; font-family: 'Orbitron', sans-serif;
  font-size: 13px; font-weight: 700; letter-spacing: 0.04em;
  cursor: not-allowed;
}

.btn-back-ghost, .btn-back {
  display: flex; align-items: center; gap: 8px;
  padding: 16px 22px; border-radius: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: #64748b; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
}
.btn-back-ghost:hover, .btn-back:hover { background: rgba(255,255,255,0.08); color: #cbd5e1; }

.currency-price { font-size: 14px; color: #64748b; margin: -18px 0 18px; }

.btn-wishlist, .btn-compare-tog {
  width: 52px; height: 52px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04); color: #64748b;
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
}
.btn-wishlist:hover  { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.25); color: #f87171; }
.btn-wishlist.wishlisted { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.3); color: #f87171; }
.btn-compare-tog:hover   { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.25); color: #60a5fa; }
.btn-compare-tog.comparing { background: rgba(59,130,246,0.12); border-color: rgba(59,130,246,0.3); color: #60a5fa; }

/* Recently Viewed */
.recently-viewed { margin-top: 56px; padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.06); }
.rv-title { display: flex; align-items: center; gap: 8px; font-family: 'Orbitron', sans-serif; font-size: 16px; font-weight: 800; color: #f1f5f9; margin-bottom: 20px; letter-spacing: 0.04em; }
.rv-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
.rv-card { padding: 16px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.07); cursor: pointer; transition: border-color 0.3s, transform 0.2s; }
.rv-card:hover { border-color: rgba(59,130,246,0.3); transform: translateY(-3px); }
.rv-img-wrap { height: 100px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(59,130,246,0.07), rgba(3,7,18,0.5)); border-radius: 12px; padding: 10px; box-sizing: border-box; margin-bottom: 10px; }
.rv-img { max-width: 100%; max-height: 100%; object-fit: contain; }
.rv-name { font-size: 12px; font-weight: 600; color: #cbd5e1; margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rv-price { font-size: 13px; font-weight: 800; color: #60a5fa; margin: 0; }

/* Responsive */
@media (max-width: 900px) {
  .detail-grid { grid-template-columns: 1fr; gap: 32px; }
  .img-panel { aspect-ratio: auto; min-height: 320px; }
}
@media (max-width: 640px) {
  .detail-name { font-size: 24px; }
  .detail-price { font-size: 28px; }
  .btn-cart { font-size: 12px; padding: 14px 20px; }
}
</style>
