<script setup>
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Toast from '../components/Toast.vue'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore }     from '../stores/cart'
import { useCurrencyStore } from '../stores/currency'

const router   = useRouter()
const cart     = useCartStore()
const currency = useCurrencyStore()
const toastRef = ref(null)

const recipientName   = ref('')
const phoneNumber     = ref('')
const shippingAddress = ref('')
const shippingMethod  = ref('standard')
const paymentMethod   = ref('cod')

const shippingCost = computed(() => shippingMethod.value === 'express' ? 25 : 10)
const total        = computed(() => cart.totalPrice + shippingCost.value)

const shippingOptions = [
  { value: 'standard', label: 'Standard Shipping', desc: '5–7 business days', price: 'RM 10' },
  { value: 'express',  label: 'Express Shipping',  desc: '1–2 business days', price: 'RM 25' },
]
const paymentOptions = [
  { value: 'cod',     label: 'Cash on Delivery',   icon: '💵' },
  { value: 'card',    label: 'Credit / Debit Card', icon: '💳' },
  { value: 'online',  label: 'Online Banking',      icon: '🏦' },
  { value: 'ewallet', label: 'E-Wallet',            icon: '📱' },
]

async function placeOrder() {
  if (!recipientName.value || !phoneNumber.value || !shippingAddress.value) {
    toastRef.value.showToastMessage('Please complete all fields', 'error')
    return
  }
  const user = JSON.parse(localStorage.getItem('user'))
  const order = {
    userEmail:       user?.email ?? '',
    recipientName:   recipientName.value,
    phoneNumber:     phoneNumber.value,
    shippingAddress: shippingAddress.value,
    shippingMethod:  shippingMethod.value,
    paymentMethod:   paymentMethod.value,
    items: cart.items.map(i => ({ id: i.id, name: i.name, image: i.image, price: i.price, quantity: i.quantity })),
    total:  total.value,
    status: 'Pending',
    date:   new Date().toISOString()
  }
  try {
    const { createOrder } = await import('../lib/api.js')
    await createOrder(order)
    // Send order confirmation email (non-critical)
    try {
      if (window.emailjs) {
        const itemsList = cart.items.map(i => `${i.name} × ${i.quantity} — RM ${(i.price*i.quantity).toFixed(2)}`).join('\n')
        await window.emailjs.send('service_50rx02q', 'template_order_confirm', {
          to_email:   user?.email ?? '',
          recipient:  recipientName.value,
          order_id:   'N/A',
          items_list: itemsList,
          total:      `RM ${total.value.toFixed(2)}`,
          shipping:   shippingMethod.value,
          payment:    paymentMethod.value,
          address:    shippingAddress.value,
        })
      }
    } catch (emailErr) { console.warn('Email non-critical:', emailErr) }
    toastRef.value.showToastMessage('Order placed successfully!', 'success')
    cart.items = []
    setTimeout(() => router.push('/orders'), 1500)
  } catch (err) {
    console.error('Place order error:', err)
    toastRef.value.showToastMessage('Failed to place order: ' + err.message, 'error')
  }
}
</script>

