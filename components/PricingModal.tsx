'use client'

import { useState } from 'react'
import { Crown, Check, Star } from 'lucide-react'
import { PREMIUM_PLANS } from '@/lib/payments'

interface PricingModalProps {
  onClose: () => void
}

export default function PricingModal({ onClose }: PricingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubscribe = async (planId: string) => {
    setIsProcessing(true)
    try {
      // TODO: Integrate with payment API
      console.log('Subscribing to plan:', planId)
      // For now, just close
      onClose()
    } catch (error) {
      console.error('Subscription failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-4xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Upgrade to Premium</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="text-center mb-8">
          <p className="text-slate-300 text-lg">
            Unlock the full InkHaven experience with unlimited features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {PREMIUM_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-slate-800 border rounded-xl p-6 transition-all ${
                selectedPlan === plan.id
                  ? 'border-yellow-400 bg-slate-800/80'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {plan.interval === 'year' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star size={12} />
                    SAVE 17%
                  </div>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-yellow-400">
                  ₹{plan.price / 100}
                  <span className="text-sm text-slate-400">/{plan.interval}</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check size={16} className="text-green-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  selectedPlan === plan.id
                    ? 'bg-yellow-500 text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => selectedPlan && handleSubscribe(selectedPlan)}
            disabled={!selectedPlan || isProcessing}
            className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-purple-600 hover:from-yellow-600 hover:to-purple-700 disabled:bg-slate-600 text-white font-bold rounded-lg transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Subscribe Now'}
          </button>
          <p className="text-xs text-slate-400 mt-2">
            Secure payment powered by Razorpay • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  )
}