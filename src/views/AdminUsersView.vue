<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import Toast from '../components/Toast.vue'

import {
  ref,
  onMounted,
  computed
} from 'vue'

const users = ref([])

const search = ref('')

const loading = ref(true)

const errorMessage = ref('')

const deletingId = ref(null)

const toastRef = ref(null)

// LOAD USERS
async function loadUsers() {

  try {

    loading.value = true

    const { getAll } = await import('../lib/api.js')

    users.value = await getAll('users')

  } catch (error) {

    console.log(error)

    errorMessage.value =
      'Failed to load users.'

  } finally {

    loading.value = false
  }
}

onMounted(() => {
  loadUsers()
})

// SEARCH FILTER
const filteredUsers =
  computed(() => {

    return users.value.filter(

      user => {

        // HIDE ADMIN USERS
        if (
          user.role === 'admin'
        ) {
          return false
        }

        // SEARCH FILTER
        return (

          (
            user.username || ''
          )
            .toLowerCase()
            .includes(
              search.value.toLowerCase()
            )

          ||

          (
            user.email || ''
          )
            .toLowerCase()
            .includes(
              search.value.toLowerCase()
            )

        )
      }
    )
  })

// TOTAL USERS
const totalUsers =
  computed(() => {

    return users.value.length
  })

// ADMIN COUNT
const adminCount =
  computed(() => {

    return users.value.filter(

      user =>

        user.role === 'admin'

    ).length
  })

// CUSTOMER COUNT
const customerCount =
  computed(() => {

    return users.value.filter(

      user =>

        user.role !== 'admin'

    ).length
  })

// DELETE USER
async function deleteUser(id) {

  try {

    deletingId.value = id

    const { remove } = await import('../lib/api.js')

    await remove('users', id)

    users.value =
      users.value.filter(

        user =>
          user.id !== id

      )

    toastRef.value
      .showToastMessage(
        'User removed successfully!',
        'success'
      )

  } catch (error) {

    console.log(error)

    toastRef.value
      .showToastMessage(
        'Failed to remove user',
        'error'
      )

  } finally {

    deletingId.value = null
  }
}

// AVATAR INITIAL
function getInitial(name) {

  return name

    ? name
        .charAt(0)
        .toUpperCase()

    : '?'
}
</script>

<template>
  <div>

    <AdminNavbar />

    <div
      class="
        admin-users-container
      "
    >

      <!-- LOADING -->
      <div
        v-if="loading"
        class="status-box"
      >
        Loading users...
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

        <!-- HEADER -->
        <div
          class="
            admin-users-header
          "
        >

          <h1>
            Users Management
          </h1>

          <p>
            Manage customer accounts
          </p>

        </div>

        <!-- SUMMARY -->
        <div
          class="
            admin-users-summary-grid
          "
        >

          <!-- TOTAL -->
          <div
            class="
              admin-users-summary-card
              admin-users-blue
            "
          >

            <h2>
              👥 Total Users
            </h2>

            <p>
              {{ totalUsers }}
            </p>

          </div>

          <!-- ADMINS -->
          <div
            class="
              admin-users-summary-card
              admin-users-purple
            "
          >

            <h2>
              🛡 Admins
            </h2>

            <p>
              {{ adminCount }}
            </p>

          </div>

          <!-- CUSTOMERS -->
          <div
            class="
              admin-users-summary-card
              admin-users-green
            "
          >

            <h2>
              👤 Customers
            </h2>

            <p>
              {{ customerCount }}
            </p>

          </div>

        </div>

        <!-- SEARCH -->
        <div
          class="
            admin-users-search-box
          "
        >

          <input
            v-model="search"
            placeholder="
              Search username or email...
            "
          />

        </div>

        <!-- TABLE -->
        <div
          class="
            admin-users-table-wrapper
          "
        >

          <table
            class="
              admin-users-table
            "
          >

            <thead>

              <tr>

                <th>
                  User
                </th>

                <th>
                  Email
                </th>

                <th>
                  Role
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              <!-- EMPTY -->
              <tr
                v-if="
                  filteredUsers.length === 0
                "
              >

                <td
                  colspan="4"
                  class="empty-row"
                >
                  No users found.
                </td>

              </tr>

              <!-- USERS -->
              <tr
                v-for="
                  user in filteredUsers
                "
                :key="user.id"
              >

                <!-- USER -->
                <td>

                  <div
                    class="
                      admin-users-user-info
                    "
                  >

                    <div
                      class="
                        admin-users-avatar
                      "
                    >

                      {{
                        getInitial(
                          user.username
                        )
                      }}

                    </div>

                    <div>

                      <div
                        class="
                          admin-users-username
                        "
                      >

                        {{
                          user.username
                        }}

                      </div>

                      <div
                        class="
                          admin-users-userid
                        "
                      >

                        ID:
                        {{ user.id }}

                      </div>

                    </div>

                  </div>

                </td>

                <!-- EMAIL -->
                <td
                  class="
                    admin-users-email
                  "
                >

                  {{ user.email }}

                </td>

                <!-- ROLE -->
                <td>

                  <span
                    class="
                      admin-users-role
                    "
                    :class="
                      user.role
                    "
                  >

                    {{ user.role }}

                  </span>

                </td>

                <!-- ACTION -->
                <td>

                  <button
                    class="
                      admin-users-delete-btn
                    "
                    @click="
                      deleteUser(user.id)
                    "
                    :disabled="
                      deletingId ===
                      user.id
                    "
                  >

                    {{

                      deletingId ===
                      user.id

                        ? 'Removing...'

                        : 'Remove'

                    }}

                  </button>

                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </div>

    </div>

    <Toast ref="toastRef" />

  </div>