<template>
  <div class="checkout-page">
    <Navbar />

    <main class="checkout-main section-inner">

      <!-- Header -->
      <div class="checkout-header">
        <span class="kicker">Almost There</span>
        <h1 class="checkout-title">Check<span class="grad-text">out</span></h1>
        <p class="checkout-sub">Complete your order details below.</p>
      </div>

      <div class="checkout-layout">

        <!-- LEFT: form -->
        <div class="form-panel">

          <!-- Delivery -->
          <section class="form-section glass">
            <h2 class="section-heading">
              <span class="step-num">1</span> Delivery Details
            </h2>

            <div class="field-group">
              <label class="field-label">Recipient Name</label>
              <input v-model="recipientName" type="text" placeholder="Full name" class="field-input" />
            </div>
            <div class="field-group">
              <label class="field-label">Phone Number</label>
              <input v-model="phoneNumber" type="text" placeholder="+60 12-345 6789" class="field-input" />
            </div>
            <div class="field-group">
              <label class="field-label">Shipping Address</label>
              <textarea v-model="shippingAddress" rows="4" placeholder="Full address including postcode" class="field-input field-textarea" />
            </div>
          </section>

          <!-- Shipping method -->
          <section class="form-section glass">
            <h2 class="section-heading">
              <span class="step-num">2</span> Shipping Method
            </h2>
            <div class="option-cards">
              <label
                v-for="opt in shippingOptions" :key="opt.value"
                :class="['option-card', shippingMethod === opt.value && 'selected']"
              >
                <input type="radio" v-model="shippingMethod" :value="opt.value" hidden />
                <div class="option-radio"><div class="radio-dot" v-if="shippingMethod === opt.value" /></div>
                <div class="option-info">
                  <p class="option-name">{{ opt.label }}</p>
                  <p class="option-desc">{{ opt.desc }}</p>
                </div>
                <span class="option-price">{{ opt.price }}</span>
              </label>
            </div>
          </section>

          <!-- Payment -->
          <section class="form-section glass">
            <h2 class="section-heading">
              <span class="step-num">3</span> Payment Method
            </h2>
            <div class="option-cards">
              <label
                v-for="opt in paymentOptions" :key="opt.value"
                :class="['option-card', paymentMethod === opt.value && 'selected']"
              >
                <input type="radio" v-model="paymentMethod" :value="opt.value" hidden />
                <div class="option-radio"><div class="radio-dot" v-if="paymentMethod === opt.value" /></div>
                <span class="pay-icon">{{ opt.icon }}</span>
                <p class="option-name">{{ opt.label }}</p>
              </label>
            </div>
          </section>

        </div>

        <!-- RIGHT: summary -->
        <aside class="summary-panel glass">
          <h2 class="summary-title">Order Summary</h2>

          <!-- Items -->
          <div class="summary-items">
            <div v-for="item in cart.items" :key="item.id" class="summary-item">
              <div class="si-img-wrap">
                <img :src="item.image" :alt="item.name" class="si-img" />
                <span class="si-qty">{{ item.quantity }}</span>
              </div>
              <div class="si-info">
                <p class="si-name">{{ item.name }}</p>
                <p class="si-unit">{{ currency.format(item.price) }} each</p>
              </div>
              <p class="si-price">{{ currency.format(item.price * item.quantity) }}</p>
            </div>
          </div>

          <div class="summary-divider" />

          <div class="summary-row">
            <span>Subtotal</span>
            <span>{{ currency.format(cart.totalPrice) }}</span>
          </div>
          <div class="summary-row">
            <span>Shipping ({{ shippingMethod }})</span>
            <span>{{ currency.format(shippingCost) }}</span>
          </div>

          <div class="summary-total">
            <span>Total</span>
            <span class="total-val grad-text">{{ currency.format(total) }}</span>
          </div>

          <button class="place-btn" @click="placeOrder">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 9h14M11 4l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Place Order
          </button>

          <button class="back-btn" @click="router.push('/cart')">← Back to Cart</button>

          <div class="secure-note">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="6" width="12" height="7" rx="2" stroke="#475569" stroke-width="1.3"/><path d="M4 6V4a3 3 0 0 1 6 0v2" stroke="#475569" stroke-width="1.3" stroke-linecap="round"/></svg>
            Secure & encrypted checkout
          </div>
        </aside>

      </div>
    </main>

    <Toast ref="toastRef" />
    <Footer />
  </div>
</template>

<style scoped>
.checkout-page { background: #030712; min-height: 100vh; }
.checkout-main { padding-top: 130px; padding-bottom: 100px; }

/* Header */
.checkout-header { margin-bottom: 52px; }
.checkout-title {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(32px, 5vw, 60px); font-weight: 900; color: #f1f5f9;
  margin: 14px 0 10px; line-height: 1.1;
}
.checkout-sub { color: #475569; font-size: 16px; }

/* Layout */
.checkout-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 28px;
  align-items: start;
}

/* Form panel */
.form-panel { display: flex; flex-direction: column; gap: 20px; }

.form-section {
  padding: 28px;
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.07);
}

