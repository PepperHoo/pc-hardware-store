import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getWhere, removeWhereMany, upsert } from '../lib/api.js'
import { getSessionUserEmail } from '../lib/session.js'

function getStoredUserEmail() {
  return getSessionUserEmail()
}

function productSnapshot(product) {
  return JSON.parse(JSON.stringify(product))
}

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref([])
  const userEmail = ref('')
  const loading = ref(false)
  const syncError = ref('')

  function activeEmail(providedEmail = '') {
    return providedEmail || userEmail.value || getStoredUserEmail()
  }

  async function load(email) {
    userEmail.value = email || ''
    syncError.value = ''
    items.value = []

    if (!userEmail.value) return

    loading.value = true
    try {
      const rows = await getWhere('wishlist_items', 'user_email', userEmail.value)
      items.value = rows.map(row => ({
        ...(row.product_data || {}),
        id: row.product_id
      }))
    } catch (error) {
      syncError.value = error.message
      console.error('Failed to load wishlist from Supabase:', error)
    } finally {
      loading.value = false
    }
  }

  async function saveItem(product, email) {
    const accountEmail = activeEmail(email)
    if (!accountEmail) return

    try {
      await upsert('wishlist_items', {
        user_email: accountEmail,
        product_id: String(product.id),
        product_data: productSnapshot(product),
        updated_at: new Date().toISOString()
      }, 'user_email,product_id')
    } catch (error) {
      syncError.value = error.message
      console.error('Failed to save wishlist item to Supabase:', error)
    }
  }

  async function deleteItem(productId, email) {
    const accountEmail = activeEmail(email)
    if (!accountEmail) return

    try {
      await removeWhereMany('wishlist_items', {
        user_email: accountEmail,
        product_id: String(productId)
      })
    } catch (error) {
      syncError.value = error.message
      console.error('Failed to remove wishlist item from Supabase:', error)
    }
  }

  function toggle(product, email) {
    const accountEmail = activeEmail(email)
    if (!accountEmail) return false

    userEmail.value = accountEmail
    const index = items.value.findIndex(item => String(item.id) === String(product.id))

    if (index === -1) {
      const snapshot = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        stock: product.stock
      }
      items.value.push(snapshot)
      void saveItem(snapshot, accountEmail)
      return true
    }

    items.value.splice(index, 1)
    void deleteItem(product.id, accountEmail)
    return false
  }

  function isWishlisted(productId) {
    return items.value.some(item => String(item.id) === String(productId))
  }

  function remove(productId, email) {
    items.value = items.value.filter(item => String(item.id) !== String(productId))
    void deleteItem(productId, email)
  }

  function reset() {
    items.value = []
    userEmail.value = ''
    syncError.value = ''
  }

  const count = computed(() => items.value.length)

  return { items, count, loading, syncError, load, toggle, isWishlisted, remove, reset }
})
