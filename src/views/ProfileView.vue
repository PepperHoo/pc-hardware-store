<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

import {
  ref,
  onMounted,
  computed
} from 'vue'

import {
  useRouter
} from 'vue-router'

const router = useRouter()

const user = ref(
  JSON.parse(
    localStorage.getItem('user')
  )
)

const orders = ref([])

const loading = ref(true)

const profileImage = ref(
  localStorage.getItem('profileImage')
  || ''
)

const address = ref(
  localStorage.getItem(
    'defaultAddress'
  ) || 'Kuching, Sarawak'
)

const birthday = ref(
  localStorage.getItem(
    'birthday'
  ) || ''
)

/* ADDRESS DETAILS */
const apartment = ref(
  localStorage.getItem('apartment')
  || ''
)

const city = ref(
  localStorage.getItem('city')
  || ''
)

const state = ref(
  localStorage.getItem('state')
  || ''
)

const zipCode = ref(
  localStorage.getItem('zipCode')
  || ''
)

/* PROFILE MODAL */
const showProfileModal = ref(false)

const editName = ref('')

const editEmail = ref('')

const editBirthday = ref('')

/* ADDRESS MODAL */
const showAddressModal = ref(false)

const editAddressValue = ref('')

const editApartment = ref('')

const editCity = ref('')

const editState = ref('')

const editZipCode = ref('')

const country = ref(
  localStorage.getItem('country')
  || 'Malaysia'
)

const editCountry = ref('')

// LOAD ORDERS
async function loadOrders() {

  if (!user.value) {

    loading.value = false

    return
  }

  try {

    const { getWhere } = await import('../lib/api.js')

    orders.value = await getWhere(
      'orders',
      'userEmail',
      user.value.email
    )

  } catch (error) {

    console.log(error)

  } finally {

    loading.value = false
  }
}

// TOTAL ORDERS
const totalOrders = computed(() => {

  return orders.value.length
})

// TOTAL SPENT
const totalSpent = computed(() => {

  let total = 0

  orders.value.forEach(order => {

    total += Number(
      order.total || 0
    )
  })

  return total.toFixed(2)
})

// PENDING ORDERS
const pendingOrders = computed(() => {

  return orders.value.filter(

    order =>

      order.status ===
      'Pending'

  ).length
})

// LOGOUT
function logout() {

  localStorage.removeItem('user')

  user.value = null

  router.push('/login')
}

// PROFILE IMAGE
function handleProfileUpload(event) {

  const file = event.target.files[0]

  if (!file) return

  const reader = new FileReader()

  reader.onload = () => {

    profileImage.value =
      reader.result

    localStorage.setItem(
      'profileImage',
      reader.result
    )
  }

  reader.readAsDataURL(file)
}

/* OPEN PROFILE MODAL */
function editProfile() {

  editName.value =
    user.value.username

  editEmail.value =
    user.value.email

  editBirthday.value =
    birthday.value

  showProfileModal.value = true
}

/* SAVE PROFILE */
function saveProfile() {

  user.value.username =
    editName.value

  user.value.email =
    editEmail.value

  birthday.value =
    editBirthday.value

  localStorage.setItem(
    'birthday',
    editBirthday.value
  )

  localStorage.setItem(
    'user',
    JSON.stringify(user.value)
  )

  showProfileModal.value = false
}

/* OPEN ADDRESS MODAL */
function editAddress() {

  editAddressValue.value =
    address.value

  editApartment.value =
    apartment.value

  editCity.value =
    city.value

  editState.value =
    state.value

  editZipCode.value =
    zipCode.value

  editCountry.value =
    country.value

  showAddressModal.value = true
}

/* SAVE ADDRESS */
function saveAddress() {

  address.value =
    editAddressValue.value

  apartment.value =
    editApartment.value

  city.value =
    editCity.value

  state.value =
    editState.value

  zipCode.value =
    editZipCode.value

  localStorage.setItem(
    'defaultAddress',
    editAddressValue.value
  )

  localStorage.setItem(
    'apartment',
    editApartment.value
  )

  localStorage.setItem(
    'city',
    editCity.value
  )

  localStorage.setItem(
    'state',
    editState.value
  )

  localStorage.setItem(
    'zipCode',
    editZipCode.value
  )

  country.value =
    editCountry.value

  localStorage.setItem(
    'country',
    editCountry.value
  )

  showAddressModal.value = false
}

