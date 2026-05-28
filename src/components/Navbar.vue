<script setup>
import {
  ref,
  computed,
  onMounted
} from 'vue'

import {
  useRouter
} from 'vue-router'

const router = useRouter()

const showMenu = ref(false)

const searchQuery = ref('')

const products = ref([])

const showDropdown = ref(false)

const selectedIndex = ref(-1)

/* USER */
const user = ref(
  JSON.parse(
    localStorage.getItem('user')
  )
)

/* PROFILE PATH */
const profilePath = computed(() => {

  if (!user.value) {

    return '/login'
  }

  return '/profile'
})

/* FILTERED RESULTS */
const filteredResults =
  computed(() => {

    if (
      !searchQuery.value.trim()
    ) {

      return []
    }

    return products.value
      .filter(product =>

        product.name
          .toLowerCase()
          .includes(
            searchQuery.value
              .toLowerCase()
          )
      )
      .slice(0, 5)
})

/* TOGGLE MENU */
function toggleMenu() {

  showMenu.value =
    !showMenu.value
}

/* CLOSE MENU */
function closeMenu() {

  showMenu.value = false
}

/* SEARCH */
function searchProduct() {

  if (
    !searchQuery.value.trim()
  ) {

    return
  }

  showDropdown.value = false

  selectedIndex.value = -1

  router.push({

    path: '/products',

    query: {

      search:
        searchQuery.value
    }
  })
}

/* SELECT PRODUCT */
function selectProduct(name) {

  searchQuery.value = name

  showDropdown.value = false

  selectedIndex.value = -1

  searchProduct()
}

/* KEYBOARD NAVIGATION */
function handleKeydown(event) {

  if (
    event.key === 'ArrowDown'
  ) {

    event.preventDefault()

    if (
      selectedIndex.value <
      filteredResults.value.length - 1
    ) {

      selectedIndex.value++
    }
  }

  else if (
    event.key === 'ArrowUp'
  ) {

    event.preventDefault()

    if (
      selectedIndex.value > 0
    ) {

      selectedIndex.value--
    }
  }

  else if (
    event.key === 'Enter'
  ) {

    event.preventDefault()

    if (
      selectedIndex.value >= 0
    ) {

      selectProduct(

        filteredResults.value[
          selectedIndex.value
        ].name
      )
    }

    else {

      searchProduct()
    }
  }
}

/* LOAD PRODUCTS */
onMounted(async () => {

  try {

    const { getAll } = await import('../lib/api.js')

    products.value = await getAll('products')

  } catch (error) {

    console.log(error)
  }
})
</script>

<template>
  <div>

    <!-- NAVBAR -->
    <nav class="navbar">

      <!-- LEFT -->
      <div class="navbar-left">

        <!-- MENU -->
        <button
          class="menu-btn"
          @click="toggleMenu"
        >
          ☰
        </button>

        <!-- LOGO -->
        <router-link
          to="/"
          class="logo"
        >

          💻 PC Hardware

        </router-link>

      </div>

      <!-- SEARCH -->
      <div class="search-wrapper">

        <div class="search-box">

          <input
            v-model="searchQuery"
            class="search"
            placeholder="
              Search components...
            "
            @keydown="
              handleKeydown
            "
            @focus="
              showDropdown = true
            "
          />

          <button
            class="search-btn"
            @click="
              searchProduct
            "
          >
            🔍
          </button>

        </div>

        <!-- SEARCH DROPDOWN -->
        <div
          v-if="
            showDropdown &&
            filteredResults.length > 0
          "
          class="search-dropdown"
        >

          <div
            class="search-item"
            :class="{
              active:
                selectedIndex === index
            }"
            v-for="
              (
                product,
                index
              ) in filteredResults
            "
            :key="product.id"
            @click="
              selectProduct(
                product.name
              )
            "
          >

            {{ product.name }}

          </div>

        </div>

      </div>

      <!-- ICONS -->
      <div class="icons">

        <router-link to="/cart">
          🛒
        </router-link>

        <router-link
          :to="profilePath"
        >
          👤
        </router-link>

      </div>

    </nav>

    <!-- OVERLAY -->
    <div
      v-if="showMenu"
      class="overlay"
      @click="closeMenu"
    ></div>

    <!-- SIDEBAR -->
    <div
      class="sidebar"
      :class="{ open: showMenu }"
    >

      <!-- TITLE -->
      <h2 class="sidebar-title">

        🖥 Categories

      </h2>

      <!-- LINKS -->
      <div class="sidebar-menu">

        <router-link
          to="/products"
          @click="closeMenu"
          class="sidebar-item"
        >
          🛍️ All Products
        </router-link>

        <router-link
          to="/pc-builder"
          @click="closeMenu"
          class="sidebar-item"
        >
          🔧 Build PC
        </router-link>

        <router-link
          to="/products/processor"
          @click="closeMenu"
          class="sidebar-item"
        >
          🧠 Processor
        </router-link>

        <router-link
          to="/products/motherboard"
          @click="closeMenu"
          class="sidebar-item"
        >
          🧩 Motherboard
        </router-link>

        <router-link
          to="/products/gpu"
          @click="closeMenu"
          class="sidebar-item"
        >
          🎮 Graphics Card
        </router-link>

        <router-link
          to="/products/ram"
          @click="closeMenu"
          class="sidebar-item"
        >
          💾 RAM
        </router-link>

        <router-link
          to="/products/storage"
          @click="closeMenu"
          class="sidebar-item"
        >
          🗄️ Storage
        </router-link>

        <router-link
          to="/products/psu"
          @click="closeMenu"
          class="sidebar-item"
        >
          🔌 PSU
        </router-link>

        <router-link
          to="/products/cooler"
          @click="closeMenu"
          class="sidebar-item"
        >
          ❄️ Cooler
        </router-link>

        <router-link
          to="/products/casing"
          @click="closeMenu"
          class="sidebar-item"
        >
          🖥️ PC Casing
        </router-link>

        <router-link
          to="/products/rgb"
          @click="closeMenu"
          class="sidebar-item"
        >
          🌈 RGB Lighting
        </router-link>

      </div>

    </div>

  </div>
