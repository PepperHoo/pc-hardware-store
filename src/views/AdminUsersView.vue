<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import Toast from '../components/Toast.vue'
import { ref, onMounted, computed } from 'vue'

const users = ref([])
const search = ref('')
const loading = ref(true)
const errorMessage = ref('')
const deletingId = ref(null)
const toastRef = ref(null)

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
        <div class="page-header">
          <span class="kicker">Admin</span>
          <h1 class="page-title">User <span class="grad-text">Management</span></h1>
          <p class="page-sub">View and manage all registered customer accounts.</p>
        </div>

        <!-- Stats -->
        <div class="stats-row">
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
        <div class="search-bar glass">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#475569" stroke-width="1.5"/><path d="M11 11l3 3" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/></svg>
          <input v-model="search" placeholder="Search by username or email…" class="search-input" />
          <button v-if="search" class="clear-search" @click="search = ''" title="Clear search">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        </div>

        <!-- Table -->
        <div class="table-card glass">
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

.page-header { margin-bottom: 12px; }
.page-title { font-family: 'Orbitron', sans-serif; font-size: clamp(22px,2.5vw,34px); font-weight: 900; color: #f1f5f9; margin: 6px 0 4px; line-height: 1.08; }
.page-sub { color: #475569; font-size: 12px; margin: 0; }

.stats-row { display: grid; grid-template-columns: repeat(3,minmax(220px, 1fr)); gap: 16px; margin-bottom: 18px; justify-content: stretch; }
.stat-pill { display: flex; align-items: center; gap: 14px; padding: 18px !important; border-radius: 16px; border: 1px solid rgba(255,255,255,0.07); }
.sp-icon { width: 42px; height: 42px; border-radius: 12px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sp-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #334155; margin: 0 0 4px; }
.sp-val { font-family: 'Orbitron', sans-serif; font-size: 26px; font-weight: 900; margin: 0; }

.search-bar {
  display: flex; align-items: center; gap: 12px;
  background: rgba(15,23,42,0.68);
  border: 1px solid rgba(96,165,250,0.18);
  border-radius: 14px; padding: 12px 14px !important; margin-bottom: 18px; max-width: 520px;
  box-shadow: 0 16px 34px rgba(2,8,23,0.18);
}
.search-bar:focus-within {
  border-color: rgba(45,212,191,0.42);
  box-shadow: 0 0 0 3px rgba(45,212,191,0.10), 0 16px 34px rgba(2,8,23,0.22);
}
.search-input { flex: 1; background: none !important; border: none !important; outline: none; color: #f1f5f9; font-size: 13px; padding: 0 !important; box-shadow: none !important; }
.search-input::placeholder { color: #64748b; }
.clear-search {
  width: 28px; height: 28px; border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: #94a3b8;
  display: grid; place-items: center;
  cursor: pointer;
}
.clear-search:hover { color: #f8fafc; border-color: rgba(96,165,250,0.28); }

:global(:root[data-theme="light"]) .search-bar {
  background: rgba(255,255,255,0.92) !important;
  border-color: rgba(14,116,144,0.20) !important;
  box-shadow: 0 14px 30px rgba(15,23,42,0.10) !important;
}
:global(:root[data-theme="light"]) .search-input { color: #172033 !important; }
:global(:root[data-theme="light"]) .clear-search {
  background: #eef6fb;
  color: #64748b;
  border-color: rgba(14,116,144,0.18);
}

.table-card { border-radius: 16px; border: 1px solid rgba(255,255,255,0.07); overflow: hidden; }
.table-scroll { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table thead tr { background: rgba(59,130,246,0.06); border-bottom: 1px solid rgba(255,255,255,0.07); }
.data-table thead th { padding: 14px 16px !important; text-align: left; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #475569; }
.data-table tbody tr { border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.2s; }
.data-table tbody tr:hover { background: rgba(59,130,246,0.04); }
.data-table td { padding: 14px 16px !important; vertical-align: middle; }
.empty-row { text-align: center; color: #334155; padding: 18px !important; }

.user-cell { display: flex; align-items: center; gap: 12px; }
.user-avatar {
  width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #2563eb, #8b5cf6);
  color: white; font-size: 15px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.user-name { font-size: 13px; font-weight: 700; color: #f1f5f9; margin: 0 0 2px; }
.user-id   { font-size: 10px; color: #334155; margin: 0; }
.user-email { font-size: 12px; color: #94a3b8; }

.role-badge { display: inline-block; padding: 3px 9px; border-radius: 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.role-badge.admin { background: rgba(239,68,68,0.12); color: #fca5a5; border: 1px solid rgba(239,68,68,0.25); }
.role-badge.user  { background: rgba(59,130,246,0.12); color: #93c5fd; border: 1px solid rgba(59,130,246,0.25); }

.btn-del { padding: 6px 10px; border-radius: 8px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-del:hover { background: rgba(239,68,68,0.22); }
button:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 900px)  { .stats-row { grid-template-columns: 1fr; } }
@media (max-width: 768px)  { .admin-main { margin-left: 0; padding: 20px; } }
</style>
