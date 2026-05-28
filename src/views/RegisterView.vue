<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Toast from '../components/Toast.vue'

import { ref } from 'vue'

import { useRouter } from 'vue-router'

const router = useRouter()

const toastRef = ref(null)

const username = ref('')

const email = ref('')

const password = ref('')

const confirmPassword = ref('')

const loading = ref(false)

const showPassword = ref(false)

const showConfirmPassword = ref(false)

// REGISTER
async function register() {

  // EMPTY CHECK
  if (
    !username.value.trim() ||
    !email.value.trim() ||
    !password.value.trim() ||
    !confirmPassword.value.trim()
  ) {

    toastRef.value
      .showToastMessage(
        'Please fill all fields',
        'error'
      )

    return
  }

  // EMAIL VALIDATION
  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (
    !emailPattern.test(
      email.value
    )
  ) {

    toastRef.value
      .showToastMessage(
        'Invalid email format',
        'error'
      )

    return
  }

  // PASSWORD MATCH
  if (
    password.value !==
    confirmPassword.value
  ) {

    toastRef.value
      .showToastMessage(
        'Passwords do not match',
        'error'
      )

    return
  }

  // PASSWORD LENGTH
  if (
    password.value.length < 6
  ) {

    toastRef.value
      .showToastMessage(
        'Password must be at least 6 characters',
        'error'
      )

    return
  }

  try {

    loading.value = true

    // FETCH USERS
    const { getAll, create } = await import('../lib/api.js')

    const users = await getAll('users')

    // CHECK EXISTING EMAIL
    const existingUser =
      users.find(

        user =>

          user.email ===
          email.value
      )

    if (existingUser) {

      toastRef.value
        .showToastMessage(
          'Email already registered',
          'error'
        )

      loading.value = false

      return
    }

    // NEW USER
    const newUser = {

      username:
        username.value.trim(),

      email:
        email.value.trim(),

      password:
        password.value,

      role: 'user'
    }

    // SAVE USER
    await create('users', newUser)

    toastRef.value
      .showToastMessage(
        'Registration Successful!',
        'success'
      )

    // RESET FORM
    username.value = ''

    email.value = ''

    password.value = ''

    confirmPassword.value = ''

    // REDIRECT
    setTimeout(() => {

      router.push('/login')

    }, 1200)

  } catch (error) {

    console.log(error)

    toastRef.value
      .showToastMessage(
        'Server Error',
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

    <!-- PAGE -->
    <div
      class="
        register-page-container
      "
    >

      <!-- CARD -->
      <div
        class="register-card"
      >

        <!-- HEADER -->
        <div
          class="
            register-header
          "
        >

          <h1>
            Create Account
          </h1>

          <p>
            Join the ultimate
            PC hardware store
          </p>

        </div>

        <!-- USERNAME -->
        <div
          class="
            register-input-group
          "
        >

          <label>
            Username
          </label>

          <input
            type="text"

            placeholder="
              Enter username
            "

            v-model="username"

            autocomplete="
              username
            "

            @keyup.enter="register"
          />

        </div>

        <!-- EMAIL -->
        <div
          class="
            register-input-group
          "
        >

          <label>
            Email
          </label>

          <input
            type="email"

            placeholder="
              Enter email
            "

            v-model="email"

            autocomplete="
              email
            "

            @keyup.enter="register"
          />

        </div>

        <!-- PASSWORD -->
        <div
          class="
            register-input-group
          "
        >

          <label>
            Password
          </label>

          <div class="password-wrapper">

            <input
              :type="
                showPassword
                  ? 'text'
                  : 'password'
              "

              placeholder="
                Enter password
              "

              v-model="password"

              autocomplete="
                new-password
              "

              @keyup.enter="register"
            />

            <button
              type="button"
              class="toggle-pw-btn"
              @click="
                showPassword =
                  !showPassword
              "
              tabindex="-1"
            >

              <!-- EYE OPEN -->
              <svg
                v-if="!showPassword"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>

              <!-- EYE CLOSED -->
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>

            </button>

          </div>

        </div>

        <!-- CONFIRM -->
        <div
          class="
            register-input-group
          "
        >

          <label>
            Confirm Password
          </label>

          <div class="password-wrapper">

            <input
              :type="
                showConfirmPassword
                  ? 'text'
                  : 'password'
              "

              placeholder="
                Confirm password
              "

              v-model="
                confirmPassword
              "

              autocomplete="
                new-password
              "

              @keyup.enter="register"
            />

            <button
              type="button"
              class="toggle-pw-btn"
              @click="
                showConfirmPassword =
                  !showConfirmPassword
              "
              tabindex="-1"
            >

              <!-- EYE OPEN -->
              <svg
                v-if="!showConfirmPassword"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>

              <!-- EYE CLOSED -->
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>

            </button>

          </div>

        </div>

        <!-- BUTTON -->
        <button
          class="
            register-btn
          "

          @click="register"

          :disabled="loading"
        >

          {{

            loading

              ? 'Creating Account...'

              : 'Create Account'

          }}

        </button>

        <!-- FOOTER -->
        <div
          class="
            register-footer
          "
        >

          Already have
          an account?

          <router-link
            to="/login"
          >

            Login

          </router-link>

        </div>

      </div>

    </div>

    <Toast ref="toastRef" />

    <Footer />

  </div>
</template>

<style scoped>

/* PAGE */
.register-page-container {

  display: flex;

  justify-content: center;

  align-items: center;

  min-height:
    calc(100vh - 80px);

  padding: 40px 20px;

  box-sizing: border-box;
}

/* CARD */
.register-card {

  width: 100%;

  max-width: 520px;

  background:
    linear-gradient(
      145deg,
      rgba(17,24,39,0.98),
      rgba(15,23,42,0.98)
    );

  border-radius: 24px;

  padding: 48px;

  border:
    1px solid rgba(148,163,184,0.12);

  box-shadow:
    0 20px 50px rgba(0,0,0,0.32);

  position: relative;

  overflow: hidden;
}

/* TOP ACCENT LINE */
.register-card::before {

  content: '';

  position: absolute;

  top: 0;
  left: 0;

  width: 100%;

  height: 3px;

  background:
    linear-gradient(
      to right,
      #2563eb,
      #3b82f6,
      #60a5fa
    );
}

/* HEADER */
.register-header {

  text-align: center;

  margin-bottom: 36px;
}

.register-header h1 {

  font-size: 42px;

  font-weight: 800;

  margin-bottom: 10px;

  color: #f8fafc;

  letter-spacing: -0.5px;
}

.register-header p {

  color: #94a3b8;

  font-size: 15px;
}

/* GROUP */
.register-input-group {

  margin-bottom: 20px;
}

/* LABEL */
.register-input-group label {

  display: block;

  margin-bottom: 8px;

  font-weight: 600;

  color: #cbd5e1;

  font-size: 14px;

  letter-spacing: 0.02em;
}

/* INPUT */
.register-input-group input {

  width: 100%;

  padding: 14px 16px;

  border-radius: 12px;

  border:
    1px solid rgba(148,163,184,0.18);

  background:
    rgba(255,255,255,0.06);

  color: #f8fafc;

  font-size: 15px;

  outline: none;

  transition: 0.3s;

  box-sizing: border-box;
}

.register-input-group
input::placeholder {

  color: rgba(203,213,225,0.55);
}

.register-input-group
input:focus {

  border-color: #3b82f6;

  background:
    rgba(59,130,246,0.06);

  box-shadow:
    0 0 0 3px rgba(59,130,246,0.14);
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

/* TOGGLE BUTTON */
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

  justify-content: center;

  transition: color 0.2s;
}

.toggle-pw-btn:hover {

  color: #93c5fd;
}

/* BUTTON */
.register-btn {

  width: 100%;

  height: 52px;

  border: none;

  border-radius: 14px;

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );

  color: white;

  font-size: 16px;

  font-weight: 700;

  cursor: pointer;

  transition: 0.25s;

  margin-top: 12px;
}

.register-btn:hover:not(:disabled) {

  transform: translateY(-2px);

  box-shadow:
    0 10px 24px rgba(37,99,235,0.30);
}

/* DISABLED */
.register-btn:disabled {

  opacity: 0.55;

  cursor: not-allowed;
}

/* FOOTER */
.register-footer {

  margin-top: 28px;

  text-align: center;

  color: #94a3b8;

  font-size: 15px;
}

/* LINK */
.register-footer a {

  color: #60a5fa;

  font-weight: 700;

  text-decoration: none;
}

.register-footer a:hover {

  color: #93c5fd;

  text-decoration: underline;
}

/* MOBILE */
@media (max-width: 768px) {

  .register-page-container {

    padding: 20px;
  }

  .register-card {

    padding: 32px 24px;
  }

  .register-header h1 {

    font-size: 34px;
  }
}
</style>