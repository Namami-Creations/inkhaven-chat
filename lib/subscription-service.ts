import { supabase } from './supabase'
import { paypalService, PayPalSubscription } from './paypal-service'

export interface UserSubscription {
  id: string
  user_id: string
  paypal_subscription_id: string | null
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'
  tier: string
  amount: number
  currency: string
  interval: 'month' | 'year'
  current_period_start: string | null
  current_period_end: string | null
  trial_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  paypal_plan_id?: string
  features: string[]
  popular?: boolean
}

export class SubscriptionService {
  private plans: Record<string, SubscriptionPlan> = {
    premium_monthly: {
      id: 'premium_monthly',
      name: 'Premium Monthly',
      price: 4.99,
      interval: 'month',
      features: [
        '✅ Unlimited groups (500+ participants)',
        '✅ Full GIPHY access (unlimited)',
        '✅ AI Entertainment Suite',
        '✅ Ad-free experience',
        '✅ Priority support',
        '✅ Custom themes',
        '✅ Advanced analytics'
      ],
      popular: true
    },
    premium_yearly: {
      id: 'premium_yearly',
      name: 'Premium Yearly',
      price: 49.99,
      interval: 'year',
      features: [
        '✅ All monthly features',
        '✅ 2 months FREE ($9.98 savings)',
        '✅ Early access to features',
        '✅ Exclusive avatar packs',
        '✅ VIP support channel'
      ]
    }
  }

  // Get available plans
  getPlans(): Record<string, SubscriptionPlan> {
    return this.plans
  }

  // Create subscription
  async createSubscription(userId: string, planId: string): Promise<{ approvalUrl: string; subscriptionId: string }> {
    const plan = this.plans[planId]
    if (!plan) {
      throw new Error('Invalid plan')
    }

    try {
      // Create PayPal subscription
      const paypalSubscription = await paypalService.createSubscription(
        plan.paypal_plan_id || plan.id,
        userId
      )

      // Store subscription in database
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          paypal_subscription_id: paypalSubscription.id,
          status: 'trialing',
          tier: planId,
          amount: plan.price,
          interval: plan.interval,
          trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days trial
        })
        .select()
        .single()

      if (error) throw error

      // Update user tier
      await this.updateUserTier(userId, 'premium')

      return {
        approvalUrl: paypalSubscription.links.find((link: any) => link.rel === 'approve')?.href,
        subscriptionId: subscription.id
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw error
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string, subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<void> {
    try {
      const { data: subscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('user_id', userId)
        .single()

      if (fetchError || !subscription) {
        throw new Error('Subscription not found')
      }

      if (subscription.paypal_subscription_id) {
        // Cancel in PayPal
        await paypalService.cancelSubscription(subscription.paypal_subscription_id)
      }

      // Update subscription status
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: cancelAtPeriodEnd ? 'active' : 'cancelled',
          cancel_at_period_end: cancelAtPeriodEnd,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

      if (updateError) throw updateError

      // If immediate cancellation, downgrade user
      if (!cancelAtPeriodEnd) {
        await this.updateUserTier(userId, 'registered_free')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }
  }

  // Handle PayPal webhook
  async handleWebhook(eventType: string, resource: any): Promise<void> {
    try {
      // Log webhook
      await supabase
        .from('paypal_webhooks')
        .insert({
          webhook_id: resource.id,
          event_type: eventType,
          resource_type: resource.resource_type || 'subscription',
          resource_id: resource.id,
          resource_data: resource
        })

      switch (eventType) {
        case 'BILLING.SUBSCRIPTION.CREATED':
          await this.handleSubscriptionCreated(resource)
          break
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          await this.handleSubscriptionActivated(resource)
          break
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await this.handleSubscriptionCancelled(resource)
          break
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
          await this.handleSubscriptionSuspended(resource)
          break
        case 'PAYMENT.SALE.COMPLETED':
          await this.handlePaymentCompleted(resource)
          break
        default:
          console.log('Unhandled webhook event:', eventType)
      }
    } catch (error) {
      console.error('Error handling webhook:', error)
      throw error
    }
  }

  private async handleSubscriptionCreated(subscription: PayPalSubscription): Promise<void> {
    // Update subscription status
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'trialing',
        current_period_start: subscription.start_time,
        updated_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', subscription.id)
  }

  private async handleSubscriptionActivated(subscription: PayPalSubscription): Promise<void> {
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        current_period_start: subscription.start_time,
        updated_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', subscription.id)
  }

  private async handleSubscriptionCancelled(subscription: PayPalSubscription): Promise<void> {
    const { data: userSubscription } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('paypal_subscription_id', subscription.id)
      .single()

    if (userSubscription) {
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('paypal_subscription_id', subscription.id)

      await this.updateUserTier(userSubscription.user_id, 'registered_free')
    }
  }

  private async handleSubscriptionSuspended(subscription: PayPalSubscription): Promise<void> {
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', subscription.id)
  }

  private async handlePaymentCompleted(payment: any): Promise<void> {
    // Handle successful payments
    console.log('Payment completed:', payment.id)
  }

  // Update user tier
  async updateUserTier(userId: string, tier: 'anonymous' | 'registered_free' | 'premium'): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        user_tier: tier,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error
  }

  // Get user subscription
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return data
  }

  // Check if user has active premium subscription
  async isPremiumUser(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId)
    return subscription?.status === 'active'
  }

  // Get user tier
  async getUserTier(userId: string): Promise<'anonymous' | 'registered_free' | 'premium'> {
    const { data, error } = await supabase
      .from('users')
      .select('user_tier')
      .eq('id', userId)
      .single()

    if (error) {
      // Default to anonymous for non-registered users
      return 'anonymous'
    }

    return data.user_tier || 'anonymous'
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService()