</template>

<style scoped>

/* NAVBAR */
.navbar {

  display: flex;

  align-items: center;

  justify-content: space-between;

  background:
    linear-gradient(
      180deg,
      #111827,
      #0f172a
    );

  padding: 14px 24px;

  position: sticky;

  top: 0;

  z-index: 3000;

  border-bottom:
    1px solid rgba(255,255,255,0.06);

  box-shadow:
    0 8px 24px rgba(0,0,0,0.18);
}

/* LEFT */
.navbar-left {

  display: flex;

  align-items: center;

  gap: 16px;
}

/* MENU BUTTON */
.menu-btn {

  width: 42px;

  height: 42px;

  border: none;

  border-radius: 12px;

  background:
    rgba(255,255,255,0.08);

  color: white;

  font-size: 20px;

  cursor: pointer;

  transition: 0.3s;
}

.menu-btn:hover {

  background:
    rgba(59,130,246,0.16);

  transform: scale(1.04);
}

/* LOGO */
.logo {

  color: white;

  text-decoration: none;

  font-size: 24px;

  font-weight: 800;
}

/* SEARCH WRAPPER */
.search-wrapper {

  flex: 1;

  max-width: 650px;

  margin: 0 30px;

  position: relative;
}

/* SEARCH BOX */
.search-box {

  display: flex;

  align-items: center;

  background:
    rgba(255,255,255,0.06);

  border-radius: 14px;

  border:
    1px solid rgba(148,163,184,0.16);

  overflow: hidden;
}

/* SEARCH INPUT */
.search {

  flex: 1;

  padding: 13px 18px;

  border: none;

  background: transparent;

  color: white;

  font-size: 15px;

  outline: none;
}

.search::placeholder {

  color:
    rgba(203,213,225,0.70);
}

/* SEARCH BUTTON */
.search-btn {

  border: none;

  background: transparent;

  color: white;

  padding: 0 18px;

  cursor: pointer;

  font-size: 18px;

  transition: 0.3s;
}

.search-btn:hover {

  color: #60a5fa;

  transform: scale(1.08);
}

/* SEARCH DROPDOWN */
.search-dropdown {

  position: absolute;

  top: 62px;

  left: 0;

  width: 100%;

  background:
    linear-gradient(
      180deg,
      #111827,
      #0f172a
    );

  border:
    1px solid rgba(148,163,184,0.14);

  border-radius: 14px;

  overflow: hidden;

  box-shadow:
    0 12px 24px rgba(0,0,0,0.22);

  z-index: 5000;
}

/* SEARCH ITEM */
.search-item {

  padding: 14px 18px;

  cursor: pointer;

  transition: 0.3s;

  color: #e2e8f0;

  font-weight: 500;
}

/* HOVER */
.search-item:hover {

  background:
    rgba(59,130,246,0.12);

  color: #93c5fd;
}

/* ACTIVE SEARCH ITEM */
.search-item.active {

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );

  color: white;
}

/* ICONS */
.icons {

  display: flex;

  align-items: center;

  gap: 18px;
}

.icons a {

  color: white;

  text-decoration: none;

  font-size: 22px;

  transition: 0.3s;
}

.icons a:hover {

  color: #60a5fa;

  transform: scale(1.08);
}

/* OVERLAY */
.overlay {

  position: fixed;

  inset: 0;

  background:
    rgba(0,0,0,0.45);

  backdrop-filter: blur(2px);

  z-index: 2500;
}

/* SIDEBAR */
.sidebar {

  position: fixed;

  top: 0;

  left: -300px;

  width: 280px;

  height: 100vh;

  background:
    linear-gradient(
      180deg,
      #111827,
      #0f172a
    );

  padding: 28px 22px;

  transition: 0.35s ease;

  z-index: 2800;

  overflow-y: auto;

  border-right:
    1px solid rgba(148,163,184,0.12);

  box-shadow:
    10px 0 30px rgba(0,0,0,0.22);
}

.sidebar.open {

  left: 0;
}

/* TITLE */
.sidebar-title {

  font-size: 28px;

  font-weight: 800;

  margin-bottom: 28px;

  color: white;
}

/* MENU */
.sidebar-menu {

  display: flex;

  flex-direction: column;

  gap: 10px;
}

/* ITEM */
.sidebar-item {

  display: flex;

  align-items: center;

  gap: 14px;

  padding: 14px 18px;

  border-radius: 14px;

  text-decoration: none;

  color: #cbd5e1;

  font-weight: 600;

  transition: 0.3s;
}

/* HOVER */
.sidebar-item:hover {

  background:
    rgba(59,130,246,0.12);

  color: #93c5fd;

  transform: translateX(4px);
}

/* ACTIVE */
.router-link-active.sidebar-item {

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );

  color: white;

  box-shadow:
    0 8px 18px rgba(37,99,235,0.22);
}

/* MOBILE */
@media (max-width: 768px) {

  .navbar {

    padding: 12px 16px;
  }

  .search-wrapper {

    display: none;
  }

  .logo {

    font-size: 20px;
  }

  .sidebar {

    width: 240px;
  }
}

</style>