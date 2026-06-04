<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useCurrencyStore } from '../stores/currency'
import { useWishlistStore } from '../stores/wishlist'

const router = useRouter()
const cart = useCartStore()
const currency = useCurrencyStore()
const wishlist = useWishlistStore()
const user = ref(JSON.parse(localStorage.getItem('user')))
const orders = ref([])
const loading = ref(true)

function getProfileImageKey() {
  const identity = user.value?.id || user.value?.email
  return identity ? `profileImage:${String(identity).trim().toLowerCase()}` : ''
}

const profileImageKey = getProfileImageKey()
const profileImage = ref(profileImageKey ? localStorage.getItem(profileImageKey) || '' : '')
const address    = ref(localStorage.getItem('defaultAddress') || 'Kuching, Sarawak')
const birthday   = ref(localStorage.getItem('birthday') || '')
const apartment  = ref(localStorage.getItem('apartment') || '')
const city       = ref(localStorage.getItem('city') || '')
const state      = ref(localStorage.getItem('state') || '')
const zipCode    = ref(localStorage.getItem('zipCode') || '')
const country    = ref(localStorage.getItem('country') || 'Malaysia')

const showProfileModal = ref(false)
const showAddressModal = ref(false)
const editName         = ref('')
const editEmail        = ref('')
const editBirthday     = ref('')
const editAddressValue = ref('')
const editApartment    = ref('')
const editCity         = ref('')
const editState        = ref('')
const editZipCode      = ref('')
const editCountry      = ref('')

async function loadOrders() {
  if (!user.value) { loading.value = false; return }
  try {
    const { getWhere } = await import('../lib/api.js')
    orders.value = await getWhere('orders', 'userEmail', user.value.email)
  } catch (e) { console.log(e) }
  finally { loading.value = false }
}

const totalOrders   = computed(() => orders.value.length)
const totalSpent    = computed(() => orders.value.reduce((s, o) => s + Number(o.total || 0), 0))
const pendingOrders = computed(() => orders.value.filter(o => o.status === 'Pending').length)

function formatMoney(value) {
  return currency.format(value)
}

function logout() {
  localStorage.removeItem('user')
  cart.reset()
  wishlist.reset()
  user.value = null
  router.push('/login')
}

function handleProfileUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    profileImage.value = reader.result
    const key = getProfileImageKey()
    if (key) localStorage.setItem(key, reader.result)
  }
  reader.readAsDataURL(file)
}

function editProfile() {
  editName.value = user.value.username
  editEmail.value = user.value.email
  editBirthday.value = birthday.value
  showProfileModal.value = true
}
function saveProfile() {
  user.value.username = editName.value
  user.value.email    = editEmail.value
  birthday.value      = editBirthday.value
  localStorage.setItem('birthday', editBirthday.value)
  localStorage.setItem('user', JSON.stringify(user.value))
  showProfileModal.value = false
}

function editAddressFn() {
  editAddressValue.value = address.value
  editApartment.value    = apartment.value
  editCity.value         = city.value
  editState.value        = state.value
  editZipCode.value      = zipCode.value
  editCountry.value      = country.value
  showAddressModal.value = true
}
function saveAddress() {
  address.value   = editAddressValue.value
  apartment.value = editApartment.value
  city.value      = editCity.value
  state.value     = editState.value
  zipCode.value   = editZipCode.value
  country.value   = editCountry.value
  localStorage.setItem('defaultAddress', editAddressValue.value)
  localStorage.setItem('apartment',  editApartment.value)
  localStorage.setItem('city',       editCity.value)
  localStorage.setItem('state',      editState.value)
  localStorage.setItem('zipCode',    editZipCode.value)
  localStorage.setItem('country',    editCountry.value)
  showAddressModal.value = false
}

onMounted(() => {
  currency.fetchRates()
  loadOrders()
})
</script>

