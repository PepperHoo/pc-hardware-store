<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { useScrollAnimation } from '../composables/useScrollAnimation'
import { useCardTilt } from '../composables/useCardTilt'

const router = useRouter()
const tilt   = useCardTilt(8)
useScrollAnimation()

const loading        = ref(true)
const bannerImages   = ref([])
const hotSelling     = ref([])
const latestProducts = ref([])
const allProducts    = ref([])
const activeBanner   = ref(0)
const heroOffset     = ref(0)
let   bannerTimer    = null

function onScroll() { heroOffset.value = window.scrollY * 0.35 }
function nextBanner() { activeBanner.value = (activeBanner.value + 1) % bannerImages.value.length }
function prevBanner() { activeBanner.value = (activeBanner.value - 1 + bannerImages.value.length) % bannerImages.value.length }
function goToBanner(i) { activeBanner.value = i }
function startCarousel() { bannerTimer = setInterval(nextBanner, 5000) }

const categories = [
  { key: 'processor',   label: 'Processors',    icon: '⬡', color: '#3b82f6', desc: 'Intel & AMD latest gen' },
  { key: 'gpu',         label: 'Graphics Cards', icon: '◈', color: '#f59e0b', desc: 'RTX 5000 & RX 9000 series' },
  { key: 'motherboard', label: 'Motherboards',   icon: '⬟', color: '#8b5cf6', desc: 'Z890 / X870 / B850' },
  { key: 'ram',         label: 'Memory',         icon: '▨', color: '#a855f7', desc: 'DDR5 up to 9200MHz' },
  { key: 'storage',     label: 'Storage',        icon: '⬠', color: '#06b6d4', desc: 'PCIe 5.0 NVMe SSDs' },
  { key: 'cooler',      label: 'CPU Coolers',    icon: '❋', color: '#38bdf8', desc: 'Air & AIO liquid cooling' }
]

