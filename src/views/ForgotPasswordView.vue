<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Toast from '../components/Toast.vue'
import { ref } from 'vue'

const EMAILJS_SERVICE_ID  = 'service_50rx02q'
const EMAILJS_TEMPLATE_ID = 'template_axtgfzd'
const EMAILJS_PUBLIC_KEY  = 'QqVpBwXRHLENzRlwn'

const toastRef = ref(null)
const email    = ref('')
const loading  = ref(false)
const submitted = ref(false)

function generateToken() {
  return Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18)
}

async function sendResetEmail(toEmail, resetLink) {
  await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { to_email: toEmail, reset_link: resetLink })
}

async function submitForgot() {
  if (!email.value.trim()) {
    toastRef.value.showToastMessage('Please enter your email', 'error'); return
  }
  try {
    loading.value = true
    const { getAll, getWhere, remove, create } = await import('../lib/api.js')
    const users = await getAll('users')
    const user  = users.find(u => u.email === email.value.trim())
    if (!user) {
      toastRef.value.showToastMessage('No account found with that email', 'error'); return
    }
    const existing = await getWhere('passwordResets', 'email', email.value.trim())
    for (const record of existing) await remove('passwordResets', record.id)
    const token = generateToken()
    await create('passwordResets', { email: email.value.trim(), token, createdAt: Date.now(), approved: false })
    const resetLink = `${window.location.origin}/approve-reset?token=${token}`
    await sendResetEmail(email.value.trim(), resetLink)
    submitted.value = true
  } catch (error) {
    console.error('EmailJS error:', error)
    toastRef.value.showToastMessage(error?.text || error?.message || 'Failed to send email.', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <Navbar />

    <main class="auth-main">
      <div class="orb orb-1" />
      <div class="orb orb-2" />

      <div class="auth-card glass">
        <div class="card-bar" />

        <!-- Icon -->
        <div class="auth-icon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <!-- Success state -->
        <div v-if="submitted" class="success-state">
          <div class="success-icon">📬</div>
          <h2 class="success-title">Check Your Email</h2>
          <p class="success-desc">
            A password reset link has been sent to
            <span class="highlight">{{ email }}</span>.
            Click the link in your inbox to reset your password.
          </p>
          <div class="notice-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Link expires in 30 minutes. Check your spam folder if needed.</span>
          </div>
          <router-link to="/login" class="back-link">← Back to Login</router-link>
        </div>

        <!-- Form state -->
        <div v-else>
          <span class="kicker" style="display:block;text-align:center;margin-bottom:16px;">Password Recovery</span>
          <h1 class="auth-title">Forgot <span class="grad-text">Password?</span></h1>
          <p class="auth-sub">Enter your email and we'll send you a reset link.</p>

          <div class="field-group">
            <label class="field-label">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              v-model="email"
              class="field-input"
              @keyup.enter="submitForgot"
            />
          </div>

          <button class="auth-btn" @click="submitForgot" :disabled="loading">
            <svg v-if="!loading" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div v-else class="spinner" />
            {{ loading ? 'Sending...' : 'Send Reset Link' }}
          </button>

          <router-link to="/login" class="back-link">← Back to Login</router-link>
        </div>
      </div>
    </main>

    <Toast ref="toastRef" />
    <Footer />
  </div>
</template>

<style scoped>
.auth-page { background: #030712; min-height: 100vh; }
.auth-main {
  position: relative; display: flex; align-items: center; justify-content: center;
  min-height: 100vh; padding: 120px 20px 60px; overflow: hidden;
}
.orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
.orb-1 { width: 360px; height: 360px; background: rgba(59,130,246,0.1); top: 15%; left: 20%; }
.orb-2 { width: 280px; height: 280px; background: rgba(139,92,246,0.08); bottom: 20%; right: 15%; }

.auth-card {
  position: relative; width: 100%; max-width: 440px;
  padding: 48px; border-radius: 28px;
  border: 1px solid rgba(255,255,255,0.08);
  overflow: hidden; text-align: center;
  animation: cardIn 0.7s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes cardIn {
  from { opacity: 0; transform: perspective(800px) rotateX(8deg) translateY(40px); }
  to   { opacity: 1; transform: perspective(800px) rotateX(0deg) translateY(0); }
}
.card-bar {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #2563eb, #8b5cf6, #34d399);
}
.auth-icon {
  width: 64px; height: 64px; border-radius: 18px;
  background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);
  display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
}
.auth-title {
  font-family: 'Orbitron', sans-serif; font-size: 28px; font-weight: 900; color: #f1f5f9;
  margin: 0 0 8px; line-height: 1.1;
}
.auth-sub { color: #475569; font-size: 14px; margin: 0 0 28px; line-height: 1.6; }

.field-group { margin-bottom: 20px; text-align: left; }
.field-label { display: block; font-size: 13px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; }
.field-input {
  width: 100%; padding: 13px 16px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; color: #f1f5f9; font-size: 15px; outline: none;
  transition: all 0.25s; box-sizing: border-box;
}
.field-input::placeholder { color: #334155; }
.field-input:focus { border-color: #3b82f6; background: rgba(59,130,246,0.07); box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }

.auth-btn {
  width: 100%; padding: 14px 20px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
  color: white; border: none; border-radius: 14px;
  font-family: 'Orbitron', sans-serif; font-size: 12px; font-weight: 800; letter-spacing: 0.06em;
  cursor: pointer; transition: all 0.3s; margin-bottom: 16px;
}
.auth-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(29,78,216,0.4); }
.auth-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.spinner {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.back-link { display: block; color: #475569; font-size: 13px; text-decoration: none; margin-top: 4px; transition: color 0.2s; }
.back-link:hover { color: #60a5fa; }

/* Success */
.success-state { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.success-icon { font-size: 60px; }
.success-title { font-family: 'Orbitron', sans-serif; font-size: 22px; font-weight: 800; color: #f1f5f9; margin: 0; }
.success-desc { color: #64748b; font-size: 14px; line-height: 1.7; margin: 0; }
.highlight { color: #60a5fa; font-weight: 600; }
.notice-box {
  display: flex; align-items: flex-start; gap: 8px; width: 100%;
  padding: 12px 14px; border-radius: 12px;
  background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);
  color: #fcd34d; font-size: 12px; line-height: 1.6; text-align: left;
}
.notice-box svg { flex-shrink: 0; margin-top: 1px; }

@media (max-width: 480px) {
  .auth-card { padding: 32px 20px; }
  .auth-title { font-size: 22px; }
}
</style>
