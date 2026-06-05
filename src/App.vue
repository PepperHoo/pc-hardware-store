<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AiChatWidget from './components/AiChatWidget.vue'
import CompareBar from './components/CompareBar.vue'
import { useCartStore } from './stores/cart'
import { useCurrencyStore } from './stores/currency'
import { useWishlistStore } from './stores/wishlist'
import { getSessionUser } from './lib/session.js'

const route = useRoute()
const cart = useCartStore()
const currency = useCurrencyStore()
const wishlist = useWishlistStore()
const authPages = ['/login', '/register', '/forgot-password', '/approve-reset', '/reset-password']
const showAiChat = computed(() => !route.path.startsWith('/admin') && !authPages.includes(route.path))

onMounted(async () => {
  // Apply saved theme immediately
  const theme = localStorage.getItem('theme') || 'dark'
  document.documentElement.setAttribute('data-theme', theme)

  currency.startLiveUpdates()
  const user = getSessionUser()
  if (user?.email && String(user.role || '').toLowerCase() !== 'admin') {
    await Promise.all([
      cart.load(user.email),
      wishlist.load(user.email)
    ])
  } else {
    cart.reset()
    wishlist.reset()
  }
})

onBeforeUnmount(() => {
  currency.stopLiveUpdates()
})
</script>

<template>
  <router-view />
  <CompareBar />
  <AiChatWidget v-if="showAiChat" />
</template>
