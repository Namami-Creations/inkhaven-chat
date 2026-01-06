import Razorpay from 'razorpay'

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!
    })
  : null

export interface PaymentPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
}

export const PREMIUM_PLANS: PaymentPlan[] = [
  {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    price: 19900, // ₹199 in paisa
    currency: 'INR',
    interval: 'month',
    features: [
      'Unlimited video chat',
      'All conversation starters',
      'Unlimited bottle messages',
      'All themed rooms',
      'Story mode',
      'Whisper mode',
      'Ambient themes',
      'Karma system',
      'Achievements'
    ]
  },
  {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    price: 199900, // ₹1999 in paisa
    currency: 'INR',
    interval: 'year',
    features: [
      'All monthly features',
      '17% savings',
      'Priority support'
    ]
  }
]

export async function createSubscription(planId: string, userId: string) {
  if (!razorpay) throw new Error('Payment service not configured')

  const plan = PREMIUM_PLANS.find(p => p.id === planId)
  if (!plan) throw new Error('Invalid plan')

  const subscription = await razorpay.subscriptions.create({
    plan_id: planId, // You'll need to create plans in Razorpay dashboard
    customer_notify: 1,
    total_count: plan.interval === 'month' ? 12 : 1,
    start_at: Math.floor(Date.now() / 1000) + 86400, // Start tomorrow
    notes: {
      user_id: userId
    }
  })

  return subscription
}

export async function verifyPayment(paymentId: string, subscriptionId: string) {
  if (!razorpay) throw new Error('Payment service not configured')

  try {
    const payment = await razorpay.payments.fetch(paymentId)
    const subscription = await razorpay.subscriptions.fetch(subscriptionId)

    return {
      success: payment.status === 'captured' && subscription.status === 'active',
      payment,
      subscription
    }
  } catch (error) {
    console.error('Payment verification failed:', error)
    return { success: false }
  }
}

export async function cancelSubscription(subscriptionId: string) {
  if (!razorpay) throw new Error('Payment service not configured')

  const subscription = await razorpay.subscriptions.cancel(subscriptionId)
  return subscription
}