// LOAD
onMounted(() => {

  loadOrders()
})
</script>

<template>
  <div>

    <Navbar />

    <!-- LAYOUT -->
    <div class="profile-layout">
      <!-- CONTENT -->
      <div class="profile-content">

        <div v-if="user">

          <!-- TITLE -->
          <h1
            class="
              profile-page-title
            "
          >
            My Profile
          </h1>

          <!-- MAIN CARD -->
          <div
            class="
              profile-main-card
            "
          >

            <!-- TOP -->
            <div
              class="
                profile-top-section
              "
            >

              <!-- AVATAR -->
              <div
                class="
                  profile-avatar-wrapper
                "
              >

                <img
                  :src="
                    profileImage ||
                    'https://via.placeholder.com/150'
                  "
                  class="profile-avatar"
                />

                <label
                  class="
                    profile-upload-btn
                  "
                >

                  Change Photo

                  <input
                    type="file"
                    accept="image/*"
                    @change="
                      handleProfileUpload
                    "
                    hidden
                  />

                </label>

              </div>

              <!-- INFO -->
              <div
                class="
                  profile-user-info
                "
              >

                <h2
                  class="
                    profile-username
                  "
                >
                  {{ user.username }}
                </h2>

                <p
                  class="
                    profile-email
                  "
                >
                  {{ user.email }}
                </p>

                <p
                  class="
                    profile-birthday
                  "
                  v-if="birthday"
                >
                  🎂 {{ birthday }}
                </p>

                <div
                  class="
                    profile-role
                  "
                >
                  {{ user.role }}
                </div>

              </div>

            </div>

            <!-- STATS -->
            <div
              class="
                profile-stats-grid
              "
            >

              <div
                class="
                  profile-stat-card
                "
              >

                <h3>
                  Total Orders
                </h3>

                <p>
                  {{ totalOrders }}
                </p>

              </div>

              <div
                class="
                  profile-stat-card
                "
              >

                <h3>
                  Total Spent
                </h3>

                <p>
                  RM {{ totalSpent }}
                </p>

              </div>

              <div
                class="
                  profile-stat-card
                "
              >

                <h3>
                  Pending Orders
                </h3>

                <p>
                  {{ pendingOrders }}
                </p>

              </div>

            </div>

            <!-- OVERVIEW -->
            <div
              class="
                profile-overview-grid
              "
            >

              <!-- PROFILE -->
              <div
                class="
                  profile-overview-card
                "
              >

                <div
                  class="
                    profile-card-top
                  "
                >

                  <h3>
                    My Profile
                  </h3>

                  <button
                    class="
                      profile-edit-btn
                    "
                    @click="editProfile"
                  >
                    Edit My Profile
                  </button>

                </div>

                <p>
                  <strong>Name:</strong>
                  {{ user.username }}
                </p>

                <p>
                  <strong>Email:</strong>
                  {{ user.email }}
                </p>

                <p>
                  <strong>Birthday:</strong>
                  {{ birthday || 'Not Set' }}
                </p>

              </div>

              <!-- ADDRESS -->
              <div
                class="
                  profile-overview-card
                "
              >

                <div
                  class="
                    profile-card-top
                  "
                >

                  <h3>
                    Default Address
                  </h3>

                  <button
                    class="
                      profile-edit-btn
                    "
                    @click="editAddress"
                  >
                    Edit Default Address
                  </button>

                </div>

                <p>
                  {{ address }}
                </p>

                <p v-if="apartment">
                  {{ apartment }}
                </p>

                <p v-if="city || state">
                  {{ city }}, {{ state }}
                </p>

                <p v-if="country || zipCode">
                  {{ country }} {{ zipCode }}
                </p>

              </div>

            </div>

            <!-- RECENT ORDER -->
            <div
              class="
                profile-recent-order
              "
            >

              <h3>
                Recent Orders
              </h3>

              <p
                v-if="
                  orders.length === 0
                "
              >
                You haven't created any orders yet.
              </p>

              <div v-else>

                Latest Order:
                #{{ orders[0].id }}

              </div>

            </div>

            <!-- ORDER BUTTON -->
            <router-link
              to="/orders"
              class="
                profile-orders-link
              "
            >

              <button
                class="
                  profile-orders-btn
                "
              >
                📦 View Order History
              </button>

            </router-link>

            <!-- LOGOUT -->
            <button
              class="
                profile-logout-btn
              "
              @click="logout"
            >
              Logout
            </button>

          </div>

        </div>

      </div>

    </div>

    <!-- PROFILE MODAL -->
    <div
      v-if="showProfileModal"
      class="profile-modal-overlay"
    >

      <div class="profile-modal-card">

        <div class="profile-modal-header">

          <h2>
            Edit Profile
          </h2>

          <button
            class="profile-close-btn"
            @click="
              showProfileModal = false
            "
          >
            ✕
          </button>

        </div>

        <div class="profile-input-group">

          <label>
            Full Name
          </label>

          <input
            v-model="editName"
            type="text"
          />

        </div>

        <div class="profile-input-group">

          <label>
            Email Address
          </label>

          <input
            v-model="editEmail"
            type="email"
          />

        </div>

        <div class="profile-input-group">

          <label>
            Birthday
          </label>

          <input
            v-model="editBirthday"
            type="date"
          />

        </div>

        <div class="profile-modal-actions">

          <button
            class="profile-cancel-btn"
            @click="
              showProfileModal = false
            "
          >
            Cancel
          </button>

          <button
            class="profile-save-btn"
            @click="saveProfile"
          >
            Save Changes
          </button>

        </div>

      </div>

    </div>

    <!-- ADDRESS MODAL -->
    <div
      v-if="showAddressModal"
      class="profile-modal-overlay"
    >

      <div class="profile-modal-card">

        <div class="profile-modal-header">

          <h2>
            Edit Address
          </h2>

          <button
            class="profile-close-btn"
            @click="
              showAddressModal = false
            "
          >
            ✕
          </button>

        </div>

        <!-- STREET ADDRESS -->
        <div class="profile-input-group">

          <label>
            Street Address
          </label>

          <input
            v-model="editAddressValue"
            type="text"
            placeholder="Street Address"
          />

        </div>

        <!-- ADDRESS LINE 2 -->
        <div class="profile-input-group">

          <input
            v-model="editApartment"
            type="text"
            placeholder="Apartment, suite, etc. (optional)"
          />

        </div>

        <!-- CITY + STATE -->
        <div class="address-grid">

          <div class="profile-input-group">

            <label>
              City
            </label>

            <input
              v-model="editCity"
              type="text"
              placeholder="Kuching"
            />

          </div>

          <div class="profile-input-group">

            <label>
              State / Region
            </label>

            <input
              v-model="editState"
              type="text"
              placeholder="Sarawak"
            />

          </div>

        </div>

        <!-- COUNTRY + ZIP -->
        <div class="address-grid">

          <div class="profile-input-group">

            <label>
              Country
            </label>

            <input
              v-model="editCountry"
              type="text"
              placeholder="Malaysia"
            />

          </div>

          <div class="profile-input-group">

            <label>
              ZIP Code
            </label>

            <input
              v-model="editZipCode"
              type="text"
              placeholder="93000"
            />

          </div>

        </div>

        <div class="profile-modal-actions">

          <button
            class="profile-cancel-btn"
            @click="
              showAddressModal = false
            "
          >
            Cancel
          </button>

          <button
            class="profile-save-btn"
            @click="saveAddress"
          >
            Save Changes
          </button>

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

  background:
    linear-gradient(
      to bottom right,
      #f4f7fb,
      #e8eef9
    );

  overflow-x: hidden;
}

