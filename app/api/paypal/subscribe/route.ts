import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { paypalService } from '@/lib/paypal-service'
import { withRateLimit, authRateLimiter } from '@/lib/rate-limit'
import { validateData, paymentSchema } from '@/lib/validation'
import { logError, logInfo } from '@/lib/logger'
import { z } from 'zod'

const subscribeSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
})

async function handler(request: NextRequest) {
  try {
    logInfo('PayPal subscription request received', {
      method: request.method,
      url: request.url,
    })

    // Create Supabase server client for authentication
    const supabase = createServerSupabaseClient()

    // Get authenticated user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logError('Authentication error', authError || new Error('No authenticated user'))
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateData(subscribeSchema, body)

    if (!validation.success) {
      logError('Invalid subscription request data', new Error('Validation failed'), {
        errors: validation.errors.format(),
      })
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.errors.format() },
        { status: 400 }
      )
    }

    const { planId } = validation.data

    // Validate plan ID exists and is valid
    const validPlans = ['basic', 'premium', 'vip'] // Add your actual plan IDs
    if (!validPlans.includes(planId)) {
      logError('Invalid plan ID', new Error('Plan validation failed'), { planId, userId: user.id })
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      logError('User already has active subscription', new Error('Subscription conflict'), { userId: user.id })
      return NextResponse.json({ error: 'User already has an active subscription' }, { status: 400 })
    }

    // Create subscription
    const subscription = await paypalService.createSubscription(user.id, planId)

    // Update user tier
    await supabase
      .from('users')
      .update({ user_tier: 'premium' })
      .eq('id', user.id)

    logInfo('PayPal subscription created successfully', {
      userId: user.id,
      planId,
      subscriptionId: subscription.id,
    })

    return NextResponse.json({
      success: true,
      subscription,
    })

  } catch (error) {
    logError('PayPal subscription creation failed', error as Error, {
      method: request.method,
      url: request.url,
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Apply rate limiting to the handler
export const POST = withRateLimit(handler, authRateLimiter)