.section-heading {
  display: flex; align-items: center; gap: 12px;
  font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 800;
  color: #f1f5f9; margin: 0 0 24px; letter-spacing: 0.04em;
}
.step-num {
  width: 28px; height: 28px; border-radius: 8px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white; font-size: 13px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.field-group { margin-bottom: 18px; }
.field-label { display: block; font-size: 13px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; }
.field-input {
  width: 100%; padding: 13px 16px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; color: #f1f5f9; font-size: 15px; outline: none;
  transition: all 0.25s; box-sizing: border-box; font-family: inherit;
}
.field-input::placeholder { color: #334155; }
.field-input:focus { border-color: #3b82f6; background: rgba(59,130,246,0.07); box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
.field-textarea { resize: vertical; min-height: 100px; }

/* Option cards */
.option-cards { display: flex; flex-direction: column; gap: 10px; }
.option-card {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px; border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03);
  cursor: pointer; transition: all 0.2s;
}
.option-card:hover { border-color: rgba(59,130,246,0.3); }
.option-card.selected { border-color: #3b82f6; background: rgba(59,130,246,0.08); }

.option-radio {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.2); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: border-color 0.2s;
}
.option-card.selected .option-radio { border-color: #3b82f6; }
.radio-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; }

.option-info { flex: 1; }
.option-name { font-size: 14px; font-weight: 600; color: #f1f5f9; margin: 0 0 2px; }
.option-desc { font-size: 12px; color: #475569; margin: 0; }
.option-price { font-size: 14px; font-weight: 700; color: #60a5fa; flex-shrink: 0; }
.pay-icon { font-size: 20px; }

/* Summary */
.summary-panel {
  position: sticky; top: 100px;
  padding: 28px; border-radius: 28px;
  border: 1px solid rgba(255,255,255,0.07);
}
.summary-title {
  font-family: 'Orbitron', sans-serif; font-size: 16px; font-weight: 800;
  color: #f1f5f9; margin: 0 0 20px;
}

.summary-items { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
.summary-item { display: flex; align-items: center; gap: 12px; }
.si-img-wrap { position: relative; width: 52px; height: 52px; flex-shrink: 0; }
.si-img {
  width: 100%; height: 100%; object-fit: contain; border-radius: 10px;
  background: radial-gradient(circle, rgba(59,130,246,0.08), rgba(3,7,18,0.6));
  padding: 6px; box-sizing: border-box;
}
.si-qty {
  position: absolute; top: -6px; right: -6px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #3b82f6; color: white; font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.si-info { flex: 1; min-width: 0; }
.si-name { font-size: 13px; font-weight: 600; color: #f1f5f9; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.si-unit { font-size: 11px; color: #475569; margin: 0; }
.si-price { font-size: 13px; font-weight: 700; color: #60a5fa; flex-shrink: 0; }

.summary-divider { border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 16px 0; }
.summary-row { display: flex; justify-content: space-between; font-size: 14px; color: #64748b; margin-bottom: 10px; }
.summary-row span:last-child { color: #94a3b8; }
.summary-total {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 0; border-top: 1px solid rgba(59,130,246,0.2);
  margin: 12px 0 20px; font-size: 15px; font-weight: 700; color: #94a3b8;
}
.total-val { font-family: 'Orbitron', sans-serif; font-size: 22px; font-weight: 900; }

.place-btn {
  width: 100%; padding: 15px 20px;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
  color: white; border: none; border-radius: 14px;
  font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 0.05em;
  cursor: pointer; transition: all 0.3s; margin-bottom: 10px;
}
.place-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(29,78,216,0.4); }

.back-btn {
  width: 100%; padding: 12px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
  color: #475569; border-radius: 12px; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s; margin-bottom: 16px;
}
.back-btn:hover { color: #64748b; background: rgba(255,255,255,0.07); }

.secure-note {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-size: 12px; color: #334155;
}

/* Responsive */
@media (max-width: 1024px) {
  .checkout-layout { grid-template-columns: 1fr; }
  .summary-panel { position: relative; top: 0; }
}
@media (max-width: 640px) {
  .checkout-main { padding-top: 100px; }
}
</style>