<template>
  <div class="profile-page">
    <Navbar />

    <main class="profile-main section-inner">

      <!-- Header -->
      <div class="page-header">
        <span class="kicker">Account</span>
        <h1 class="page-title">My <span class="grad-text">Profile</span></h1>
      </div>

      <div v-if="user" class="profile-grid">

        <!-- Left: avatar + quick nav -->
        <aside class="profile-sidebar glass">
          <div class="avatar-wrap">
            <div class="avatar-ring">
              <img
                :src="profileImage || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.username"
                class="avatar-img"
                alt="avatar"
              />
            </div>
            <label class="upload-label">
              Change Photo
              <input type="file" accept="image/*" @change="handleProfileUpload" hidden />
            </label>
          </div>

          <div class="sidebar-info">
            <h2 class="sidebar-name">{{ user.username }}</h2>
            <p class="sidebar-email">{{ user.email }}</p>
            <span class="role-badge">{{ user.role }}</span>
          </div>

          <nav class="sidebar-nav">
            <button class="snav-btn active">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              Profile
            </button>
            <button class="snav-btn" @click="router.push('/orders')">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 7h6M5 10h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              My Orders
            </button>
            <button class="snav-btn" @click="router.push('/cart')">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2h2l2 7h6l1.5-4H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="13" r="1" fill="currentColor"/><circle cx="12" cy="13" r="1" fill="currentColor"/></svg>
              Cart
            </button>
            <button class="snav-btn logout" @click="logout">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Logout
            </button>
          </nav>
        </aside>

        <!-- Right: content -->
        <div class="profile-content">

          <!-- Stats -->
          <div class="stats-row">
            <div class="stat-card glass">
              <p class="stat-label">Total Orders</p>
              <p class="stat-value grad-text-blue">{{ totalOrders }}</p>
            </div>
            <div class="stat-card glass">
              <p class="stat-label">Total Spent</p>
              <p class="stat-value grad-text">{{ formatMoney(totalSpent) }}</p>
            </div>
            <div class="stat-card glass">
              <p class="stat-label">Pending</p>
              <p class="stat-value" style="color:#fcd34d">{{ pendingOrders }}</p>
            </div>
          </div>

          <!-- Profile info card -->
          <div class="info-card glass">
            <div class="info-card-header">
              <h3 class="info-card-title">Personal Info</h3>
              <button class="edit-btn" @click="editProfile">Edit</button>
            </div>
            <div class="info-rows">
              <div class="info-row"><span class="info-key">Username</span><span class="info-val">{{ user.username }}</span></div>
              <div class="info-row"><span class="info-key">Email</span><span class="info-val">{{ user.email }}</span></div>
              <div class="info-row"><span class="info-key">Birthday</span><span class="info-val">{{ birthday || '—' }}</span></div>
              <div class="info-row"><span class="info-key">Role</span><span class="info-val"><span class="role-badge">{{ user.role }}</span></span></div>
            </div>
          </div>

          <!-- Address card -->
          <div class="info-card glass">
            <div class="info-card-header">
              <h3 class="info-card-title">Default Address</h3>
              <button class="edit-btn" @click="editAddressFn">Edit</button>
            </div>
            <div class="address-display">
              <p>{{ address }}</p>
              <p v-if="apartment">{{ apartment }}</p>
              <p v-if="city || state">{{ city }}<span v-if="city && state">, </span>{{ state }}</p>
              <p v-if="country || zipCode">{{ country }} {{ zipCode }}</p>
            </div>
          </div>

          <!-- Recent orders -->
          <div class="info-card glass">
            <div class="info-card-header">
              <h3 class="info-card-title">Recent Orders</h3>
              <button class="edit-btn" @click="router.push('/orders')">View All</button>
            </div>
            <div v-if="loading" class="orders-loading">Loading…</div>
            <div v-else-if="orders.length === 0" class="orders-empty">No orders yet.</div>
            <div v-else class="recent-orders">
              <div v-for="o in orders.slice(0,3)" :key="o.id" class="recent-order-row">
                <div>
                  <p class="ro-id">#{{ o.id }}</p>
                  <p class="ro-date">{{ o.userEmail }}</p>
                </div>
                <span :class="['status-badge', `s-${o.status?.toLowerCase()}`]">{{ o.status }}</span>
                <span class="ro-total">{{ formatMoney(o.total) }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Not logged in -->
      <div v-else class="not-logged">
        <p>You are not logged in.</p>
        <button class="btn-primary" @click="router.push('/login')">Go to Login</button>
      </div>

    </main>

    <!-- Profile modal -->
    <Teleport to="body">
      <div v-if="showProfileModal" class="modal-overlay" @click.self="showProfileModal = false">
        <div class="modal-card glass">
          <div class="modal-header">
            <h2 class="modal-title">Edit Profile</h2>
            <button class="modal-close" @click="showProfileModal = false">✕</button>
          </div>
          <div class="modal-field">
            <label>Username</label>
            <input v-model="editName" type="text" class="modal-input" />
          </div>
          <div class="modal-field">
            <label>Email</label>
            <input v-model="editEmail" type="email" class="modal-input" />
          </div>
          <div class="modal-field">
            <label>Birthday</label>
            <input v-model="editBirthday" type="date" class="modal-input" />
          </div>
          <div class="modal-actions">
            <button class="btn-ghost" @click="showProfileModal = false">Cancel</button>
            <button class="btn-primary" @click="saveProfile">Save Changes</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Address modal -->
    <Teleport to="body">
      <div v-if="showAddressModal" class="modal-overlay" @click.self="showAddressModal = false">
        <div class="modal-card glass">
          <div class="modal-header">
            <h2 class="modal-title">Edit Address</h2>
            <button class="modal-close" @click="showAddressModal = false">✕</button>
          </div>
          <div class="modal-field">
            <label>Street Address</label>
            <input v-model="editAddressValue" type="text" placeholder="123 Main St" class="modal-input" />
          </div>
          <div class="modal-field">
            <label>Apartment / Suite</label>
            <input v-model="editApartment" type="text" placeholder="Optional" class="modal-input" />
          </div>
          <div class="addr-grid">
            <div class="modal-field">
              <label>City</label>
              <input v-model="editCity" type="text" placeholder="Kuching" class="modal-input" />
            </div>
            <div class="modal-field">
              <label>State</label>
              <input v-model="editState" type="text" placeholder="Sarawak" class="modal-input" />
            </div>
          </div>
          <div class="addr-grid">
            <div class="modal-field">
              <label>Country</label>
              <input v-model="editCountry" type="text" placeholder="Malaysia" class="modal-input" />
            </div>
            <div class="modal-field">
              <label>ZIP Code</label>
              <input v-model="editZipCode" type="text" placeholder="93000" class="modal-input" />
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-ghost" @click="showAddressModal = false">Cancel</button>
            <button class="btn-primary" @click="saveAddress">Save Address</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Footer />
  </div>
</template>

<style scoped>
.profile-page {
  --profile-heading: #f8fafc;
  --profile-value: #e2e8f0;
  --profile-muted: #a9b7c8;
  --profile-badge-text: #93c5fd;
  --profile-badge-bg: rgba(59,130,246,0.12);
  --profile-badge-border: rgba(59,130,246,0.28);
  background: #030712;
  min-height: 100vh;
}

:global(:root[data-theme="light"]) .profile-page {
  --profile-heading: #172033;
  --profile-value: #263247;
  --profile-muted: #52657d;
  --profile-badge-text: #2563eb;
  --profile-badge-bg: rgba(37,99,235,0.10);
  --profile-badge-border: rgba(37,99,235,0.28);
}
.profile-main { padding-top: 130px; padding-bottom: 100px; }

/* Header */
.page-header { margin-bottom: 48px; }
.page-title {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(32px, 5vw, 60px); font-weight: 900; color: #f1f5f9;
  margin: 14px 0 0; line-height: 1.1;
}

/* Grid */
.profile-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 28px;
  align-items: start;
}

