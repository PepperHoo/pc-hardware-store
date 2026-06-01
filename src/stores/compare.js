import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCompareStore = defineStore('compare', () => {
  const items = ref([])
  const MAX = 3

  function toggle(product) {
    const idx = items.value.findIndex(i => i.id === product.id)
    if (idx !== -1) { items.value.splice(idx, 1); return }
    if (items.value.length >= MAX) { items.value.shift() }
    items.value.push(product)
  }

  function remove(id) { items.value = items.value.filter(i => i.id !== id) }
  function clear()    { items.value = [] }
  function isAdded(id) { return items.value.some(i => i.id === id) }

  const count = computed(() => items.value.length)
  const canAdd = computed(() => items.value.length < MAX)

  return { items, count, canAdd, MAX, toggle, remove, clear, isAdded }
})
