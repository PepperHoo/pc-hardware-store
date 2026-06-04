<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AiChatWidget from './components/AiChatWidget.vue'
import CompareBar from './components/CompareBar.vue'
import { useCartStore } from './stores/cart'
import { useCurrencyStore } from './stores/currency'
import { useWishlistStore } from './stores/wishlist'

const route = useRoute()
const cart = useCartStore()
const currency = useCurrencyStore()
const wishlist = useWishlistStore()
const showAiChat = computed(() => !route.path.startsWith('/admin'))

onMounted(async () => {
  // Apply saved theme immediately
  const theme = localStorage.getItem('theme') || 'dark'
  document.documentElement.setAttribute('data-theme', theme)

  currency.startLiveUpdates()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
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