const featuredProducts = computed(() =>
  allProducts.value.filter(p => ['gpu', 'processor', 'ram'].includes(p.category)).slice(0, 6)
)

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  try {
    const { getAll } = await import('../lib/api.js')
    const [hpData, products] = await Promise.all([getAll('homepage'), getAll('products')])
    allProducts.value = products
    if (hpData?.[0]) {
      const hp = hpData[0]
      bannerImages.value   = hp.banners        || []
      hotSelling.value     = hp.hotSelling     || []
      latestProducts.value = hp.latestProducts || []
    }
    startCarousel()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  clearInterval(bannerTimer)
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="home">
    <Navbar />

    <!-- ══ HERO ══════════════════════════════════════════════════════════ -->
    <section class="hero">
      <div class="hero-bg" :style="{ transform: `translateY(${heroOffset}px)` }">
        <img v-if="bannerImages[activeBanner]" :src="bannerImages[activeBanner]" class="hero-bg-img" alt="" />
        <div class="hero-bg-gradient" />
      </div>
      <div class="orb orb-1" />
      <div class="orb orb-2" />
      <div class="orb orb-3" />
      <div class="hero-grid" />

      <div class="hero-content section-inner">
        <span class="kicker">Premium PC Hardware Store</span>
        <h1 class="hero-title">
          Build the PC<br />
          <span class="grad-text">of Your Dreams</span>
        </h1>
        <p class="hero-sub">
          Top-tier processors, graphics cards, and components from the world's
          leading manufacturers — all in one place.
        </p>
        <div class="hero-ctas">
          <button class="cta-primary" @click="router.push('/products')">
            Shop Now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button class="cta-secondary" @click="router.push('/pc-builder')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            PC Builder
          </button>
        </div>
        <div v-if="bannerImages.length > 1" class="banner-dots">
          <button v-for="(_, i) in bannerImages" :key="i" class="dot" :class="{ active: i === activeBanner }" @click="goToBanner(i)" />
        </div>
      </div>

      <button v-if="bannerImages.length > 1" class="hero-arrow hero-arrow--left"  @click="prevBanner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button v-if="bannerImages.length > 1" class="hero-arrow hero-arrow--right" @click="nextBanner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      <div class="scroll-cue">
        <div class="scroll-cue-line" />
        <span>Scroll</span>
      </div>
    </section>

    <!-- ══ STATS ══════════════════════════════════════════════════════════ -->
    <section class="stats-strip reveal">
      <div class="section-inner">
        <div class="stats-grid">
          <div class="stat-item"><span class="stat-num grad-text-blue">500+</span><span class="stat-label">Products</span></div>
          <div class="stat-divider" />
          <div class="stat-item"><span class="stat-num grad-text-blue">50+</span><span class="stat-label">Top Brands</span></div>
          <div class="stat-divider" />
          <div class="stat-item"><span class="stat-num grad-text-blue">10k+</span><span class="stat-label">Happy Builders</span></div>
          <div class="stat-divider" />
          <div class="stat-item"><span class="stat-num grad-text-blue">Free</span><span class="stat-label">PC Build Guide</span></div>
        </div>
      </div>
    </section>

    <!-- ══ CATEGORIES ════════════════════════════════════════════════════ -->
    <section class="home-section">
      <div class="section-inner">
        <div class="section-head reveal">
          <span class="kicker">Browse by Type</span>
          <h2 class="section-title">Shop by Category</h2>
        </div>
        <div class="categories-grid">
          <button
            v-for="(cat, i) in categories" :key="cat.key"
            class="cat-card tilt-card reveal" :class="`stagger-${i + 1}`"
            @mousemove="tilt.onMove" @mouseleave="tilt.onLeave"
            @click="router.push(`/products/${cat.key}`)"
          >
            <div class="card-shine" />
            <div class="cat-icon" :style="{ color: cat.color, boxShadow: `0 0 20px ${cat.color}33` }">{{ cat.icon }}</div>
            <h3 class="cat-label">{{ cat.label }}</h3>
            <p class="cat-desc">{{ cat.desc }}</p>
            <div class="cat-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <div class="cat-glow" :style="{ background: `radial-gradient(circle at 50% 100%, ${cat.color}22, transparent 70%)` }" />
          </button>
        </div>
      </div>
    </section>

    <!-- ══ HOT SELLING ════════════════════════════════════════════════════ -->
    <section class="home-section" v-if="hotSelling.length">
      <div class="section-inner">
        <div class="section-head reveal">
          <span class="kicker">Trending Now</span>
          <h2 class="section-title">Hot Selling</h2>
          <button class="section-link" @click="router.push('/products')">View all <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
        </div>
        <div class="products-grid">
          <div
            v-for="(product, i) in hotSelling.slice(0, 6)" :key="product.id || i"
            class="product-card tilt-card reveal" :class="`stagger-${(i % 3) + 1}`"
            @mousemove="tilt.onMove" @mouseleave="tilt.onLeave"
            @click="router.push(`/product/${product.id}`)"
          >
            <div class="card-shine" />
            <div class="product-img-wrap"><img :src="product.image" :alt="product.name" class="product-img" /></div>
            <div class="product-body">
              <span class="product-tag">{{ product.category }}</span>
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-footer">
                <span class="product-price">RM {{ Number(product.price).toFixed(2) }}</span>
                <button class="product-btn" @click.stop="router.push(`/product/${product.id}`)">View</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ FEATURED (fallback) ════════════════════════════════════════════ -->
    <section class="home-section" v-else-if="!loading && featuredProducts.length">
      <div class="section-inner">
        <div class="section-head reveal">
          <span class="kicker">Top Picks</span>
          <h2 class="section-title">Featured Products</h2>
          <button class="section-link" @click="router.push('/products')">View all <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
        </div>
        <div class="products-grid">
          <div
            v-for="(product, i) in featuredProducts" :key="product.id"
            class="product-card tilt-card reveal" :class="`stagger-${(i % 3) + 1}`"
            @mousemove="tilt.onMove" @mouseleave="tilt.onLeave"
            @click="router.push(`/product/${product.id}`)"
          >
            <div class="card-shine" />
            <div class="product-img-wrap"><img :src="product.image" :alt="product.name" class="product-img" /></div>
            <div class="product-body">
              <span class="product-tag">{{ product.category }}</span>
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-footer">
                <span class="product-price">RM {{ Number(product.price).toFixed(2) }}</span>
                <button class="product-btn" @click.stop="router.push(`/product/${product.id}`)">View</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ BUILDER CTA ════════════════════════════════════════════════════ -->
    <section class="builder-cta reveal">
      <div class="section-inner">
        <div class="builder-cta-inner">
          <div class="builder-cta-orb" />
          <div class="builder-cta-text reveal-left">
            <span class="kicker">Custom PC Builder</span>
            <h2 class="section-title" style="margin-top:12px">Build Your Perfect Rig</h2>
            <p class="builder-cta-sub">Our smart compatibility engine picks the best matching components for your platform. Start with a motherboard — we handle the rest.</p>
            <button class="cta-primary" style="margin-top:28px" @click="router.push('/pc-builder')">
              Start Building
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
          <div class="builder-cta-visual reveal-right">
            <div class="visual-box">
              <div class="visual-line" v-for="n in 8" :key="n" :style="{ width: `${55 + n * 5}%`, opacity: 0.05 + n * 0.04 }" />
              <div class="visual-card" v-for="(cat, i) in ['CPU', 'GPU', 'RAM', 'SSD', 'PSU']" :key="cat" :style="{ top: `${i * 46}px` }">
                <span class="visual-dot" /><span>{{ cat }}</span><span class="visual-check">✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ LATEST PRODUCTS ════════════════════════════════════════════════ -->
    <section class="home-section" v-if="latestProducts.length">
      <div class="section-inner">
        <div class="section-head reveal">
          <span class="kicker">Just Arrived</span>
          <h2 class="section-title">Latest Products</h2>
          <button class="section-link" @click="router.push('/products')">View all <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
        </div>
        <div class="products-grid">
          <div
            v-for="(product, i) in latestProducts.slice(0, 6)" :key="product.id || i"
            class="product-card tilt-card reveal" :class="`stagger-${(i % 3) + 1}`"
            @mousemove="tilt.onMove" @mouseleave="tilt.onLeave"
            @click="router.push(`/product/${product.id}`)"
          >
            <div class="card-shine" />
            <div class="product-img-wrap"><img :src="product.image" :alt="product.name" class="product-img" /></div>
            <div class="product-body">
              <span class="product-tag">{{ product.category }}</span>
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-footer">
                <span class="product-price">RM {{ Number(product.price).toFixed(2) }}</span>
                <button class="product-btn" @click.stop="router.push(`/product/${product.id}`)">View</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <Footer />
  </div>
</template>

<style scoped>
.home { background: #030712; color: #f1f5f9; min-height: 100vh; }

/* ── HERO ─────────────────────────────────────────────────────────────── */
.hero {
  position: relative; min-height: 100vh;
  display: flex; align-items: center; overflow: hidden;
}
.hero-bg {
  position: absolute; inset: -10%; z-index: 0; will-change: transform;
}
.hero-bg-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.22; filter: saturate(1.3); }
.hero-bg-gradient {
  position: absolute; inset: 0;
  background:
    linear-gradient(to right, #030712 35%, transparent 72%),
    linear-gradient(to top, #030712 12%, transparent 55%);
}
.hero-grid {
  position: absolute; inset: 0; z-index: 1;
  background-image:
    linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 80%);
}
.orb { position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 1; }
.orb-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%);
  top: -120px; left: -80px;
  animation: drift 10s ease-in-out infinite alternate;
}
.orb-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(139,92,246,0.13), transparent 70%);
  bottom: -60px; right: 8%;
  animation: drift 14s ease-in-out infinite alternate-reverse;
}
.orb-3 {
  width: 280px; height: 280px;
  background: radial-gradient(circle, rgba(52,211,153,0.09), transparent 70%);
  top: 38%; left: 48%;
  animation: drift 9s ease-in-out infinite alternate;
}
@keyframes drift {
  from { transform: translate(0,0) scale(1); }
  to   { transform: translate(40px,-28px) scale(1.1); }
}

