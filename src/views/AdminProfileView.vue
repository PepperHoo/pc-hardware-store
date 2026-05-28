<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import Toast from '../components/Toast.vue'

import {
  ref,
  onMounted
} from 'vue'

import {
  useRouter
} from 'vue-router'

const router = useRouter()

const toastRef = ref(null)

const user = ref(
  JSON.parse(
    localStorage.getItem('user')
  )
)

const profileImage = ref(
  localStorage.getItem('adminProfileImage') || ''
)

const editName = ref('')
const editEmail = ref('')
const editPhone = ref('')
const editTitle = ref('')
const saving = ref(false)

function syncForm() {

  editName.value =
    user.value?.username ||
    user.value?.name ||
    'Admin User'

  editEmail.value =
    user.value?.email || ''

  editPhone.value =
    localStorage.getItem('adminPhone') || ''

  editTitle.value =
    localStorage.getItem('adminTitle') ||
    'Hardware Store Administrator'
}

function handleProfileUpload(event) {

  const file = event.target.files[0]

  if (!file) return

  const reader = new FileReader()

  reader.onload = () => {

    profileImage.value =
      reader.result

    localStorage.setItem(
      'adminProfileImage',
      reader.result
    )

    toastRef.value.showToastMessage(
      'Profile photo updated',
      'success'
    )
  }

  reader.readAsDataURL(file)
}

async function saveProfile() {

  if (
    !editName.value.trim() ||
    !editEmail.value.trim()
  ) {

    toastRef.value.showToastMessage(
      'Name and email are required',
      'error'
    )

    return
  }

  const updatedUser = {
    ...user.value,
    username: editName.value,
    email: editEmail.value
  }

  try {

    saving.value = true

    if (updatedUser.id) {

      const { update } = await import('../lib/api.js')

      await update('users', updatedUser.id, updatedUser)
    }

    user.value = updatedUser

    localStorage.setItem(
      'user',
      JSON.stringify(updatedUser)
    )

    localStorage.setItem(
      'adminPhone',
      editPhone.value
    )

    localStorage.setItem(
      'adminTitle',
      editTitle.value
    )

    toastRef.value.showToastMessage(
      'Admin profile saved',
      'success'
    )

  } catch (error) {

    console.log(error)

    toastRef.value.showToastMessage(
      'Failed to save profile',
      'error'
    )

  } finally {

    saving.value = false
  }
}

function logout() {

  localStorage.removeItem('user')

  router.push('/login')
}

onMounted(() => {

  if (
    !user.value ||
    String(user.value.role).toLowerCase() !== 'admin'
  ) {

    router.push(
      user.value
        ? '/profile'
        : '/login'
    )

    return
  }

  syncForm()
})
</script>

<template>
  <div>
    <AdminNavbar />

    <main class="admin-profile-page">
      <section class="admin-profile-hero">
        <div>
          <p class="admin-profile-label">
            Admin Profile
          </p>

          <h1>
            Control center settings
          </h1>

          <p>
            Manage your administrator identity, account details, and profile image.
          </p>
        </div>

        <button
          class="logout-btn"
          @click="logout"
        >
          Logout
        </button>
      </section>

      <section class="admin-profile-grid">
        <aside class="admin-profile-card profile-preview">
          <div class="avatar-frame">
            <img
              v-if="profileImage"
              :src="profileImage"
              alt="Admin profile"
            />

            <span v-else>
              {{
                editName
                  ? editName.charAt(0).toUpperCase()
                  : 'A'
              }}
            </span>
          </div>

          <h2>
            {{ editName || 'Admin User' }}
          </h2>

          <p>
            {{ editTitle }}
          </p>

          <label class="upload-btn">
            Upload Photo

            <input
              type="file"
              accept="image/*"
              hidden
              @change="handleProfileUpload"
            />
          </label>
        </aside>

        <section class="admin-profile-card profile-form">
          <div class="form-heading">
            <h2>
              Edit Profile
            </h2>

            <p>
              Changes are saved to your active admin session.
            </p>
          </div>

          <div class="form-grid">
            <label>
              Full Name

              <input
                v-model="editName"
                type="text"
                placeholder="Admin name"
              />
            </label>

            <label>
              Email

              <input
                v-model="editEmail"
                type="email"
                placeholder="admin@email.com"
              />
            </label>

            <label>
              Phone

              <input
                v-model="editPhone"
                type="text"
                placeholder="+60..."
              />
            </label>

            <label>
              Role Title

              <input
                v-model="editTitle"
                type="text"
                placeholder="Store administrator"
              />
            </label>
          </div>

          <button
            class="save-btn"
            :disabled="saving"
            @click="saveProfile"
          >
            {{
              saving
                ? 'Saving...'
                : 'Save Profile'
            }}
          </button>
        </section>
      </section>
    </main>

    <Toast ref="toastRef" />
  </div>
