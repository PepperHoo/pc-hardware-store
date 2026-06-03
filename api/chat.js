const SYSTEM_PROMPT = `
You are the AI assistant for PC Hardware, an online store for PC components and custom PC building.
Help customers choose compatible components, compare parts, understand specifications, and plan a complete functioning PC build.
Be practical and concise. When compatibility is uncertain, explain what must be checked such as CPU socket, motherboard chipset, RAM type, case size, PSU wattage, cooler clearance, and GPU length.
Do not claim live stock, delivery status, or exact pricing unless the user provides it in the chat.
If the user asks for support outside PC hardware or store guidance, answer briefly and bring the conversation back to PC building.
`.trim()

const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant'
const DEFAULT_GOOGLE_MODEL = 'gemini-1.5-flash'

function sendJson(res, status, payload) {
  res.status(status).json(payload)
}

function sanitizeText(value, maxLength = 1600) {
  return String(value || '')
    .replace(/\s+\n/g, '\n')
    .trim()
    .slice(0, maxLength)
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return []

  return messages
    .map((message) => {
      const role = message?.role === 'assistant' ? 'assistant' : 'user'
      const content = sanitizeText(message?.content)
      return content ? { role, content } : null
    })
    .filter(Boolean)
    .slice(-12)
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

async function callGroq(messages) {
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
      temperature: 0.35,
      max_tokens: 650,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ]
    })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.error?.message || `Groq request failed with status ${response.status}`)
  }

  return {
    provider: 'groq',
    model,
    reply: sanitizeText(data?.choices?.[0]?.message?.content, 4000)
  }
}

async function callGoogle(messages) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  const model = process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || DEFAULT_GOOGLE_MODEL

  const contents = messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }]
  }))

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents,
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 650
        }
      })
    }
  )

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.error?.message || `Google AI request failed with status ${response.status}`)
  }

  return {
    provider: 'google',
    model,
    reply: sanitizeText(data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n'), 4000)
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
    const messages = normalizeMessages(body.messages)
    const latestUserMessage = messages.findLast((message) => message.role === 'user')

    if (!latestUserMessage) {
      return sendJson(res, 400, { error: 'Please send at least one user message.' })
    }

    const provider = String(process.env.AI_PROVIDER || '').toLowerCase()
    const hasGroq = Boolean(process.env.GROQ_API_KEY)
    const hasGoogle = Boolean(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY)

    let result

    if (provider === 'google') {
      if (!hasGoogle) throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is not configured.')
      result = await callGoogle(messages)
    } else if (provider === 'groq') {
      if (!hasGroq) throw new Error('GROQ_API_KEY is not configured.')
      result = await callGroq(messages)
    } else if (hasGroq) {
      result = await callGroq(messages)
    } else if (hasGoogle) {
      result = await callGoogle(messages)
    } else {
      return sendJson(res, 500, {
        error: 'AI API key is not configured. Add GROQ_API_KEY or GOOGLE_API_KEY in Vercel environment variables.'
      })
    }

    if (!result.reply) {
      return sendJson(res, 502, { error: 'The AI provider returned an empty response.' })
    }

    return sendJson(res, 200, result)
  } catch (error) {
    return sendJson(res, 500, {
      error: error?.message || 'AI chat request failed.'
    })
  }
}
