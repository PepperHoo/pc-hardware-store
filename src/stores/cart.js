import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),

  actions: {
    addToCart(food) {
      const existing = this.items.find(i => i.id === food.id)

      if (existing) {
        existing.quantity++
      } else {
        this.items.push({ ...food, quantity: 1 })
      }
    },

    removeFromCart(id) {
      this.items = this.items.filter(i => i.id !== id)
    },

    increaseQty(id) {
      const item = this.items.find(i => i.id === id)
      if (item) item.quantity++
    },

    decreaseQty(id) {
      const item = this.items.find(i => i.id === id)
      if (item && item.quantity > 1) item.quantity--
    }
  },

  getters: {
    totalPrice: (state) =>
      state.items.reduce((total, item) => total + item.price * item.quantity, 0)
  }
})