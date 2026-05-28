<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>

  <!-- SIDEBAR -->
  <div class="sidebar">

    <!-- LOGO -->
    <div class="logo">

      <h2>
        PC Admin
      </h2>

      <p>
        Hardware Dashboard
      </p>

    </div>

    <!-- MENU -->
    <div class="menu">

      <!-- DASHBOARD -->
      <router-link
        to="/admin"
        class="menu-item"
        :class="{ active: route.path === '/admin' }"
      >
        <span>📊</span>
        Dashboard
      </router-link>

      <!-- PRODUCTS -->
      <router-link
        to="/admin/products"
        class="menu-item"
        :class="{ active: route.path.includes('/admin/products') }"
      >
        <span>🖥️</span>
        Products
      </router-link>

      <!-- ORDERS -->
      <router-link
        to="/admin/orders"
        class="menu-item"
        :class="{ active: route.path.includes('/admin/orders') }"
      >
        <span>🛒</span>
        Orders
      </router-link>

      <!-- USERS -->
      <router-link
        to="/admin/users"
        class="menu-item"
        :class="{ active: route.path.includes('/admin/users') }"
      >
        <span>👥</span>
        Users
      </router-link>

      <!-- HOMEPAGE -->
      <router-link
        to="/admin/homepage"
        class="menu-item"
        :class="{ active: route.path.includes('/admin/homepage') }"
      >
        <span>🖼️</span>
        Homepage
      </router-link>

    </div>

    <!-- BOTTOM -->
    <div class="bottom-section">

      <router-link
        to="/admin/profile"
        class="profile-btn"
      >
        👤 Admin Profile
      </router-link>

    </div>

  </div>

</template>

<style scoped>

/* SIDEBAR */
.sidebar {

  width: 260px;

  height: 100vh;

  background:
    linear-gradient(
      180deg,
      #111827,
      #0f172a
    );

  position: fixed;

  left: 0;

  top: 0;

  display: flex;

  flex-direction: column;

  justify-content: space-between;

  padding: 25px 20px;

  box-sizing: border-box;

  border-right:
    1px solid rgba(255,255,255,0.06);

  box-shadow:
    4px 0 18px rgba(0,0,0,0.18);

  z-index: 9999;
}

/* LOGO */
.logo {

  margin-bottom: 40px;
}

.logo h2 {

  color: white;

  font-size: 30px;

  margin: 0 0 8px;
}

.logo p {

  color: #94a3b8;

  margin: 0;

  font-size: 14px;
}

/* MENU */
.menu {

  display: flex;

  flex-direction: column;

  gap: 12px;

  flex: 1;
}

/* MENU ITEM */
.menu-item {

  text-decoration: none;

  color: #cbd5e1;

  padding: 15px 18px;

  border-radius: 14px;

  display: flex;

  align-items: center;

  gap: 14px;

  font-size: 16px;

  font-weight: 600;

  transition: 0.3s;
}

/* ICON */
.menu-item span {

  font-size: 20px;
}

/* HOVER */
.menu-item:hover {

  background:
    rgba(59,130,246,0.10);

  color: #93c5fd;

  transform: translateX(4px);
}

/* ACTIVE */
.active {

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );

  color: white;

  box-shadow:
    0 8px 18px rgba(37,99,235,0.20);
}

/* BOTTOM */
.bottom-section {

  display: flex;

  flex-direction: column;

  gap: 12px;
}

/* PROFILE BUTTON */
.profile-btn {

  text-decoration: none;

  text-align: center;

  padding: 14px;

  border-radius: 12px;

  font-weight: 600;

  transition: 0.3s;

  background:
    rgba(255,255,255,0.06);

  color: white;

  border:
    1px solid rgba(255,255,255,0.06);
}

.profile-btn:hover {

  background:
    rgba(59,130,246,0.12);

  color: #bfdbfe;
}

/* MOBILE */
@media (max-width: 768px) {

  .sidebar {

    width: 100%;

    height: auto;

    position: relative;

    padding: 20px;
  }

  .menu {

    margin-top: 20px;
  }

  .bottom-section {

    margin-top: 25px;
  }
}

</style>