</template>

<style scoped>

/* CONTAINER */
.admin-users-container {

  margin-left: 260px;

  min-height: 100vh;

  padding: 40px;

  background:
    linear-gradient(
      to bottom,
      #0f172a,
      #111827
    );

  box-sizing: border-box;
}

/* HEADER */
.admin-users-header {

  margin-bottom: 32px;
}

.admin-users-header h1 {

  font-size: 48px;

  font-weight: 800;

  margin-bottom: 10px;

  color: #f8fafc;

  letter-spacing: -0.5px;
}

.admin-users-header p {

  color: #94a3b8;

  font-size: 17px;
}

/* SUMMARY */
.admin-users-summary-grid {

  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(220px,1fr)
    );

  gap: 20px;

  margin-bottom: 32px;
}

/* CARD */
.admin-users-summary-card {

  padding: 26px 28px;

  border-radius: 18px;

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.97),
      rgba(15,23,42,0.97)
    );

  border:
    1px solid rgba(148,163,184,0.10);

  box-shadow:
    0 8px 24px rgba(0,0,0,0.22);

  transition: 0.30s cubic-bezier(0.4,0,0.2,1);
}

.admin-users-summary-card:hover {

  transform: translateY(-4px);

  box-shadow:
    0 14px 34px rgba(0,0,0,0.30);
}

.admin-users-summary-card h2 {

  margin-bottom: 10px;

  font-size: 18px;

  font-weight: 600;
}

.admin-users-summary-card p {

  font-size: 44px;

  font-weight: 800;

  margin: 0;
}

/* ACCENT COLORS */
.admin-users-blue {

  border-left: 4px solid #3b82f6;
}

