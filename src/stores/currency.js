import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCurrencyStore = defineStore('currency', () => {
  const current  = ref(localStorage.getItem('currency') || 'MYR')
  const rates    = ref({ MYR: 1 })
  const loading  = ref(false)
  const lastFetch = ref(null)

  const symbols = { MYR: 'RM', USD: '$', SGD: 'S$', AUD: 'A$', GBP: '£', EUR: '€' }
  const currencies = ['MYR', 'USD', 'SGD', 'AUD', 'GBP', 'EUR']

  const symbol = computed(() => symbols[current.value] || current.value)
  const rate   = computed(() => rates.value[current.value] || 1)

  async function fetchRates() {
    // Only refetch if older than 10 mins
    if (lastFetch.value && Date.now() - lastFetch.value < 600_000) return
    try {
      loading.value = true
      const res  = await fetch('https://open.er-api.com/v6/latest/MYR')
      const data = await res.json()
      if (data.rates) {
        rates.value = { MYR: 1, ...data.rates }
        lastFetch.value = Date.now()
      }
    } catch (e) {
      console.warn('Currency fetch failed, using fallback rates', e)
      // Fallback approximate rates (MYR base)
      rates.value = { MYR: 1, USD: 0.21, SGD: 0.29, AUD: 0.33, GBP: 0.17, EUR: 0.20 }
    } finally {
      loading.value = false
    }
  }

  function setCurrency(code) {
    current.value = code
    localStorage.setItem('currency', code)
  }

  function format(myrPrice) {
    const converted = (Number(myrPrice) * rate.value).toFixed(2)
    return `${symbol.value} ${converted}`
  }

  return { current, rates, loading, currencies, symbols, symbol, rate, fetchRates, setCurrency, format }
})
