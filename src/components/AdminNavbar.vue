<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCurrencyStore } from '../stores/currency'

const route  = useRoute()
const router = useRouter()
const currency = useCurrencyStore()
const isDark = ref(true)
const showCurrency = ref(false)

const navItems = [
  {
    to: '/admin', label: 'Dashboard', exact: true,
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="1" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="10" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="10" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/></svg>`
  },
  {
    to: '/admin/products', label: 'Products', exact: false,
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="5" y="7" width="3" height="2" rx="0.5" fill="currentColor" opacity=".6"/><rect x="10" y="7" width="4" height="2" rx="0.5" fill="currentColor" opacity=".6"/></svg>`
  },
  {
    to: '/admin/orders', label: 'Orders', exact: false,
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 7h8M5 10h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
  },
  {
    to: '/admin/users', label: 'Users', exact: false,
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M2 16c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
  },
  {
    to: '/admin/homepage', label: 'Homepage', exact: false,
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 8l7-6 7 6v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 17V10h6v7" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`
  },
]

function isActive(item) {
  return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}

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

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

function goAdminProfile() {
  const user = getStoredUser()
  const role = String(user?.role || '').trim().toLowerCase()

  if (!user) {
    router.push('/login')
    return
  }

  router.push(role === 'admin' ? '/admin/profile' : '/profile')
}

onMounted(() => {
  const saved = localStorage.getItem('theme') || 'dark'

  isDark.value = saved !== 'light'
  document.documentElement.setAttribute('data-theme', saved)
  currency.fetchRates()
})
</script>

<template>
  <aside class="admin-sidebar">
    <!-- Top gradient bar -->
    <div class="sidebar-bar" />

    <!-- Logo -->
    <router-link to="/admin" class="sidebar-logo" aria-label="Go to admin dashboard">
      <div class="logo-icon">
        <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
          <rect x="2" y="6" width="24" height="16" rx="3" stroke="#3b82f6" stroke-width="2"/>
          <rect x="6" y="10" width="6" height="4" rx="1" fill="#3b82f6" opacity=".7"/>
          <rect x="14" y="10" width="8" height="4" rx="1" fill="#8b5cf6" opacity=".7"/>
        </svg>
      </div>
      <div>
        <p class="logo-name">PC<span class="logo-accent">Admin</span></p>
        <p class="logo-sub">Hardware Dashboard</p>
      </div>
    </router-link>

    <!-- Divider -->
    <div class="sidebar-divider" />

    <!-- Nav label -->
    <p class="nav-label">Navigation</p>

    <!-- Menu -->
    <nav class="sidebar-menu">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="menu-link"
        :class="{ active: isActive(item) }"
      >
        <span class="link-icon" v-html="item.icon" />
        <span class="link-text">{{ item.label }}</span>
        <span v-if="isActive(item)" class="active-dot" />
      </router-link>
    </nav>

    <!-- Spacer -->
    <div class="sidebar-spacer" />

    <!-- Bottom -->
    <div class="sidebar-bottom">
      <div class="admin-currency-wrap">
        <button class="admin-currency-btn" type="button" @click="showCurrency = !showCurrency" :title="`Currency: ${currency.current}`">
          <span class="currency-symbol">{{ currency.symbol }}</span>
          <span class="currency-code">{{ currency.current }}</span>
        </button>
        <div v-if="showCurrency" class="admin-currency-menu">
          <button
            v-for="code in currency.currencies"
            :key="code"
            class="admin-currency-option"
            :class="{ active: currency.current === code }"
            type="button"
            @click="selectCurrency(code)"
          >
            <span>{{ currency.symbols[code] }}</span>
            <strong>{{ code }}</strong>
          </button>
        </div>
      </div>

      <button class="theme-toggle" @click="toggleTheme">
        <span>
          {{ isDark ? 'Light Mode' : 'Dark Mode' }}
        </span>

        <span class="theme-pill">
          {{ isDark ? '☀' : '☾' }}
        </span>
      </button>

      <button type="button" class="profile-link" @click="goAdminProfile">
        <div class="profile-avatar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5" r="3" stroke="#93c5fd" stroke-width="1.5"/>
            <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#93c5fd" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div>
          <p class="profile-name">Admin Profile</p>
          <p class="profile-role">Administrator</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" class="profile-arrow">
          <path d="M5 3l4 4-4 4" stroke="#475569" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

    </div>
  </aside>
</template>

<style scoped>
.admin-sidebar {
  width: 256px;
  height: 100vh;
  background: #020817;
  position: fixed;
  left: 0; top: 0;
  display: flex;
  flex-direction: column;
  padding: 0 0 24px;
  box-sizing: border-box;
  border-right: 1px solid rgba(255,255,255,0.06);
  z-index: 9999;
  overflow-y: auto;
}

