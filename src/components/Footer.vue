<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user   = computed(() => JSON.parse(localStorage.getItem('user')))
const year   = new Date().getFullYear()

const categories = [
  { label: 'Processors',    path: '/products/processor' },
  { label: 'Graphics Cards',path: '/products/gpu' },
  { label: 'Motherboards',  path: '/products/motherboard' },
  { label: 'RAM',           path: '/products/ram' },
  { label: 'Storage',       path: '/products/storage' },
  { label: 'Power Supply',  path: '/products/psu' },
  { label: 'CPU Cooler',    path: '/products/cooler' },
  { label: 'PC Cases',      path: '/products/casing' },
  { label: 'RGB / Fans',    path: '/products/rgb' },
]

const links = [
  { label: 'All Products', path: '/products' },
  { label: 'PC Builder',   path: '/pc-builder' },
  { label: user.value ? 'My Profile' : 'Login', path: user.value ? '/profile' : '/login' },
  { label: 'My Orders',    path: '/orders' },
  { label: 'Cart',         path: '/cart' },
]
</script>

<template>
  <footer class="footer">
    <!-- Grid line decoration -->
    <div class="footer-grid" />

    <div class="footer-inner section-inner">
      <div class="footer-cols">

        <!-- Brand -->
        <div class="footer-brand">
          <div class="brand-logo" @click="router.push('/')">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="6" width="24" height="16" rx="3" stroke="#3b82f6" stroke-width="2"/>
              <rect x="6" y="10" width="6" height="4" rx="1" fill="#3b82f6" opacity=".6"/>
              <rect x="14" y="10" width="8" height="4" rx="1" fill="#8b5cf6" opacity=".6"/>
            </svg>
            <span>PC<span class="brand-accent">Hardware</span></span>
          </div>
          <p class="brand-desc">
            Your one-stop shop for premium PC components. We source only the best hardware from the world's top manufacturers.
          </p>
          <div class="brand-badges">
            <span class="badge">🔒 Secure Checkout</span>
            <span class="badge">⚡ Fast Delivery</span>
          </div>
        </div>

        <!-- Categories -->
        <div class="footer-col">
          <h4 class="col-heading">Shop</h4>
          <nav class="col-links col-links--shop">
            <button v-for="cat in categories" :key="cat.path" @click="router.push(cat.path)" class="col-link">
              {{ cat.label }}
            </button>
          </nav>
        </div>

        <!-- Account -->
        <div class="footer-col">
          <h4 class="col-heading">Account</h4>
          <nav class="col-links">
            <button v-for="link in links" :key="link.path" @click="router.push(link.path)" class="col-link">
              {{ link.label }}
            </button>
          </nav>
        </div>

      </div>

      <!-- Bottom bar -->
      <div class="footer-bottom">
        <p class="copyright">© {{ year }} PCHardware. All rights reserved.</p>
        <p class="built-with">Built with Vue 3 + Supabase</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: relative; overflow: hidden;
  background: #030712;
  border-top: 1px solid rgba(255,255,255,0.05);
  margin-top: 0;
}
.footer-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(to bottom, transparent, rgba(0,0,0,0.5) 40%, transparent);
  pointer-events: none;
}
.footer-inner { position: relative; z-index: 1; padding-top: 64px; padding-bottom: 32px; }

.footer-cols {
  display: grid; grid-template-columns: 2fr 1fr 1fr;
  gap: 52px; margin-bottom: 52px;
}

/* Brand */
.footer-brand {}
.brand-logo {
  display: flex; align-items: center; gap: 10px; cursor: pointer;
  font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 800;
  color: white; margin-bottom: 18px; width: fit-content;
}
.brand-accent { color: #3b82f6; }
.brand-desc { font-size: 14px; color: #334155; line-height: 1.75; margin: 0 0 20px; max-width: 320px; }
.brand-badges { display: flex; gap: 10px; flex-wrap: wrap; }
.badge {
  padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); color: #334155;
}

/* Columns */
.footer-col {}
.col-heading {
  font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 800;
  letter-spacing: 0.12em; text-transform: uppercase; color: #1e293b; margin: 0 0 18px;
}
.col-links { display: flex; flex-direction: column; gap: 4px; }
.col-links--shop {
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, max-content));
  column-gap: 26px;
  row-gap: 4px;
}
.col-link {
  background: none; border: none; text-align: left; cursor: pointer;
  color: #334155; font-size: 14px; font-weight: 500; padding: 6px 0;
  transition: color 0.2s; width: fit-content;
}
.col-link:hover { color: #60a5fa; }

/* Bottom */
.footer-bottom {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
  gap: 12px; padding-top: 28px; border-top: 1px solid rgba(255,255,255,0.04);
}
.copyright   { font-size: 12px; color: #1e293b; margin: 0; }
.built-with  { font-size: 12px; color: #1e293b; margin: 0; }

@media (max-width: 768px) {
  .footer-cols { grid-template-columns: 1fr 1fr; }
  .footer-brand { grid-column: 1 / -1; }
}
@media (max-width: 480px) {
  .footer-cols { grid-template-columns: 1fr; }
  .col-links--shop { grid-template-columns: 1fr; }
}
</style>
