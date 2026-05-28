<script setup>
import AdminNavbar from '../components/AdminNavbar.vue'
import { ref, onMounted } from 'vue'

const bannerImages = ref([])

const hotSelling = ref([])

const latestProducts = ref([])

const loading = ref(true)

const saving = ref(false)

const successMessage = ref('')

const errorMessage = ref('')

// Store the id of the homepage row
const homepageId = ref(null)

// LOAD DATA
async function loadHomepage() {

  try {

    loading.value = true

    const { getAll } = await import('../lib/api.js')

    const rows = await getAll('homepage')

    const data = rows[0] || {}

    homepageId.value = data.id ?? null

    bannerImages.value =
      data.banners || []

    hotSelling.value =
      data.hotSelling || []

    latestProducts.value =
      data.latestProducts || []

  } catch (error) {

    console.log(error)

    errorMessage.value =
      'Failed to load homepage data.'

  } finally {

    loading.value = false
  }
}

onMounted(() => {
  loadHomepage()
})

// SAVE DATA
async function saveHomepage() {

  try {

    saving.value = true

    successMessage.value = ''

    errorMessage.value = ''

    const updatedData = {

      banners:
        bannerImages.value,

      hotSelling:
        hotSelling.value,

      latestProducts:
        latestProducts.value
    }

    const { update } = await import('../lib/api.js')

    await update('homepage', homepageId.value, updatedData)

    successMessage.value =
      'Homepage updated successfully!'

  } catch (error) {

    console.log(error)

    errorMessage.value =
      'Failed to update homepage.'

  } finally {

    saving.value = false
  }
}

// BANNER IMAGE
function handleBannerUpload(event) {

  const files = event.target.files

  if (!files.length) return

  for (let file of files) {

    const reader =
      new FileReader()

    reader.onload = () => {

      bannerImages.value.push(
        reader.result
      )
    }

    reader.readAsDataURL(file)
  }
}

// HOT SELLING IMAGE
function handleHotSellingUpload(
  event,
  index
) {

  const file =
    event.target.files[0]

  if (!file) return

  const reader =
    new FileReader()

  reader.onload = () => {

    hotSelling.value[index].image =
      reader.result
  }

  reader.readAsDataURL(file)
}

// LATEST PRODUCT IMAGE
function handleLatestUpload(
  event,
  index
) {

  const file =
    event.target.files[0]

  if (!file) return

  const reader =
    new FileReader()

  reader.onload = () => {

    latestProducts.value[index].image =
      reader.result
  }

  reader.readAsDataURL(file)
}

// REMOVE BANNER
function removeBanner(index) {

  bannerImages.value.splice(
    index,
    1
  )
}

// REMOVE HOT SELLING IMAGE
function removeHotSellingImage(
  index
) {

  hotSelling.value[index].image =
    ''
}

// REMOVE LATEST PRODUCT IMAGE
function removeLatestProductImage(
  index
) {

  latestProducts.value[index].image =
    ''
}

// ADD HOT SELLING PRODUCT
function addHotSellingProduct() {

  hotSelling.value.push({

    name: '',

    image: ''
  })
}

// REMOVE HOT SELLING PRODUCT
function removeHotSellingProduct(index) {

  hotSelling.value.splice(
    index,
    1
  )
}

// ADD LATEST PRODUCT
function addLatestProduct() {

  latestProducts.value.push({

    name: '',

    image: ''
  })
}

// REMOVE LATEST PRODUCT
function removeLatestProduct(index) {

  latestProducts.value.splice(
    index,
    1
  )
}
</script>

