const DEFAULT_GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
const DEFAULT_GOOGLE_MODEL = 'gemini-2.5-flash'

const SYSTEM_PROMPT = `
You are a PC component compatibility recommendation assistant for an online PC hardware store.
You receive the store's real product catalog and the customer's currently selected parts.
Recommend only products from the provided catalog. Never invent product IDs.
Prioritize a complete, functioning PC build: CPU socket and motherboard platform, RAM generation, GPU fit, PSU wattage, storage support, cooler suitability, case clearance, and balanced performance.
If exact specs are missing, infer carefully from product names and descriptions, then choose conservative compatible options.
Return only valid compact JSON in this exact shape:
{"items":[{"category":"category_key","productIds":["catalog_id"],"reasons":["short reason"]}]}
If unsure for one category, return that category with an empty productIds array.
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
      name: sanitizeText(product?.name, 140),
      category: normalizeCategory(product?.category),
      price: Number(product?.price || 0),
      stock: Number(product?.stock ?? 0),
      description: sanitizeText(product?.description || product?.details, 160)
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
  const compactCatalog = products.map((product) => ({
    id: product.id,
    category: product.category,
    name: product.name,
    price: product.price,
    stock: product.stock,
    description: product.description
  }))

  return JSON.stringify({
    task: 'Return smart recommendations for remaining PC build components.',
    expectedOutputShape: {
      items: [
        {
          category: 'processor',
          productIds: ['catalog_product_id_1', 'catalog_product_id_2'],
          reasons: ['short reason for product 1', 'short reason for product 2']
        }
      ]
    },
    rules: [
      'Return one item for every unselected category key.',
      'For each item, return up to 3 product IDs from the catalog only.',
      'Do not return products from the wrong category.',
      'Do not return selected product IDs.',
      'Avoid out-of-stock products unless no in-stock option exists.',
      'Use compatibility and balanced build reasoning, not just lowest price.',
      'The reasons array must match the productIds order.',
      'Use compact JSON with double-quoted keys and string values only.',
      'Return JSON only, no markdown.'
    ],
    categories,
    selectedParts,
    catalog: compactCatalog
  })
}

function buildGeminiResponseSchema(categories) {
  return {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: categories.map((category) => category.key)
            },
            productIds: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 3
            },
            reasons: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 3
            }
          },
          required: ['category', 'productIds', 'reasons'],
          additionalProperties: false
        }
      }
    },
    required: ['items'],
    additionalProperties: false
  }
}

function extractJson(text) {
  const value = String(text || '').trim()

  if (!value) {
    throw new Error('Recommendation service returned an empty response.')
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

  throw new Error('Recommendation service returned invalid JSON.')
}

function getGeminiText(data) {
  return (data?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.text || '')
    .filter(Boolean)
    .join('\n')
}

function validateAiResult(raw, { categories, catalogById, selectedParts }) {
  const selectedIds = new Set(Object.values(selectedParts).map((product) => product.id))
  const recommendations = {}
  const reasons = {}
  const rawRecommendations = {}
  const rawReasons = {}

  if (Array.isArray(raw?.items)) {
    for (const item of raw.items) {
      const categoryKey = normalizeCategory(item?.category)
      const ids = Array.isArray(item?.productIds) ? item.productIds : []
      const itemReasons = Array.isArray(item?.reasons) ? item.reasons : []

      rawRecommendations[categoryKey] = ids
      rawReasons[categoryKey] = {}

      ids.forEach((id, index) => {
        rawReasons[categoryKey][String(id || '')] = itemReasons[index] || ''
      })
    }
  } else {
    Object.assign(rawRecommendations, raw?.recommendations || {})
    Object.assign(rawReasons, raw?.reasons || {})
  }

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
  const model = process.env.PC_RECOMMENDATION_GROQ_MODEL || DEFAULT_GROQ_MODEL

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature: 0.15,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]
    })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const retryAfter = Math.ceil(Number(response.headers.get('retry-after') || 0))

    if (response.status === 429) {
      const error = new Error(
        retryAfter > 0
          ? `Smart recommendations are refreshing too quickly. Retrying in ${retryAfter} seconds.`
          : 'Smart recommendations are refreshing too quickly. Please try again shortly.'
      )
      error.status = 429
      error.retryAfter = retryAfter
      throw error
    }

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
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const generationConfig = {
    temperature: 0.15,
    maxOutputTokens: 3000,
    responseMimeType: 'application/json',
    responseJsonSchema: buildGeminiResponseSchema(categories)
  }

  const response = await fetch(endpoint, {
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
      generationConfig
    })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.error?.message || `Google recommendation request failed with status ${response.status}`)
  }

  const rawText = getGeminiText(data)
  let raw

  try {
    raw = extractJson(rawText)
  } catch {
    try {
      raw = await repairGoogleJson({ endpoint, model, prompt, rawText, categories })
    } catch {
      raw = await retryGoogleJson({ endpoint, model, prompt, rawText, categories })
    }
  }

  return {
    provider: 'google',
    model,
    raw
  }
}

async function repairGoogleJson({ endpoint, model, prompt, rawText, categories }) {
  const repairPrompt = JSON.stringify({
    task: 'Repair the previous AI response into valid JSON only.',
    originalRequest: JSON.parse(prompt),
    previousResponse: String(rawText || '').slice(0, 12000),
    requiredOutput: buildGeminiResponseSchema(categories)
  })

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: repairPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 3000,
        responseMimeType: 'application/json',
        responseJsonSchema: buildGeminiResponseSchema(categories)
      }
    })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.error?.message || `Google JSON repair request failed with status ${response.status}`)
  }

  const repairedText = getGeminiText(data)
  try {
    return extractJson(repairedText)
  } catch {
    throw new Error(`Recommendation service returned invalid JSON from ${model}.`)
  }
}

async function retryGoogleJson({ endpoint, model, prompt, rawText, categories }) {
  const retryPrompt = JSON.stringify({
    task: 'Return only one valid JSON object for PC part recommendations. No markdown, no explanation.',
    shape: { items: [{ category: 'category_key', productIds: ['catalog_id'], reasons: ['short reason'] }] },
    allowedCategories: categories.map((category) => category.key),
    originalRequest: JSON.parse(prompt),
    previousInvalidResponse: String(rawText || '').slice(0, 6000)
  })

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: retryPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 2200,
        responseMimeType: 'application/json'
      }
    })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.error?.message || `Google JSON retry request failed with status ${response.status}`)
  }

  try {
    return extractJson(getGeminiText(data))
  } catch {
    throw new Error(`Recommendation service returned invalid JSON from ${model}.`)
  }
}

function isQuotaError(error) {
  return /quota|rate limit|rate-limit|429|exceeded/i.test(String(error?.message || ''))
}

async function callPreferredProvider({ provider, hasGroq, hasGoogle, prompt, categories }) {
  if (provider === 'google') {
    if (!hasGoogle) throw new Error('Google key is not configured.')

    try {
      return await callGoogle(prompt, categories)
    } catch (error) {
      if (hasGroq && isQuotaError(error)) {
        return callGroq(prompt)
      }
      if (isQuotaError(error)) {
        throw new Error('Google quota exceeded. Switch the recommendation provider to Groq or wait for the quota reset.')
      }
      throw error
    }
  }

  if (!hasGroq) throw new Error('Groq key is not configured.')

  return callGroq(prompt)
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
      return sendJson(res, 400, { error: 'Select at least one component before requesting smart recommendations.' })
    }

    const prompt = buildPrompt({ products, categories, selectedParts })

    const provider = String(process.env.PC_RECOMMENDATION_PROVIDER || 'groq').toLowerCase()
    const hasGroq = Boolean(process.env.GROQ_API_KEY)
    const hasGoogle = Boolean(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY)

    const result = await callPreferredProvider({ provider, hasGroq, hasGoogle, prompt, categories })

    const validated = validateAiResult(result.raw, { categories, catalogById, selectedParts })

    return sendJson(res, 200, {
      provider: result.provider,
      model: result.model,
      source: 'smart-recommendation',
      ...validated
    })
  } catch (error) {
    return sendJson(res, error?.status || 500, {
      error: error?.message || 'PC recommendation request failed.',
      retryAfter: error?.retryAfter || undefined
    })
  }
}
