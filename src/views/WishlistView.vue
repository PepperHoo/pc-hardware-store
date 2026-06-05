<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWishlistStore } from '../stores/wishlist'
import { useCartStore } from '../stores/cart'
import { useCurrencyStore } from '../stores/currency'
import { getSessionUser } from '../lib/session.js'

const router   = useRouter()
const wishlist = useWishlistStore()
const cart     = useCartStore()
const currency = useCurrencyStore()

const user = getSessionUser()

function addToCart(product) {
  cart.addToCart(product)
}
function removeItem(id) {
  wishlist.remove(id, user?.email)
}

onMounted(() => {
  if (user?.email) wishlist.load(user.email)
})
</script>

<template>
  <div class="page-bg">
    <Navbar />
    <main class="main section-inner">
      <div class="page-header">
        <span class="kicker">Account</span>
        <h1 class="page-title">My <span class="grad-text">Wishlist</span></h1>
        <p class="page-sub">{{ wishlist.count }} saved item{{ wishlist.count !== 1 ? 's' : '' }}</p>
      </div>

      <!-- Empty -->
      <div v-if="wishlist.items.length === 0" class="empty-state glass">
        <div class="empty-icon">🤍</div>
        <h2>Your wishlist is empty</h2>
        <p>Save products you love and come back to them later.</p>
        <button class="btn-primary" @click="router.push('/products')">Browse Products</button>
      </div>

      <!-- Grid -->
      <div v-else class="wish-grid">
        <div v-for="item in wishlist.items" :key="item.id" class="wish-card glass">
          <button class="remove-btn" @click="removeItem(item.id)" title="Remove from wishlist">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>

          <div class="card-img-wrap" @click="router.push(`/product/${item.id}`)">
            <img :src="item.image" :alt="item.name" class="card-img" />
          </div>

          <div class="card-info">
            <span class="card-cat">{{ item.category }}</span>
            <p class="card-name" @click="router.push(`/product/${item.id}`)">{{ item.name }}</p>
            <p class="card-price">{{ currency.format(item.price) }}</p>
            <div class="card-stock" :class="item.stock <= 5 ? 'low' : 'ok'">
              <span class="stock-dot" />
              {{ item.stock <= 5 ? `Only ${item.stock} left!` : 'In Stock' }}
            </div>
          </div>

          <button class="btn-cart" @click="addToCart(item)" :disabled="item.stock === 0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1h2l1.5 6h7L13 4H4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="11" cy="12" r="1.2" fill="currentColor"/></svg>
            {{ item.stock === 0 ? 'Out of Stock' : 'Add to Cart' }}
          </button>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<style scoped>
.page-bg { background: #030712; min-height: 100vh; }
.main { padding-top: 130px; padding-bottom: 100px; }
.page-header { margin-bottom: 48px; }
.page-title { font-family: 'Orbitron', sans-serif; font-size: clamp(32px,5vw,56px); font-weight: 900; color: #f1f5f9; margin: 14px 0 8px; }
.page-sub { color: #475569; font-size: 16px; margin: 0; }

.empty-state { padding: 80px 40px; border-radius: 28px; border: 1px solid rgba(255,255,255,0.07); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.empty-icon { font-size: 64px; }
.empty-state h2 { font-family: 'Orbitron', sans-serif; font-size: 22px; color: #f1f5f9; margin: 0; }
.empty-state p { color: #475569; font-size: 15px; max-width: 360px; margin: 0; }

.btn-primary { padding: 12px 28px; background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; border: none; border-radius: 14px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(37,99,235,0.35); }

.wish-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
.wish-card { position: relative; border-radius: 22px; border: 1px solid rgba(255,255,255,0.07); padding: 20px; display: flex; flex-direction: column; gap: 12px; transition: border-color 0.3s; }
.wish-card:hover { border-color: rgba(59,130,246,0.3); }

.remove-btn { position: absolute; top: 14px; right: 14px; width: 30px; height: 30px; border-radius: 8px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #f87171; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.remove-btn:hover { background: rgba(239,68,68,0.25); }

.card-img-wrap { height: 160px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(59,130,246,0.07), rgba(3,7,18,0.5)); border-radius: 14px; padding: 12px; box-sizing: border-box; cursor: pointer; }
.card-img { max-width: 100%; max-height: 100%; object-fit: contain; }

.card-cat { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #3b82f6; }
.card-name { font-size: 14px; font-weight: 700; color: #f1f5f9; margin: 0; cursor: pointer; line-height: 1.4; }
.card-name:hover { color: #60a5fa; }
.card-price { font-size: 18px; font-weight: 800; color: #60a5fa; margin: 0; }
.card-stock { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; }
.card-stock.ok { color: #6ee7b7; } .card-stock.low { color: #fcd34d; }
.stock-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.btn-cart { display: flex; align-items: center; justify-content: center; gap: 7px; padding: 11px; border-radius: 12px; background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; border: none; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.3s; margin-top: auto; }
.btn-cart:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(37,99,235,0.35); }
.btn-cart:disabled { opacity: 0.35; cursor: not-allowed; }
</style>
