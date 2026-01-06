#!/usr/bin/env node

/**
 * Environment Validation CLI Utility (self-contained)
 *
 * Checks the variables actually used by the current Next.js app:
 * - Supabase (required)
 * - TURN (optional but strongly recommended for video reliability)
 * - NextAuth (optional; currently used only for a test credentials provider)
 */

const fs = require('fs')
const path = require('path')

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
    value = value.replace(/^['"]|['"]$/g, '')
    map[key] = value
  }
  return map
}

function isPresent(v) {
  return typeof v === 'string' && v.trim().length > 0
}

function redact(v) {
  if (!isPresent(v)) return ''
  if (v.length <= 8) return '********'
  return `${v.slice(0, 3)}…${v.slice(-3)}`
}

function main() {
  const args = process.argv.slice(2)
  const json = args.includes('--json')

  const envPath = path.join(process.cwd(), '.env.local')
  const env = { ...process.env, ...readEnvFile(envPath) }

  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
  const missing = required.filter((k) => !isPresent(env[k]))

  const warnings = []
  if (!isPresent(env.NEXT_PUBLIC_METERED_DOMAIN) || !isPresent(env.NEXT_PUBLIC_TURN_USERNAME) || !isPresent(env.NEXT_PUBLIC_TURN_CREDENTIAL)) {
    warnings.push('TURN is not fully configured (video calls may fail on restrictive networks).')
  }

  if (!isPresent(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)) {
    warnings.push('NEXT_PUBLIC_TURNSTILE_SITE_KEY not set (required if Supabase Auth captcha/Turnstile is enabled).')
  }

  // Prevent common misconfiguration: secret key must never be shipped to the browser.
  if (isPresent(env.TURNSTILE_SECRET_KEY) || isPresent(env.NEXT_PUBLIC_TURNSTILE_SECRET_KEY)) {
    warnings.push('Turnstile secret key detected in env. Remove it from .env.local and store it only in Supabase Auth captcha settings.')
  }
  if (!isPresent(env.NEXTAUTH_SECRET) || !isPresent(env.NEXTAUTH_URL)) {
    warnings.push('NEXTAUTH_SECRET / NEXTAUTH_URL not configured (only needed if you use NextAuth flows).')
  }

  const result = {
    ok: missing.length === 0,
    envFile: fs.existsSync(envPath) ? envPath : null,
    missing,
    warnings,
    summary: {
      NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL || null,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: isPresent(env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ? redact(env.NEXT_PUBLIC_SUPABASE_ANON_KEY) : null,
      SUPABASE_SERVICE_ROLE_KEY: isPresent(env.SUPABASE_SERVICE_ROLE_KEY) ? redact(env.SUPABASE_SERVICE_ROLE_KEY) : null,
      NEXT_PUBLIC_METERED_DOMAIN: env.NEXT_PUBLIC_METERED_DOMAIN || null,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? '(set)' : null
    }
  }

  if (json) {
    console.log(JSON.stringify(result, null, 2))
    process.exit(result.ok ? 0 : 1)
  }

  console.log('InkHaven Chat - Environment Validator')
  console.log('')
  console.log(`Env file: ${result.envFile ?? '(not found)'}`)
  console.log('')
  if (result.ok) {
    console.log('✅ Required variables present')
  } else {
    console.log('❌ Missing required variables:')
    for (const k of missing) console.log(`  - ${k}`)
  }

  if (warnings.length > 0) {
    console.log('')
    console.log('⚠️  Warnings:')
    for (const w of warnings) console.log(`  - ${w}`)
  }

  process.exit(result.ok ? 0 : 1)
}

main()