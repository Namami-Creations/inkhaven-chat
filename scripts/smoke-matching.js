#!/usr/bin/env node

/**
 * Smoke test: verifies local Next API route + Supabase auth are working together.
 * - Starts from .env.local (no dotenv dependency)
 * - Signs in anonymously (anon key)
 * - Calls local /api/matching/smart with Bearer token
 *
 * Usage:
 *   node scripts/smoke-matching.js http://localhost:3001
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const map = {}
  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx < 1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    value = value.replace(/^['"]|['"]$/g, '')
    map[key] = value
  }
  return map
}

async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:3000'
  const fileEnv = readEnvFile(path.join(process.cwd(), '.env.local'))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.error('Anonymous auth failed')
    console.error(error)
    process.exit(2)
  }

  const token = data?.session?.access_token
  if (!token) {
    console.error('Anonymous auth succeeded but no access token found')
    process.exit(3)
  }

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/matching/smart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ interests: ['Music'], language: 'English', ageGroup: '18-25' })
  })

  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    // ignore
  }

  console.log('match api status:', res.status)
  if (json) {
    console.log('match api response:', {
      success: Boolean(json.success),
      status: json.status ?? null,
      error: json.error ?? null,
      sessionId: json.sessionId ?? null
    })
  } else {
    console.log('match api non-json:', text.slice(0, 200))
  }

  process.exit(res.status >= 500 ? 5 : 0)
}

main().catch((err) => {
  console.error(err?.message || err)
  process.exit(4)
})
