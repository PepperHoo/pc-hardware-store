<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore }     from '../stores/cart'
import { useWishlistStore } from '../stores/wishlist'
import { useCurrencyStore } from '../stores/currency'

const router   = useRouter()
const cart     = useCartStore()
const wishlist = useWishlistStore()
const currency = useCurrencyStore()

const showMenu      = ref(false)
const searchQuery   = ref('')
const showDropdown  = ref(false)
const selectedIndex = ref(-1)
const scrolled      = ref(false)
const products      = ref([])
const showCurrency  = ref(false)

const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
const isDark = ref(localStorage.getItem('theme') !== 'light')

const profilePath = computed(() => user.value ? '/profile' : '/login')
const cartCount   = computed(() => cart.items.reduce((n, i) => n + i.quantity, 0))

const filteredResults = computed(() => {
  if (!searchQuery.value.trim()) return []
  return products.value
    .filter(p => p.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
    .slice(0, 6)
})

function toggleMenu()  { showMenu.value = !showMenu.value }
function closeMenu()   { showMenu.value = false }

function toggleTheme() {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

function selectCurrency(code) {
  currency.setCurrency(code)
  showCurrency.value = false
}

function searchProduct() {
  if (!searchQuery.value.trim()) return
  showDropdown.value  = false
  selectedIndex.value = -1
  router.push({ path: '/products', query: { search: searchQuery.value } })
}

function selectProduct(product) {
  showDropdown.value  = false
  selectedIndex.value = -1
  router.push(`/product/${product.id}`)
}

function handleKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (selectedIndex.value < filteredResults.value.length - 1) selectedIndex.value++
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (selectedIndex.value > 0) selectedIndex.value--
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (selectedIndex.value >= 0) selectProduct(filteredResults.value[selectedIndex.value])
    else searchProduct()
  } else if (e.key === 'Escape') {
    showDropdown.value = false
  }
}

function onScroll() { scrolled.value = window.scrollY > 20 }

onMounted(async () => {
  window.addEventListener('scroll', onScroll)
  // Apply saved theme
  const saved = localStorage.getItem('theme') || 'dark'
  isDark.value = saved !== 'light'
  document.documentElement.setAttribute('data-theme', saved)
  try {
    const { getAll } = await import('../lib/api.js')
    products.value = await getAll('products')
  } catch (e) { console.error(e) }
})

onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div>
    <!-- ── NAVBAR ─────────────────────────────────────────────────── -->
    <nav class="nav" :class="{ 'nav--scrolled': scrolled }">
      <div class="nav-inner">

        <!-- Left: Hamburger + Logo -->
        <div class="nav-left">
          <button class="hamburger" @click="toggleMenu" aria-label="Menu">
            <span /><span /><span />
          </button>

          <router-link to="/" class="nav-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="6" width="24" height="16" rx="3" stroke="#3b82f6" stroke-width="2"/>
              <rect x="6" y="10" width="6" height="4" rx="1" fill="#3b82f6" opacity=".6"/>
              <rect x="14" y="10" width="8" height="4" rx="1" fill="#8b5cf6" opacity=".6"/>
              <line x1="9" y1="22" x2="9" y2="26" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/>
              <line x1="19" y1="22" x2="19" y2="26" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>PC<span class="logo-accent">Hardware</span></span>
          </router-link>
        </div>

        <!-- Center: Nav links (desktop) -->
        <div class="nav-links">
          <router-link to="/products" class="nav-link">Products</router-link>
          <router-link to="/pc-builder" class="nav-link nav-link--special">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            PC Builder
          </router-link>
        </div>

        <!-- Right: Search + Icons -->
        <div class="nav-right">
          <!-- Search -->
          <div class="search-wrap" @click.outside="showDropdown = false">
            <div class="search-box" :class="{ focused: showDropdown }">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                v-model="searchQuery"
                class="search-input"
                placeholder="Search components…"
                @keydown="handleKeydown"
                @focus="showDropdown = true"
                @blur="setTimeout(() => showDropdown = false, 150)"
              />
            </div>

            <!-- Dropdown -->
            <transition name="dropdown">
              <div v-if="showDropdown && filteredResults.length" class="search-dropdown">
                <button
                  v-for="(product, i) in filteredResults"
                  :key="product.id"
                  class="dropdown-item"
                  :class="{ active: selectedIndex === i }"
                  @mousedown.prevent="selectProduct(product)"
                >
                  <img :src="product.image" :alt="product.name" class="dropdown-img" />
                  <div>
                    <div class="dropdown-name">{{ product.name }}</div>
                    <div class="dropdown-price">RM {{ Number(product.price).toFixed(2) }}</div>
                  </div>
                </button>
              </div>
            </transition>
          </div>

          <!-- Currency Picker -->
          <div class="currency-wrap">
            <button class="currency-btn nav-icon-btn" @click="showCurrency = !showCurrency" :title="currency.current">
              <span class="currency-sym">{{ currency.symbol }}</span>
            </button>
            <transition name="dropdown">
              <div v-if="showCurrency" class="currency-dropdown">
                <button
                  v-for="code in currency.currencies" :key="code"
                  class="currency-opt" :class="{ active: currency.current === code }"
                  @mousedown.prevent="selectCurrency(code)"
                >
                  <span class="opt-sym">{{ currency.symbols[code] }}</span>
                  <span class="opt-code">{{ code }}</span>
                </button>
              </div>
            </transition>
          </div>

          <!-- Dark / Light toggle -->
          <button class="nav-icon-btn theme-btn" @click="toggleTheme" :title="isDark ? 'Light mode' : 'Dark mode'">
            <svg v-if="isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>

          <!-- Wishlist -->
          <router-link to="/wishlist" class="nav-icon-btn" aria-label="Wishlist">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" :fill="wishlist.count > 0 ? '#f87171' : 'none'" :stroke="wishlist.count > 0 ? '#f87171' : 'currentColor'"/>
            </svg>
            <span v-if="wishlist.count > 0" class="cart-badge" style="background:#ef4444">{{ wishlist.count }}</span>
          </router-link>

          <!-- Cart -->
          <router-link to="/cart" class="nav-icon-btn" aria-label="Cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
          </router-link>

          <!-- Profile -->
          <router-link :to="profilePath" class="nav-icon-btn" aria-label="Profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </router-link>
        </div>

      </div>
    </nav>

    <!-- ── OVERLAY ─────────────────────────────────────────────────── -->
    <transition name="fade">
      <div v-if="showMenu" class="overlay" @click="closeMenu" />
    </transition>

    <!-- ── SIDEBAR ─────────────────────────────────────────────────── -->
    <aside class="sidebar" :class="{ open: showMenu }">
      <div class="sidebar-head">
        <span class="sidebar-title">Categories</span>
        <button class="sidebar-close" @click="closeMenu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/products"            @click="closeMenu" class="s-link">
          <span class="s-icon">⬡</span> All Products
        </router-link>
        <router-link to="/pc-builder"          @click="closeMenu" class="s-link s-link--special">
          <span class="s-icon">⚙</span> PC Builder
        </router-link>
        <div class="s-divider" />
        <router-link to="/products/processor"  @click="closeMenu" class="s-link">
          <span class="s-icon s-icon--blue">●</span> Processor
        </router-link>
        <router-link to="/products/motherboard" @click="closeMenu" class="s-link">
          <span class="s-icon s-icon--purple">●</span> Motherboard
        </router-link>
        <router-link to="/products/gpu"        @click="closeMenu" class="s-link">
          <span class="s-icon s-icon--amber">●</span> Graphics Card
        </router-link>
        <router-link to="/products/ram"        @click="closeMenu" class="s-link">
          <span class="s-icon s-icon--violet">●</span> RAM
        </router-link>
        <router-link to="/products/storage"    @click="closeMenu" class="s-link">
          <span class="s-icon s-icon--cyan">●</span> Storage
        </router-link>
        <router-link to="/products/psu"        @click="closeMenu" class="s-link">
          <span class="s-icon s-icon--red">●</span> Power Supply
        </router-link>
        <router-link to="/products/cooler"     @click="closeMenu" class="s-link">
          <span class="s-icon s-icon--sky">●</span> CPU Cooler
        </router-link>
        <router-link to="/products/casing"     @click="closeMenu" class="s-link">
          <span class="s-icon s-icon--slate">●</span> PC Case
        </router-link>
        <router-link to="/products/rgb"        @click="closeMenu" class="s-link">
          <span class="s-icon s-icon--pink">●</span> RGB / Fans
        </router-link>
      </nav>
    </aside>
  </div>
