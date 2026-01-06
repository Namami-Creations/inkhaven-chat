/**
 * Complete PayPal Setup Script
 * 
 * This script will:
 * 1. Create PayPal subscription plans
 * 2. Display Plan IDs
 * 3. Show instructions for adding to environment
 * 
 * Usage: node scripts/complete-paypal-setup.js
 */

const https = require('https')
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

const envFile = readEnvFile(path.join(process.cwd(), '.env.local'))

function getEnv(name) {
  return process.env[name] || envFile[name] || ''
}

function requireEnv(name) {
  const value = getEnv(name)
  if (!value) {
    console.error(`Missing ${name}. Set it in .env.local or your shell.`)
    process.exit(1)
  }
  return value
}

const PAYPAL_CREDENTIALS = {
  clientId: requireEnv('PAYPAL_CLIENT_ID'),
  clientSecret: requireEnv('PAYPAL_CLIENT_SECRET'),
  environment: (getEnv('PAYPAL_ENVIRONMENT') || 'sandbox').toLowerCase()
}

async function makePayPalRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${PAYPAL_CREDENTIALS.clientId}:${PAYPAL_CREDENTIALS.clientSecret}`).toString('base64')
    const baseUrl = PAYPAL_CREDENTIALS.environment === 'production' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com'

    // Get access token first
    const tokenOptions = {
      hostname: baseUrl.replace('https://', '').split('/')[0],
      path: '/v1/oauth2/token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }

    const tokenReq = https.request(tokenOptions, (tokenRes) => {
      let tokenData = ''
      tokenRes.on('data', (chunk) => tokenData += chunk)
      tokenRes.on('end', () => {
        const token = JSON.parse(tokenData).access_token
        
        // Now make the actual request
        const options = {
          hostname: baseUrl.replace('https://', '').split('/')[0],
          path: endpoint,
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }

        const req = https.request(options, (res) => {
          let responseData = ''
          res.on('data', (chunk) => responseData += chunk)
          res.on('end', () => {
            try {
              resolve(JSON.parse(responseData))
            } catch (e) {
              resolve(responseData)
            }
          })
        })

        req.on('error', reject)
        
        if (data) {
          req.write(JSON.stringify(data))
        }
        
        req.end()
      })
    })

    tokenReq.on('error', reject)
    tokenReq.write('grant_type=client_credentials')
    tokenReq.end()
  })
}

async function createProduct(name, description) {
  const product = {
    name,
    description,
    type: 'SERVICE',
    category: 'SOFTWARE'
  }

  const result = await makePayPalRequest('POST', '/v1/catalogs/products', product)
  return result.id
}

async function createPlan(planData) {
  const productId = await createProduct(planData.name, planData.description)
  
  const billingCycles = []
  
  if (planData.promotionalPrice) {
    // Add trial cycle for promotional pricing
    billingCycles.push({
      frequency: {
        interval_unit: planData.interval.toUpperCase(),
        interval_count: 1
      },
      tenure_type: 'TRIAL',
      sequence: 1,
      total_cycles: 1,
      pricing_scheme: {
        fixed_price: {
          value: planData.promotionalPrice.toString(),
          currency_code: 'USD'
        }
      }
    })
    
    // Add regular cycle after trial
    billingCycles.push({
      frequency: {
        interval_unit: planData.interval.toUpperCase(),
        interval_count: 1
      },
      tenure_type: 'REGULAR',
      sequence: 2,
      total_cycles: 0,
      pricing_scheme: {
        fixed_price: {
          value: planData.price.toString(),
          currency_code: 'USD'
        }
      }
    })
  } else {
    billingCycles.push({
      frequency: {
        interval_unit: planData.interval.toUpperCase(),
        interval_count: 1
      },
      tenure_type: 'REGULAR',
      sequence: 1,
      total_cycles: 0,
      pricing_scheme: {
        fixed_price: {
          value: planData.price.toString(),
          currency_code: 'USD'
        }
      }
    })
  }
  
  const plan = {
    product_id: productId,
    name: planData.name,
    description: planData.description,
    status: 'ACTIVE',
    billing_cycles,
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        value: '0',
        currency_code: 'USD'
      },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3
    }
  }

  return await makePayPalRequest('POST', '/v1/billing/plans', plan)
}

async function main() {
  console.log('🚀 Starting PayPal Plan Setup...\n')
  console.log('Environment:', PAYPAL_CREDENTIALS.environment)
  console.log('Client ID:', PAYPAL_CREDENTIALS.clientId.substring(0, 20) + '...\n')

  try {
    // Create monthly plan
    console.log('📦 Creating Monthly Plan with promotional pricing...')
    const monthlyPlan = await createPlan({
      name: 'Inkhaven Chat - Premium Monthly',
      description: 'Premium monthly subscription - $2.00 for first month, then $4.99/month',
      price: 4.99,
      promotionalPrice: 2.00,
      interval: 'month'
    })
    
    console.log('✅ Monthly Plan Created!')
    console.log(`   Plan ID: ${monthlyPlan.id}`)
    console.log(`   Name: ${monthlyPlan.name}`)
    console.log(`   Status: ${monthlyPlan.status}\n`)

    // Create yearly plan
    console.log('📦 Creating Yearly Plan...')
    const yearlyPlan = await createPlan({
      name: 'Inkhaven Chat - Premium Yearly',
      description: 'Premium yearly subscription - $49.99/year (2 months free)',
      price: 49.99,
      interval: 'year'
    })
    
    console.log('✅ Yearly Plan Created!')
    console.log(`   Plan ID: ${yearlyPlan.id}`)
    console.log(`   Name: ${yearlyPlan.name}`)
    console.log(`   Status: ${yearlyPlan.status}\n`)

    // Display results
    console.log('='.repeat(60))
    console.log('✅ SETUP COMPLETE!')
    console.log('='.repeat(60))
    console.log('\n📋 Add these to your .env.local file:\n')
    console.log(`PAYPAL_PREMIUM_MONTHLY_PLAN_ID=${monthlyPlan.id}`)
    console.log(`PAYPAL_PREMIUM_YEARLY_PLAN_ID=${yearlyPlan.id}\n`)
    console.log('📋 For Vercel, add these environment variables:\n')
    console.log(`PAYPAL_PREMIUM_MONTHLY_PLAN_ID = ${monthlyPlan.id}`)
    console.log(`PAYPAL_PREMIUM_YEARLY_PLAN_ID = ${yearlyPlan.id}\n`)
    console.log('🎉 Your PayPal subscription is now fully configured!\n')

  } catch (error) {
    console.error('❌ Error creating plans:', error.message)
    if (error.response) {
      console.error('Response:', error.response)
    }
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { createPlan, main }

