const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant'
const DEFAULT_GOOGLE_MODEL = 'gemini-2.5-flash'

const SYSTEM_PROMPT = `
You are a PC component compatibility recommendation API for an online PC hardware store.
You receive the store's real product catalog and the customer's currently selected parts.
Recommend only products from the provided catalog. Never invent product IDs.
Prioritize a complete, functioning PC build: CPU socket and motherboard platform, RAM generation, GPU fit, PSU wattage, storage support, cooler suitability, case clearance, and balanced performance.
If exact specs are missing, infer carefully from product names and descriptions, then choose conservative compatible options.
Return only valid compact JSON. If unsure for one category, return an empty array for that category.
`.trim()

function sendJson(res, status, payload) {
  res.status(status).json(payload)
}

function sanitizeText(value, maxLength = 700) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

async function readBody(req) {
  if (req.body) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  }

  const chunks = []

  for await (const chunk of req) {
    chunks.push(chunk)
  }

  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function normalizeCategory(category) {
  return sanitizeText(category, 60).toLowerCase()
}

function normalizeProducts(products) {
  if (!Array.isArray(products)) return []

  return products
    .map((product) => ({
      id: sanitizeText(product?.id, 80),
      name: sanitizeText(product?.name, 180),
      category: normalizeCategory(product?.category),
      price: Number(product?.price || 0),
      stock: Number(product?.stock ?? 0),
      description: sanitizeText(product?.description || product?.details, 360)
    }))
    .filter((product) => product.id && product.name && product.category)
    .slice(0, 120)
}

function normalizeCategories(categories, products) {
  const fromRequest = Array.isArray(categories)
    ? categories.map((category) => ({
        key: normalizeCategory(category?.key || category),
        label: sanitizeText(category?.label || category?.key || category, 80)
      }))
    : []

  const categoryKeys = new Set(products.map((product) => product.category))

  return fromRequest
    .filter((category) => category.key && categoryKeys.has(category.key))
    .filter((category, index, list) => list.findIndex((item) => item.key === category.key) === index)
}

function normalizeSelectedParts(selectedParts, catalogById) {
  const selected = {}

  if (!selectedParts || typeof selectedParts !== 'object') return selected

  for (const [category, value] of Object.entries(selectedParts)) {
    const productId = typeof value === 'object' ? value?.id : value
    const product = catalogById.get(String(productId || ''))

    if (product) {
      selected[normalizeCategory(category)] = product
    }
  }

  return selected
}

function buildPrompt({ products, categories, selectedParts }) {
  const categoryKeys = categories.map((category) => category.key)
  const compactCatalog = products.map((product) => ({
    id: product.id,
    category: product.category,
    name: product.name,
    price: product.price,
    stock: product.stock,
    description: product.description
  }))

  return JSON.stringify({
    task: 'Return AI API recommendations for remaining PC build components.',
    expectedOutputShape: {
      recommendations: Object.fromEntries(categoryKeys.map((key) => [key, ['catalog_product_id']])),
      reasons: Object.fromEntries(categoryKeys.map((key) => [key, { catalog_product_id: 'short reason under 90 characters' }]))
    },
    rules: [
      'Return every unselected category key.',
      'For each unselected category, return up to 3 product IDs from the catalog only.',
      'Do not return products from the wrong category.',
      'Do not return selected product IDs.',
      'Avoid out-of-stock products unless no in-stock option exists.',
      'Use compatibility and balanced build reasoning, not just lowest price.',
      'Use compact JSON with double-quoted keys and string values.',
      'Return JSON only, no markdown.'
    ],
    categories,
    selectedParts,
    catalog: compactCatalog
  })
}

function buildGeminiResponseSchema(categories) {
  const recommendationProperties = Object.fromEntries(
    categories.map((category) => [
      category.key,
      {
        type: 'ARRAY',
        items: { type: 'STRING' }
      }
    ])
  )
  const reasonProperties = Object.fromEntries(
    categories.map((category) => [
      category.key,
      {
        type: 'OBJECT'
      }
    ])
  )

  return {
    type: 'OBJECT',
    properties: {
      recommendations: {
        type: 'OBJECT',
        properties: recommendationProperties,
        required: categories.map((category) => category.key)
      },
      reasons: {
        type: 'OBJECT',
        properties: reasonProperties
      }
    },
    required: ['recommendations']
  }
}

