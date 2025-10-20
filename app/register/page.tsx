'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  UserPlusIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import ProfileWizard from '@/components/ProfileWizard'

export default function RegisterPage() {
  const [step, setStep] = useState<'register' | 'profile'>('register')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const validateForm = () => {
    if (!formData.email.trim()) {
      alert('Please enter your email address')
      return false
    }

    if (!formData.password) {
      alert('Please enter a password')
      return false
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      return false
    }

    if (!formData.acceptTerms) {
      alert('Please accept the terms and conditions')
      return false
    }

    return true
  }

  const handleRegister = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      // Create user account
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.email.split('@')[0], // Temporary display name
          }
        }
      })

      if (error) throw error

      if (data.user) {
        setUserId(data.user.id)
        setStep('profile')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      alert(error.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileComplete = () => {
    // Registration complete - redirect to chat
    router.push('/chat')
  }

  const handleSkipProfile = () => {
    // Skip profile setup but still mark as registered
    if (userId) {
      supabase
        .from('users')
        .update({
          is_registered: true,
          user_tier: 'registered_free',
          display_name: formData.email.split('@')[0]
        })
        .eq('id', userId)
        .then(() => {
          router.push('/chat')
        })
    }
  }

  if (step === 'profile' && userId) {
    return (
      <ProfileWizard
        userId={userId}
        onComplete={handleProfileComplete}
        onSkip={handleSkipProfile}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlusIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join Inkhaven Chat</h1>
          <p className="text-white/70">
            Create your account to unlock premium features
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <div className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Email Address
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-3.5 w-5 h-5 text-white/50" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-3.5 w-5 h-5 text-white/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  placeholder="Create a password"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-10 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-white/50 hover:text-white"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-white/50 text-sm mt-1">
                Must be at least 6 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-3.5 w-5 h-5 text-white/50" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={formData.acceptTerms}
                onChange={(e) => updateFormData('acceptTerms', e.target.checked)}
                className="mt-1 w-4 h-4 text-cyan-400 bg-white/10 border-white/20 rounded focus:ring-cyan-400 focus:ring-2"
              />
              <label htmlFor="acceptTerms" className="text-white/70 text-sm">
                I agree to the{' '}
                <a href="/terms" className="text-cyan-400 hover:text-cyan-300 underline">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="/privacy" className="text-cyan-400 hover:text-cyan-300 underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Register Button */}
            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center"
            >
              {isLoading ? (
                'Creating Account...'
              ) : (
                <>
                  Create Account
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 text-center">What You Get:</h3>
          <div className="space-y-3">
            <div className="flex items-center text-white/80">
              <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
              <span>Custom AI-generated avatar</span>
            </div>
            <div className="flex items-center text-white/80">
              <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
              <span>Create and join groups</span>
            </div>
            <div className="flex items-center text-white/80">
              <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
              <span>Premium features access</span>
            </div>
            <div className="flex items-center text-white/80">
              <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
              <span>Advanced AI matching</span>
            </div>
          </div>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-white/70">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              Sign in here
            </button>
          </p>
        </div>

        {/* Anonymous Option */}
        <div className="mt-4 text-center">
          <p className="text-white/60 text-sm">
            Just want to try it out?{' '}
            <button
              onClick={() => router.push('/chat')}
              className="text-white/80 hover:text-white underline"
            >
              Continue anonymously
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
