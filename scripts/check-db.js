#!/usr/bin/env node

/**
 * Check Supabase backend health: required tables + storage buckets.
 *
 * Usage:
 *   node scripts/check-db.js
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const { spawnSync } = require('child_process')

function findPsqlPath() {
  // Try PATH first
  const res = spawnSync('psql', ['--version'], { encoding: 'utf8' })
  if (!res.error) return 'psql'

  const programFiles = process.env.ProgramFiles || 'C:\\Program Files'
  const candidates = [17, 16, 15, 14, 13].map(
    (v) => `${programFiles}\\PostgreSQL\\${v}\\bin\\psql.exe`
  )
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const map = {}
  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx < 1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    value = value.replace(/^['\"]|['\"]$/g, '')
    map[key] = value
  }
  return map
}

function getEnv(name, fileEnv) {
  return process.env[name] || fileEnv[name] || ''
}

async function main() {
  const envFile = readEnvFile(path.join(process.cwd(), '.env.local'))
  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL', envFile)
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY', envFile)
  const databaseUrl = getEnv('DATABASE_URL', envFile)

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (set in .env.local).')
    process.exit(1)
  }

  if (!databaseUrl) {
    console.error('Missing DATABASE_URL in .env.local; table checks require it.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  console.log('Checking tables (via psql)...')
  const requiredTables = ['messages', 'waiting_users', 'anonymous_sessions', 'call_signals', 'voice_messages', 'reports', 'profiles', 'attachments']
  const url = new URL(databaseUrl)
  const pgEnv = {
    ...process.env,
    PGSSLMODE: 'require',
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGDATABASE: url.pathname.replace(/^\//, '') || 'postgres',
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password)
  }
  const psqlPath = findPsqlPath()
  if (!psqlPath) {
    console.error('psql not found. Install PostgreSQL client tools to run table checks.')
    process.exit(1)
  }

  const query = `select table_name from information_schema.tables where table_schema='public' and table_name = any(array['${requiredTables.join("','")}']) order by table_name;`
  const res = spawnSync(psqlPath, ['-X', '-At', '-v', 'ON_ERROR_STOP=1', '-c', query], { env: pgEnv, encoding: 'utf8' })
  if (res.status !== 0) {
    console.error(res.stderr || `psql exited with ${res.status}`)
    process.exit(res.status || 1)
  }
  const present = new Set((res.stdout || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean))
  for (const t of requiredTables) {
    console.log(`  ${t}: ${present.has(t) ? 'OK' : 'MISSING'}`)
  }

  console.log('\nChecking storage buckets...')
  const { data: bucketsList, error: listErr } = await supabase.storage.listBuckets()
  if (listErr) {
    const details = typeof listErr === 'object' ? JSON.stringify(listErr) : String(listErr)
    console.log(`  listBuckets: ERROR - ${details}`)
  } else {
    const ids = (bucketsList || []).map((b) => b.id).sort()
    console.log(`  Buckets present: ${ids.join(', ') || '(none)'}`)
  }

  const buckets = ['voice-messages', 'chat-attachments']

  for (const bucket of buckets) {
    const { error } = await supabase.storage.getBucket(bucket)
    if (error) {
      const details = typeof error === 'object' ? JSON.stringify(error) : String(error)
      console.log(`  ${bucket}: ERROR - ${details}`)
    }
    else console.log(`  ${bucket}: OK`)
  }
}

main().catch((err) => {
  console.error(err?.message || err)
  process.exit(1)
})