</template>

<style scoped>
/* ── Navbar ─────────────────────────────────────────────────────────── */
.nav {
  position: sticky;
  top: 0;
  z-index: 3000;
  transition: background 0.4s, border-color 0.4s, box-shadow 0.4s;
  background: rgba(3, 7, 18, 0.5);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.nav--scrolled {
  background: rgba(3, 7, 18, 0.88);
  border-bottom-color: rgba(59,130,246,0.14);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

.nav-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px;
  height: 64px;
}

/* ── Left ───────────────────────────────────────────────────────────── */
.nav-left { display: flex; align-items: center; gap: 16px; }

.hamburger {
  display: flex; flex-direction: column; gap: 5px;
  padding: 8px; border-radius: 10px;
  background: transparent; border: none; cursor: pointer;
  transition: background 0.2s;
}
.hamburger:hover { background: rgba(255,255,255,0.06); }
.hamburger span {
  display: block; width: 20px; height: 2px;
  background: #94a3b8; border-radius: 2px;
  transition: 0.3s;
}

.nav-logo {
  display: flex; align-items: center; gap: 10px;
  text-decoration: none; color: white;
  font-family: 'Orbitron', sans-serif;
  font-size: 18px; font-weight: 800;
  letter-spacing: 0.02em;
}

.logo-accent { color: #3b82f6; }

/* ── Center links ────────────────────────────────────────────────────── */
.nav-links { display: flex; align-items: center; gap: 4px; margin-left: 16px; }

.nav-link {
  padding: 8px 16px; border-radius: 10px;
  color: #94a3b8; font-weight: 600; font-size: 14px;
  text-decoration: none; transition: all 0.2s;
}
.nav-link:hover,
.nav-link.router-link-active { color: #f1f5f9; background: rgba(255,255,255,0.06); }

.nav-link--special {
  display: flex; align-items: center; gap: 6px;
  color: #60a5fa;
  border: 1px solid rgba(59,130,246,0.25);
  background: rgba(59,130,246,0.08);
}
.nav-link--special:hover {
  background: rgba(59,130,246,0.16);
  border-color: rgba(59,130,246,0.45);
  color: #93c5fd;
}

/* ── Right ───────────────────────────────────────────────────────────── */
.nav-right {
  display: flex; align-items: center; gap: 8px; margin-left: auto;
}

/* Search */
.search-wrap { position: relative; }

.search-box {
  display: flex; align-items: center; gap: 8px;
  padding: 0 14px; height: 40px; width: 260px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; transition: all 0.25s;
}
.search-box.focused {
  background: rgba(255,255,255,0.08);
  border-color: rgba(59,130,246,0.4);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
  width: 320px;
}
.search-icon { color: #475569; flex-shrink: 0; }
.search-input {
  flex: 1; background: none; border: none; outline: none;
  color: #f1f5f9; font-size: 14px;
}
.search-input::placeholder { color: #475569; }

.search-dropdown {
  position: absolute; top: 48px; left: 0; right: 0;
  background: #0d1526;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 20px 48px rgba(0,0,0,0.5);
  z-index: 9999;
}

.dropdown-item {
  display: flex; align-items: center; gap: 12px;
  width: 100%; padding: 12px 16px;
  background: none; border: none; cursor: pointer;
  text-align: left; transition: background 0.15s;
}
.dropdown-item:hover, .dropdown-item.active {
  background: rgba(59,130,246,0.1);
}
.dropdown-img {
  width: 40px; height: 40px; object-fit: contain;
  border-radius: 8px; background: rgba(255,255,255,0.04);
  flex-shrink: 0;
}
.dropdown-name  { font-size: 13px; font-weight: 600; color: #e2e8f0; }
.dropdown-price { font-size: 12px; color: #60a5fa; margin-top: 2px; }

/* Icon buttons */
.nav-icon-btn {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 12px;
  color: #94a3b8; text-decoration: none; transition: all 0.2s;
}
.nav-icon-btn:hover {
  background: rgba(255,255,255,0.06); color: #f1f5f9;
}

.cart-badge {
  position: absolute; top: 2px; right: 2px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #3b82f6; color: white;
  font-size: 10px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}

/* ── Overlay ─────────────────────────────────────────────────────────── */
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 4990;
}

/* ── Sidebar ─────────────────────────────────────────────────────────── */
.sidebar {
  position: fixed; top: 0; left: -320px;
  width: 300px; height: 100vh;
  background: #080d1a;
  border-right: 1px solid rgba(255,255,255,0.06);
  box-shadow: 20px 0 60px rgba(0,0,0,0.5);
  z-index: 5000; transition: left 0.35s cubic-bezier(0.16,1,0.3,1);
  display: flex; flex-direction: column; overflow-y: auto;
}
.sidebar.open { left: 0; }

.sidebar-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 22px; border-bottom: 1px solid rgba(255,255,255,0.05);
  flex-shrink: 0;
}
.sidebar-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 14px; font-weight: 800;
  letter-spacing: 0.1em; text-transform: uppercase; color: #475569;
}
.sidebar-close {
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(255,255,255,0.04); border: none; cursor: pointer;
  color: #64748b; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.sidebar-close:hover { background: rgba(255,255,255,0.08); color: white; }

.sidebar-nav { padding: 12px; display: flex; flex-direction: column; gap: 2px; }

.s-link {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 12px;
  color: #64748b; font-size: 14px; font-weight: 600;
  text-decoration: none; transition: all 0.2s;
}
.s-link:hover { background: rgba(255,255,255,0.04); color: #cbd5e1; }
.s-link.router-link-active {
  background: rgba(59,130,246,0.12);
  color: #93c5fd;
}
.s-link--special { color: #60a5fa; }
.s-link--special:hover { background: rgba(59,130,246,0.1); color: #93c5fd; }

.s-icon { font-size: 10px; width: 20px; text-align: center; }
.s-icon--blue   { color: #3b82f6; }
.s-icon--purple { color: #a855f7; }
.s-icon--amber  { color: #f59e0b; }
.s-icon--violet { color: #8b5cf6; }
.s-icon--cyan   { color: #06b6d4; }
.s-icon--red    { color: #ef4444; }
.s-icon--sky    { color: #38bdf8; }
.s-icon--slate  { color: #94a3b8; }
.s-icon--pink   { color: #ec4899; }

.s-divider {
  height: 1px; background: rgba(255,255,255,0.05);
  margin: 8px 0;
}

/* Currency */
.currency-wrap { position: relative; }
.currency-btn { font-size: 13px; font-weight: 800; font-family: 'Orbitron', sans-serif; color: #60a5fa !important; }
.currency-sym { line-height: 1; }
.currency-dropdown {
  position: absolute; top: 48px; right: 0;
  background: #0d1526; border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px; overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5); z-index: 9999; min-width: 100px;
}
.currency-opt {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 10px 14px;
  background: none; border: none; cursor: pointer; text-align: left;
  transition: background 0.15s; color: #94a3b8;
}
.currency-opt:hover, .currency-opt.active { background: rgba(59,130,246,0.12); color: #93c5fd; }
.opt-sym { font-weight: 800; font-size: 14px; width: 20px; }
.opt-code { font-size: 12px; font-weight: 600; }

/* Transitions */
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s cubic-bezier(0.16,1,0.3,1); }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Mobile ──────────────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .nav-links { display: none; }
}

@media (max-width: 640px) {
  .nav-inner {
    gap: 8px;
    height: 58px;
    padding: 0 10px;
    width: 100%;
    max-width: 100%;
  }

  .nav-left {
    gap: 8px;
    min-width: 0;
    flex-shrink: 0;
  }

  .hamburger {
    width: 36px;
    height: 36px;
    padding: 8px;
    flex-shrink: 0;
  }

  .nav-logo {
    gap: 6px;
    font-size: 12px;
    max-width: 96px;
    overflow: hidden;
    white-space: nowrap;
  }

  .nav-logo svg {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }

  .nav-right {
    flex: 1;
    min-width: 0;
    gap: 4px;
  }

  .search-wrap {
    flex: 1;
    min-width: 0;
  }

  .search-box,
  .search-box.focused {
    width: 100%;
    min-width: 0;
    height: 36px;
    padding: 0 9px;
    border-radius: 10px;
  }

  .search-input {
    min-width: 0;
    font-size: 11px;
  }

  .search-input::placeholder {
    font-size: 10px;
  }

  .search-dropdown {
    top: 42px;
    width: min(280px, calc(100vw - 20px));
    left: auto;
    right: 0;
  }

  .currency-wrap,
  .nav-right > .nav-icon-btn[aria-label="Wishlist"] {
    display: none;
  }

  .nav-icon-btn {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .nav-icon-btn svg {
    width: 17px;
    height: 17px;
  }
}

@media (max-width: 380px) {
  .nav-logo span {
    display: none;
  }

  .nav-logo {
    max-width: 28px;
  }

  .nav-inner {
    padding: 0 8px;
  }
}

@media (max-width: 640px) {
  .nav {
    background: rgba(248,250,252,0.96);
  }

  .nav-inner {
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    gap: 8px 10px;
    height: auto;
    min-height: 92px;
    padding: 8px 12px 10px;
  }

  .nav-left {
    order: 1;
    flex: 1 1 auto;
    max-width: calc(100% - 116px);
  }

  .nav-logo {
    max-width: 140px;
    font-size: 13px;
  }

  .nav-right {
    display: contents;
  }

  .search-wrap {
    order: 3;
    flex: 0 0 100%;
    width: 100%;
  }

  .search-box,
  .search-box.focused {
    width: 100%;
    height: 38px;
    background: rgba(255,255,255,0.78);
  }

  .theme-btn,
  .nav-right > .nav-icon-btn[aria-label="Cart"],
  .nav-right > .nav-icon-btn[aria-label="Profile"] {
    order: 2;
  }

  .search-dropdown {
    left: 0;
    right: 0;
    width: 100%;
  }

  .sidebar {
    width: min(82vw, 300px);
    left: -310px;
    background:
      linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98));
    border-right: 1px solid rgba(96,165,250,0.16);
    box-shadow: 18px 0 48px rgba(2,6,23,0.55);
  }

  .sidebar.open {
    left: 0;
  }

  .sidebar-head {
    min-height: 58px;
    padding: 14px 16px;
  }

  .sidebar-title {
    font-size: 12px;
    color: #93c5fd;
  }

  .sidebar-nav {
    padding: 10px 12px 18px;
    gap: 4px;
  }

  .s-link {
    min-height: 44px;
    padding: 11px 12px;
    border-radius: 12px;
    font-size: 13px;
  }

  .s-divider {
    margin: 8px 0;
  }
}

@media (max-width: 380px) {
  .nav-left {
    max-width: calc(100% - 104px);
  }

  .nav-logo span {
    display: inline;
  }

  .nav-logo {
    max-width: 116px;
    font-size: 12px;
  }
}
</style>