/* LAYOUT */
.profile-layout {

  display: flex;

  justify-content: center;

  max-width: 1500px;

  margin: 0 auto;

  padding: 40px 60px;
}

/* CONTENT */
.profile-content {

  width: 100%;

  max-width: 1200px;
}

.profile-page-title {

  font-size: 58px;

  font-weight: 800;

  margin-bottom: 30px;

  color: #f8fafc;
}

/* MAIN CARD */
.profile-main-card {

  background:
    linear-gradient(
      145deg,
      #1e293b,
      #162032
    );

  border-radius: 30px;

  padding: 40px;

  border:
    1px solid rgba(59,130,246,0.16);

  box-shadow:
    0 24px 56px
    rgba(0,0,0,0.34);

  width: 100%;

  box-sizing: border-box;
}

/* TOP */
.profile-top-section {

  display: flex;

  align-items: center;

  gap: 40px;

  padding-bottom: 35px;

  border-bottom:
    1px solid rgba(59,130,246,0.16);

  margin-bottom: 35px;
}

.profile-avatar {

  width: 150px;

  height: 150px;

  border-radius: 50%;

  object-fit: cover;

  border: 3px solid #3b82f6;

  box-shadow:
    0 10px 20px
    rgba(59,130,246,0.28);
}

.profile-avatar-wrapper {

  width: 180px;

  display: flex;

  flex-direction: column;

  align-items: center;

  gap: 16px;

  flex-shrink: 0;
}

