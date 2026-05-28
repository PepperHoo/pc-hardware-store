/**
 * import-to-supabase.js
 *
 * Run once to seed your Supabase database from db.json:
 *   node import-to-supabase.js
 *
 * Requirements: Node 18+ (uses built-in fetch)
 */

import fs from 'fs'

// ─── Supabase credentials ────────────────────────────────────────────────────
const BASE_URL = 'https://qmrhibrvgswkeheinlxd.supabase.co/rest/v1'
const API_KEY  =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcmhpYnJ2Z3N3a2VoZWlubHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NjgwNzMsImV4cCI6MjA5NTU0NDA3M30.' +
  'q5TGqhpt6k29Mbb_ZffpASB2uG1ocdRu7RVmctcN3AQ'

const HEADERS = {
  'apikey':        API_KEY,
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type':  'application/json',
  'Prefer':        'return=minimal'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function insertBatch(table, rows) {
  if (!rows || rows.length === 0) return

  // Insert in chunks of 100 to avoid request size limits
  const chunkSize = 100
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const res = await fetch(`${BASE_URL}/${table}`, {
      method:  'POST',
      headers: HEADERS,
      body:    JSON.stringify(chunk)
    })
    if (!res.ok) {
      const text = await res.text()
      console.error(`  ✗ Error inserting into ${table} (chunk ${Math.floor(i/chunkSize)+1}):`, text)
    } else {
      console.log(`  ✓ Inserted rows ${i + 1}–${Math.min(i + chunkSize, rows.length)} into ${table}`)
    }
  }
}

async function clearTable(table) {
  // Delete all rows (RLS must be off)
  const res = await fetch(`${BASE_URL}/${table}?id=gte.0`, {
    method:  'DELETE',
    headers: HEADERS
  })
  // Also try text-id tables
  if (!res.ok) {
    const res2 = await fetch(`${BASE_URL}/${table}?id=neq.null_placeholder`, {
      method:  'DELETE',
      headers: { ...HEADERS, 'Prefer': 'return=minimal' }
    })
    if (!res2.ok) {
      console.warn(`  ⚠ Could not clear ${table} (may already be empty)`)
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Reading db.json...')
  const db = JSON.parse(fs.readFileSync('./db.json', 'utf8'))

  // ── PRODUCTS ────────────────────────────────────────────────────────────────
  if (db.products?.length) {
    console.log(`\nImporting ${db.products.length} products...`)
    const rows = db.products.map(p => ({
      id:          String(p.id),
      name:        p.name        || '',
      price:       Number(p.price || 0),
      category:    p.category    || '',
      image:       p.image       || '',
      stock:       Number(p.stock || 0),
      description: p.description || p.details || ''
    }))
    await insertBatch('products', rows)
  }

  // ── USERS ────────────────────────────────────────────────────────────────────
  if (db.users?.length) {
    console.log(`\nImporting ${db.users.length} users...`)
    const rows = db.users.map(u => ({
      username: u.username || '',
      email:    u.email    || '',
      password: u.password || '',
      role:     u.role     || 'user',
      birthday: u.birthday || null,
      phone:    u.phone    || null,
      address:  u.address  || null
    }))
    await insertBatch('users', rows)
  }

  // ── ORDERS ──────────────────────────────────────────────────────────────────
  if (db.orders?.length) {
    console.log(`\nImporting ${db.orders.length} orders...`)
    const rows = db.orders.map(o => ({
      userEmail:       o.userEmail       || '',
      recipientName:   o.recipientName   || '',
      phoneNumber:     o.phoneNumber     || '',
      shippingAddress: o.shippingAddress || '',
      shippingMethod:  o.shippingMethod  || '',
      paymentMethod:   o.paymentMethod   || '',
      items:           o.items           || [],
      total:           Number(o.total    || 0),
      status:          o.status          || 'Pending',
      date:            o.date            || new Date().toISOString()
    }))
    await insertBatch('orders', rows)
  }

  // ── HOMEPAGE ─────────────────────────────────────────────────────────────────
  const hp = db.homepage
  if (hp) {
    console.log('\nImporting homepage data...')
    const row = {
      banners:        hp.bannerImages    || hp.banners    || [],
      hotSelling:     hp.hotSelling      || [],
      latestProducts: hp.latestProducts  || []
    }
    const res = await fetch(`${BASE_URL}/homepage`, {
      method:  'POST',
      headers: HEADERS,
      body:    JSON.stringify([row])
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('  ✗ Error inserting homepage:', text)
    } else {
      console.log('  ✓ Homepage data inserted')
    }
  }

  // ── PASSWORD RESETS ──────────────────────────────────────────────────────────
  // Skip — leave empty, not needed for seed data

  console.log('\n✅ Import complete! Your Supabase database is now seeded.')
  console.log('   Refresh your Vercel site and products should appear.')
}

main().catch(console.error)