.sidebar-bar {
  height: 3px;
  background: linear-gradient(90deg, #2563eb, #8b5cf6, #34d399);
  flex-shrink: 0;
}

/* Logo */
.sidebar-logo {
  display: flex; align-items: center; gap: 12px;
  padding: 22px 20px 18px;
  color: inherit;
  text-decoration: none;
}
.logo-icon {
  width: 42px; height: 42px; border-radius: 12px;
  background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.logo-name {
  font-family: 'Orbitron', sans-serif;
  font-size: 16px; font-weight: 900; color: white; margin: 0 0 2px;
}
.logo-accent { color: #3b82f6; }
.logo-sub { font-size: 11px; color: #334155; margin: 0; }

.sidebar-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 0 20px 16px; }

.nav-label {
  font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
  color: #1e293b; margin: 0 0 8px; padding: 0 20px;
}

/* Menu */
.sidebar-menu { display: flex; flex-direction: column; gap: 2px; padding: 0 12px; }

.menu-link {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 12px; border-radius: 12px;
  text-decoration: none; color: #475569;
  font-size: 14px; font-weight: 600;
  transition: all 0.2s;
  position: relative;
}
.menu-link:hover { background: rgba(59,130,246,0.08); color: #93c5fd; }
.menu-link.active {
  background: linear-gradient(135deg, rgba(37,99,235,0.2), rgba(59,130,246,0.12));
  color: #93c5fd;
  border: 1px solid rgba(59,130,246,0.2);
}

.link-icon { display: flex; align-items: center; flex-shrink: 0; }
.link-text { flex: 1; }
.active-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 6px rgba(59,130,246,0.6);
}

.sidebar-spacer { flex: 1; }

/* Bottom */
.sidebar-bottom { padding: 0 12px; display: flex; flex-direction: column; gap: 8px; }

.admin-currency-wrap {
  position: relative;
}

.admin-currency-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  min-height: 34px;
  padding: 7px 10px;
  border-radius: 12px;
  border: 1px solid rgba(96,165,250,0.18);
  background: rgba(59,130,246,0.08);
  color: #93c5fd;
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}

.admin-currency-btn:hover {
  border-color: rgba(96,165,250,0.36);
  background: rgba(59,130,246,0.14);
}

.currency-symbol {
  color: #60a5fa;
}

.currency-code {
  letter-spacing: 0.04em;
}

.admin-currency-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 180px;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid rgba(96,165,250,0.20);
  background: rgba(15,23,42,0.98);
  box-shadow: 0 18px 34px rgba(2,6,23,0.36);
  z-index: 20;
}

.admin-currency-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #cbd5e1;
  font-size: 12px;
  cursor: pointer;
}

.admin-currency-option:hover,
.admin-currency-option.active {
  background: rgba(59,130,246,0.14);
  color: #93c5fd;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.03);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.theme-toggle:hover {
  background: rgba(59,130,246,0.07);
  border-color: rgba(59,130,246,0.20);
}

.theme-pill {
  display: grid;
  place-items: center;
  width: 30px;
  height: 22px;
  border-radius: 999px;
  background: rgba(59,130,246,0.14);
  color: #93c5fd;
}

