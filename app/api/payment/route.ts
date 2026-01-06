import { NextRequest, NextResponse } from 'next/server'
import { bearerFromAuthHeader } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createSubscription, PREMIUM_PLANS } from '@/lib/payments'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createServerSupabaseClient()

  const bearer = bearerFromAuthHeader(request.headers.get('authorization'))
  if (!bearer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(bearer)
  if (authError || !authData?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = authData.user.id
  const { planId } = await request.json()

  if (!planId || !PREMIUM_PLANS.find(p => p.id === planId)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  try {
    const subscription = await createSubscription(planId, userId)
    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Subscription creation failed:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}

// Webhook for payment confirmation
export async function PUT(request: NextRequest): Promise<NextResponse> {
  // TODO: Implement webhook verification
  // This would handle payment confirmations from Razorpay
  return NextResponse.json({ success: true })
}