.profile-upload-btn {

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );

  color: white;

  padding: 10px 18px;

  border-radius: 12px;

  font-size: 14px;

  font-weight: bold;

  cursor: pointer;

  transition: 0.3s;
}

.profile-upload-btn:hover {

  transform:
    translateY(-2px);
}

.profile-user-info {

  flex: 1;
}

.profile-username {

  font-size: 48px;

  font-weight: bold;

  color: #f8fafc;

  margin-bottom: 12px;
}

.profile-email {

  color: #94a3b8;

  font-size: 18px;

  margin-bottom: 10px;
}

.profile-birthday {

  color: #94a3b8;

  font-size: 15px;

  margin-bottom: 16px;
}

.profile-role {

  display: inline-block;

  padding: 10px 18px;

  border-radius: 999px;

  background:
    rgba(59,130,246,0.13);

  color: #93c5fd;

  font-size: 13px;

  font-weight: bold;

  text-transform: uppercase;

  border:
    1px solid rgba(59,130,246,0.22);
}

/* STATS */
.profile-stats-grid {

  display: grid;

  grid-template-columns:
    repeat(3, 1fr);

  gap: 22px;

  margin-bottom: 30px;
}

.profile-stat-card {

  background:
    rgba(255,255,255,0.05);

  border-radius: 22px;

  padding: 30px 24px;

  text-align: center;

  border:
    1px solid rgba(59,130,246,0.14);

  min-height: 150px;

  display: flex;

  flex-direction: column;

  justify-content: center;
}

.profile-stat-card h3 {

  color: #94a3b8;

  font-size: 16px;

  margin-bottom: 14px;
}

.profile-stat-card p {

  font-size: 34px;

  font-weight: bold;

  color: #f8fafc;

  margin: 0;
}

/* OVERVIEW */
.profile-overview-grid {

  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 22px;

  margin-bottom: 22px;
}

.profile-overview-card {

  background:
    rgba(255,255,255,0.05);

  border-radius: 22px;

  padding: 24px;

  border:
    1px solid rgba(59,130,246,0.14);

  min-height: 180px;
}

.profile-overview-card p {

  margin: 10px 0;

  line-height: 1.7;

  color: #cbd5e1;
}

.profile-card-top {

  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 20px;
}

.profile-card-top h3 {

  margin: 0;

  font-size: 24px;
}

.profile-edit-btn {

  border:
    1px solid rgba(59,130,246,0.22);

  background:
    rgba(59,130,246,0.10);

  color: #93c5fd;

  padding: 10px 18px;

  border-radius: 12px;

  font-size: 14px;

  font-weight: 700;

  cursor: pointer;

  transition: 0.25s;
}

.profile-edit-btn:hover {

  background:
    rgba(59,130,246,0.18);

  color: #bfdbfe;

  transform: translateY(-2px);
}

/* RECENT ORDER */
.profile-recent-order {

  background:
    rgba(255,255,255,0.05);

  border-radius: 22px;

  padding: 28px;

  margin-top: 24px;

  margin-bottom: 30px;

  border:
    1px solid rgba(59,130,246,0.14);
}

/* BUTTONS */
.profile-orders-link {

  text-decoration: none;
}

.profile-orders-btn,
.profile-logout-btn {

  width: 100%;

  height: 56px;

  border: none;

  border-radius: 18px;

  color: white;

  font-size: 17px;

  font-weight: bold;

  cursor: pointer;

  transition: 0.3s;
}

