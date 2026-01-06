const { readFileSync, existsSync } = require('fs')
const { join } = require('path')
const { spawnSync } = require('child_process')

function readEnvFile(path) {
  if (!existsSync(path)) return {}
  const map = {}
  const envContent = readFileSync(path, 'utf8')
  envContent.split('\n').forEach((rawLine) => {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) return
    const idx = line.indexOf('=')
    if (idx < 1) return
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    value = value.replace(/^['"]|['"]$/g, '')
    map[key] = value
  })
  return map
}

function projectRefFromSupabaseUrl(supabaseUrl) {
  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local')
  const raw = String(supabaseUrl).trim().replace(/^['"]|['"]$/g, '').replace(/\/$/, '')
  const match = raw.match(/^https?:\/\/(?<ref>[a-z0-9-]+)\.supabase\.co/i)
  if (!match?.groups?.ref) {
    throw new Error(`Could not parse project ref from NEXT_PUBLIC_SUPABASE_URL (${raw}). Expected https://<ref>.supabase.co`)
  }
  return match.groups.ref
}

function passwordFromDatabaseUrl(databaseUrl) {
  if (!databaseUrl) return null
  const raw = String(databaseUrl).trim().replace(/^['"]|['"]$/g, '')
  const match = raw.match(/^postgres(?:ql)?:\/\/[^:]+:(?<pw>[^@]+)@/i)
  return match?.groups?.pw ?? null
}

function main() {
  const repoRoot = process.cwd()
  const env = readEnvFile(join(repoRoot, '.env.local'))

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL

  const projectRef = projectRefFromSupabaseUrl(supabaseUrl)
  const pgPassword = passwordFromDatabaseUrl(databaseUrl) || process.env.PGPASSWORD

  if (!pgPassword) {
    console.error('Missing database password. Add DATABASE_URL to .env.local or set PGPASSWORD in your shell.')
    console.error('Recommended (Windows): run scripts\\apply-supabase-sql.ps1 which prompts safely.')
    process.exit(1)
  }

  const schemaPath = join(repoRoot, 'database', 'schema.sql')
  if (!existsSync(schemaPath)) {
    console.error(`Schema file not found: ${schemaPath}`)
    process.exit(1)
  }

  const poolerHost = `${projectRef}.pooler.supabase.com`
  const pgUser = process.env.PGUSER || `postgres.${projectRef}`
  const pgDb = process.env.PGDATABASE || 'postgres'
  const pgPort = process.env.PGPORT || '6543'

  console.log('Target:')
  console.log(`  Host: ${poolerHost}`)
  console.log(`  Port: ${pgPort}`)
  console.log(`  DB:   ${pgDb}`)
  console.log(`  User: ${pgUser}`)
  console.log('Applying database schema...')

  const res = spawnSync('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-f', schemaPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PGSSLMODE: 'require',
      PGHOST: poolerHost,
      PGPORT: String(pgPort),
      PGDATABASE: String(pgDb),
      PGUSER: String(pgUser),
      PGPASSWORD: String(pgPassword)
    }
  })

  if (res.error && res.error.code === 'ENOENT') {
    console.error('psql not found. Install PostgreSQL client tools or use scripts\\apply-supabase-sql.ps1')
    process.exit(1)
  }

  process.exit(res.status ?? 0)
}

main()
