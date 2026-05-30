<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import Toast from '../components/Toast.vue'
import { ref, onMounted, computed } from 'vue'
import { useScrollAnimation } from '../composables/useScrollAnimation'

const users = ref([])
const search = ref('')
const loading = ref(true)
const errorMessage = ref('')
const deletingId = ref(null)
const toastRef = ref(null)

useScrollAnimation()

async function loadUsers() {
  try {
    loading.value = true
    const { getAll } = await import('../lib/api.js')
    users.value = await getAll('users')
  } catch (e) {
    console.log(e); errorMessage.value = 'Failed to load users.'
  } finally { loading.value = false }
}

onMounted(loadUsers)

const filteredUsers = computed(() =>
  users.value.filter(u => u.role !== 'admin' &&
    ((u.username||'').toLowerCase().includes(search.value.toLowerCase()) ||
     (u.email||'').toLowerCase().includes(search.value.toLowerCase())))
)

const totalUsers    = computed(() => users.value.length)
const adminCount    = computed(() => users.value.filter(u => u.role==='admin').length)
const customerCount = computed(() => users.value.filter(u => u.role!=='admin').length)

async function deleteUser(id) {
  try {
    deletingId.value = id
    const { remove } = await import('../lib/api.js')
    await remove('users', id)
    users.value = users.value.filter(u => u.id !== id)
    toastRef.value.showToastMessage('User removed!', 'success')
  } catch (e) {
    toastRef.value.showToastMessage('Failed to remove user', 'error')
  } finally { deletingId.value = null }
}

function getInitial(name) { return name ? name.charAt(0).toUpperCase() : '?' }
</script>

<template>
  <div class="admin-page">
    <AdminNavbar />

    <main class="admin-main">
      <div v-if="loading" class="state-screen"><div class="loader" /><p>Loading users…</p></div>
      <div v-else-if="errorMessage" class="state-screen"><p class="err">{{ errorMessage }}</p></div>

      <div v-else>
        <!-- Header -->
        <div class="page-header reveal">
          <span class="kicker">Admin</span>
          <h1 class="page-title">User <span class="grad-text">Management</span></h1>
          <p class="page-sub">View and manage all registered customer accounts.</p>
        </div>

        <!-- Stats -->
        <div class="stats-row reveal stagger-1">
          <div class="stat-pill glass">
            <div class="sp-icon" style="color:#60a5fa">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M1.5 17c0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
            <div><p class="sp-label">Total Users</p><p class="sp-val" style="color:#93c5fd">{{ totalUsers }}</p></div>
          </div>
          <div class="stat-pill glass">
            <div class="sp-icon" style="color:#c4b5fd">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5l2 4.5h4.5L12 9l1.5 4.5L9 11l-4.5 2.5L6 9 2.5 6H7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
            </div>
            <div><p class="sp-label">Admins</p><p class="sp-val" style="color:#c4b5fd">{{ adminCount }}</p></div>
          </div>
          <div class="stat-pill glass">
            <div class="sp-icon" style="color:#6ee7b7">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M1.5 17c0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
            <div><p class="sp-label">Customers</p><p class="sp-val" style="color:#6ee7b7">{{ customerCount }}</p></div>
          </div>
        </div>

        <!-- Search -->
        <div class="search-bar reveal stagger-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#475569" stroke-width="1.5"/><path d="M11 11l3 3" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/></svg>
          <input v-model="search" placeholder="Search by username or email…" class="search-input" />
        </div>

        <!-- Table -->
        <div class="table-card glass reveal stagger-3">
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredUsers.length === 0">
                  <td colspan="4" class="empty-row">No users found.</td>
                </tr>
                <tr v-for="user in filteredUsers" :key="user.id">
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar">{{ getInitial(user.username) }}</div>
                      <div>
                        <p class="user-name">{{ user.username }}</p>
                        <p class="user-id">ID: {{ user.id }}</p>
                      </div>
                    </div>
                  </td>
                  <td><span class="user-email">{{ user.email }}</span></td>
                  <td>
                    <span :class="['role-badge', user.role]">{{ user.role }}</span>
                  </td>
                  <td>
                    <button class="btn-del" @click="deleteUser(user.id)" :disabled="deletingId===user.id">
                      {{ deletingId===user.id ? 'Removing…' : 'Remove' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

    <Toast ref="toastRef" />
  </div>
</template>

<style scoped>
.admin-page { display: flex; background: #030712; min-height: 100vh; }
.admin-main { margin-left: 256px; flex: 1; padding: 48px 40px; box-sizing: border-box; }

.state-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; color: #475569; }
.loader { width: 40px; height: 40px; border-radius: 50%; border: 3px solid rgba(59,130,246,0.2); border-top-color: #3b82f6; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.err { color: #f87171; }

.page-header { margin-bottom: 36px; }
.page-title { font-family: 'Orbitron', sans-serif; font-size: clamp(26px,4vw,48px); font-weight: 900; color: #f1f5f9; margin: 12px 0 8px; line-height: 1.1; }
.page-sub { color: #475569; font-size: 15px; margin: 0; }

.stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 24px; }
.stat-pill { display: flex; align-items: center; gap: 14px; padding: 20px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.07); }
.sp-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sp-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #334155; margin: 0 0 4px; }
.sp-val { font-family: 'Orbitron', sans-serif; font-size: 24px; font-weight: 900; margin: 0; }

.search-bar {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px; padding: 12px 16px; margin-bottom: 20px; max-width: 480px;
}
.search-input { flex: 1; background: none; border: none; outline: none; color: #f1f5f9; font-size: 14px; }
.search-input::placeholder { color: #334155; }

.table-card { border-radius: 24px; border: 1px solid rgba(255,255,255,0.07); overflow: hidden; }
.table-scroll { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table thead tr { background: rgba(59,130,246,0.06); border-bottom: 1px solid rgba(255,255,255,0.07); }
.data-table thead th { padding: 16px 20px; text-align: left; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #475569; }
.data-table tbody tr { border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.2s; }
.data-table tbody tr:hover { background: rgba(59,130,246,0.04); }
.data-table td { padding: 16px 20px; vertical-align: middle; }
.empty-row { text-align: center; color: #334155; padding: 48px !important; }

.user-cell { display: flex; align-items: center; gap: 14px; }
.user-avatar {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #2563eb, #8b5cf6);
  color: white; font-size: 16px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.user-name { font-size: 14px; font-weight: 700; color: #f1f5f9; margin: 0 0 2px; }
.user-id   { font-size: 11px; color: #334155; margin: 0; }
.user-email { font-size: 13px; color: #94a3b8; }

.role-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.role-badge.admin { background: rgba(239,68,68,0.12); color: #fca5a5; border: 1px solid rgba(239,68,68,0.25); }
.role-badge.user  { background: rgba(59,130,246,0.12); color: #93c5fd; border: 1px solid rgba(59,130,246,0.25); }

.btn-del { padding: 8px 16px; border-radius: 10px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-del:hover { background: rgba(239,68,68,0.22); }
button:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 900px)  { .stats-row { grid-template-columns: 1fr; } }
@media (max-width: 768px)  { .admin-main { margin-left: 0; padding: 20px; } }
</style>
