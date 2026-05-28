<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

import {
  ref,
  onMounted,
  onUnmounted
} from 'vue'

import {
  useRouter
} from 'vue-router'

const router = useRouter()

const homepage = ref({

  bannerImages: [],

  hotSelling: [],

  latestProducts: []
})

const currentSlide = ref(0)

const loading = ref(true)

const errorMessage = ref('')

const products = ref([])

let slideshowInterval = null

let startX = 0

let endX = 0

// LOAD HOMEPAGE DATA
async function loadHomepage() {

  try {

    loading.value = true

    const { getAll } = await import('../lib/api.js')

    const rows = await getAll('homepage')

    const data = rows[0] || {}

    homepage.value = {
      bannerImages:  data.banners        || [],
      hotSelling:    data.hotSelling     || [],
      latestProducts: data.latestProducts || []
    }

  } catch (error) {

    console.log(error)

    errorMessage.value =
      'Failed to load homepage.'

  } finally {

    loading.value = false
  }
}

async function loadProducts() {

  const { getAll } = await import('../lib/api.js')

  products.value = await getAll('products')
}

function normalizeName(value) {

  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function findProduct(item) {

  const itemName =
    normalizeName(item.name)

  return products.value.find(product => {

    const productName =
      normalizeName(product.name)

    return productName === itemName ||
      productName.includes(itemName) ||
      itemName.includes(productName)
  })
}

function openProduct(item) {

  const product = findProduct(item)

  if (product) {

    router.push(
      `/product/${product.id}`
    )

    return
  }

  router.push({
    path: '/products',
    query: {
      search: item.name
    }
  })
}

// START SLIDESHOW
function startSlideshow() {

  slideshowInterval =
    setInterval(() => {

      nextSlide()

    }, 3000)
}

// NEXT SLIDE
function nextSlide() {

  if (
    homepage.value.bannerImages
      ?.length > 0
  ) {

    currentSlide.value =

      (
        currentSlide.value + 1
      )

      %

      homepage.value
        .bannerImages.length
  }
}

// PREVIOUS SLIDE
function prevSlide() {

  if (
    homepage.value.bannerImages
      ?.length > 0
  ) {

    currentSlide.value =

      (
        currentSlide.value - 1 +
        homepage.value
          .bannerImages.length
      )

      %

      homepage.value
        .bannerImages.length
  }
}

// TOUCH START
function touchStart(event) {

  startX =
    event.touches[0].clientX
}

// TOUCH END
function touchEnd(event) {

  endX =
    event.changedTouches[0]
      .clientX

  handleSwipe()
}

// HANDLE SWIPE
function handleSwipe() {

  const diff =
    startX - endX

  const minSwipe = 50

  // SWIPE LEFT
  if (diff > minSwipe) {

    nextSlide()
  }

  // SWIPE RIGHT
  else if (
    diff < -minSwipe
  ) {

    prevSlide()
  }
}

onMounted(async () => {

  try {

    loading.value = true

    await Promise.all([
      loadHomepage(),
      loadProducts()
    ])

  } catch (error) {

    console.log(error)

    errorMessage.value =
      'Failed to load homepage.'

  } finally {

    loading.value = false
  }

  startSlideshow()
})

// CLEAR INTERVAL
onUnmounted(() => {

  clearInterval(
    slideshowInterval
  )
})
</script>

<template>
  <div>

    <Navbar />

    <!-- LOADING -->
    <div
      v-if="loading"
      class="status-box"
    >
      Loading homepage...
    </div>

    <!-- ERROR -->
    <div
      v-else-if="errorMessage"
      class="error-box"
    >
      {{ errorMessage }}
    </div>

    <!-- MAIN -->
    <div v-else>

      <!-- HERO -->
      <div
        class="home-hero"

        @touchstart.passive="
          touchStart
        "

        @touchend.passive="
          touchEnd
        "

        :style="{

          backgroundImage:

            homepage.bannerImages
              .length > 0

              ? `url(${
                  homepage
                    .bannerImages[
                      currentSlide
                    ]
                })`

              : 'none'
        }"
      >

        <!-- LEFT BUTTON -->
        <button
          class="
            slide-btn
            left-btn
          "
          @click="prevSlide"
        >
          ❮
        </button>

        <!-- RIGHT BUTTON -->
        <button
          class="
            slide-btn
            right-btn
          "
          @click="nextSlide"
        >
          ❯
        </button>

        <div class="home-hero-content">
          <p>
            Premium PC Components
          </p>

          <h1>
            Build faster, cleaner, smarter.
          </h1>

          <div class="home-hero-actions">
            <router-link to="/pc-builder">
              Start PC Builder
            </router-link>

            <router-link to="/products">
              Shop Components
            </router-link>
          </div>
        </div>

        <!-- SLIDER DOTS -->
        <div class="home-slider-dots">

          <span
            v-for="
              (banner, index)
              in homepage.bannerImages
            "
            :key="index"
            class="home-dot"
            :class="{
              active:
                currentSlide === index
            }"
            @click="
              currentSlide = index
            "
          ></span>

        </div>

      </div>

      <!-- CONTAINER -->
      <div
        class="
          home-container
        "
      >

        <!-- QUICK ACTIONS -->
        <div class="home-action-grid">
          <router-link
            to="/pc-builder"
            class="home-action-card"
          >
            <span>
              Build
            </span>

            <strong>
              Compatible PC Builder
            </strong>
          </router-link>

          <router-link
            to="/products/gpu"
            class="home-action-card"
          >
            <span>
              Upgrade
            </span>

            <strong>
              Graphics Cards
            </strong>
          </router-link>

          <router-link
            to="/products/processor"
            class="home-action-card"
          >
            <span>
              Core
            </span>

            <strong>
              Processors
            </strong>
          </router-link>

          <router-link
            to="/products/motherboard"
            class="home-action-card"
          >
            <span>
              Platform
            </span>

            <strong>
              Motherboards
            </strong>
          </router-link>
        </div>

        <!-- HOT SELLING -->
        <div
          class="
            home-section
          "
        >

          <h2
            class="
              home-section-title
            "
          >
            🔥 Hot Selling
          </h2>

          <div
            class="
              home-horizontal
            "
          >

            <div
              class="
                home-card
                home-hot-card
              "
              v-for="
                item in
                homepage.hotSelling
              "
              :key="item.name"
              role="button"
              tabindex="0"
              @click="openProduct(item)"
              @keydown.enter="openProduct(item)"
            >

              <img
                :src="
                  item.image
                "
                alt="
                  Product Image
                "
              />

              <div
                class="
                  home-product-info
                "
              >

                <div
                  class="
                    home-product-name
                  "
                >

                  {{
                    item.name
                  }}

                </div>

                <div
                  class="
                    home-product-tag
                  "
                >
                  Best Seller
                </div>

              </div>

            </div>

          </div>

        </div>

        <!-- LATEST -->
        <div
          class="
            home-section
          "
        >

          <h2
            class="
              home-section-title
            "
          >
            🆕 Latest Products
          </h2>

          <div
            class="
              home-grid
            "
          >

            <div
              class="
                home-card
              "
              v-for="
                item in
                homepage
                  .latestProducts
              "
              :key="item.name"
              role="button"
              tabindex="0"
              @click="openProduct(item)"
              @keydown.enter="openProduct(item)"
            >

              <img
                :src="
                  item.image
                "
                alt="
                  Product Image
                "
              />

              <div
                class="
                  home-product-info
                "
              >

                <div
                  class="
                    home-product-name
                  "
                >

                  {{
                    item.name
                  }}

                </div>

                <div
                  class="
                    home-product-tag
                  "
                >
                  New Arrival
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

    <Footer />

  </div>
