#!/usr/bin/env node

/**
 * Unified Supabase setup runner (schema + storage).
 *
 * Requires `psql` in PATH.
 * Reads config from `.env.local` (without extra deps) and/or process env.
 *
 * Usage:
 *   node scripts/setup-supabase.js
 *   node scripts/setup-supabase.js --schema-only
 *   node scripts/setup-supabase.js --storage-only
 */

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const readline = require('readline')

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

function projectRefFromSupabaseUrl(supabaseUrl) {
  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  const raw = String(supabaseUrl).trim().replace(/^['\"]|['\"]$/g, '').replace(/\/$/, '')
  const match = raw.match(/^https?:\/\/(?<ref>[a-z0-9-]+)\.supabase\.co/i)
  if (!match?.groups?.ref) {
    throw new Error(`Could not parse project ref from NEXT_PUBLIC_SUPABASE_URL (${raw}). Expected https://<ref>.supabase.co`)
  }
  return match.groups.ref
}

function passwordFromDatabaseUrl(databaseUrl) {
  if (!databaseUrl) return null
  const raw = String(databaseUrl).trim().replace(/^['\"]|['\"]$/g, '')
  const match = raw.match(/^postgres(?:ql)?:\/\/[^:]+:(?<pw>[^@]+)@/i)
  return match?.groups?.pw ?? null
}

function usageAndExit(code) {
  console.log('Usage: node scripts/setup-supabase.js [--schema-only|--storage-only]')
  process.exit(code)
}

function runPsql({ filePath, env }) {
  const res = spawnSync('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-f', filePath], {
    stdio: 'inherit',
    env
  })

  if (res.error && res.error.code === 'ENOENT') {
    console.error('psql not found. Install PostgreSQL client tools (or use scripts/apply-supabase-sql.ps1 on Windows).')
    process.exit(1)
  }

  if (typeof res.status === 'number' && res.status !== 0) {
    process.exit(res.status)
  }
}

async function promptHidden(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return await new Promise((resolve) => {
    const onDataHandler = (char) => {
      char = char + ''
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.off('data', onDataHandler)
          rl.output.write('\n')
          break
        default:
          rl.output.write('\x1B[2K\x1B[200D' + question + Array(rl.line.length + 1).join('*'))
          break
      }
    }

    process.stdin.on('data', onDataHandler)
    rl.question(question, (value) => {
      rl.close()
      resolve(value)
    })
  })
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) usageAndExit(0)

  const schemaOnly = args.includes('--schema-only')
  const storageOnly = args.includes('--storage-only')
  if (schemaOnly && storageOnly) usageAndExit(1)

  const repoRoot = process.cwd()
  const envFilePath = path.join(repoRoot, '.env.local')
  const fileEnv = readEnvFile(envFilePath)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL
  const databaseUrl = process.env.DATABASE_URL || fileEnv.DATABASE_URL

  const projectRef = projectRefFromSupabaseUrl(supabaseUrl)
  const poolerHost = `${projectRef}.pooler.supabase.com`

  const pgUser = process.env.PGUSER || fileEnv.PGUSER || `postgres.${projectRef}`
  const pgDb = process.env.PGDATABASE || fileEnv.PGDATABASE || 'postgres'
  const pgPort = process.env.PGPORT || fileEnv.PGPORT || '6543'

  let pgPassword = process.env.PGPASSWORD || passwordFromDatabaseUrl(databaseUrl)
  if (!pgPassword) {
    pgPassword = await promptHidden(`Database password for ${pgUser}: `)
  }
  if (!pgPassword) {
    console.error('Missing database password. Set PGPASSWORD or DATABASE_URL, or enter when prompted.')
    process.exit(1)
  }

  const schemaPath = path.join(repoRoot, 'database', 'schema.sql')
  const storagePath = path.join(repoRoot, 'database', 'storage-setup.sql')

  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema file not found: ${schemaPath}`)
    process.exit(1)
  }
  if (!fs.existsSync(storagePath)) {
    console.error(`Storage setup file not found: ${storagePath}`)
    process.exit(1)
  }

  console.log('Target:')
  console.log(`  Host: ${poolerHost}`)
  console.log(`  Port: ${pgPort}`)
  console.log(`  DB:   ${pgDb}`)
  console.log(`  User: ${pgUser}`)

  const pgEnv = {
    ...process.env,
    PGSSLMODE: 'require',
    PGHOST: poolerHost,
    PGPORT: String(pgPort),
    PGDATABASE: String(pgDb),
    PGUSER: String(pgUser),
    PGPASSWORD: String(pgPassword)
  }

  if (!storageOnly) {
    console.log('Applying database schema...')
    runPsql({ filePath: schemaPath, env: pgEnv })
  }

  if (!schemaOnly) {
    console.log('Applying storage setup...')
    runPsql({ filePath: storagePath, env: pgEnv })
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error(err?.message || err)
  process.exit(1)
})