.hero-content {
  position: relative; z-index: 10;
  padding-top: 100px; padding-bottom: 100px;
  max-width: 780px;
}
.hero-title {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(40px, 7vw, 88px);
  font-weight: 900; line-height: 1.06;
  margin: 22px 0 26px; letter-spacing: -0.02em; color: #f1f5f9;
}
.hero-sub { font-size: 18px; color: #64748b; line-height: 1.75; max-width: 540px; }
.hero-ctas { display: flex; gap: 14px; margin-top: 36px; flex-wrap: wrap; }

.cta-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 16px 32px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white; font-family: 'Orbitron', sans-serif;
  font-size: 13px; font-weight: 700; letter-spacing: 0.06em;
  cursor: pointer; transition: all 0.3s;
  box-shadow: 0 12px 32px rgba(59,130,246,0.35);
}
.cta-primary:hover { transform: translateY(-3px); box-shadow: 0 20px 44px rgba(59,130,246,0.5); }

.cta-secondary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 16px 32px; border-radius: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.12);
  color: #cbd5e1; font-family: 'Orbitron', sans-serif;
  font-size: 13px; font-weight: 700; letter-spacing: 0.06em;
  cursor: pointer; transition: all 0.3s; backdrop-filter: blur(12px);
}
.cta-secondary:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.22); color: white; transform: translateY(-3px); }

