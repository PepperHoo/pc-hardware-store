<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

import { ref, onMounted } from 'vue'

import { useRoute, useRouter } from 'vue-router'

const route = useRoute()

const router = useRouter()

const status = ref('loading') // 'loading' | 'valid' | 'invalid'

const email = ref('')

const token = ref('')

onMounted(async () => {

  token.value = route.query.token || ''

  if (!token.value) {

    status.value = 'invalid'

    return
  }

  try {

    const { getWhere, remove, update } = await import('../lib/api.js')

    // LOOK UP TOKEN
    const records = await getWhere('passwordResets', 'token', token.value)

    if (!records.length) {

      status.value = 'invalid'

      return
    }

    const record = records[0]

    // CHECK EXPIRY (30 minutes)
    const age = Date.now() - record.createdAt

    if (age > 30 * 60 * 1000) {

      // DELETE EXPIRED TOKEN
      await remove('passwordResets', record.id)

      status.value = 'expired'

      return
    }

    // MARK AS APPROVED
    await update('passwordResets', record.id, { approved: true })

    email.value = record.email

    status.value = 'valid'

  } catch (error) {

    console.log(error)

    status.value = 'invalid'
  }
})

function proceed() {

  router.push(
    `/reset-password?token=${token.value}`
  )
}
</script>

<template>
  <div>

    <Navbar />

    <div class="ar-container">

      <div class="ar-card">

        <!-- LOADING -->
        <div v-if="status === 'loading'" class="ar-state">

          <div class="ar-spinner"></div>

          <p>Verifying your reset link...</p>

        </div>

        <!-- VALID -->
        <div v-else-if="status === 'valid'" class="ar-state">

          <div class="ar-icon ar-icon--success">

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

          <h2>Link Verified!</h2>

          <p>
            Your reset link for
            <strong>{{ email }}</strong>
            has been verified. Click below
            to set your new password.
          </p>

          <button class="ar-btn" @click="proceed">
            Proceed to Reset Password
          </button>

        </div>

        <!-- EXPIRED -->
        <div v-else-if="status === 'expired'" class="ar-state">

          <div class="ar-icon ar-icon--warn">

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
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>

          </div>

          <h2>Link Expired</h2>

          <p>
            This reset link has expired (valid for 30 minutes).
            Please request a new one.
          </p>

          <router-link to="/forgot-password" class="ar-btn">
            Request New Link
          </router-link>

        </div>

        <!-- INVALID -->
        <div v-else class="ar-state">

          <div class="ar-icon ar-icon--error">

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

          <h2>Invalid Link</h2>

          <p>
            This reset link is invalid or has already been used.
            Please request a new one.
          </p>

          <router-link to="/forgot-password" class="ar-btn">
            Request New Link
          </router-link>

        </div>

        <router-link to="/login" class="ar-back-link">
          ← Back to Login
        </router-link>

      </div>

    </div>

    <Footer />

  </div>
</template>

<style scoped>

/* CONTAINER */
.ar-container {

  display: flex;

  justify-content: center;

  align-items: center;

  min-height: calc(100vh - 80px);

  padding: 40px 20px;

  box-sizing: border-box;
}

/* CARD */
.ar-card {

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
.ar-card::before {

  content: '';

  position: absolute;

  top: 0;
  left: 0;

  width: 100%;

  height: 3px;

  background:
    linear-gradient(to right, #2563eb, #3b82f6, #60a5fa);
}

/* STATE WRAPPER */
.ar-state {

  display: flex;

  flex-direction: column;

  align-items: center;

  gap: 18px;
}

.ar-state h2 {

  font-size: 30px;

  font-weight: 800;

  color: #f8fafc;
}

.ar-state p {

  color: #94a3b8;

  font-size: 15px;

  line-height: 1.7;
}

.ar-state p strong {

  color: #93c5fd;
}

/* ICONS */
.ar-icon {

  display: flex;

  justify-content: center;

  align-items: center;

  width: 80px;

  height: 80px;

  border-radius: 50%;

  margin-bottom: 8px;
}

.ar-icon--success {

  background: rgba(16,185,129,0.12);

  border: 1px solid rgba(16,185,129,0.28);

  color: #6ee7b7;
}

.ar-icon--warn {

  background: rgba(245,158,11,0.12);

  border: 1px solid rgba(245,158,11,0.28);

  color: #fcd34d;
}

.ar-icon--error {

  background: rgba(239,68,68,0.12);

  border: 1px solid rgba(239,68,68,0.28);

  color: #fca5a5;
}

/* SPINNER */
.ar-spinner {

  width: 52px;

  height: 52px;

  border: 4px solid rgba(59,130,246,0.15);

  border-top-color: #3b82f6;

  border-radius: 50%;

  animation: spin 0.8s linear infinite;

  margin-bottom: 8px;
}

@keyframes spin {

  to { transform: rotate(360deg); }
}

/* BUTTON */
.ar-btn {

  display: inline-block;

  padding: 14px 32px;

  background: linear-gradient(135deg, #2563eb, #3b82f6);

  color: white;

  border: none;

  border-radius: 14px;

  font-size: 15px;

  font-weight: 700;

  cursor: pointer;

  text-decoration: none;

  transition: 0.25s;

  margin-top: 8px;
}

.ar-btn:hover {

  transform: translateY(-2px);

  box-shadow: 0 10px 24px rgba(37,99,235,0.30);
}

/* BACK LINK */
.ar-back-link {

  display: block;

  color: #64748b;

  font-size: 14px;

  text-decoration: none;

  margin-top: 28px;

  transition: color 0.2s;
}

.ar-back-link:hover {

  color: #93c5fd;
}

/* MOBILE */
@media (max-width: 768px) {

  .ar-container { padding: 20px; }

  .ar-card { padding: 32px 24px; }
}
</style>