</template>

<style scoped>

body {

  margin: 0;

  font-family: Arial, sans-serif;

  background: #0f172a;

  overflow-x: hidden;
}

/* STATUS */
.status-box,
.error-box {

  margin: 40px;

  background:
    linear-gradient(
      145deg,
      #1e293b,
      #172033
    );

  padding: 30px;

  border-radius: 18px;

  border:
    1px solid rgba(255,255,255,0.06);

  box-shadow:
    0 10px 28px
    rgba(0,0,0,0.18);

  font-size: 18px;
}

.error-box {

  color: #f87171;
}

/* HOME CONTAINER */
.home-container {

  width: 100%;

  max-width: 1500px;

  margin: 0 auto;

  padding: 40px;

  box-sizing: border-box;
}

/* HERO */
.home-hero {

  width: calc(100% - 80px);

  height: 560px;

  margin: 40px auto;

  border-radius: 20px;

  background-size: cover;

  background-position: center;

  background-repeat: no-repeat;

  position: relative;

  overflow: hidden;

  border:
    1px solid rgba(255,255,255,0.06);

  box-shadow:
    0 16px 40px
    rgba(0,0,0,0.22);

  transition: 0.5s;

  touch-action: pan-y;

  user-select: none;
}

/* OVERLAY */
.home-hero::before {

  content: '';

  position: absolute;

  inset: 0;

  background:
    linear-gradient(
      to right,
      rgba(15,23,42,0.84),
      rgba(15,23,42,0.42),
      rgba(15,23,42,0.18)
    );
}

