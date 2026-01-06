import Link from 'next/link'
import { Check, Star, Zap } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: [
      'Anonymous chat',
      'Interest-based matching',
      'Text messaging',
      'Voice messages',
      'Basic video calls',
      'Report abuse'
    ],
    cta: 'Start Chatting',
    href: '/chat',
    popular: false
  },
  {
    name: 'Premium',
    price: '₹410',
    period: 'month',
    originalPrice: '₹499',
    features: [
      'Everything in Free',
      'Priority matching',
      'Unlimited chats',
      'HD video calls',
      'No ads',
      'Advanced moderation',
      '24/7 support'
    ],
    cta: 'Go Premium',
    href: '/register',
    popular: true
  },
  {
    name: 'Premium Yearly',
    price: '₹4,099',
    period: 'year',
    originalPrice: '₹5,988',
    savings: 'Save ₹1,889',
    features: [
      'Everything in Premium',
      '2 months FREE',
      'VIP badge',
      'Early access to features',
      'Exclusive events'
    ],
    cta: 'Save Big',
    href: '/register',
    popular: false
  }
]

export default function PricingPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Choose Your Plan</h1>
        <p className="text-slate-300 text-lg">
          Start free and upgrade when you're ready for more features.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative bg-white/5 border rounded-xl p-6 space-y-4 ${
              plan.popular
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Most Popular
                </div>
              </div>
            )}

            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <div className="space-y-1">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-slate-400">/{plan.period}</span>
                </div>
                {plan.originalPrice && (
                  <div className="text-sm text-slate-400 line-through">
                    {plan.originalPrice}
                  </div>
                )}
                {plan.savings && (
                  <div className="text-sm text-green-400 font-semibold">
                    {plan.savings}
                  </div>
                )}
              </div>
            </div>

            <ul className="space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href={plan.href}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-center block ${
                plan.popular
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Zap className="w-5 h-5" />
          <span>All plans include our commitment to safety and privacy</span>
        </div>
        <p className="text-sm text-slate-500">
          Prices in INR. Cancel anytime. No hidden fees.
        </p>
      </div>
    </main>
  )
}