/* Sidebar */
.profile-sidebar {
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.07);
  padding: 28px;
  position: sticky; top: 100px;
}
.avatar-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 24px; }
.avatar-ring {
  width: 96px; height: 96px; border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}
.avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }
.upload-label {
  font-size: 12px; color: #60a5fa; cursor: pointer; font-weight: 600;
  padding: 6px 14px; border-radius: 20px;
  background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);
  transition: all 0.2s;
}
.upload-label:hover { background: rgba(59,130,246,0.2); }

.sidebar-info { text-align: center; margin-bottom: 24px; }
.sidebar-name { font-size: 18px; font-weight: 700; color: var(--profile-heading); margin: 0 0 4px; }
.sidebar-email { font-size: 13px; color: var(--profile-muted); margin: 0 0 10px; }
.role-badge {
  display: inline-block; padding: 4px 12px; border-radius: 20px;
  background: var(--profile-badge-bg); border: 1px solid var(--profile-badge-border);
  color: var(--profile-badge-text); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
}

.sidebar-nav { display: flex; flex-direction: column; gap: 4px; }
.snav-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 12px;
  background: none; border: none; color: #475569;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.2s; text-align: left;
}
.snav-btn:hover, .snav-btn.active { background: rgba(59,130,246,0.1); color: #93c5fd; }
.snav-btn.logout { color: #f87171; margin-top: 8px; }
.snav-btn.logout:hover { background: rgba(239,68,68,0.1); }

/* Content */
.profile-content { display: flex; flex-direction: column; gap: 20px; }

/* Stats */
.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.stat-card {
  padding: 24px; border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.06);
  text-align: center;
}
.stat-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; margin: 0 0 8px; }
.stat-value { font-family: 'Orbitron', sans-serif; font-size: 28px; font-weight: 900; margin: 0; }