.profile-link {
  display: flex; align-items: center; gap: 10px;
  width: 100%;
  padding: 12px; border-radius: 14px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  color: inherit;
  text-align: left;
  text-decoration: none; transition: all 0.2s;
  cursor: pointer;
}
.profile-link:hover { background: rgba(59,130,246,0.07); border-color: rgba(59,130,246,0.2); }
.profile-avatar {
  width: 34px; height: 34px; border-radius: 10px;
  background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.2);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.profile-name { font-size: 13px; font-weight: 700; color: #cbd5e1; margin: 0 0 1px; }
.profile-role { font-size: 11px; color: #334155; margin: 0; }
.profile-arrow { margin-left: auto; flex-shrink: 0; }

.back-site-link {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px; border-radius: 12px;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
  text-decoration: none; color: #334155; font-size: 12px; font-weight: 600;
  transition: all 0.2s;
}
.back-site-link:hover { color: #475569; background: rgba(255,255,255,0.05); }

/* Mobile */
@media (max-width: 768px) {
  .admin-sidebar {
    width: 100%;
    height: auto;
    position: sticky;
    top: 0;
    padding-bottom: 10px;
    border-right: none;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    overflow: visible;
  }

  .sidebar-logo {
    padding: 12px 16px 8px;
  }

  .logo-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .logo-name {
    font-size: 15px;
  }

  .logo-sub {
    font-size: 10px;
  }

  .sidebar-divider,
  .nav-label,
  .sidebar-spacer {
    display: none;
  }

  .sidebar-menu {
    flex-direction: row;
    justify-content: space-between;
    gap: 6px;
    overflow-x: auto;
    padding: 8px 12px;
    scroll-snap-type: x proximity;
  }

  .menu-link {
    flex: 1 1 0;
    min-width: 46px;
    min-height: 42px;
    justify-content: center;
    padding: 9px;
    scroll-snap-align: start;
  }

  .link-text {
    display: none;
  }

  .active-dot {
    display: none;
  }

  .sidebar-bottom {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 4px 12px 10px;
  }

  .theme-toggle {
    flex: 0 0 auto;
    width: auto;
    min-height: 38px;
    padding: 9px 10px;
  }

  .theme-toggle span:first-child {
    display: none;
  }

  .profile-link {
    flex: 1;
    min-width: 0;
    padding: 9px 10px;
  }

  .profile-name,
  .profile-role {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@media (max-width: 480px) {
  .menu-link {
    width: 46px;
    padding: 10px;
  }
}

/* Top admin navigation */
.admin-sidebar {
  position: sticky;
  top: 0;
  left: auto;
  width: 100%;
  height: auto;
  min-height: 58px;
  flex-direction: row;
  align-items: center;
  gap: 14px;
  padding: 8px 18px;
  border-right: none;
  border-bottom: 1px solid rgba(96,165,250,0.14);
  background: rgba(2,8,23,0.92);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: 0 10px 24px rgba(2,6,23,0.20);
  overflow: visible;
}

.sidebar-bar,
.sidebar-divider,
.nav-label,
.sidebar-spacer {
  display: none;
}

.sidebar-logo {
  padding: 0;
  flex: 0 0 230px;
  min-width: 230px;
}

.logo-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
}

.logo-name {
  font-size: 14px;
}

.logo-sub {
  font-size: 10px;
}

.sidebar-menu {
  flex: 1;
  min-width: 0;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0;
}

.menu-link {
  min-height: 34px;
  padding: 7px 10px;
  border-radius: 10px;
  font-size: 12px;
  white-space: nowrap;
}

.link-text {
  flex: 0 0 auto;
}

.active-dot {
  display: none;
}

.sidebar-bottom {
  flex: 0 0 auto;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 0;
}

.admin-currency-wrap {
  flex: 0 0 118px;
}

.theme-toggle {
  width: auto;
  min-height: 34px;
  gap: 7px;
  padding: 7px 10px;
  font-size: 11px;
}

.theme-pill {
  width: 26px;
  height: 18px;
}

.profile-link {
  min-width: 176px;
  padding: 7px 9px;
  border-radius: 12px;
}

.profile-avatar {
  width: 30px;
  height: 30px;
  border-radius: 9px;
}

.profile-name {
  font-size: 12px;
}

.profile-role {
  font-size: 10px;
}

:global(:root[data-theme="light"]) .admin-sidebar {
  background: rgba(255,255,255,0.94) !important;
  border-bottom-color: rgba(14,116,144,0.16) !important;
  box-shadow: 0 14px 30px rgba(15,23,42,0.10) !important;
}

:global(:root[data-theme="light"]) .sidebar-logo {
  color: #172033 !important;
}

:global(:root[data-theme="light"]) .admin-currency-btn {
  background: rgba(37,99,235,0.08) !important;
  border-color: rgba(37,99,235,0.18) !important;
  color: #1d4ed8 !important;
}

:global(:root[data-theme="light"]) .currency-symbol {
  color: #2563eb !important;
}

:global(:root[data-theme="light"]) .admin-currency-menu {
  background: rgba(255,255,255,0.98) !important;
  border-color: rgba(37,99,235,0.18) !important;
  box-shadow: 0 18px 34px rgba(15,23,42,0.14) !important;
}

:global(:root[data-theme="light"]) .admin-currency-option {
  color: #334155 !important;
}

:global(:root[data-theme="light"]) .admin-currency-option:hover,
:global(:root[data-theme="light"]) .admin-currency-option.active {
  background: rgba(37,99,235,0.10) !important;
  color: #1d4ed8 !important;
}

@media (max-width: 1100px) {
  .admin-sidebar {
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
  }

  .sidebar-logo {
    flex: 0 0 170px;
    min-width: 170px;
  }

  .sidebar-menu {
    order: 3;
    flex: 0 0 100%;
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .sidebar-bottom {
    margin-left: auto;
  }
}

@media (max-width: 640px) {
  .admin-sidebar {
    min-height: 0;
    padding: 8px 10px;
  }

  .sidebar-logo {
    min-width: 0;
    flex: 1;
  }

  .sidebar-menu {
    gap: 6px;
  }

  .menu-link {
    flex: 1 0 44px;
    min-width: 44px;
    padding: 10px;
  }

  .link-text {
    display: none;
  }

  .theme-toggle {
    min-height: 34px;
  }

  .admin-currency-btn {
    width: 42px;
    padding: 8px;
  }

  .admin-currency-wrap {
    flex: 0 0 42px;
  }

  .admin-currency-menu {
    right: -46px;
  }

  .currency-code {
    display: none;
  }

  .theme-toggle span:first-child {
    display: none;
  }

  .profile-link {
    min-width: 0;
    width: 36px;
    height: 36px;
    justify-content: center;
    padding: 6px;
  }

  .profile-link > div:not(.profile-avatar),
  .profile-arrow {
    display: none;
  }
}
</style>
