import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCurrencyStore = defineStore('currency', () => {
  const currencies = ['MYR', 'YEN', 'WON', 'USD', 'SGD', 'EUR']
  const symbols = { MYR: 'RM', YEN: 'YEN', WON: 'WON', USD: '$', SGD: 'S$', EUR: 'EUR' }
  const storedCurrency = localStorage.getItem('currency')

  const current  = ref(currencies.includes(storedCurrency) ? storedCurrency : 'MYR')
  const rates    = ref({ MYR: 1, YEN: 33, WON: 290, USD: 0.21, SGD: 0.29, EUR: 0.20 })
  const loading  = ref(false)
  const lastFetch = ref(null)

  const symbol = computed(() => symbols[current.value] || current.value)
  const rate   = computed(() => rates.value[current.value] || 1)

  async function fetchRates() {
    if (lastFetch.value && Date.now() - lastFetch.value < 600_000) return

    try {
      loading.value = true
      const res  = await fetch('https://open.er-api.com/v6/latest/MYR')
      const data = await res.json()

      if (data.rates) {
        rates.value = {
          MYR: 1,
          YEN: data.rates.JPY || rates.value.YEN,
          WON: data.rates.KRW || rates.value.WON,
          USD: data.rates.USD || rates.value.USD,
          SGD: data.rates.SGD || rates.value.SGD,
          EUR: data.rates.EUR || rates.value.EUR,
        }
        lastFetch.value = Date.now()
      }
    } catch (e) {
      console.warn('Currency fetch failed, using fallback rates', e)
    } finally {
      loading.value = false
    }
  }

  function setCurrency(code) {
    const next = currencies.includes(code) ? code : 'MYR'
    current.value = next
    localStorage.setItem('currency', next)
  }

  function format(myrPrice) {
    const converted = (Number(myrPrice) * rate.value).toFixed(2)
    return `${symbol.value} ${converted}`
  }

  return { current, rates, loading, currencies, symbols, symbol, rate, fetchRates, setCurrency, format }
})
