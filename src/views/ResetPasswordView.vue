<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Toast from '../components/Toast.vue'

import { ref, onMounted } from 'vue'

import { useRoute, useRouter } from 'vue-router'

const route = useRoute()

const router = useRouter()

const toastRef = ref(null)

const tokenStatus = ref('loading') // 'loading' | 'valid' | 'invalid'

const tokenRecord = ref(null)

const newPassword = ref('')

const confirmPassword = ref('')

const loading = ref(false)

const done = ref(false)

const showNew = ref(false)

const showConfirm = ref(false)

// VERIFY TOKEN ON LOAD
onMounted(async () => {

  const token = route.query.token || ''

  if (!token) {

    tokenStatus.value = 'invalid'

    return
  }

  try {

    const { getWhere, getAll, update, remove } = await import('../lib/api.js')

    const records = await getWhere('passwordResets', 'token', token)

    if (!records.length) {

      tokenStatus.value = 'invalid'

      return
    }

    const record = records[0]

    // MUST BE APPROVED
    if (!record.approved) {

      tokenStatus.value = 'invalid'

      return
    }

    // CHECK EXPIRY (30 minutes)
    const age = Date.now() - record.createdAt

    if (age > 30 * 60 * 1000) {

      tokenStatus.value = 'invalid'

      return
    }

    tokenRecord.value = record

    tokenStatus.value = 'valid'

  } catch (error) {

    console.log(error)

    tokenStatus.value = 'invalid'
  }
})

// RESET PASSWORD
async function resetPassword() {

  if (!newPassword.value || !confirmPassword.value) {

    toastRef.value.showToastMessage(
      'Please fill all fields',
      'error'
    )

    return
  }

  if (newPassword.value !== confirmPassword.value) {

    toastRef.value.showToastMessage(
      'Passwords do not match',
      'error'
    )

    return
  }

  if (newPassword.value.length < 6) {

    toastRef.value.showToastMessage(
      'Password must be at least 6 characters',
      'error'
    )

    return
  }

  try {

    loading.value = true

    const { getAll, update, remove } = await import('../lib/api.js')

    // FIND USER BY EMAIL
    const users = await getAll('users')

    const user = users.find(
      u => u.email === tokenRecord.value.email
    )

    if (!user) {

      toastRef.value.showToastMessage(
        'User not found',
        'error'
      )

      return
    }

    // UPDATE PASSWORD
    await update('users', user.id, {
      password: newPassword.value
    })

    // DELETE USED TOKEN
    await remove('passwordResets', tokenRecord.value.id)

    done.value = true

    setTimeout(() => {

      router.push('/login')

    }, 2500)

  } catch (error) {

    console.log(error)

    toastRef.value.showToastMessage(
      'Server error. Please try again.',
      'error'
    )

  } finally {

    loading.value = false
  }
}
</script>

<template>
  <div>

    <Navbar />

    <div class="rp-container">

      <div class="rp-card">

        <!-- LOADING -->
        <div v-if="tokenStatus === 'loading'" class="rp-state">

          <div class="rp-spinner"></div>

          <p>Verifying your link...</p>

        </div>

        <!-- INVALID TOKEN -->
        <div v-else-if="tokenStatus === 'invalid'" class="rp-state">

          <div class="rp-icon rp-icon--error">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40" height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>

          </div>

          <h2>Invalid or Expired Link</h2>

          <p>
            This reset link is invalid, expired, or
            has not been approved. Please request
            a new one.
          </p>

          <router-link to="/forgot-password" class="rp-btn">
            Request New Link
          </router-link>

        </div>

        <!-- SUCCESS STATE -->
        <div v-else-if="done" class="rp-state">

          <div class="rp-icon rp-icon--success">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40" height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>

          </div>

          <h2>Password Reset!</h2>

          <p>
            Your password has been updated successfully.
            Redirecting you to login...
          </p>

        </div>

        <!-- RESET FORM -->
        <div v-else>

          <!-- SHIELD ICON -->
          <div class="rp-icon rp-icon--blue" style="margin: 0 auto 28px">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="38" height="38"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>

          </div>

          <h2 class="rp-title">Reset Password</h2>

          <p class="rp-subtitle">
            Resetting password for
            <strong>{{ tokenRecord?.email }}</strong>
          </p>

          <!-- NEW PASSWORD -->
          <div class="rp-group">

            <label>New Password</label>

            <div class="password-wrapper">

              <input
                :type="showNew ? 'text' : 'password'"
                placeholder="Enter new password"
                v-model="newPassword"
                @keyup.enter="resetPassword"
              />

              <button
                type="button"
                class="toggle-pw-btn"
                @click="showNew = !showNew"
                tabindex="-1"
              >

                <svg v-if="!showNew" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>

                <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>

              </button>

            </div>

          </div>

          <!-- CONFIRM PASSWORD -->
          <div class="rp-group">

            <label>Confirm New Password</label>

            <div class="password-wrapper">

              <input
                :type="showConfirm ? 'text' : 'password'"
                placeholder="Confirm new password"
                v-model="confirmPassword"
                @keyup.enter="resetPassword"
              />

              <button
                type="button"
                class="toggle-pw-btn"
                @click="showConfirm = !showConfirm"
                tabindex="-1"
              >

                <svg v-if="!showConfirm" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>

                <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>

              </button>

            </div>

          </div>

          <!-- BUTTON -->
          <button
            class="rp-btn"
            @click="resetPassword"
            :disabled="loading"
          >

            {{
              loading
                ? 'Resetting...'
                : 'Reset Password'
            }}

          </button>

          <router-link to="/login" class="rp-back-link">
            ← Back to Login
          </router-link>

        </div>

      </div>

    </div>

    <Toast ref="toastRef" />

    <Footer />

  </div>
