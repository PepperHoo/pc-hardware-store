<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Toast from '../components/Toast.vue'

import {
  ref
} from 'vue'

import {
  useRouter
} from 'vue-router'

const router = useRouter()

const toastRef = ref(null)

const email = ref('')

const password = ref('')

const loading = ref(false)

const showPassword = ref(false)

// LOGIN
async function login() {

  // VALIDATION
  if (
    !email.value ||
    !password.value
  ) {

    toastRef.value
      .showToastMessage(
        'Please fill all fields',
        'error'
      )

    return
  }

  try {

    loading.value = true

    // FETCH USERS
    const { getAll } = await import('../lib/api.js')

    const users = await getAll('users')

    // FIND USER
    const user = users.find(

      u =>

        u.email ===
          email.value

        &&

        u.password ===
          password.value
    )

    // INVALID LOGIN
    if (!user) {

      toastRef.value
        .showToastMessage(
          'Invalid email or password',
          'error'
        )

      return
    }

    // SAVE SESSION
    localStorage.setItem(

      'user',

      JSON.stringify(user)
    )

    toastRef.value
      .showToastMessage(
        'Login Successful!',
        'success'
      )

    // ROLE CHECK
    setTimeout(() => {

      if (
        user.role === 'admin'
      ) {

        router.push('/admin')

      } else {

        router.push('/profile')
      }

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

    <!-- LOGIN -->
    <div
      class="
        login-container
      "
    >

      <div
        class="
          login-card
        "
      >

        <!-- TITLE -->
        <h2
          class="
            login-title
          "
        >
          Login
        </h2>

        <!-- SUBTITLE -->
        <p
          class="
            login-subtitle
          "
        >

          Welcome back!
          Login to continue
          shopping.

        </p>

        <!-- EMAIL -->
        <div
          class="
            login-input-group
          "
        >

          <label
            class="
              login-label
            "
          >
            Email
          </label>

          <input
            type="email"
            placeholder="
              Enter your email
            "
            v-model="email"
            class="
              login-input
            "
            @keyup.enter="login"
          />

        </div>

        <!-- PASSWORD -->
        <div
          class="
            login-input-group
          "
        >

          <label
            class="
              login-label
            "
          >
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
                Enter your password
              "
              v-model="password"
              class="
                login-input
              "
              @keyup.enter="login"
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

        <!-- FORGOT PASSWORD -->
        <div class="login-forgot">

          <router-link
            to="/forgot-password"
          >
            Forgot password?
          </router-link>

        </div>

        <!-- BUTTON -->
        <button
          class="
            login-btn
          "
          @click="login"
          :disabled="loading"
        >

          {{

            loading

              ? 'Logging in...'

              : 'Login'

          }}

        </button>

        <!-- FOOTER -->
        <p
          class="
            login-footer
          "
        >

          Don't have an account?

          <router-link
            to="/register"
          >
            Register
          </router-link>

        </p>

      </div>

    </div>

    <Toast ref="toastRef" />

    <Footer />

  </div>
</template>

<style scoped>

/* CONTAINER */
.login-container {

  display: flex;

  justify-content: center;

  align-items: center;

  min-height:
    calc(100vh - 80px);

  padding: 40px 20px;

  box-sizing: border-box;
}

/* CARD */
.login-card {

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

  border:
    1px solid rgba(148,163,184,0.12);

  box-shadow:
    0 20px 50px rgba(0,0,0,0.32);

  position: relative;

  overflow: hidden;
}

/* TOP ACCENT LINE */
.login-card::before {

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

/* TITLE */
.login-title {

  text-align: center;

  font-size: 40px;

  font-weight: 800;

  color: #f8fafc;

  margin-bottom: 10px;

  letter-spacing: -0.5px;
}

/* SUBTITLE */
.login-subtitle {

  text-align: center;

  color: #94a3b8;

  margin-bottom: 36px;

  font-size: 15px;

  line-height: 1.6;
}

/* INPUT GROUP */
.login-input-group {

  margin-bottom: 20px;
}

/* LABEL */
.login-label {

  display: block;

  margin-bottom: 10px;

  font-weight: 600;

  color: #cbd5e1;

  font-size: 14px;

  letter-spacing: 0.02em;
}

/* INPUT */
.login-input {

  width: 100%;

  padding: 14px 16px;

  border-radius: 12px;

  border:
    1px solid rgba(148,163,184,0.18);

  font-size: 15px;

  outline: none;

  transition: 0.3s;

  box-sizing: border-box;

  background:
    rgba(255,255,255,0.06);

  color: #f8fafc;
}

.login-input::placeholder {

  color: rgba(203,213,225,0.55);
}

.login-input:focus {

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

.password-wrapper .login-input {

  padding-right: 50px;
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
.login-btn {

  width: 100%;

  padding: 15px;

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

.login-btn:hover {

  transform: translateY(-2px);

  box-shadow:
    0 10px 24px rgba(37,99,235,0.30);
}

/* DISABLED */
.login-btn:disabled {

  opacity: 0.55;

  cursor: not-allowed;

  transform: none;

  box-shadow: none;
}

/* FORGOT PASSWORD */
.login-forgot {

  text-align: right;

  margin-bottom: 8px;
}

.login-forgot a {

  color: #60a5fa;

  font-size: 13px;

  font-weight: 600;

  text-decoration: none;

  transition: color 0.2s;
}

.login-forgot a:hover {

  color: #93c5fd;

  text-decoration: underline;
}

/* FOOTER */
.login-footer {

  text-align: center;

  margin-top: 28px;

  color: #94a3b8;

  font-size: 15px;
}

/* LINK */
.login-footer a {

  color: #60a5fa;

  font-weight: 700;

  text-decoration: none;
}

.login-footer a:hover {

  color: #93c5fd;

  text-decoration: underline;
}

/* MOBILE */
@media (max-width: 768px) {

  .login-container {

    padding: 20px;
  }

  .login-card {

    padding: 32px 24px;
  }

  .login-title {

    font-size: 34px;
  }
}
</style>