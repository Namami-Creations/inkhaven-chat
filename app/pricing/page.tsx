'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  CheckIcon,
  StarIcon,
  SparklesIcon,
  HeartIcon,
  CpuChipIcon,
  CloudIcon,
  ChartBarIcon,
  UserGroupIcon,
  PaintBrushIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'
import { subscriptionService } from '@/lib/subscription-service'

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const plans = subscriptionService.getPlans()

  const handleSubscribe = async (planId: string) => {
    setSelectedPlan(planId)
    setIsProcessing(true)

    try {
      // In a real implementation, this would redirect to PayPal
      // For now, we'll simulate the process
      alert(`Redirecting to PayPal for ${planId} subscription...`)

      // Simulate subscription creation
      const mockSubscription = await subscriptionService.createSubscription(
        'user-id', // This would come from auth context
        planId
      )

      // In real implementation, redirect to approvalUrl
      console.log('Subscription created:', mockSubscription)
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Subscription failed. Please try again.')
    } finally {
      setIsProcessing(false)
      setSelectedPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Inkhaven Chat</h1>
              <p className="text-white/60 text-sm">Premium Plans</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-white/70 hover:text-white transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold text-white mb-6">
              Unlock Your
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                {" "}Premium{" "}
              </span>
              Experience
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Join thousands of users enjoying unlimited features, AI entertainment,
              and ad-free conversations.
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-white/60 mb-12">
              <div className="flex items-center">
                <StarIcon className="w-5 h-5 text-yellow-400 mr-2" />
                <span>7-Day Free Trial</span>
              </div>
              <div className="flex items-center">
                <CreditCardIcon className="w-5 h-5 text-green-400 mr-2" />
                <span>Secure PayPal Payments</span>
              </div>
              <div className="flex items-center">
                <HeartIcon className="w-5 h-5 text-red-400 mr-2" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Premium Monthly</h3>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-4xl font-bold text-white">$4.99</span>
                  <span className="text-white/60 ml-2">/month</span>
                </div>
                <p className="text-white/70">Perfect for trying premium features</p>
              </div>

              <div className="space-y-4 mb-8">
                {plans.premium_monthly.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscribe('premium_monthly')}
                disabled={isProcessing && selectedPlan === 'premium_monthly'}
                className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300"
              >
                {isProcessing && selectedPlan === 'premium_monthly' ? 'Processing...' : 'Start Free Trial'}
              </button>
            </motion.div>

            {/* Yearly Plan - Popular */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-cyan-400/50 hover:bg-white/15 transition-all duration-300 relative"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  🔥 Most Popular
                </span>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Premium Yearly</h3>
                <div className="flex items-center justify-center mb-2">
                  <span className="text-4xl font-bold text-white">$49.99</span>
                  <span className="text-white/60 ml-2">/year</span>
                </div>
                <div className="bg-green-500/20 text-green-300 text-sm px-3 py-1 rounded-full inline-block mb-4">
                  Save 17% ($9.98)
                </div>
                <p className="text-white/70">Best value for committed users</p>
              </div>

              <div className="space-y-4 mb-8">
                {plans.premium_yearly.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscribe('premium_yearly')}
                disabled={isProcessing && selectedPlan === 'premium_yearly'}
                className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300"
              >
                {isProcessing && selectedPlan === 'premium_yearly' ? 'Processing...' : 'Start Free Trial'}
              </button>
            </motion.div>
          </div>

          {/* Feature Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
          >
            <h3 className="text-2xl font-bold text-white text-center mb-8">
              Why Go Premium?
            </h3>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Unlimited Groups</h4>
                <p className="text-white/70 text-sm">
                  Create and join groups with unlimited participants. Connect with communities that matter to you.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">AI Entertainment</h4>
                <p className="text-white/70 text-sm">
                  Daily horoscopes, personality quizzes, IQ tests, and hidden animal identities. Fun AI experiences await.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PaintBrushIcon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Custom Everything</h4>
                <p className="text-white/70 text-sm">
                  Custom themes, avatars, and layouts. Make the platform truly yours with premium customization.
                </p>
              </div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 space-y-6"
          >
            <h3 className="text-2xl font-bold text-white text-center">Frequently Asked Questions</h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-3">Can I cancel anytime?</h4>
                <p className="text-white/70 text-sm">
                  Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-3">What payment methods do you accept?</h4>
                <p className="text-white/70 text-sm">
                  We accept PayPal payments for secure, easy subscriptions. No credit card required.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-3">Is there a free trial?</h4>
                <p className="text-white/70 text-sm">
                  Yes! All premium plans include a 7-day free trial. No payment required to start.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-3">Can I change plans?</h4>
                <p className="text-white/70 text-sm">
                  Absolutely! You can upgrade, downgrade, or change your plan at any time from your account settings.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-black/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Go Premium?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of users enjoying the full Inkhaven Chat experience
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleSubscribe('premium_yearly')}
              className="bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300"
            >
              Start Your Free Trial
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 border border-white/20"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