</template>

<style scoped>

/* CONTAINER */
.rp-container {

  display: flex;

  justify-content: center;

  align-items: center;

  min-height: calc(100vh - 80px);

  padding: 40px 20px;

  box-sizing: border-box;
}

/* CARD */
.rp-card {

  width: 100%;

  max-width: 460px;

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.98),
      rgba(15,23,42,0.98)
    );

  padding: 48px;

  border-radius: 24px;

  border: 1px solid rgba(148,163,184,0.12);

  box-shadow: 0 20px 50px rgba(0,0,0,0.32);

  position: relative;

  overflow: hidden;

  text-align: center;
}

/* TOP ACCENT */
.rp-card::before {

  content: '';

  position: absolute;

  top: 0;
  left: 0;

  width: 100%;

  height: 3px;

  background:
    linear-gradient(to right, #2563eb, #3b82f6, #60a5fa);
}

/* STATE */
.rp-state {

  display: flex;

  flex-direction: column;

  align-items: center;

  gap: 18px;
}

.rp-state h2 {

  font-size: 28px;

  font-weight: 800;

  color: #f8fafc;
}

.rp-state p {

  color: #94a3b8;

  font-size: 15px;

  line-height: 1.7;
}

/* ICONS */
.rp-icon {

  display: flex;

  justify-content: center;

  align-items: center;

  width: 80px;

  height: 80px;

  border-radius: 50%;
}

.rp-icon--blue {

  background: rgba(59,130,246,0.12);

  border: 1px solid rgba(59,130,246,0.22);

  color: #60a5fa;
}

.rp-icon--success {

  background: rgba(16,185,129,0.12);

  border: 1px solid rgba(16,185,129,0.28);

  color: #6ee7b7;
}

.rp-icon--error {

  background: rgba(239,68,68,0.12);

  border: 1px solid rgba(239,68,68,0.28);

  color: #fca5a5;
}

/* SPINNER */
.rp-spinner {

  width: 52px;

  height: 52px;

  border: 4px solid rgba(59,130,246,0.15);

  border-top-color: #3b82f6;

  border-radius: 50%;

  animation: spin 0.8s linear infinite;
}

@keyframes spin {

  to { transform: rotate(360deg); }
}

/* TITLE */
.rp-title {

  font-size: 34px;

  font-weight: 800;

  color: #f8fafc;

  margin-bottom: 10px;

  letter-spacing: -0.5px;
}

/* SUBTITLE */
.rp-subtitle {

  color: #94a3b8;

  font-size: 15px;

  margin-bottom: 28px;
}

.rp-subtitle strong {

  color: #93c5fd;
}

/* GROUP */
.rp-group {

  margin-bottom: 20px;

  text-align: left;
}

.rp-group label {

  display: block;

  margin-bottom: 8px;

  font-weight: 600;

  color: #cbd5e1;

  font-size: 14px;

  letter-spacing: 0.02em;
}

.rp-group input {

  width: 100%;

  padding: 14px 16px;

  border-radius: 12px;

  border: 1px solid rgba(148,163,184,0.18);

  background: rgba(255,255,255,0.06);

  color: #f8fafc;

  font-size: 15px;

  outline: none;

  transition: 0.3s;

  box-sizing: border-box;
}

.rp-group input::placeholder {

  color: rgba(203,213,225,0.55);
}

.rp-group input:focus {

  border-color: #3b82f6;

  background: rgba(59,130,246,0.06);

  box-shadow: 0 0 0 3px rgba(59,130,246,0.14);
}

/* PASSWORD WRAPPER */
.password-wrapper {

  position: relative;

  display: flex;

  align-items: center;
}

.password-wrapper input {

  padding-right: 50px !important;
}

/* TOGGLE */
.toggle-pw-btn {

  position: absolute;

  right: 14px;

  background: none;

  border: none;

  cursor: pointer;

  color: #64748b;

  padding: 0;

  display: flex;

  align-items: center;

  transition: color 0.2s;
}

.toggle-pw-btn:hover {

  color: #93c5fd;
}

/* BUTTON */
.rp-btn {

  display: inline-block;

  width: 100%;

  padding: 15px;

  border: none;

  border-radius: 14px;

  background: linear-gradient(135deg, #2563eb, #3b82f6);

  color: white;

  font-size: 16px;

  font-weight: 700;

  cursor: pointer;

  text-decoration: none;

  transition: 0.25s;

  margin-top: 8px;

  margin-bottom: 20px;
}

.rp-btn:hover:not(:disabled) {

  transform: translateY(-2px);

  box-shadow: 0 10px 24px rgba(37,99,235,0.30);
}

.rp-btn:disabled {

  opacity: 0.55;

  cursor: not-allowed;
}

/* BACK LINK */
.rp-back-link {

  display: block;

  color: #64748b;

  font-size: 14px;

  text-decoration: none;

  transition: color 0.2s;
}

.rp-back-link:hover {

  color: #93c5fd;
}

/* MOBILE */
@media (max-width: 768px) {

  .rp-container { padding: 20px; }

  .rp-card { padding: 32px 24px; }

  .rp-title { font-size: 28px; }
}
</style>