/* Info cards */
.info-card {
  padding: 28px; border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.07);
}
.info-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.info-card-title { font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 800; color: #f1f5f9; margin: 0; letter-spacing: 0.05em; }
.edit-btn {
  padding: 7px 16px; border-radius: 10px;
  background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25);
  color: #60a5fa; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.edit-btn:hover { background: rgba(59,130,246,0.2); }

.info-rows { display: flex; flex-direction: column; gap: 14px; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.04); }
.info-row:last-child { border-bottom: none; padding-bottom: 0; }
.info-key { font-size: 13px; color: var(--profile-muted); font-weight: 600; }
.info-val { font-size: 14px; color: var(--profile-value); font-weight: 600; }

.profile-page .sidebar-name,
.profile-page .info-val {
  color: var(--profile-value) !important;
}

.profile-page .sidebar-email,
.profile-page .info-key {
  color: var(--profile-muted) !important;
}

.profile-page .role-badge {
  background: var(--profile-badge-bg) !important;
  border-color: var(--profile-badge-border) !important;
  color: var(--profile-badge-text) !important;
}

:global([data-theme="light"]) .profile-page .sidebar-name,
:global([data-theme="light"]) .profile-page .info-val {
  color: #172033 !important;
}

:global([data-theme="light"]) .profile-page .sidebar-email,
:global([data-theme="light"]) .profile-page .info-key,
:global([data-theme="light"]) .profile-page .stat-label {
  color: #52657d !important;
}

:global([data-theme="light"]) .profile-page .role-badge {
  background: rgba(37, 99, 235, 0.12) !important;
  border-color: rgba(37, 99, 235, 0.32) !important;
  color: #2563eb !important;
}

.address-display p { font-size: 14px; color: #94a3b8; margin: 0 0 6px; line-height: 1.6; }
.address-display p:last-child { margin: 0; }

/* Recent orders */
.orders-loading, .orders-empty { color: #475569; font-size: 14px; padding: 12px 0; }
.recent-orders { display: flex; flex-direction: column; gap: 12px; }
.recent-order-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; border-radius: 14px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
}
.ro-id { font-size: 14px; font-weight: 700; color: #f1f5f9; margin: 0 0 2px; }
.ro-date { font-size: 12px; color: #475569; margin: 0; }
.ro-total { font-size: 15px; font-weight: 700; color: #60a5fa; }

.status-badge {
  padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;
}
.s-pending   { background: rgba(245,158,11,0.15); color: #fcd34d; border: 1px solid rgba(245,158,11,0.3); }
.s-processing{ background: rgba(59,130,246,0.15); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3); }
.s-shipping  { background: rgba(139,92,246,0.15); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.3); }
.s-delivered { background: rgba(16,185,129,0.15); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.3); }
.s-rejected  { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }

/* Not logged in */
.not-logged { text-align: center; padding: 80px 20px; color: #475569; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px;
}
.modal-card {
  width: 100%; max-width: 560px;
  padding: 36px; border-radius: 28px;
  border: 1px solid rgba(255,255,255,0.1);
  animation: modalPop 0.3s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes modalPop {
  from { opacity: 0; transform: scale(0.92) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
.modal-title { font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 800; color: #f1f5f9; margin: 0; }
.modal-close {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(255,255,255,0.06); border: none;
  color: #64748b; font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.modal-close:hover { background: rgba(255,255,255,0.1); color: #f1f5f9; }

.modal-field { margin-bottom: 18px; }
.modal-field label { display: block; font-size: 13px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; }
.modal-input {
  width: 100%; padding: 12px 16px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; color: #f1f5f9; font-size: 15px; outline: none;
  transition: all 0.25s; box-sizing: border-box;
}
.modal-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
.modal-input::placeholder { color: #334155; }

.addr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 28px; }
.btn-primary {
  padding: 11px 22px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white; border: none; border-radius: 12px;
  font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(37,99,235,0.35); }
.btn-ghost {
  padding: 11px 22px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  color: #64748b; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-ghost:hover { background: rgba(255,255,255,0.09); color: #94a3b8; }

/* Responsive */
@media (max-width: 1024px) {
  .profile-grid { grid-template-columns: 1fr; }
  .profile-sidebar { position: relative; top: 0; }
}
@media (max-width: 640px) {
  .stats-row { grid-template-columns: 1fr; }
  .addr-grid { grid-template-columns: 1fr; }
}
</style>
