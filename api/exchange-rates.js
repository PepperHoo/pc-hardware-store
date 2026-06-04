const PAIRS = {
  YEN: 'MYR/JPY',
  WON: 'MYR/KRW',
  USD: 'MYR/USD',
  SGD: 'MYR/SGD',
  EUR: 'MYR/EUR'
}

const CACHE_MS = 30_000
let cachedPayload = null
let cacheExpiresAt = 0

function sendJson(res, status, payload) {
  res.status(status).json(payload)
}

function getPrice(data, pair) {
  const value = Number(data?.[pair]?.price)
  return Number.isFinite(value) && value > 0 ? value : null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }

  const now = Date.now()

  if (cachedPayload && now < cacheExpiresAt) {
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    return sendJson(res, 200, cachedPayload)
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY

  if (!apiKey) {
    return sendJson(res, 500, {
      error: 'Live currency pricing is not configured. Add TWELVE_DATA_API_KEY in Vercel environment variables.'
    })
  }

  try {
    const endpoint = new URL('https://api.twelvedata.com/price')
    endpoint.searchParams.set('symbol', Object.values(PAIRS).join(','))
    endpoint.searchParams.set('apikey', apiKey)

    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' }
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok || data?.status === 'error') {
      throw new Error(data?.message || `Live currency provider returned status ${response.status}.`)
    }

    const rates = { MYR: 1 }

    for (const [code, pair] of Object.entries(PAIRS)) {
      const price = getPrice(data, pair)
      if (!price) throw new Error(`Live currency provider did not return a valid ${pair} price.`)
      rates[code] = price
    }

    cachedPayload = {
      base: 'MYR',
      rates,
      provider: 'Twelve Data',
      live: true,
      updatedAt: new Date().toISOString()
    }
    cacheExpiresAt = now + CACHE_MS

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    return sendJson(res, 200, cachedPayload)
  } catch (error) {
    if (cachedPayload) {
      return sendJson(res, 200, {
        ...cachedPayload,
        stale: true,
        warning: error?.message || 'Unable to refresh live currency pricing.'
      })
    }

    return sendJson(res, 502, {
      error: error?.message || 'Unable to fetch live currency pricing.'
    })
  }
}
