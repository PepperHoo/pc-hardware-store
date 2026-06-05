<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import Toast from '../components/Toast.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useWishlistStore } from '../stores/wishlist'
import { clearSessionUser, getSessionUser, setSessionUser } from '../lib/session.js'

const router = useRouter()
const cart = useCartStore()
const wishlist = useWishlistStore()
const toastRef = ref(null)
const user = ref(getSessionUser())

function getProfileImageKey() {
  const identity = user.value?.id || user.value?.email
  return identity ? `profileImage:${String(identity).trim().toLowerCase()}` : ''
}

const profileImageKey = getProfileImageKey()
const profileImage = ref(profileImageKey ? localStorage.getItem(profileImageKey) || '' : '')
const editName  = ref('')
const editEmail = ref('')
const editPhone = ref('')
const editTitle = ref('')
const saving = ref(false)

function syncForm() {
  editName.value  = user.value?.username || user.value?.name || 'Admin User'
  editEmail.value = user.value?.email || ''
  editPhone.value = localStorage.getItem('adminPhone') || ''
  editTitle.value = localStorage.getItem('adminTitle') || 'Hardware Store Administrator'
}

function handleProfileUpload(e) {
  const file = e.target.files[0]; if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    profileImage.value = reader.result
    const key = getProfileImageKey()
    if (key) localStorage.setItem(key, reader.result)
    toastRef.value.showToastMessage('Profile photo updated', 'success')
  }
  reader.readAsDataURL(file)
}

async function saveProfile() {
  if (!editName.value.trim() || !editEmail.value.trim()) {
    toastRef.value.showToastMessage('Name and email are required', 'error'); return
  }
  const updatedUser = { ...user.value, username: editName.value, email: editEmail.value }
  const dbUser = {
    username: editName.value,
    email: editEmail.value,
    role: updatedUser.role || 'admin'
  }
  try {
    saving.value = true
    if (updatedUser.id) {
      const { update } = await import('../lib/api.js')
      await update('users', updatedUser.id, dbUser)
    }
    user.value = updatedUser
    setSessionUser(updatedUser)
    localStorage.setItem('adminPhone', editPhone.value)
    localStorage.setItem('adminTitle', editTitle.value)
    toastRef.value.showToastMessage('Profile saved!', 'success')
  } catch (e) {
    console.error(e)
    toastRef.value.showToastMessage(`Failed to save profile: ${e.message}`, 'error')
  } finally { saving.value = false }
}

function logout() {
  clearSessionUser()
  cart.reset()
  wishlist.reset()
  router.push('/login')
}

onMounted(() => {
  if (!user.value || String(user.value.role).toLowerCase() !== 'admin') {
    router.push(user.value ? '/profile' : '/login'); return
  }
  syncForm()
})
</script>

<template>
  <div class="admin-page">
    <AdminNavbar />

    <main class="admin-main">
      <!-- Header -->
      <div class="page-header">
        <div>
          <span class="kicker">Admin</span>
          <h1 class="page-title">Admin <span class="grad-text">Profile</span></h1>
          <p class="page-sub">Manage your administrator identity and account details.</p>
        </div>
        <button class="logout-btn" @click="logout">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 12H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M9 10l3-3-3-3M12 7H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Logout
        </button>
      </div>

      <!-- Grid -->
      <div class="profile-grid">
        <!-- Avatar card -->
        <div class="avatar-card glass">
          <div class="avatar-ring">
            <img v-if="profileImage" :src="profileImage" class="avatar-img" alt="admin" />
            <span v-else class="avatar-initial">{{ editName ? editName.charAt(0).toUpperCase() : 'A' }}</span>
          </div>
          <h2 class="avatar-name">{{ editName || 'Admin User' }}</h2>
          <p class="avatar-title">{{ editTitle }}</p>
          <p class="avatar-email">{{ editEmail }}</p>
          <span class="role-badge">Administrator</span>
          <label class="upload-label">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v7M3 5l3.5-3.5L10 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M1.5 11.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Change Photo
            <input type="file" accept="image/*" @change="handleProfileUpload" hidden />
          </label>
        </div>

        <!-- Form card -->
        <div class="form-card glass">
          <h2 class="form-title">Edit Profile</h2>
          <p class="form-sub">Changes are saved to your admin session and database.</p>

          <div class="form-grid">
            <div class="field-group">
              <label class="field-label">Full Name</label>
              <input v-model="editName" type="text" placeholder="Admin name" class="field-input" />
            </div>
            <div class="field-group">
              <label class="field-label">Email Address</label>
              <input v-model="editEmail" type="email" placeholder="admin@email.com" class="field-input" />
            </div>
            <div class="field-group">
              <label class="field-label">Phone</label>
              <input v-model="editPhone" type="text" placeholder="+60 12-345 6789" class="field-input" />
            </div>
            <div class="field-group">
              <label class="field-label">Role Title</label>
              <input v-model="editTitle" type="text" placeholder="Store Administrator" class="field-input" />
            </div>
          </div>

          <button class="save-btn" @click="saveProfile" :disabled="saving">
            <svg v-if="!saving" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 8l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <div v-else class="mini-spin" />
            {{ saving ? 'Saving...' : 'Save Profile' }}
          </button>
        </div>
      </div>
    </main>

    <Toast ref="toastRef" />
  </div>
