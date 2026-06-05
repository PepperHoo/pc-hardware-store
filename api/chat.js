const SYSTEM_PROMPT = `
You are the AI assistant for PC Hardware, an online store for PC components and custom PC building.
Help customers choose compatible components, compare parts, understand specifications, and plan a complete functioning PC build.
Be practical and concise. When compatibility is uncertain, explain what must be checked such as CPU socket, motherboard chipset, RAM type, case size, PSU wattage, cooler clearance, and GPU length.
Do not claim live stock, delivery status, or exact pricing unless the user provides it in the chat.
If the user asks for support outside PC hardware or store guidance, answer briefly and bring the conversation back to PC building.
`.trim()

const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant'

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
  const apiKey = process.env.CHAT_GROQ_API_KEY || process.env.GROQ_API_KEY
  const model = process.env.CHAT_GROQ_MODEL || process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL

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

    const hasGroq = Boolean(process.env.CHAT_GROQ_API_KEY || process.env.GROQ_API_KEY)

    if (!hasGroq) {
      return sendJson(res, 500, {
        error: 'AI chat key is not configured. Add CHAT_GROQ_API_KEY or GROQ_API_KEY in Vercel environment variables.'
      })
    }

    const result = await callGroq(messages)

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
