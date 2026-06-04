// ─────────────────────────────────────────────
// Supabase REST API helper
// ─────────────────────────────────────────────

const BASE_URL    = 'https://qmrhibrvgswkeheinlxd.supabase.co/rest/v1'
const STORAGE_URL = 'https://qmrhibrvgswkeheinlxd.supabase.co/storage/v1'
const PUBLIC_URL  = 'https://qmrhibrvgswkeheinlxd.supabase.co/storage/v1/object/public'

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
 * Fetch rows matching multiple equality filters.
 * e.g. getWhereMany('cart_items', { user_email: 'foo@bar.com', product_id: 'abc' })
 */
export async function getWhereMany(table, filters) {
  const query = Object.entries(filters)
    .map(([field, value]) => `${field}=eq.${encodeURIComponent(value)}`)
    .join('&')
  const res = await fetch(
    `${BASE_URL}/${table}?select=*&${query}`,
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
 * Insert or update a row using a Supabase unique constraint.
 * e.g. upsert('cart_items', row, 'user_email,product_id')
 */
export async function upsert(table, data, conflictFields = 'id') {
  const res = await fetch(
    `${BASE_URL}/${table}?on_conflict=${encodeURIComponent(conflictFields)}`,
    {
      method:  'POST',
      headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates,return=representation' },
      body:    JSON.stringify(data)
    }
  )
  const rows = await handleRes(res)
  return Array.isArray(rows) ? rows[0] : rows
}

/**
 * Insert an order using return=minimal to avoid RLS SELECT conflicts
 */
export async function createOrder(data) {
  const res = await fetch(
    `${BASE_URL}/orders`,
    {
      method:  'POST',
      headers: { ...HEADERS, Prefer: 'return=minimal' },
      body:    JSON.stringify(data)
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Order insert failed ${res.status}: ${text}`)
  }
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

// ── Storage ───────────────────────────────────

/**
 * Upload a File object to Supabase Storage.
 * Returns the public URL of the uploaded image.
 *
 * @param {string} bucket  - Storage bucket name (e.g. 'images')
 * @param {File}   file    - The File object from an <input type="file">
 * @param {string} [folder] - Optional subfolder (e.g. 'products', 'banners')
 *
 * Usage:
 *   const url = await uploadImage('images', file, 'products')
 */
export async function uploadImage(bucket, file, folder = '') {

  // Build a unique filename to avoid collisions
  const ext      = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path     = folder ? `${folder}/${filename}` : filename

  const res = await fetch(
    `${STORAGE_URL}/object/${bucket}/${path}`,
    {
      method:  'POST',
      headers: {
        'apikey':        API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type':  file.type || 'application/octet-stream',
        'x-upsert':      'true'
      },
      body: file
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Storage upload failed ${res.status}: ${text}`)
  }

  // Return the public URL
  return `${PUBLIC_URL}/${bucket}/${path}`
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

/**
 * Delete rows matching multiple equality filters.
 * e.g. removeWhereMany('wishlist_items', { user_email: 'foo@bar.com', product_id: 'abc' })
 */
export async function removeWhereMany(table, filters) {
  const query = Object.entries(filters)
    .map(([field, value]) => `${field}=eq.${encodeURIComponent(value)}`)
    .join('&')
  const res = await fetch(
    `${BASE_URL}/${table}?${query}`,
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