.admin-users-blue h2 { color: #93c5fd; }
.admin-users-blue p  { color: #bfdbfe; }

.admin-users-purple {

  border-left: 4px solid #8b5cf6;
}

.admin-users-purple h2 { color: #c4b5fd; }
.admin-users-purple p  { color: #ddd6fe; }

.admin-users-green {

  border-left: 4px solid #10b981;
}

.admin-users-green h2 { color: #6ee7b7; }
.admin-users-green p  { color: #a7f3d0; }

/* SEARCH */
.admin-users-search-box {

  margin-bottom: 28px;
}

.admin-users-search-box input {

  width: 100%;

  max-width: 450px;

  padding: 14px 18px;

  border-radius: 14px;

  border:
    1px solid rgba(148,163,184,0.18);

  background:
    rgba(255,255,255,0.06);

  color: #f1f5f9;

  font-size: 15px;

  outline: none;

  transition: 0.3s;
}

.admin-users-search-box input::placeholder {

  color: rgba(203,213,225,0.55);
}

.admin-users-search-box input:focus {

  border-color: #3b82f6;

  box-shadow:
    0 0 0 3px rgba(59,130,246,0.14);
}

/* TABLE WRAPPER */
.admin-users-table-wrapper {

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.97),
      rgba(15,23,42,0.97)
    );

  border:
    1px solid rgba(148,163,184,0.10);

  border-radius: 20px;

  overflow-x: auto;

  box-shadow:
    0 8px 24px rgba(0,0,0,0.22);
}

/* TABLE */
.admin-users-table {

  width: 100%;

  border-collapse: separate;

  border-spacing: 0;
}

/* HEADER */
.admin-users-table thead tr {

  background:
    rgba(59,130,246,0.10);
}

.admin-users-table thead th {

  padding: 18px 20px;

  text-align: center;

  color: #93c5fd;

  font-size: 13px;

  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.06em;
}

/* ROW */
.admin-users-table tbody tr {

  border-bottom:
    1px solid rgba(148,163,184,0.08);

  transition: 0.2s;
}

.admin-users-table tbody tr:hover {

  background:
    rgba(59,130,246,0.05);
}

/* CELL */
.admin-users-table td {

  padding: 20px 18px;

  text-align: center;

  vertical-align: middle;

  color: #cbd5e1;
}

/* EMPTY */
.empty-row {

  padding: 50px;

  color: #94a3b8;

  font-size: 17px;
}

/* USER INFO */
.admin-users-user-info {

  display: flex;

  align-items: center;

  gap: 16px;
}

/* AVATAR */
.admin-users-avatar {

  width: 50px;

  height: 50px;

  border-radius: 50%;

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );

  color: white;

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 20px;

  font-weight: 800;

  flex-shrink: 0;

  box-shadow:
    0 4px 12px rgba(37,99,235,0.28);
}

/* USERNAME */
.admin-users-username {

  font-weight: 700;

  font-size: 15px;

  color: #f1f5f9;

  text-align: left;
}

/* USER ID */
.admin-users-userid {

  font-size: 12px;

  color: #94a3b8;

  margin-top: 4px;

  text-align: left;
}

/* EMAIL */
.admin-users-email {

  font-weight: 500;

  color: #cbd5e1;
}

/* ROLE */
.admin-users-role {

  display: inline-block;

  padding: 7px 14px;

  border-radius: 999px;

  font-size: 11px;

  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.06em;
}

/* ROLE COLORS — dark variants */
.admin-users-role.admin {

  background: rgba(239,68,68,0.14);

  color: #fca5a5;

  border: 1px solid rgba(239,68,68,0.28);
}

.admin-users-role.user {

  background: rgba(59,130,246,0.13);

  color: #93c5fd;

  border: 1px solid rgba(59,130,246,0.24);
}

/* DELETE BUTTON */
.admin-users-delete-btn {

  background:
    linear-gradient(
      135deg,
      #dc2626,
      #ef4444
    );

  color: white;

  border: none;

  padding: 10px 18px;

  border-radius: 10px;

  cursor: pointer;

  font-weight: 700;

  font-size: 13px;

  transition: 0.25s;
}

.admin-users-delete-btn:hover {

  transform: translateY(-2px);

  box-shadow:
    0 8px 18px rgba(239,68,68,0.28);
}

/* DISABLED */
button:disabled {

  opacity: 0.5;

  cursor: not-allowed;

  transform: none !important;
}

/* STATUS / ERROR BOX */
.status-box,
.error-box {

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.97),
      rgba(15,23,42,0.97)
    );

  border:
    1px solid rgba(148,163,184,0.10);

  padding: 28px;

  border-radius: 20px;

  font-size: 18px;

  color: #94a3b8;
}

.error-box {

  color: #f87171;
}

/* MOBILE */
@media (max-width: 768px) {

  .admin-users-container {

    margin-left: 0;

    padding: 20px;
  }

  .admin-users-header h1 {

    font-size: 34px;
  }

  .admin-users-summary-grid {

    grid-template-columns: 1fr;
  }

  .admin-users-table {

    min-width: 720px;
  }

  .admin-users-search-box input {

    max-width: 100%;
  }
}
</style>