<template>
  <div>

    <AdminNavbar />

    <div class="admin-homepage-container">

      <!-- LOADING -->
      <div
        v-if="loading"
        class="status-box"
      >
        Loading homepage...
      </div>

      <!-- MAIN -->
      <div v-else>

        <h1>
          Manage Homepage
        </h1>

        <!-- SUCCESS -->
        <div
          v-if="successMessage"
          class="success-box"
        >
          {{ successMessage }}
        </div>

        <!-- ERROR -->
        <div
          v-if="errorMessage"
          class="error-box"
        >
          {{ errorMessage }}
        </div>

        <!-- BANNER -->
        <div class="admin-homepage-card">

          <div class="banner-header">

            <div>

              <h2>
                Homepage Banner
              </h2>

              <p class="banner-subtitle">
                Upload slideshow images
                for the homepage banner
              </p>

            </div>

          </div>

          <div
            v-if="bannerImages.length === 0"
            class="empty-banner-box"
          >

            <div class="empty-icon">
              🖼️
            </div>

            <p>
              No banner images uploaded
            </p>

          </div>

          <div
            v-else
            class="banner-grid"
          >

            <div
              class="banner-card"
              v-for="(
                image,
                index
              ) in bannerImages"
              :key="index"
            >

              <img
                :src="image"
                class="preview-banner"
              />

              <div class="banner-number">

                Slide
                {{ index + 1 }}

              </div>

              <button
                class="remove-btn"
                @click="
                  removeBanner(index)
                "
              >
                Remove Banner
              </button>

            </div>

          </div>

          <label
            class="
              upload-banner-box
            "
          >

            <div class="upload-icon">
              ⬆️
            </div>

            <p>
              Click to upload
              banner images
            </p>

            <span>
              Multiple images supported
            </span>

            <input
              type="file"
              accept="image/*"
              multiple
              @change="
                handleBannerUpload
              "
              hidden
            />

          </label>

        </div>

        <!-- HOT SELLING -->
        <div class="admin-homepage-card">

          <div class="banner-header">

            <div>

              <h2>
                Hot Selling Products
              </h2>

              <p class="banner-subtitle">
                Upload hot selling products
                for homepage display
              </p>

            </div>

            <button
              class="add-btn"
              @click="addHotSellingProduct"
            >
              + Add Product
            </button>

          </div>

          <div
            v-if="hotSelling.length === 0"
            class="empty-banner-box"
          >

            <div class="empty-icon">
              🔥
            </div>

            <p>
              No hot selling products
            </p>

          </div>

          <div
            v-else
            class="banner-grid"
          >

            <div
              class="banner-card"
              v-for="(
                product,
                index
              ) in hotSelling"
              :key="index"
            >

              <img
                v-if="product.image"
                :src="product.image"
                class="preview-banner"
              />

              <input
                v-model="product.name"
                placeholder="Product Name"
              />

              <label
                class="mini-upload-box"
              >

                <div class="mini-upload-icon">
                  ⬆️
                </div>

                <span>
                  Upload Product Image
                </span>

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  @change="
                    handleHotSellingUpload(
                      $event,
                      index
                    )
                  "
                />

              </label>

              <div v-if="product.image">

                <div class="banner-number">

                  Product
                  {{ index + 1 }}

                </div>

                <button
                  class="remove-btn"
                  @click="
                    removeHotSellingImage(
                      index
                    )
                  "
                >
                  Remove Image
                </button>

              </div>

              <button
                class="delete-product-btn"
                @click="
                  removeHotSellingProduct(
                    index
                  )
                "
              >
                Delete Product
              </button>

            </div>

          </div>

        </div>

        <!-- LATEST PRODUCTS -->
        <div class="admin-homepage-card">

          <div class="banner-header">

            <div>

              <h2>
                Latest Products
              </h2>

              <p class="banner-subtitle">
                Upload latest products
                for homepage display
              </p>

            </div>

            <button
              class="add-btn"
              @click="addLatestProduct"
            >
              + Add Product
            </button>

          </div>

          <div
            v-if="
              latestProducts.length === 0
            "
            class="empty-banner-box"
          >

            <div class="empty-icon">
              🆕
            </div>

            <p>
              No latest products
            </p>

          </div>

          <div
            v-else
            class="banner-grid"
          >

            <div
              class="banner-card"
              v-for="(
                product,
                index
              ) in latestProducts"
              :key="index"
            >

              <img
                v-if="product.image"
                :src="product.image"
                class="preview-banner"
              />

              <input
                v-model="product.name"
                placeholder="Product Name"
              />

              <label
                class="mini-upload-box"
              >

                <div class="mini-upload-icon">
                  ⬆️
                </div>

                <span>
                  Upload Product Image
                </span>

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  @change="
                    handleLatestUpload(
                      $event,
                      index
                    )
                  "
                />

              </label>

              <div v-if="product.image">

                <div class="banner-number">

                  Product
                  {{ index + 1 }}

                </div>

                <button
                  class="remove-btn"
                  @click="
                    removeLatestProductImage(
                      index
                    )
                  "
                >
                  Remove Image
                </button>

              </div>

              <button
                class="delete-product-btn"
                @click="
                  removeLatestProduct(
                    index
                  )
                "
              >
                Delete Product
              </button>

            </div>

          </div>

        </div>

        <!-- SAVE -->
        <button
          class="save-btn"
          @click="saveHomepage"
          :disabled="saving"
        >

          {{
            saving
              ? 'Saving...'
              : 'Save Homepage'
          }}

        </button>

      </div>

    </div>

  </div>
