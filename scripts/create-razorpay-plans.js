#!/usr/bin/env node

/**
 * Razorpay Plans Creation Script
 *
 * Usage:
 *   node scripts/create-razorpay-plans.js
 *
 * Required env vars (in .env.local or your shell):
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
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
    value = value.replace(/^['\"]|['\"]$/g, '')
    map[key] = value
  }
  return map
}

function getEnv(name, fileEnv) {
  return process.env[name] || fileEnv[name] || ''
}

function requireEnv(name, fileEnv) {
  const v = getEnv(name, fileEnv)
  if (!v) {
    console.error(`Missing ${name}. Set it in .env.local or your shell.`)
    process.exit(1)
  }
  return v
}

async function createPlan(authHeader, planData) {
  const response = await fetch('https://api.razorpay.com/v1/plans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader
    },
    body: JSON.stringify(planData)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(`Failed to create plan (${response.status}): ${JSON.stringify(error)}`)
  }

  return await response.json()
}

async function main() {
  const envFile = readEnvFile(path.join(process.cwd(), '.env.local'))

  const keyId = requireEnv('RAZORPAY_KEY_ID', envFile)
  const keySecret = requireEnv('RAZORPAY_KEY_SECRET', envFile)

  const authHeader =
    'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  console.log('Creating Razorpay Subscription Plans...\n')

  // Keep the plan definitions aligned with razorpay-plans.txt (if used).
  const monthlyPlan = await createPlan(authHeader, {
    period: 'monthly',
    interval: 1,
    item: {
      name: 'InkHaven Premium Monthly',
      description:
        'Premium monthly subscription with video chat and ad-free experience.',
      amount: 41000,
      currency: 'INR'
    }
  })
  console.log('Monthly plan created:')
  console.log(`  id: ${monthlyPlan.id}`)

  const yearlyPlan = await createPlan(authHeader, {
    period: 'yearly',
    interval: 1,
    item: {
      name: 'InkHaven Premium Yearly',
      description:
        'Premium yearly subscription with video chat and ad-free experience.',
      amount: 410000,
      currency: 'INR'
    }
  })
  console.log('Yearly plan created:')
  console.log(`  id: ${yearlyPlan.id}`)
}

main().catch((err) => {
  console.error(err?.message || err)
  process.exit(1)
})
