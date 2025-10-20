import { createHash } from 'crypto'

export interface PayPalSubscription {
  id: string
  status: string
  plan_id: string
  start_time: string
  subscriber: {
    email_address: string
    name?: {
      given_name: string
      surname: string
    }
  }
  billing_info?: {
    cycle_executions?: any[]
  }
}

export interface PayPalPlan {
  id: string
  name: string
  description: string
  status: string
  billing_cycles: any[]
  payment_preferences: any
}

export class PayPalService {
  private clientId: string
  private clientSecret: string
  private baseUrl: string
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID!
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET!
    this.baseUrl = process.env.PAYPAL_ENVIRONMENT === 'production'
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com'
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      throw new Error(`PayPal auth failed: ${response.statusText}`)
    }

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000))

    return this.accessToken
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAccessToken()

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`PayPal API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  // Create a subscription plan
  async createPlan(planData: {
    name: string
    description: string
    price: number
    interval: 'month' | 'year'
  }): Promise<PayPalPlan> {
    const plan = {
      product_id: await this.createProduct(planData.name, planData.description),
      name: planData.name,
      description: planData.description,
      status: 'ACTIVE',
      billing_cycles: [{
        frequency: {
          interval_unit: planData.interval.toUpperCase(),
          interval_count: 1
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // Infinite
        pricing_scheme: {
          fixed_price: {
            value: planData.price.toString(),
            currency_code: 'USD'
          }
        }
      }],
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

    return this.makeRequest('/v1/billing/plans', {
      method: 'POST',
      body: JSON.stringify(plan)
    })
  }

  // Create a product (required for plans)
  private async createProduct(name: string, description: string): Promise<string> {
    const product = {
      name,
      description,
      type: 'SERVICE',
      category: 'SOFTWARE'
    }

    const result = await this.makeRequest('/v1/catalogs/products', {
      method: 'POST',
      body: JSON.stringify(product)
    })

    return result.id
  }

  // Create a subscription
  async createSubscription(planId: string, customId?: string): Promise<any> {
    const subscription = {
      plan_id: planId,
      custom_id: customId,
      application_context: {
        brand_name: 'Inkhaven Chat',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        },
        return_url: `${process.env.APP_URL}/subscription/success`,
        cancel_url: `${process.env.APP_URL}/subscription/cancel`
      }
    }

    return this.makeRequest('/v1/billing/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscription)
    })
  }

  // Get subscription details
  async getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
    return this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}`)
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, reason: string = 'User requested cancellation'): Promise<void> {
    await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
  }

  // Suspend subscription
  async suspendSubscription(subscriptionId: string, reason: string = 'Temporary suspension'): Promise<void> {
    await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
  }

  // Activate subscription
  async activateSubscription(subscriptionId: string, reason: string = 'Reactivating subscription'): Promise<void> {
    await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}/activate`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
  }

  // Verify webhook signature
  async verifyWebhookSignature(webhookBody: string, signature: any): Promise<boolean> {
    try {
      const expectedSignature = createHash('sha256')
        .update(webhookBody + this.clientSecret)
        .digest('hex')

      return signature === expectedSignature
    } catch (error) {
      console.error('Webhook verification failed:', error)
      return false
    }
  }

  // Get available plans
  getPlans() {
    return {
      premium_monthly: {
        id: process.env.PAYPAL_PREMIUM_MONTHLY_PLAN_ID,
        name: 'Premium Monthly',
        price: 4.99,
        interval: 'month',
        features: [
          'Unlimited group chats (500+ participants)',
          'Full GIPHY access',
          'AI entertainment features',
          'Ad-free experience',
          'Priority support'
        ]
      },
      premium_yearly: {
        id: process.env.PAYPAL_PREMIUM_YEARLY_PLAN_ID,
        name: 'Premium Yearly',
        price: 49.99,
        interval: 'year',
        savings: '17% off',
        features: [
          'All monthly features',
          '2 months free',
          'Early access to new features'
        ]
      }
    }
  }
}

// Export singleton instance
export const paypalService = new PayPalService()
