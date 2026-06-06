<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Toast from '../components/Toast.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useWishlistStore } from '../stores/wishlist'
import { setSessionUser } from '../lib/session.js'

const router = useRouter()
const cart = useCartStore()
const wishlist = useWishlistStore()
const toastRef = ref(null)
const email = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function login() {
  if (!email.value || !password.value) {
    toastRef.value.showToastMessage('Please fill all fields', 'error')
    return
  }
  try {
    loading.value = true
    const { getAll } = await import('../lib/api.js')
    const users = await getAll('users')
    const user = users.find(u => u.email === email.value && u.password === password.value)
    if (!user) {
      toastRef.value.showToastMessage('Invalid email or password', 'error')
      return
    }
    const normalizedUser = {
      ...user,
      role: String(user.role || 'user').trim().toLowerCase()
    }
    setSessionUser(normalizedUser)
    if (normalizedUser.role === 'admin') {
      cart.reset()
      wishlist.reset()
    } else {
      await Promise.all([
        cart.load(normalizedUser.email, { mergeCurrent: true }),
        wishlist.load(normalizedUser.email)
      ])
    }
    toastRef.value.showToastMessage('Login Successful!', 'success')
    setTimeout(() => {
      router.push(normalizedUser.role === 'admin' ? '/admin' : '/profile')
    }, 1200)
  } catch (error) {
    console.log(error)
    toastRef.value.showToastMessage('Server Error', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <Navbar />

    <main class="auth-main">
      <!-- Ambient orbs -->
      <div class="orb orb-1" />
      <div class="orb orb-2" />

      <div class="auth-card glass">
        <!-- Top gradient bar -->
        <div class="card-bar" />

        <!-- Icon -->
        <div class="auth-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="3" y="8" width="26" height="18" rx="4" stroke="#3b82f6" stroke-width="2"/>
            <path d="M10 8V6a6 6 0 0 1 12 0v2" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
            <circle cx="16" cy="17" r="3" fill="#3b82f6"/>
          </svg>
        </div>

        <span class="kicker" style="display:block;text-align:center;margin-bottom:16px;">Welcome Back</span>
        <h1 class="auth-title">Sign <span class="grad-text">In</span></h1>
        <p class="auth-sub">Login to continue shopping the best PC hardware.</p>

        <div class="demo-accounts" aria-label="Demo login accounts">
          <div class="demo-account">
            <p class="demo-title">Demo - User</p>
            <div class="demo-values">
              <code>demo@gmail.com</code>
              <span>/</span>
              <code>demo123</code>
            </div>
          </div>

          <div class="demo-account">
            <p class="demo-title">Demo - Admin</p>
            <div class="demo-values">
              <code>admin@gmail.com</code>
              <span>/</span>
              <code>123456</code>
            </div>
          </div>
        </div>

        <!-- Email -->
        <div class="field-group">
          <label class="field-label">Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            v-model="email"
            class="field-input"
            @keyup.enter="login"
          />
        </div>

        <!-- Password -->
        <div class="field-group">
          <label class="field-label">Password</label>
          <div class="pw-wrap">
            <input
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              v-model="password"
              class="field-input"
              @keyup.enter="login"
            />
            <button type="button" class="eye-btn" @click="showPassword = !showPassword" tabindex="-1">
              <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="forgot-row">
          <router-link to="/forgot-password" class="forgot-link">Forgot password?</router-link>
        </div>

        <button class="auth-btn" @click="login" :disabled="loading">
          <span>{{ loading ? 'Signing in...' : 'Sign In' }}</span>
          <svg v-if="!loading" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none" class="spin">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="20" stroke-dashoffset="10"/>
          </svg>
        </button>

        <p class="switch-text">
          Don't have an account?
          <router-link to="/register" class="switch-link">Create one</router-link>
        </p>
      </div>
    </main>

    <Toast ref="toastRef" />
    <Footer />
  </div>
</template>

<style scoped>
.auth-page { background: #030712; min-height: 100vh; }

.auth-main {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  min-height: 100vh;
  padding: 120px 20px 60px;
  overflow: hidden;
}

/* Orbs */
.orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
.orb-1 { width: 400px; height: 400px; background: rgba(59,130,246,0.12); top: 10%; left: 15%; }
.orb-2 { width: 300px; height: 300px; background: rgba(139,92,246,0.10); bottom: 15%; right: 15%; }

/* Card */
.auth-card {
  position: relative;
  width: 100%; max-width: 460px;
  padding: 48px;
  border-radius: 28px;
  border: 1px solid rgba(255,255,255,0.08);
  overflow: hidden;
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

/* Icon */
.auth-icon {
  width: 64px; height: 64px; border-radius: 18px;
  background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.2);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}

.auth-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 36px; font-weight: 900; color: #f1f5f9;
  text-align: center; margin: 0 0 8px; line-height: 1.1;
}
.auth-sub { text-align: center; color: #475569; font-size: 14px; margin: 0 0 32px; line-height: 1.6; }

.demo-accounts {
  display: grid;
  gap: 12px;
  margin: -12px 0 28px;
}

.demo-account {
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(15,23,42,0.82);
  border: 1px solid rgba(148,163,184,0.18);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 24px rgba(2,6,23,0.18);
  transition: background 0.25s, border-color 0.25s, box-shadow 0.25s;
}

.demo-title {
  margin: 0 0 8px;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 800;
  transition: color 0.25s;
}

.demo-values {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  color: #94a3b8;
  font-size: 12px;
  transition: color 0.25s;
}

.demo-values code {
  padding: 4px 7px;
  border-radius: 6px;
  background: rgba(59,130,246,0.14);
  color: #93c5fd;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 800;
  transition: background 0.25s, color 0.25s;
}

/* Fields */
.field-group { margin-bottom: 20px; }
.field-label { display: block; font-size: 13px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; letter-spacing: 0.04em; }
.field-input {
  width: 100%; padding: 13px 16px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; color: #f1f5f9; font-size: 15px; outline: none;
  transition: all 0.25s; box-sizing: border-box;
}
.field-input::placeholder { color: #334155; }
.field-input:focus { border-color: #3b82f6; background: rgba(59,130,246,0.07); box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }

/* Password */
.pw-wrap { position: relative; }
.pw-wrap .field-input { padding-right: 48px; }
.eye-btn {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: #475569; cursor: pointer;
  display: flex; align-items: center; transition: color 0.2s;
}
.eye-btn:hover { color: #60a5fa; }

.forgot-row { text-align: right; margin-bottom: 24px; margin-top: -8px; }
.forgot-link { font-size: 13px; color: #60a5fa; text-decoration: none; font-weight: 600; }
.forgot-link:hover { color: #93c5fd; }

/* Button */
.auth-btn {
  width: 100%; padding: 14px 24px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
  color: white; border: none; border-radius: 14px;
  font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.05em;
  cursor: pointer; transition: all 0.3s;
}
.auth-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(29,78,216,0.4); }
.auth-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.switch-text { text-align: center; margin-top: 24px; color: #475569; font-size: 14px; }
.switch-link { color: #60a5fa; font-weight: 700; text-decoration: none; }
.switch-link:hover { color: #93c5fd; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.9s linear infinite; }

@media (max-width: 520px) {
  .auth-card { padding: 32px 24px; }
  .auth-title { font-size: 28px; }
  .demo-account { padding: 12px; }
  .demo-values code { font-size: 11px; }
}

:global([data-theme="light"]) .demo-account,
:global(:root[data-theme="light"]) .demo-account {
  background: rgba(255,255,255,0.92) !important;
  border-color: rgba(37,99,235,0.16) !important;
  box-shadow: 0 12px 28px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.86) !important;
}

:global([data-theme="light"]) .demo-title,
:global(:root[data-theme="light"]) .demo-title {
  color: #334155 !important;
}

:global([data-theme="light"]) .demo-values,
:global(:root[data-theme="light"]) .demo-values {
  color: #64748b !important;
}

:global([data-theme="light"]) .demo-values code,
:global(:root[data-theme="light"]) .demo-values code {
  background: rgba(37,99,235,0.10) !important;
  color: #1d4ed8 !important;
  border: 1px solid rgba(37,99,235,0.14) !important;
}
</style>