.home-hero-content {

  position: absolute;

  left: clamp(32px, 7vw, 110px);

  bottom: clamp(72px, 10vw, 130px);

  z-index: 6;

  max-width: 620px;

  color: white;
}

.home-hero-content p {

  margin-bottom: 12px;

  color: #93c5fd;

  font-size: 14px;

  font-weight: 800;

  text-transform: uppercase;
}

.home-hero-content h1 {

  margin: 0;

  font-size: clamp(38px, 5vw, 72px);

  line-height: 1.02;
}

.home-hero-actions {

  display: flex;

  flex-wrap: wrap;

  gap: 14px;

  margin-top: 26px;
}

.home-hero-actions a {

  padding: 14px 20px;

  border-radius: 10px;

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );

  color: white;

  font-weight: 700;

  box-shadow:
    0 8px 18px rgba(37,99,235,0.18);
}

.home-hero-actions a + a {

  background:
    rgba(255,255,255,0.08);

  color: white;

  border:
    1px solid rgba(255,255,255,0.10);

  box-shadow: none;
}

/* SLIDE BUTTON */
.slide-btn {

  position: absolute;

  top: 50%;

  transform: translateY(-50%);

  width: 56px;

  height: 56px;

  border: none;

  border-radius: 50%;

  background:
    rgba(255,255,255,0.10);

  backdrop-filter: blur(6px);

  color: white;

  font-size: 28px;

  font-weight: bold;

  cursor: pointer;

  z-index: 10;

  transition: 0.3s;

  display: flex;

  align-items: center;

  justify-content: center;
}

.slide-btn:hover {

  background:
    rgba(59,130,246,0.18);

  transform:
    translateY(-50%)
    scale(1.05);
}

/* LEFT */
.left-btn {

  left: 24px;
}

/* RIGHT */
.right-btn {

  right: 24px;
}

/* SLIDER DOTS */
.home-slider-dots {

  position: absolute;

  bottom: 25px;

  left: 50%;

  transform: translateX(-50%);

  display: flex;

  gap: 12px;

  z-index: 5;
}

/* DOT */
.home-dot {

  width: 12px;

  height: 12px;

  border-radius: 50%;

  background:
    rgba(255,255,255,0.45);

  cursor: pointer;

  transition: 0.3s;
}

/* ACTIVE */
.home-dot.active {

  background: #60a5fa;

  transform: scale(1.15);
}

/* SECTION */
.home-section {

  margin-bottom: 70px;
}

/* ACTION GRID */
.home-action-grid {

  display: grid;

  grid-template-columns:
    repeat(4,minmax(0,1fr));

  gap: 18px;

  margin-bottom: 58px;
}

/* ACTION CARD — base */
.home-action-card {

  padding: 24px;

  min-height: 120px;

  border-radius: 18px;

  display: flex;

  flex-direction: column;

  justify-content: space-between;

  transition: 0.30s cubic-bezier(0.4,0,0.2,1);

  position: relative;

  overflow: hidden;
}

.home-action-card::after {

  content: '';

  position: absolute;

  inset: 0;

  opacity: 0;

  transition: opacity 0.3s;
}

.home-action-card:hover {

  transform: translateY(-5px);
}

.home-action-card:hover::after {

  opacity: 1;
}

/* BUILD — blue */
.home-action-grid a:nth-child(1) {

  background:
    linear-gradient(
      145deg,
      rgba(37,99,235,0.28),
      rgba(29,78,216,0.18)
    );

  border:
    1px solid rgba(59,130,246,0.35);

  box-shadow:
    0 8px 24px rgba(37,99,235,0.18),
    0 0 0 1px rgba(59,130,246,0.08) inset;
}

.home-action-grid a:nth-child(1):hover {

  border-color: rgba(59,130,246,0.60);

  box-shadow:
    0 14px 34px rgba(37,99,235,0.30);
}

.home-action-grid a:nth-child(1) span {

  color: #93c5fd;
}

.home-action-grid a:nth-child(1) strong {

  color: #dbeafe;
}

/* UPGRADE — purple */
.home-action-grid a:nth-child(2) {

  background:
    linear-gradient(
      145deg,
      rgba(109,40,217,0.28),
      rgba(91,33,182,0.18)
    );

  border:
    1px solid rgba(139,92,246,0.35);

  box-shadow:
    0 8px 24px rgba(109,40,217,0.18),
    0 0 0 1px rgba(139,92,246,0.08) inset;
}

.home-action-grid a:nth-child(2):hover {

  border-color: rgba(139,92,246,0.60);

  box-shadow:
    0 14px 34px rgba(109,40,217,0.30);
}

.home-action-grid a:nth-child(2) span {

  color: #c4b5fd;
}