</template>

<style scoped>

/* CONTAINER */
.admin-homepage-container {

  margin-left: 260px;

  padding: 40px;

  min-height: 100vh;

  background:
    linear-gradient(
      to bottom,
      #0f172a,
      #111827
    );

  box-sizing: border-box;
}

/* TITLE */
h1 {

  font-size: 46px;

  margin-bottom: 10px;

  color: #f8fafc;

  font-weight: 800;

  letter-spacing: -0.5px;
}

/* CARD */
.admin-homepage-card {

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

  margin-bottom: 30px;

  box-shadow:
    0 8px 24px rgba(0,0,0,0.22);
}

/* HEADER */
.banner-header {

  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 20px;

  margin-bottom: 20px;
}

/* TITLE */
.admin-homepage-card h2 {

  margin-bottom: 8px;

  font-size: 28px;

  font-weight: 700;

  color: #f1f5f9;
}

/* SUBTITLE */
.banner-subtitle {

  color: #94a3b8;

  font-size: 15px;
}

/* INPUT */
input {

  width: 100%;

  padding: 14px;

  margin-bottom: 15px;

  border:
    1px solid rgba(148,163,184,0.18);

  border-radius: 10px;

  background:
    rgba(255,255,255,0.06);

  color: #f1f5f9;

  box-sizing: border-box;

  font-size: 15px;

  transition: 0.3s;
}

input:focus {

  border-color: #3b82f6;

  box-shadow:
    0 0 0 3px rgba(59,130,246,0.14);
}

/* EMPTY */
.empty-banner-box {

  background:
    rgba(59,130,246,0.04);

  border: 2px dashed rgba(148,163,184,0.25);

  border-radius: 18px;

  padding: 40px;

  text-align: center;

  margin-bottom: 25px;

  color: #94a3b8;
}

.empty-icon {

  font-size: 48px;

  margin-bottom: 12px;
}

/* GRID */
.banner-grid {

  display: grid;

  grid-template-columns:
    repeat(auto-fit, minmax(300px,1fr));

  gap: 24px;

  margin-bottom: 30px;
}

/* CARD */
.banner-card {

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.97),
      rgba(15,23,42,0.97)
    );

  border:
    1px solid rgba(148,163,184,0.10);

  border-radius: 20px;

  overflow: hidden;

  padding: 16px;

  box-shadow:
    0 8px 24px rgba(0,0,0,0.22);

  transition: 0.30s cubic-bezier(0.4,0,0.2,1);
}

.banner-card:hover {

  transform: translateY(-4px);

  border-color: rgba(59,130,246,0.24);

  box-shadow:
    0 16px 40px rgba(0,0,0,0.30);
}

/* IMAGE */
.preview-banner {

  width: 100%;

  height: 220px;

  object-fit: cover;

  border-radius: 14px;

  margin-bottom: 14px;
}

/* NUMBER */
.banner-number {

  display: inline-block;

  background: rgba(59,130,246,0.14);

  color: #93c5fd;

  border: 1px solid rgba(59,130,246,0.24);

  padding: 6px 14px;

  border-radius: 999px;

  font-size: 13px;

  font-weight: bold;

  margin-bottom: 14px;
}

