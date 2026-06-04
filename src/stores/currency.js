import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

function loadStoredLiveRates() {
  try {
    return JSON.parse(localStorage.getItem('liveFxRates') || 'null')
  } catch {
    localStorage.removeItem('liveFxRates')
    return null
  }
}

export const useCurrencyStore = defineStore('currency', () => {
  const currencies = ['MYR', 'YEN', 'WON', 'USD', 'SGD', 'EUR']
  const symbols = { MYR: 'RM', YEN: '\u00A5', WON: '\u20A9', USD: '$', SGD: 'S$', EUR: '\u20AC' }
  const storedCurrency = localStorage.getItem('currency')
  const storedLiveRates = loadStoredLiveRates()

  const current  = ref(currencies.includes(storedCurrency) ? storedCurrency : 'MYR')
  const rates    = ref(storedLiveRates?.rates || { MYR: 1, YEN: 33, WON: 290, USD: 0.21, SGD: 0.29, EUR: 0.20 })
  const loading  = ref(false)
  const lastFetch = ref(null)
  const lastUpdated = ref(storedLiveRates?.updatedAt || null)
  const provider = ref(storedLiveRates?.provider || '')
  const isLive = ref(Boolean(storedLiveRates?.live))
  const error = ref('')
  let refreshTimer = null

  const symbol = computed(() => symbols[current.value] || current.value)
  const rate   = computed(() => rates.value[current.value] || 1)

  async function fetchRates({ force = false } = {}) {
    if (loading.value) return
    if (!force && lastFetch.value && Date.now() - lastFetch.value < 30_000) return

    try {
      loading.value = true
      error.value = ''
      const res = await fetch('/api/exchange-rates')
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Unable to fetch live currency pricing.')
      if (!data.rates) throw new Error('Live currency provider returned no rates.')

      rates.value = data.rates
      lastUpdated.value = data.updatedAt || new Date().toISOString()
      provider.value = data.provider || 'Live market feed'
      isLive.value = Boolean(data.live && !data.stale)
      error.value = data.warning || ''
      lastFetch.value = Date.now()

      localStorage.setItem('liveFxRates', JSON.stringify({
        rates: rates.value,
        updatedAt: lastUpdated.value,
        provider: provider.value,
        live: isLive.value
      }))
    } catch (e) {
      error.value = e?.message || 'Unable to refresh live currency pricing.'
      isLive.value = false
      console.warn('Live currency fetch failed, using the last successful rates', e)
    } finally {
      lastFetch.value = Date.now()
      loading.value = false
    }
  }

  function startLiveUpdates() {
    if (refreshTimer) return
    fetchRates({ force: true })
    refreshTimer = setInterval(() => fetchRates({ force: true }), 60_000)
  }

  function stopLiveUpdates() {
    clearInterval(refreshTimer)
    refreshTimer = null
  }

  function setCurrency(code) {
    const next = currencies.includes(code) ? code : 'MYR'
    current.value = next
    localStorage.setItem('currency', next)
    fetchRates()
  }

  function format(myrPrice) {
    const converted = (Number(myrPrice) * rate.value).toFixed(2)
    return `${symbol.value} ${converted}`
  }

  return {
    current,
    rates,
    loading,
    lastUpdated,
    provider,
    isLive,
    error,
    currencies,
    symbols,
    symbol,
    rate,
    fetchRates,
    startLiveUpdates,
    stopLiveUpdates,
    setCurrency,
    format
  }
})