function extractJson(text) {
  const value = String(text || '').trim()

  if (!value) {
    throw new Error('AI recommendation API returned an empty response.')
  }

  const unfenced = value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const attempts = [unfenced]
  const start = unfenced.indexOf('{')
  const end = unfenced.lastIndexOf('}')

  if (start >= 0 && end > start) {
    attempts.push(unfenced.slice(start, end + 1))
  }

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt)
    } catch {
      // Try the next extraction strategy.
    }
  }

  throw new Error('AI recommendation API returned invalid JSON.')
}

function validateAiResult(raw, { categories, catalogById, selectedParts }) {
  const selectedIds = new Set(Object.values(selectedParts).map((product) => product.id))
  const recommendations = {}
  const reasons = {}
  const rawRecommendations = raw?.recommendations || {}
  const rawReasons = raw?.reasons || {}

  for (const category of categories) {
    const categoryKey = category.key
    const ids = Array.isArray(rawRecommendations[categoryKey])
      ? rawRecommendations[categoryKey]
      : []

    recommendations[categoryKey] = []
    reasons[categoryKey] = {}

    for (const idValue of ids) {
      const id = String(idValue || '')
      const product = catalogById.get(id)

      if (
        product &&
        product.category === categoryKey &&
        !selectedIds.has(id) &&
        !recommendations[categoryKey].includes(id)
      ) {
        recommendations[categoryKey].push(id)
        reasons[categoryKey][id] = sanitizeText(rawReasons?.[categoryKey]?.[id], 110)
      }

      if (recommendations[categoryKey].length >= 3) break
    }
  }

  return { recommendations, reasons }
}

async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY
  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature: 0.15,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]
    })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.error?.message || `Groq recommendation request failed with status ${response.status}`)
  }

  return {
    provider: 'groq',
    model,
    raw: extractJson(data?.choices?.[0]?.message?.content || '')
  }
}

async function callGoogle(prompt, categories) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  const model = process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || DEFAULT_GOOGLE_MODEL

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 3000,
          responseMimeType: 'application/json',
          responseSchema: buildGeminiResponseSchema(categories)
        }
      })
    }
  )

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.error?.message || `Google recommendation request failed with status ${response.status}`)
  }

  return {
    provider: 'google',
    model,
    raw: extractJson(data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n') || '')
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true })
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  try {
    const body = await readBody(req)
    const products = normalizeProducts(body.products)
    const catalogById = new Map(products.map((product) => [product.id, product]))
    const categories = normalizeCategories(body.categories, products)
    const selectedParts = normalizeSelectedParts(body.selectedParts, catalogById)

    if (products.length === 0 || categories.length === 0) {
      return sendJson(res, 400, { error: 'Product catalog and categories are required.' })
    }

    if (Object.keys(selectedParts).length === 0) {
      return sendJson(res, 400, { error: 'Select at least one component before requesting AI recommendations.' })
    }

    const prompt = buildPrompt({ products, categories, selectedParts })

    const provider = String(process.env.AI_PROVIDER || '').toLowerCase()
    const hasGroq = Boolean(process.env.GROQ_API_KEY)
    const hasGoogle = Boolean(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY)

    let result

    if (provider === 'google') {
      if (!hasGoogle) throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is not configured.')
      result = await callGoogle(prompt, categories)
    } else if (provider === 'groq') {
      if (!hasGroq) throw new Error('GROQ_API_KEY is not configured.')
      result = await callGroq(prompt)
    } else if (hasGroq) {
      result = await callGroq(prompt)
    } else if (hasGoogle) {
      result = await callGoogle(prompt, categories)
    } else {
      return sendJson(res, 500, {
        error: 'Recommendation API key is not configured. Add GROQ_API_KEY or GOOGLE_API_KEY in Vercel environment variables.'
      })
    }

    const validated = validateAiResult(result.raw, { categories, catalogById, selectedParts })

    return sendJson(res, 200, {
      provider: result.provider,
      model: result.model,
      source: 'real-ai-api',
      ...validated
    })
  } catch (error) {
    return sendJson(res, 500, {
      error: error?.message || 'PC recommendation API request failed.'
    })
  }
}