</template>

<style scoped>
.admin-page { display: flex; background: #030712; min-height: 100vh; }
.admin-main { margin-left: 256px; flex: 1; padding: 48px 40px; box-sizing: border-box; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px; margin-bottom: 12px; }
.page-title { font-family: 'Orbitron', sans-serif; font-size: clamp(22px,2.5vw,34px); font-weight: 900; color: #f1f5f9; margin: 6px 0 4px; line-height: 1.08; }
.page-sub { color: #475569; font-size: 12px; margin: 0; }

.logout-btn {
  display: flex; align-items: center; gap: 7px; padding: 7px 11px;
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
  color: #fca5a5; border-radius: 9px; font-size: 11px; font-weight: 700; cursor: pointer;
  transition: all 0.2s; margin-top: 6px;
}
.logout-btn:hover { background: rgba(239,68,68,0.2); }

.profile-grid { display: grid; grid-template-columns: 220px 1fr; gap: 12px; align-items: start; }

/* Avatar card */
.avatar-card { padding: 14px 12px !important; border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 7px; }
.avatar-ring { width: 70px; height: 70px; border-radius: 50%; padding: 2px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); }
.avatar-img  { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }
.avatar-initial { width: 100%; height: 100%; border-radius: 50%; background: #030712; display: flex; align-items: center; justify-content: center; color: #3b82f6; font-size: 28px; font-weight: 900; font-family: 'Orbitron', sans-serif; }
.avatar-name  { font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 800; color: #f1f5f9; margin: 0; }
.avatar-title { font-size: 11px; color: #475569; margin: 0; }
.avatar-email { font-size: 11px; color: #334155; margin: 0; }
.role-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(59,130,246,0.12);
  border: 1px solid rgba(96,165,250,0.28);
  color: #93c5fd;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1;
  white-space: nowrap;
  box-sizing: border-box;
}
.upload-label { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 9px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); color: #60a5fa; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 2px; }
.upload-label:hover { background: rgba(59,130,246,0.18); }

/* Form card */
.form-card { padding: 14px 16px !important; border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); }
.form-title { font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 800; color: #f1f5f9; margin: 0 0 5px; }
.form-sub { font-size: 11px; color: #475569; margin: 0 0 10px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.field-group { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; }
.field-input { padding: 8px 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; color: #f1f5f9; font-size: 12px; outline: none; transition: all 0.2s; }
.field-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.field-input::placeholder { color: #334155; }

.save-btn { display: flex; align-items: center; gap: 8px; padding: 8px 13px; border-radius: 9px; background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; border: none; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
.save-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(37,99,235,0.35); }
.save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.mini-spin { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px)  { .profile-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px)  { .admin-main { margin-left: 0; padding: 20px; } .form-grid { grid-template-columns: 1fr; } }
</style>