.home-action-grid a:nth-child(2) strong {

  color: #ede9fe;
}

/* CORE — orange */
.home-action-grid a:nth-child(3) {

  background:
    linear-gradient(
      145deg,
      rgba(217,119,6,0.28),
      rgba(180,83,9,0.18)
    );

  border:
    1px solid rgba(245,158,11,0.35);

  box-shadow:
    0 8px 24px rgba(217,119,6,0.18),
    0 0 0 1px rgba(245,158,11,0.08) inset;
}

.home-action-grid a:nth-child(3):hover {

  border-color: rgba(245,158,11,0.60);

  box-shadow:
    0 14px 34px rgba(217,119,6,0.30);
}

.home-action-grid a:nth-child(3) span {

  color: #fcd34d;
}

.home-action-grid a:nth-child(3) strong {

  color: #fef3c7;
}

/* PLATFORM — green */
.home-action-grid a:nth-child(4) {

  background:
    linear-gradient(
      145deg,
      rgba(5,150,105,0.28),
      rgba(4,120,87,0.18)
    );

  border:
    1px solid rgba(16,185,129,0.35);

  box-shadow:
    0 8px 24px rgba(5,150,105,0.18),
    0 0 0 1px rgba(16,185,129,0.08) inset;
}

.home-action-grid a:nth-child(4):hover {

  border-color: rgba(16,185,129,0.60);

  box-shadow:
    0 14px 34px rgba(5,150,105,0.30);
}

.home-action-grid a:nth-child(4) span {

  color: #6ee7b7;
}

.home-action-grid a:nth-child(4) strong {

  color: #d1fae5;
}

/* TITLE */
.home-section-title {

  font-size: 40px;

  margin-bottom: 28px;

  color: #f8fafc;

  font-weight: 800;
}

/* HOT */
.home-horizontal {

  display: flex;

  gap: 28px;

  overflow-x: auto;

  padding-bottom: 18px;

  scroll-behavior: smooth;
}

/* GRID */
.home-grid {

  display: grid;

  grid-template-columns:
    repeat(auto-fit,minmax(300px,1fr));

  gap: 30px;
}

/* CARD */
.home-card {

  background:
    linear-gradient(
      160deg,
      #1e293b,
      #162032
    );

  border-radius: 18px;

  overflow: hidden;

  border:
    1px solid rgba(148,163,184,0.16);

  box-shadow:
    0 8px 24px rgba(0,0,0,0.28),
    0 0 0 1px rgba(59,130,246,0.04) inset;

  transition: 0.30s cubic-bezier(0.4,0,0.2,1);

  cursor: pointer;

  position: relative;
}

.home-card:hover {

  transform: translateY(-6px);

  border-color: rgba(59,130,246,0.40);

  box-shadow:
    0 20px 40px rgba(0,0,0,0.34),
    0 0 0 1px rgba(59,130,246,0.10) inset;
}

/* HOT CARD */
.home-hot-card {

  min-width: 320px;
}

/* IMAGE */
.home-card img {

  width: 100%;

  height: 280px;

  object-fit: cover;

  display: block;

  transition: 0.35s;
}

.home-card:hover img {

  transform: scale(1.03);
}

/* INFO */
.home-product-info {

  padding: 20px 22px 22px;

  background:
    linear-gradient(
      to bottom,
      transparent,
      rgba(15,23,42,0.30)
    );
}

/* NAME */
.home-product-name {

  font-size: 22px;

  font-weight: 700;

  color: #f1f5f9;

  margin-bottom: 12px;

  line-height: 1.3;
}

/* TAG */
.home-product-tag {

  display: inline-block;

  padding: 7px 16px;

  border-radius: 999px;

  background:
    rgba(59,130,246,0.18);

  color: #93c5fd;

  font-size: 12px;

  font-weight: 700;

  letter-spacing: 0.05em;

  text-transform: uppercase;

  border:
    1px solid rgba(59,130,246,0.28);
}

/* MOBILE */
@media (max-width: 992px) {

  .home-hero {

    height: 420px;

    width: calc(100% - 40px);
  }
}

@media (max-width: 768px) {

  .home-container {

    padding: 20px;
  }

  .home-hero {

    height: 300px;

    border-radius: 20px;

    margin: 20px auto;
  }

  .slide-btn {

    width: 42px;

    height: 42px;

    font-size: 22px;
  }

  .home-section-title {

    font-size: 30px;
  }

  .home-grid {

    grid-template-columns: 1fr;
  }

  .home-action-grid {

    grid-template-columns: 1fr;
  }

  .home-hot-card {

    min-width: 240px;
  }

  .home-card img {

    height: 220px;
  }

  .home-product-name {

    font-size: 20px;
  }
}

</style>