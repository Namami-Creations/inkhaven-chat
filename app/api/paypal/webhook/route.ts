import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { paypalService } from '@/lib/paypal-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhookId, eventType, resource } = body

    // Verify webhook (in production, validate PayPal signature)
    if (!webhookId || !eventType) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
    }

    // Log webhook
    await supabase.from('paypal_webhooks').insert({
      webhook_id: webhookId,
      event_type: eventType,
      resource_type: resource.resource_type,
      resource_id: resource.id,
      resource_data: resource,
      processed: false
    })

    // Handle subscription events
    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      await paypalService.handleSubscriptionActivated(resource)
    } else if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
      await paypalService.handleSubscriptionCancelled(resource)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
