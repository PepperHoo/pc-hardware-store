<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Toast from '../components/Toast.vue'

import { ref } from 'vue'

/*
  ─────────────────────────────────────────────────
  EMAILJS SETUP (one-time, free)
  ─────────────────────────────────────────────────
  1. Go to https://www.emailjs.com and create a free account
  2. Add an Email Service (e.g. Gmail) → copy the Service ID
  3. Create an Email Template with these variables:
       {{to_email}}   ← recipient's email address
       {{reset_link}} ← the reset URL
     Example template body:
       Hi, click the link below to reset your password:
       {{reset_link}}
     Copy the Template ID
  4. Go to Account → API Keys → copy the Public Key
  5. Replace the three constants below with your real values
  ─────────────────────────────────────────────────
*/
const EMAILJS_SERVICE_ID  = 'service_50rx02q'
const EMAILJS_TEMPLATE_ID = 'template_axtgfzd'
const EMAILJS_PUBLIC_KEY  = 'QqVpBwXRHLENzRlwn'

const toastRef = ref(null)

const email = ref('')

const loading = ref(false)

const submitted = ref(false)

// GENERATE RANDOM TOKEN
function generateToken() {

  return (
    Math.random().toString(36).substring(2, 18) +
    Math.random().toString(36).substring(2, 18)
  )
}

// SEND EMAIL VIA EMAILJS SDK
async function sendResetEmail(toEmail, resetLink) {

  await window.emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      to_email:   toEmail,
      reset_link: resetLink
    }
  )
}