.profile-orders-btn {

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );

  color: white;

  margin-bottom: 18px;
}

.profile-logout-btn {

  background:
    linear-gradient(
      135deg,
      #ef4444,
      #dc2626
    );
}

.profile-orders-btn:hover,
.profile-logout-btn:hover {

  transform:
    translateY(-2px);
}

/* MODAL */
.profile-modal-overlay {

  position: fixed;

  inset: 0;

  background:
    rgba(0,0,0,0.45);

  display: flex;

  align-items: center;

  justify-content: center;

  z-index: 999;
}

.profile-modal-card {

  width: 650px;

  background:
    linear-gradient(
      145deg,
      #111827,
      #0b1020
    );

  border-radius: 24px;

  padding: 30px;

  box-shadow:
    0 20px 40px
    rgba(0,0,0,0.42);

  border:
    1px solid rgba(59,130,246,0.16);

  animation:
    modalPop 0.25s ease;
}

.profile-modal-header {

  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 24px;
}

.profile-modal-header h2 {

  margin: 0;

  font-size: 28px;

  color: #f8fafc;
}

.profile-close-btn {

  border: none;

  background: transparent;

  font-size: 22px;

  cursor: pointer;

  color: #94a3b8;
}

.profile-input-group {

  margin-bottom: 20px;
}

.profile-input-group label {

  display: block;

  margin-bottom: 8px;

  font-weight: 600;

  color: #cbd5e1;
}

.profile-input-group input {

  width: 100%;

  height: 52px;

  border:
    1px solid rgba(59,130,246,0.18);

  background:
    rgba(2,6,23,0.48);

  color: #f8fafc;

  border-radius: 14px;

  padding: 0 16px;

  font-size: 15px;

  box-sizing: border-box;
}

.profile-input-group input:focus {

  outline: none;

  border-color: #3b82f6;

  box-shadow:
    0 0 0 3px rgba(59,130,246,0.14);
}

.address-grid {

  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 20px;
}

.profile-modal-actions {

  display: flex;

  justify-content: flex-end;

  gap: 14px;

  margin-top: 30px;
}

.profile-cancel-btn {

  border: none;

  background:
    rgba(255,255,255,0.10);

  color: #f8fafc;

  padding: 12px 20px;

  border-radius: 12px;

  font-weight: 600;

  cursor: pointer;
}

.profile-save-btn {

  border: none;

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );

  color: white;

  padding: 12px 22px;

  border-radius: 12px;

  font-weight: 700;

  cursor: pointer;

  transition: 0.25s;
}

.profile-save-btn:hover {

  transform: translateY(-2px);

  box-shadow:
    0 8px 18px rgba(37,99,235,0.28);
}

@keyframes modalPop {

  from {

    opacity: 0;

    transform:
      scale(0.9);
  }

  to {

    opacity: 1;

    transform:
      scale(1);
  }
}

/* RESPONSIVE */
@media (max-width: 992px) {

  .profile-layout {

    flex-direction: column;

    padding: 30px 20px;
  }

  .profile-sidebar {

    position: relative;

    top: 0;

    width: 100%;
  }

  .profile-content {

    max-width: 100%;
  }

  .profile-stats-grid {

    grid-template-columns:
      repeat(2, 1fr);
  }

  .profile-overview-grid {

    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {

  .profile-layout {

    padding: 20px;
  }

  .profile-page-title {

    font-size: 38px;

    text-align: center;
  }

  .profile-main-card {

    padding: 24px;
  }

  .profile-top-section {

    flex-direction: column;

    text-align: center;
  }

  .profile-avatar {

    width: 120px;

    height: 120px;
  }

  .profile-username {

    font-size: 34px;
  }

  .profile-user-info {

    display: flex;

    flex-direction: column;

    align-items: center;
  }

  .profile-stats-grid {

    grid-template-columns: 1fr;
  }

  .profile-overview-grid {

    grid-template-columns: 1fr;
  }

  .profile-sidebar {

    width: 100%;
  }

  .profile-sidebar h3 {

    font-size: 28px;
  }

  .profile-sidebar a {

    font-size: 15px;
  }
}
</style>