/* UPLOAD */
.upload-banner-box {

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  gap: 10px;

  background:
    rgba(59,130,246,0.05);

  border: 2px dashed rgba(59,130,246,0.30);

  border-radius: 22px;

  padding: 40px;

  cursor: pointer;

  transition: 0.3s;

  color: #93c5fd;
}

.upload-banner-box:hover {

  background:
    rgba(59,130,246,0.10);

  border-color: rgba(59,130,246,0.55);
}

/* MINI UPLOAD */
.mini-upload-box {

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  gap: 8px;

  background:
    rgba(59,130,246,0.05);

  border: 2px dashed rgba(59,130,246,0.28);

  border-radius: 16px;

  padding: 18px;

  margin-top: 14px;

  margin-bottom: 16px;

  cursor: pointer;

  transition: 0.3s;

  color: #93c5fd;
}

.mini-upload-box:hover {

  background:
    rgba(59,130,246,0.10);

  border-color: rgba(59,130,246,0.50);
}

.mini-upload-icon {

  font-size: 28px;
}

/* ICON */
.upload-icon {

  font-size: 42px;
}

/* ADD BUTTON */
.add-btn {

  background:
    linear-gradient(135deg, #2563eb, #3b82f6);

  color: white;

  border: none;

  padding: 12px 20px;

  border-radius: 12px;

  cursor: pointer;

  font-weight: bold;

  transition: 0.25s;

  box-shadow:
    0 6px 16px rgba(37,99,235,0.22);
}

.add-btn:hover {

  transform: translateY(-2px);

  box-shadow:
    0 10px 22px rgba(37,99,235,0.32);
}

/* SAVE BUTTON */
.save-btn {

  width: 100%;

  padding: 16px;

  background:
    linear-gradient(135deg, #2563eb, #3b82f6);

  color: white;

  border: none;

  border-radius: 14px;

  cursor: pointer;

  font-size: 18px;

  font-weight: bold;

  transition: 0.25s;

  box-shadow:
    0 6px 16px rgba(37,99,235,0.22);
}

.save-btn:hover {

  transform: translateY(-2px);

  box-shadow:
    0 12px 28px rgba(37,99,235,0.32);
}

/* REMOVE */
.remove-btn {

  background:
    linear-gradient(135deg, #dc2626, #ef4444);

  color: white;

  border: none;

  padding: 10px 18px;

  border-radius: 10px;

  cursor: pointer;

  font-weight: bold;

  transition: 0.25s;
}

.remove-btn:hover {

  transform: translateY(-2px);

  box-shadow:
    0 8px 18px rgba(239,68,68,0.28);
}

/* DELETE PRODUCT */
.delete-product-btn {

  margin-top: 14px;

  width: 100%;

  background:
    linear-gradient(135deg, #dc2626, #ef4444);

  color: white;

  border: none;

  padding: 12px;

  border-radius: 12px;

  cursor: pointer;

  font-weight: bold;

  transition: 0.25s;
}

.delete-product-btn:hover {

  transform: translateY(-2px);

  box-shadow:
    0 10px 22px rgba(239,68,68,0.28);
}

/* STATUS */
.status-box,
.success-box,
.error-box {

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.97),
      rgba(15,23,42,0.97)
    );

  border:
    1px solid rgba(148,163,184,0.10);

  padding: 18px;

  border-radius: 14px;

  margin-bottom: 20px;

  box-shadow:
    0 8px 24px rgba(0,0,0,0.22);

  color: #94a3b8;
}

.success-box {

  color: #6ee7b7;

  border-color: rgba(16,185,129,0.20);
}

.error-box {

  color: #fca5a5;

  border-color: rgba(239,68,68,0.20);
}

/* MOBILE */
@media (max-width: 768px) {

  .admin-homepage-container {

    margin-left: 0;

    padding: 20px;
  }

  .banner-header {

    flex-direction: column;

    align-items: flex-start;
  }

  h1 {

    font-size: 34px;
  }

  .admin-homepage-card h2 {

    font-size: 24px;
  }

  .banner-grid {

    grid-template-columns: 1fr;
  }
}
</style>