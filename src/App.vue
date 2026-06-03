<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AiChatWidget from './components/AiChatWidget.vue'
import CompareBar from './components/CompareBar.vue'
import { useCurrencyStore } from './stores/currency'
import { useWishlistStore } from './stores/wishlist'

const route = useRoute()
const currency = useCurrencyStore()
const wishlist = useWishlistStore()
const showAiChat = computed(() => !route.path.startsWith('/admin'))

onMounted(() => {
  // Apply saved theme immediately
  const theme = localStorage.getItem('theme') || 'dark'
  document.documentElement.setAttribute('data-theme', theme)

  currency.fetchRates()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  if (user?.email) wishlist.load(user.email)
})
</script>

<template>
  <router-view />
  <CompareBar />
  <AiChatWidget v-if="showAiChat" />
</template>
