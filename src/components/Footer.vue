<script setup>
import { computed } from 'vue'

const user = computed(() => {

  return JSON.parse(
    localStorage.getItem('user')
  )
})

const year = new Date().getFullYear()
</script>

<template>

  <footer class="footer">

    <!-- TOP -->
    <div class="footer-container">

      <!-- BRAND -->
      <div class="footer-section brand-section">

        <router-link
          to="/"
          class="footer-logo"
        >

          🖥 PC Hardware Store

        </router-link>

        <p class="footer-description">

          Your trusted destination
          for premium PC components,
          gaming hardware, and
          custom computer accessories.

        </p>

      </div>

      <!-- CATEGORIES -->
      <div class="footer-section">

        <h3>
          Categories
        </h3>

        <ul>

          <li>

            <router-link
              to="/products/processor"
            >
              Processors
            </router-link>

          </li>

          <li>

            <router-link
              to="/products/gpu"
            >
              Graphics Cards
            </router-link>

          </li>

          <li>

            <router-link
              to="/products/motherboard"
            >
              Motherboards
            </router-link>

          </li>

          <li>

            <router-link
              to="/products/ram"
            >
              RAM
            </router-link>

          </li>

          <li>

            <router-link
              to="/products/storage"
            >
              Storage
            </router-link>

          </li>

          <li>

            <router-link
              to="/products/casing"
            >
              PC Cases
            </router-link>

          </li>

        </ul>

      </div>

      <!-- ACCOUNT -->
      <div class="footer-section">

        <h3>
          Account
        </h3>

        <ul>

          <!-- NOT LOGIN -->
          <template v-if="!user">

            <li>

              <router-link to="/login">
                Login
              </router-link>

            </li>

            <li>

              <router-link to="/register">
                Register
              </router-link>

            </li>

          </template>

          <!-- LOGIN -->
          <template v-else>

            <li>

              <router-link to="/profile">
                My Profile
              </router-link>

            </li>

            <li>

              <router-link to="/cart">
                Shopping Cart
              </router-link>

            </li>

            <li>

              <router-link to="/orders">
                Order History
              </router-link>

            </li>

          </template>

        </ul>

      </div>

      <!-- CONTACT -->
      <div class="footer-section">

        <h3>
          Contact
        </h3>

        <div class="footer-contact">

          <a
            href="
              mailto:support@pchardware.com
            "
          >

            📧 support@pchardware.com

          </a>

          <a
            href="
              tel:+60123456789
            "
          >

            📞 +60 12-345 6789

          </a>

          <p>
            📍 Kuching, Sarawak
          </p>

        </div>

      </div>

    </div>

    <!-- BOTTOM -->
    <div class="footer-bottom">

      © {{ year }}
      PC Hardware Store —
      Built for Gamers &
      PC Enthusiasts

    </div>

  </footer>

</template>

<style scoped>

/* FOOTER */
.footer {

  background:
    linear-gradient(
      135deg,
      #020617,
      #0f172a
    );

  color: white;

  margin-top: 80px;

  overflow: hidden;
}

/* CONTAINER */
.footer-container {

  max-width: 1450px;

  margin: 0 auto;

  padding: 70px 40px 50px;

  display: grid;

  grid-template-columns:
    1.4fr
    1fr
    1fr
    1fr;

  gap: 60px;
}

/* SECTION */
.footer-section h3 {

  font-size: 28px;

  margin-bottom: 24px;

  color: white;
}

/* LOGO */
.footer-logo {

  display: inline-block;

  font-size: 44px;

  font-weight: 800;

  color: white;

  text-decoration: none;

  line-height: 1.2;

  margin-bottom: 24px;

  transition: 0.3s;
}

.footer-logo:hover {

  color: #60a5fa;
}

/* DESCRIPTION */
.footer-description {

  color: #cbd5e1;

  line-height: 1.9;

  font-size: 17px;

  max-width: 340px;
}

/* LIST */
.footer-section ul {

  list-style: none;

  padding: 0;

  margin: 0;
}

/* LIST ITEM */
.footer-section ul li {

  margin-bottom: 18px;
}

/* LINKS */
.footer-section a {

  color: #cbd5e1;

  text-decoration: none;

  font-size: 17px;

  transition: 0.3s;

  position: relative;
}

.footer-section a:hover {

  color: #60a5fa;

  padding-left: 6px;
}

/* CONTACT */
.footer-contact {

  display: flex;

  flex-direction: column;

  gap: 18px;
}

.footer-contact a,
.footer-contact p {

  color: #cbd5e1;

  font-size: 17px;

  margin: 0;

  line-height: 1.6;
}

/* BOTTOM */
.footer-bottom {

  border-top:
    1px solid
    rgba(255,255,255,0.08);

  text-align: center;

  padding: 24px;

  color: #94a3b8;

  font-size: 15px;

  background:
    rgba(255,255,255,0.02);
}

/* MOBILE */
@media (max-width: 1100px) {

  .footer-container {

    grid-template-columns:
      repeat(2,1fr);

    gap: 40px;
  }
}

@media (max-width: 768px) {

  .footer-container {

    grid-template-columns: 1fr;

    padding: 50px 24px;
  }

  .footer-logo {

    font-size: 34px;
  }

  .footer-section h3 {

    font-size: 24px;
  }

  .footer-description {

    max-width: 100%;
  }

  .footer-bottom {

    padding: 20px;

    font-size: 14px;
  }
}

</style>