'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onRegistered?: (profile: any) => void
  onSwitchToLogin?: () => void
}

export default function RegistrationModal({
  isOpen,
  onClose,
  onRegistered,
  onSwitchToLogin
}: RegistrationModalProps) {
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    age: '',
    agreeToTerms: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleInputChange = (field: string, value: string | boolean) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetForm = () => {
    setForm({
      email: '',
      username: '',
      password: '',
      age: '',
      agreeToTerms: false
    })
    setErrorMessage('')
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.agreeToTerms) {
      setErrorMessage('Please agree to the terms of service')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      // Create user account with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            username: form.username,
            age: parseInt(form.age),
            display_name: form.username
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Create user profile in Supabase
        const userProfile = {
          id: data.user.id,
          username: form.username,
          email: form.email,
          age: parseInt(form.age),
          created_at: new Date().toISOString(),
          is_registered: true,
          user_tier: 'registered_free'
        }

        const { error: profileError } = await supabase
          .from('users')
          .insert(userProfile)

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Continue anyway - the user is registered
        }

        // Emit success event
        onRegistered?.(userProfile)
        onClose()
        resetForm()
      }
    } catch (error: any) {
      console.error('Registration error:', error)

      // Handle specific Supabase errors
      if (error.message.includes('already registered')) {
        setErrorMessage('This email is already registered. Try signing in instead.')
      } else if (error.message.includes('Password')) {
        setErrorMessage('Password is too weak. Please use at least 6 characters.')
      } else if (error.message.includes('email')) {
        setErrorMessage('Please enter a valid email address.')
      } else {
        setErrorMessage('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const closeModal = () => {
    resetForm()
    onClose()
  }

  const switchToLogin = () => {
    onSwitchToLogin?.()
    closeModal()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🚀 Create Account</h2>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              aria-label="Close registration modal"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Unlock premium features and save your chats
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              📧 Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="your@email.com"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              👤 Username
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              required
              minLength={3}
              maxLength={20}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Choose a username"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              🔒 Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Minimum 6 characters"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              🎂 Age
            </label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              required
              min={18}
              max={99}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your age"
            />
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start">
            <input
              type="checkbox"
              checked={form.agreeToTerms}
              onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
              required
              className="mt-1 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
            </label>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="px-6 pb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?
              <button
                onClick={switchToLogin}
                className="text-blue-600 hover:underline ml-1"
              >
                Sign in instead
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
