// ─────────────────────────────────────────────
// Supabase REST API helper
// ─────────────────────────────────────────────

const BASE_URL = 'https://qmrhibrvgswkeheinlxd.supabase.co/rest/v1'

const API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcmhpYnJ2Z3N3a2VoZWlubHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NjgwNzMsImV4cCI6MjA5NTU0NDA3M30.' +
  'q5TGqhpt6k29Mbb_ZffpASB2uG1ocdRu7RVmctcN3AQ'

const HEADERS = {
  'apikey':        API_KEY,
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type':  'application/json'
}

// ── helpers ───────────────────────────────────

async function handleRes(res) {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase error ${res.status}: ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ── CRUD ─────────────────────────────────────

/** Fetch every row from a table */
export async function getAll(table) {
  const res = await fetch(
    `${BASE_URL}/${table}?select=*`,
    { headers: HEADERS }
  )
  return handleRes(res)
}

/**
 * Fetch rows where field equals value
 * e.g. getWhere('users', 'email', 'foo@bar.com')
 */
export async function getWhere(table, field, value) {
  const res = await fetch(
    `${BASE_URL}/${table}?select=*&${field}=eq.${encodeURIComponent(value)}`,
    { headers: HEADERS }
  )
  return handleRes(res)
}

/**
 * Insert a new row; returns the created row
 */
export async function create(table, data) {
  const res = await fetch(
    `${BASE_URL}/${table}`,
    {
      method:  'POST',
      headers: { ...HEADERS, Prefer: 'return=representation' },
      body:    JSON.stringify(data)
    }
  )
  const rows = await handleRes(res)
  return Array.isArray(rows) ? rows[0] : rows
}

/**
 * Update row(s) by id; returns the updated row
 */
export async function update(table, id, data) {
  const res = await fetch(
    `${BASE_URL}/${table}?id=eq.${id}`,
    {
      method:  'PATCH',
      headers: { ...HEADERS, Prefer: 'return=representation' },
      body:    JSON.stringify(data)
    }
  )
  const rows = await handleRes(res)
  return Array.isArray(rows) ? rows[0] : rows
}

/**
 * Update row(s) by any field
 * e.g. updateWhere('passwordResets', 'token', 'abc123', { approved: true })
 */
export async function updateWhere(table, field, value, data) {
  const res = await fetch(
    `${BASE_URL}/${table}?${field}=eq.${encodeURIComponent(value)}`,
    {
      method:  'PATCH',
      headers: { ...HEADERS, Prefer: 'return=representation' },
      body:    JSON.stringify(data)
    }
  )
  const rows = await handleRes(res)
  return Array.isArray(rows) ? rows[0] : rows
}

/**
 * Delete row by id
 */
export async function remove(table, id) {
  const res = await fetch(
    `${BASE_URL}/${table}?id=eq.${id}`,
    {
      method:  'DELETE',
      headers: HEADERS
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase error ${res.status}: ${text}`)
  }
}

/**
 * Delete row(s) by field value
 * e.g. removeWhere('passwordResets', 'email', 'foo@bar.com')
 */
export async function removeWhere(table, field, value) {
  const res = await fetch(
    `${BASE_URL}/${table}?${field}=eq.${encodeURIComponent(value)}`,
    {
      method:  'DELETE',
      headers: HEADERS
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase error ${res.status}: ${text}`)
  }
}