</template>

<style scoped>
.admin-profile-page {
  min-height: 100vh;
  margin-left: 260px;
  padding: 42px;
  background:
    radial-gradient(
      circle at top right,
      rgba(34,211,238,0.12),
      transparent 34%
    ),
    linear-gradient(
      135deg,
      #070b14,
      #101827 54%,
      #121826
    );
  color: #f8fafc;
}

.admin-profile-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 28px;
  margin-bottom: 28px;
}

.admin-profile-label {
  margin: 0 0 12px;
  color: #7dd3fc;
  font-weight: 900;
  text-transform: uppercase;
}

.admin-profile-hero h1 {
  margin: 0;
  font-size: 44px;
  line-height: 1.1;
}

.admin-profile-hero p {
  max-width: 640px;
  margin: 14px 0 0;
  color: #cbd5e1;
  line-height: 1.7;
}

.logout-btn,
.save-btn,
.upload-btn {
  border: none;
  border-radius: 8px;
  font-weight: 900;
  cursor: pointer;
}

.logout-btn {
  padding: 14px 22px;
  background:
    linear-gradient(
      135deg,
      #ef4444,
      #b91c1c
    );
  color: white;
}

.admin-profile-grid {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 24px;
  max-width: 1180px;
}

.admin-profile-card {
  border: 1px solid rgba(125,211,252,0.16);
  border-radius: 10px;
  background:
    linear-gradient(
      145deg,
      rgba(15,23,42,0.98),
      rgba(17,24,39,0.92)
    );
  box-shadow:
    0 24px 56px rgba(0,0,0,0.34);
}

.profile-preview {
  padding: 28px;
  text-align: center;
}

.avatar-frame {
  width: 160px;
  height: 160px;
  margin: 0 auto 22px;
  border-radius: 50%;
  border: 2px solid rgba(34,211,238,0.7);
  background:
    linear-gradient(
      135deg,
      #0f172a,
      #164e63
    );
  display: grid;
  place-items: center;
  overflow: hidden;
  box-shadow:
    0 0 42px rgba(34,211,238,0.18);
}

.avatar-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-frame span {
  color: #7dd3fc;
  font-size: 64px;
  font-weight: 900;
}

.profile-preview h2,
.form-heading h2 {
  margin: 0;
  color: #f8fafc;
}

.profile-preview p,
.form-heading p {
  color: #94a3b8;
  line-height: 1.6;
}

.upload-btn {
  display: inline-flex;
  margin-top: 18px;
  padding: 13px 18px;
  background:
    rgba(34,211,238,0.12);
  color: #7dd3fc;
  border:
    1px solid rgba(34,211,238,0.26);
}

.profile-form {
  padding: 30px;
}

.form-heading {
  margin-bottom: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.form-grid label {
  color: #cbd5e1;
  font-weight: 800;
}

.form-grid input {
  width: 100%;
  height: 52px;
  margin-top: 9px;
  padding: 0 14px;
  border: 1px solid rgba(125,211,252,0.18);
  border-radius: 8px;
  background: rgba(2,6,23,0.48);
  color: #f8fafc;
  font-size: 15px;
}

.form-grid input:focus {
  border-color: #22d3ee;
  box-shadow: 0 0 0 4px rgba(34,211,238,0.12);
}

.save-btn {
  margin-top: 24px;
  height: 52px;
  padding: 0 24px;
  background:
    linear-gradient(
      135deg,
      #0284c7,
      #22d3ee
    );
  color: #06121f;
}

.save-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 980px) {
  .admin-profile-page {
    margin-left: 0;
    padding: 26px;
  }

  .admin-profile-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-profile-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
