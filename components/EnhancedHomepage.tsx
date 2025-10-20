'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  HeartIcon,
  SparklesIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  PaintBrushIcon,
  ChartBarIcon,
  CloudIcon,
  CheckIcon,
  StarIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function EnhancedHomepage() {
  const [showPricing, setShowPricing] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const router = useRouter()

  const handleAnonymousStart = () => {
    // Store anonymous preference and redirect
    localStorage.setItem('user_preference', 'anonymous')
    router.push('/chat')
  }

  const handleRegisterStart = () => {
    // Redirect to registration
    router.push('/register')
  }

  const handleUpgradeClick = (planId: string) => {
    setSelectedPlan(planId)
    setShowPricing(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">Inkhaven Chat</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-white/70 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#about" className="text-white/70 hover:text-white transition-colors">
              About
            </Link>
            <Link href="#pricing" className="text-white/70 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="#contact" className="text-white/70 hover:text-white transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Connect Through
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                {" "}Meaningful{" "}
              </span>
              Conversations
            </h1>
            <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto">
              Experience AI-powered matchmaking, beautiful themes, and authentic connections.
              Choose your journey: anonymous exploration or personalized experience.
            </p>
          </motion.div>

          {/* Choice Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16"
          >
            {/* Anonymous Card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserGroupIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Go Anonymous</h3>
              <p className="text-white/70 mb-6">
                Jump right in with basic AI-powered chats. No registration required.
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-white/80">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span>Unlimited individual chats</span>
                </div>
                <div className="flex items-center text-white/80">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span>Basic AI matchmaking</span>
                </div>
                <div className="flex items-center text-white/80">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span>Free forever</span>
                </div>
              </div>
              <button
                onClick={handleAnonymousStart}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center group"
              >
                Start Chatting
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Register Card */}
            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/30 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Recommended
                </span>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Create Account</h3>
              <p className="text-white/70 mb-6">
                Unlock your personalized avatar, join groups, and access premium features.
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-white/80">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span>Custom AI avatar creation</span>
                </div>
                <div className="flex items-center text-white/80">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span>Create & join groups</span>
                </div>
                <div className="flex items-center text-white/80">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span>Premium features unlock</span>
                </div>
              </div>
              <button
                onClick={handleRegisterStart}
                className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center group"
              >
                Create Account
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap justify-center items-center gap-8 text-white/60"
          >
            <div className="flex items-center">
              <StarIcon className="w-5 h-5 text-yellow-400 mr-2" />
              <span>10,000+ Conversations</span>
            </div>
            <div className="flex items-center">
              <HeartIcon className="w-5 h-5 text-red-400 mr-2" />
              <span>95% User Satisfaction</span>
            </div>
            <div className="flex items-center">
              <CpuChipIcon className="w-5 h-5 text-blue-400 mr-2" />
              <span>AI-Powered Matching</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need for Meaningful Connections
            </h2>
            <p className="text-xl text-white/70">
              From anonymous chats to premium AI entertainment
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: SparklesIcon,
                title: "AI Avatar Creation",
                description: "Create your unique digital identity with our AI-powered avatar studio",
                premium: true
              },
              {
                icon: UserGroupIcon,
                title: "Smart Groups",
                description: "Join or create groups with AI-matched participants based on interests",
                premium: false
              },
              {
                icon: CpuChipIcon,
                title: "AI Entertainment",
                description: "Horoscopes, personality tests, IQ assessments, and more",
                premium: true
              },
              {
                icon: PaintBrushIcon,
                title: "Beautiful Themes",
                description: "Choose from dozens of stunning themes or create your own",
                premium: false
              },
              {
                icon: ChartBarIcon,
                title: "Advanced Analytics",
                description: "Track your conversations and discover insights about your social patterns",
                premium: true
              },
              {
                icon: CloudIcon,
                title: "Cloud Sync",
                description: "Access your chats and preferences across all your devices",
                premium: true
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
              >
                <feature.icon className="w-12 h-12 text-cyan-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/70 mb-4">{feature.description}</p>
                {feature.premium && (
                  <span className="inline-block bg-gradient-to-r from-cyan-400 to-purple-500 text-white text-xs px-3 py-1 rounded-full">
                    Premium
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-white/70 mb-8">
            Join thousands of users discovering meaningful connections every day
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleAnonymousStart}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 border border-white/20"
            >
              Try Anonymous Chat
            </button>
            <button
              onClick={handleRegisterStart}
              className="bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300"
            >
              Create Your Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 border-t border-white/10 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold">Inkhaven Chat</span>
              </div>
              <p className="text-white/70 text-sm">
                Connecting hearts through intelligent conversations
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60 text-sm">
              © 2025 Inkhaven Chat. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-white/60 text-sm">Made with ❤️ for meaningful connections</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
