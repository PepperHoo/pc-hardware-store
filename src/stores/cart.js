import { defineStore } from 'pinia'
import { getWhere, removeWhere, removeWhereMany, upsert } from '../lib/api.js'

const writeQueues = new Map()

function enqueueWrite(key, write) {
  const previous = writeQueues.get(key) || Promise.resolve()
  const next = previous.catch(() => {}).then(write)
  writeQueues.set(key, next)
  next.then(() => {
    if (writeQueues.get(key) === next) writeQueues.delete(key)
  }, () => {
    if (writeQueues.get(key) === next) writeQueues.delete(key)
  })
  return next
}

function getStoredUserEmail() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')?.email || ''
  } catch {
    return ''
  }
}

function productSnapshot(item) {
  const { quantity, ...product } = item
  return JSON.parse(JSON.stringify(product))
}

function restoreCartItem(row) {
  return {
    ...(row.product_data || {}),
    id: row.product_id,
    quantity: Math.max(1, Number(row.quantity || 1))
  }
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    userEmail: '',
    loading: false,
    syncError: ''
  }),

  actions: {
    activeEmail() {
      return this.userEmail || getStoredUserEmail()
    },

    async load(userEmail, { mergeCurrent = false } = {}) {
      const email = userEmail || ''
      const currentItems = mergeCurrent ? this.items.map(item => ({ ...item })) : []

      this.userEmail = email
      this.syncError = ''

      if (!email) {
        if (!mergeCurrent) this.items = []
        return
      }

      this.loading = true
      try {
        const rows = await getWhere('cart_items', 'user_email', email)
        const databaseItems = rows.map(restoreCartItem)

        if (mergeCurrent && currentItems.length) {
          const merged = [...databaseItems]
          currentItems.forEach(item => {
            const existing = merged.find(saved => String(saved.id) === String(item.id))
            if (existing) existing.quantity += Number(item.quantity || 1)
            else merged.push(item)
          })
          this.items = merged
          await Promise.all(this.items.map(item => this.syncItem(item.id)))
        } else {
          this.items = databaseItems
        }
      } catch (error) {
        this.syncError = error.message
        console.error('Failed to load cart from Supabase:', error)
      } finally {
        this.loading = false
      }
    },

    async syncItem(id) {
      const email = this.activeEmail()
      if (!email) return

      const key = `${email}:${id}`
      return enqueueWrite(key, async () => {
        const item = this.items.find(entry => String(entry.id) === String(id))
        if (!item) return

        await upsert('cart_items', {
          user_email: email,
          product_id: String(item.id),
          product_data: productSnapshot(item),
          quantity: Math.max(1, Number(item.quantity || 1)),
          updated_at: new Date().toISOString()
        }, 'user_email,product_id')
      }).catch(error => {
        this.syncError = error.message
        console.error('Failed to save cart item to Supabase:', error)
      })
    },

    async deleteItem(id) {
      const email = this.activeEmail()
      if (!email) return

      const key = `${email}:${id}`
      return enqueueWrite(key, () => removeWhereMany('cart_items', {
        user_email: email,
        product_id: String(id)
      })).catch(error => {
        this.syncError = error.message
        console.error('Failed to remove cart item from Supabase:', error)
      })
    },

    addToCart(product) {
      const existing = this.items.find(item => String(item.id) === String(product.id))

      if (existing) {
        existing.quantity++
      } else {
        this.items.push({ ...product, quantity: 1 })
      }

      void this.syncItem(product.id)
    },

    removeFromCart(id) {
      this.items = this.items.filter(item => String(item.id) !== String(id))
      void this.deleteItem(id)
    },

    increaseQty(id) {
      const item = this.items.find(entry => String(entry.id) === String(id))
      if (item) {
        item.quantity++
        void this.syncItem(id)
      }
    },

    decreaseQty(id) {
      const item = this.items.find(entry => String(entry.id) === String(id))
      if (item && item.quantity > 1) {
        item.quantity--
        void this.syncItem(id)
      }
    },

    async clear() {
      const email = this.activeEmail()
      const ids = this.items.map(item => item.id)
      this.items = []

      if (!email) return

      await Promise.all(ids.map(id => this.deleteItem(id)))
      try {
        await removeWhere('cart_items', 'user_email', email)
      } catch (error) {
        this.syncError = error.message
        console.error('Failed to clear cart in Supabase:', error)
      }
    },

    reset() {
      this.items = []
      this.userEmail = ''
      this.syncError = ''
    }
  },

  getters: {
    totalPrice: (state) =>
      state.items.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0)
  }
})
