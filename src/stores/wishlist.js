import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref([])

  function load(userEmail) {
    const saved = localStorage.getItem(`wishlist_${userEmail}`)
    items.value = saved ? JSON.parse(saved) : []
  }

  function save(userEmail) {
    localStorage.setItem(`wishlist_${userEmail}`, JSON.stringify(items.value))
  }

  function toggle(product, userEmail) {
    if (!userEmail) return false
    const idx = items.value.findIndex(i => i.id === product.id)
    if (idx === -1) {
      items.value.push({ id: product.id, name: product.name, price: product.price, image: product.image, category: product.category, stock: product.stock })
    } else {
      items.value.splice(idx, 1)
    }
    save(userEmail)
    return idx === -1 // true = added
  }

  function isWishlisted(productId) {
    return items.value.some(i => i.id === productId)
  }

  function remove(productId, userEmail) {
    items.value = items.value.filter(i => i.id !== productId)
    save(userEmail)
  }

  const count = computed(() => items.value.length)

  return { items, count, load, toggle, isWishlisted, remove }
})