.banner-dots { display: flex; gap: 8px; margin-top: 44px; }
.dot {
  width: 8px; height: 8px; border-radius: 4px;
  background: rgba(255,255,255,0.18); border: none; cursor: pointer;
  transition: all 0.35s; padding: 0;
}
.dot.active { background: #3b82f6; width: 28px; }

.hero-arrow {
  position: absolute; top: 50%; z-index: 10; transform: translateY(-50%);
  width: 48px; height: 48px; border-radius: 50%;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: white; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; backdrop-filter: blur(8px);
}
.hero-arrow:hover { background: rgba(59,130,246,0.18); border-color: rgba(59,130,246,0.38); }
.hero-arrow--left  { left: 28px; }
.hero-arrow--right { right: 28px; }

.scroll-cue {
  position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  color: #334155; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
  animation: bob 2.2s ease-in-out infinite;
}
.scroll-cue-line { width: 1px; height: 38px; background: linear-gradient(to bottom, transparent, #3b82f6 60%, transparent); }
@keyframes bob { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(8px); } }

/* ── STATS ────────────────────────────────────────────────────────────── */
.stats-strip {
  padding: 44px 0;
  border-top: 1px solid rgba(255,255,255,0.04);
  border-bottom: 1px solid rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.012);
}
.stats-grid { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; }
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0 52px; }
.stat-num { font-family: 'Orbitron', sans-serif; font-size: 38px; font-weight: 900; line-height: 1; }
.stat-label { font-size: 12px; color: #475569; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.stat-divider { width: 1px; height: 52px; background: rgba(255,255,255,0.06); }

/* ── SECTIONS ─────────────────────────────────────────────────────────── */
.home-section { padding: 96px 0; }
.section-head { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 52px; }
.section-title {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(24px, 4vw, 38px);
  font-weight: 800; color: #f1f5f9; margin: 0;
}
.section-link {
  margin-left: auto; display: flex; align-items: center; gap: 6px;
  padding: 8px 18px; border-radius: 10px; border: none;
  background: rgba(59,130,246,0.09); color: #60a5fa;
  font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.section-link:hover { background: rgba(59,130,246,0.16); color: #93c5fd; }

/* ── CATEGORIES ───────────────────────────────────────────────────────── */
.categories-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.cat-card {
  position: relative; overflow: hidden; padding: 30px 26px;
  border-radius: 20px; text-align: left; cursor: pointer;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.07);
  transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
}
.cat-card:hover {
  background: rgba(255,255,255,0.048);
  border-color: rgba(255,255,255,0.13);
  box-shadow: 0 28px 60px rgba(0,0,0,0.45);
}
.cat-icon {
  font-size: 28px; margin-bottom: 16px;
  width: 52px; height: 52px; border-radius: 14px;
  background: rgba(255,255,255,0.04);
  display: flex; align-items: center; justify-content: center;
}
.cat-label { font-family: 'Orbitron', sans-serif; font-size: 15px; font-weight: 800; color: #e2e8f0; margin: 0 0 6px; }
.cat-desc  { font-size: 12px; color: #475569; margin: 0; line-height: 1.55; }
.cat-arrow { position: absolute; bottom: 22px; right: 22px; color: #334155; transition: all 0.3s; }
.cat-card:hover .cat-arrow { color: #60a5fa; transform: translateX(4px); }
.cat-glow  { position: absolute; inset: 0; pointer-events: none; }

/* ── PRODUCTS GRID ────────────────────────────────────────────────────── */
.products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
.product-card {
  border-radius: 20px; overflow: hidden; cursor: pointer;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.07);
  transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
}
.product-card:hover {
  border-color: rgba(59,130,246,0.24);
  box-shadow: 0 28px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.08);
}
.product-img-wrap {
  background: radial-gradient(circle at 50% 60%, rgba(59,130,246,0.07), #080d1a 70%);
  padding: 28px; display: flex; align-items: center; justify-content: center; height: 200px;
}
.product-img { max-height: 155px; object-fit: contain; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); }
.product-card:hover .product-img { transform: scale(1.07) translateY(-5px); }
.product-body { padding: 18px 22px 22px; }
.product-tag {
  display: inline-block; padding: 3px 10px; border-radius: 6px;
  background: rgba(59,130,246,0.12); color: #60a5fa;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; margin-bottom: 10px;
}
.product-name {
  font-size: 14px; font-weight: 700; color: #e2e8f0;
  line-height: 1.45; margin: 0 0 16px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.product-footer { display: flex; align-items: center; justify-content: space-between; }
.product-price { font-family: 'Orbitron', sans-serif; font-size: 17px; font-weight: 800; color: #60a5fa; }
.product-btn {
  padding: 7px 16px; border-radius: 9px; border: none;
  background: rgba(59,130,246,0.12); color: #60a5fa;
  font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.product-btn:hover { background: #3b82f6; color: white; }

/* ── BUILDER CTA ──────────────────────────────────────────────────────── */
.builder-cta {
  padding: 96px 0; position: relative; overflow: hidden;
}
.builder-cta::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(37,99,235,0.07), rgba(139,92,246,0.05));
  border-top: 1px solid rgba(59,130,246,0.1);
  border-bottom: 1px solid rgba(59,130,246,0.1);
}
.builder-cta-orb {
  position: absolute; width: 520px; height: 520px;
  background: radial-gradient(circle, rgba(59,130,246,0.13), transparent 70%);
  filter: blur(80px); top: -120px; right: -80px; pointer-events: none;
}
.builder-cta-inner {
  position: relative; z-index: 2;
  display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
}
.builder-cta-sub { font-size: 16px; color: #475569; line-height: 1.75; margin-top: 14px; }

.builder-cta-visual { display: flex; justify-content: flex-end; }
.visual-box {
  position: relative; width: 320px; height: 260px;
  border-radius: 20px; overflow: hidden;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06); padding: 28px;
}
.visual-line { height: 1px; background: rgba(59,130,246,0.25); margin-bottom: 10px; border-radius: 2px; }
.visual-card {
  position: absolute; left: 20px; right: 20px;
  display: flex; align-items: center; gap: 10px;
  padding: 9px 14px; border-radius: 10px;
  background: rgba(8,13,26,0.9);
  border: 1px solid rgba(59,130,246,0.14);
  font-size: 12px; font-weight: 700; color: #94a3b8;
}
.visual-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; }
.visual-check { margin-left: auto; color: #22c55e; }

/* ── RESPONSIVE ───────────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .categories-grid   { grid-template-columns: repeat(2, 1fr); }
  .products-grid     { grid-template-columns: repeat(2, 1fr); }
  .builder-cta-inner { grid-template-columns: 1fr; gap: 40px; }
  .builder-cta-visual { display: none; }
}
@media (max-width: 640px) {
  .categories-grid { grid-template-columns: 1fr; }
  .products-grid   { grid-template-columns: 1fr; }
  .stat-item       { padding: 16px 24px; }
  .stat-divider    { display: none; }
  .hero-title      { font-size: 36px; }
  .home-section    { padding: 60px 0; }
}
</style>