// SUBMIT
async function submitForgot() {

  if (!email.value.trim()) {

    toastRef.value.showToastMessage(
      'Please enter your email',
      'error'
    )

    return
  }

  try {

    loading.value = true

    const {
      getAll,
      getWhere,
      remove,
      create
    } = await import('../lib/api.js')

    // CHECK USER EXISTS
    const users = await getAll('users')

    const user = users.find(
      u => u.email === email.value.trim()
    )

    if (!user) {

      toastRef.value.showToastMessage(
        'No account found with that email',
        'error'
      )

      return
    }

    // DELETE ANY EXISTING TOKEN FOR THIS EMAIL
    const existing = await getWhere(
      'passwordResets',
      'email',
      email.value.trim()
    )

    for (const record of existing) {

      await remove('passwordResets', record.id)
    }

    // CREATE NEW TOKEN
    const token = generateToken()

    await create('passwordResets', {
      email:     email.value.trim(),
      token,
      createdAt: Date.now(),
      approved:  false
    })

    // BUILD RESET LINK
    const resetLink =
      `${window.location.origin}/approve-reset?token=${token}`

    // SEND EMAIL
    await sendResetEmail(email.value.trim(), resetLink)

    submitted.value = true

  } catch (error) {

    console.error('EmailJS error:', error)

    toastRef.value.showToastMessage(
      error?.text || error?.message || 'Failed to send email. Check console for details.',
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

    <div class="fp-container">

      <div class="fp-card">

        <!-- ICON -->
        <div class="fp-icon">

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
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>

        </div>

        <!-- SUCCESS STATE -->
        <div v-if="submitted" class="fp-success">

          <div class="fp-success-icon">📬</div>

          <h2>Check Your Email</h2>

          <p>
            A password reset link has been sent to
            <strong>{{ email }}</strong>.
            Open your inbox and click the link
            to reset your password.
          </p>

          <div class="fp-notice">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18" height="18"
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

            <span>
              The link expires in 30 minutes.
              Check your spam folder if you don't
              see it in your inbox.
            </span>

          </div>

          <router-link to="/login" class="fp-back-link">
            ← Back to Login
          </router-link>

        </div>

        <!-- FORM STATE -->
        <div v-else>

          <h2 class="fp-title">Forgot Password</h2>

          <p class="fp-subtitle">
            Enter your registered email and we'll
            send you a password reset link.
          </p>

          <!-- EMAIL -->
          <div class="fp-group">

            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              v-model="email"
              @keyup.enter="submitForgot"
            />

          </div>

          <!-- BUTTON -->
          <button
            class="fp-btn"
            @click="submitForgot"
            :disabled="loading"
          >

            <span v-if="loading" class="fp-spinner"></span>

            {{
              loading
                ? 'Sending...'
                : 'Send Reset Link'
            }}

          </button>

          <router-link to="/login" class="fp-back-link">
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
.fp-container {

  display: flex;

  justify-content: center;

  align-items: center;

  min-height: calc(100vh - 80px);

  padding: 40px 20px;

  box-sizing: border-box;
}

/* CARD */
.fp-card {

  width: 100%;

  max-width: 480px;

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
.fp-card::before {

  content: '';

  position: absolute;

  top: 0;
  left: 0;

  width: 100%;

  height: 3px;

  background:
    linear-gradient(to right, #2563eb, #3b82f6, #60a5fa);
}

/* LOCK ICON */
.fp-icon {

  display: flex;

  justify-content: center;

  align-items: center;

  width: 72px;

  height: 72px;

  margin: 0 auto 28px;

  border-radius: 50%;

  background: rgba(59,130,246,0.12);

  border: 1px solid rgba(59,130,246,0.22);

  color: #60a5fa;
}

/* TITLE */
.fp-title {

  font-size: 34px;

  font-weight: 800;

  color: #f8fafc;

  margin-bottom: 12px;

  letter-spacing: -0.5px;
}

/* SUBTITLE */
.fp-subtitle {

  color: #94a3b8;

  font-size: 15px;

  line-height: 1.7;

  margin-bottom: 32px;
}

/* GROUP */
.fp-group {

  margin-bottom: 24px;

  text-align: left;
}

.fp-group label {

  display: block;

  margin-bottom: 8px;

  font-weight: 600;

  color: #cbd5e1;

  font-size: 14px;

  letter-spacing: 0.02em;
}

.fp-group input {

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

.fp-group input::placeholder {

  color: rgba(203,213,225,0.55);
}

.fp-group input:focus {

  border-color: #3b82f6;

  background: rgba(59,130,246,0.06);

  box-shadow: 0 0 0 3px rgba(59,130,246,0.14);
}

/* BUTTON */
.fp-btn {

  width: 100%;

  padding: 15px;

  border: none;

  border-radius: 14px;

  background: linear-gradient(135deg, #2563eb, #3b82f6);

  color: white;

  font-size: 16px;

  font-weight: 700;

  cursor: pointer;

  transition: 0.25s;

  margin-bottom: 20px;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 10px;
}

.fp-btn:hover:not(:disabled) {

  transform: translateY(-2px);

  box-shadow: 0 10px 24px rgba(37,99,235,0.30);
}

.fp-btn:disabled {

  opacity: 0.60;

  cursor: not-allowed;
}

/* INLINE SPINNER */
.fp-spinner {

  width: 18px;

  height: 18px;

  border: 2px solid rgba(255,255,255,0.35);

  border-top-color: white;

  border-radius: 50%;

  animation: spin 0.7s linear infinite;

  flex-shrink: 0;
}

@keyframes spin {

  to { transform: rotate(360deg); }
}

/* BACK LINK */
.fp-back-link {

  display: block;

  color: #64748b;

  font-size: 14px;

  text-decoration: none;

  margin-top: 16px;

  transition: color 0.2s;
}

.fp-back-link:hover {

  color: #93c5fd;
}

/* SUCCESS */
.fp-success {

  display: flex;

  flex-direction: column;

  align-items: center;

  gap: 20px;
}

.fp-success-icon {

  font-size: 56px;
}

.fp-success h2 {

  font-size: 28px;

  font-weight: 800;

  color: #f8fafc;
}

.fp-success p {

  color: #94a3b8;

  font-size: 15px;

  line-height: 1.7;
}

.fp-success p strong {

  color: #93c5fd;
}

/* NOTICE BOX */
.fp-notice {

  display: flex;

  align-items: flex-start;

  gap: 10px;

  width: 100%;

  background: rgba(245,158,11,0.08);

  border: 1px solid rgba(245,158,11,0.22);

  border-radius: 12px;

  padding: 14px 16px;

  text-align: left;

  color: #fcd34d;

  font-size: 13px;

  line-height: 1.6;
}

.fp-notice svg {

  flex-shrink: 0;

  margin-top: 2px;
}

/* MOBILE */
@media (max-width: 768px) {

  .fp-container { padding: 20px; }

  .fp-card { padding: 32px 24px; }

  .fp-title { font-size: 28px; }
}
</style>
