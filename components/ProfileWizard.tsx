'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import AvatarCreator from './AvatarCreator'

interface ProfileWizardProps {
  userId: string
  onComplete: () => void
  onSkip?: () => void
}

interface ProfileData {
  displayName: string
  bio: string
  interests: string[]
  avatarData?: any
}

export default function ProfileWizard({ userId, onComplete, onSkip }: ProfileWizardProps) {
  const [step, setStep] = useState(0)
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    bio: '',
    interests: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedInterests, setSuggestedInterests] = useState<string[]>([])

  const steps = [
    { title: 'Welcome', icon: SparklesIcon },
    { title: 'Avatar', icon: PhotoIcon },
    { title: 'Details', icon: UserIcon },
    { title: 'Interests', icon: HeartIcon },
    { title: 'Complete', icon: CheckIcon }
  ]

  useEffect(() => {
    loadSuggestedInterests()
  }, [])

  const loadSuggestedInterests = async () => {
    try {
      const { data, error } = await supabase
        .from('interests')
        .select('name, category, emoji')
        .limit(20)

      if (error) throw error

      setSuggestedInterests(data.map(interest => interest.name))
    } catch (error) {
      console.error('Error loading interests:', error)
      // Fallback interests
      setSuggestedInterests([
        'Technology', 'Gaming', 'Music', 'Art', 'Sports', 'Travel',
        'Food', 'Books', 'Movies', 'Photography', 'Fitness', 'Nature'
      ])
    }
  }

  const updateProfileData = (key: keyof ProfileData, value: any) => {
    setProfileData(prev => ({ ...prev, [key]: value }))
  }

  const handleInterestToggle = (interest: string) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const saveProfile = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: profileData.displayName,
          bio: profileData.bio,
          interests: profileData.interests,
          is_registered: true,
          user_tier: 'registered_free',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      onComplete()
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 0: // Welcome
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-24 h-24 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mx-auto">
              <SparklesIcon className="w-12 h-12 text-white" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Welcome to Inkhaven Chat! 🎉
              </h2>
              <p className="text-xl text-white/80 mb-6">
                Let's create your unique profile and get you connected with amazing people
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-white mb-3">What you'll get:</h3>
              <ul className="space-y-2 text-left text-white/80">
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  Custom AI-generated avatar
                </li>
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  Personalized profile
                </li>
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  Smart interest matching
                </li>
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  Access to groups & features
                </li>
              </ul>
            </div>
          </motion.div>
        )

      case 1: // Avatar Creation
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Create Your Avatar</h2>
              <p className="text-white/70">
                Design a unique avatar that represents you
              </p>
            </div>

            <AvatarCreator
              userId={userId}
              onComplete={(avatarData) => {
                setProfileData(prev => ({ ...prev, avatarData }))
                setStep(2)
              }}
              onSkip={() => setStep(2)}
            />
          </div>
        )

      case 2: // Profile Details
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Tell Us About Yourself</h2>
              <p className="text-white/70">
                This helps us match you with the right people
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={(e) => updateProfileData('displayName', e.target.value)}
                  placeholder="How others will see you"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => updateProfileData('bio', e.target.value)}
                  placeholder="Share a bit about yourself..."
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                />
                <p className="text-white/50 text-sm mt-1">
                  {profileData.bio.length}/150 characters
                </p>
              </div>
            </div>
          </div>
        )

      case 3: // Interests
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">What Interests You?</h2>
              <p className="text-white/70">
                Select topics you're passionate about for better matches
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {suggestedInterests.map(interest => (
                  <button
                    key={interest}
                    onClick={() => handleInterestToggle(interest)}
                    className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      profileData.interests.includes(interest)
                        ? 'border-cyan-400 bg-cyan-400/20 text-white'
                        : 'border-white/20 bg-white/10 hover:bg-white/20 text-white/80'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <label className="block text-white font-semibold mb-2">
                  Custom Interest (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Add your own interest..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim()
                      if (value && !profileData.interests.includes(value)) {
                        handleInterestToggle(value)
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
              </div>

              <div className="mt-4 text-center">
                <p className="text-white/60 text-sm">
                  Selected: {profileData.interests.length} interests
                </p>
              </div>
            </div>
          </div>
        )

      case 4: // Complete
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckIcon className="w-12 h-12 text-white" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white mb-4">
                You're All Set! 🎉
              </h2>
              <p className="text-xl text-white/80 mb-6">
                Your profile is ready. Start connecting with amazing people!
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-white mb-4">Your Profile Summary:</h3>
              <div className="space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-white/70">Name:</span>
                  <span className="text-white">{profileData.displayName || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Interests:</span>
                  <span className="text-white">{profileData.interests.length} selected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Avatar:</span>
                  <span className="text-white">{profileData.avatarData ? 'Created' : 'Skipped'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={isLoading || !profileData.displayName.trim()}
              className="bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300"
            >
              {isLoading ? 'Saving...' : 'Complete Setup & Start Chatting'}
            </button>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Profile Setup</h1>
              <p className="text-white/60 text-sm">Create your unique identity</p>
            </div>
          </div>

          {onSkip && step < 4 && (
            <button
              onClick={onSkip}
              className="text-white/60 hover:text-white text-sm underline"
            >
              Skip setup
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {steps.map((stepInfo, index) => (
              <div
                key={index}
                className={`flex items-center ${index <= step ? 'text-cyan-400' : 'text-white/40'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  index <= step
                    ? 'border-cyan-400 bg-cyan-400/20'
                    : 'border-white/40'
                }`}>
                  {index < step ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <stepInfo.icon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-xs ml-2 hidden sm:block">{stepInfo.title}</span>
              </div>
            ))}
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      {step > 0 && step < 4 && step !== 1 && (
        <div className="px-6 py-4 border-t border-white/10">
          <div className="max-w-4xl mx-auto flex justify-between">
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back
            </button>

            <button
              onClick={() => {
                if (step === 2 && !profileData.displayName.trim()) {
                  alert('Please enter a display name to continue')
                  return
                }
                setStep(step + 1)
              }}
              className="flex items-center bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300"
            >
              Next
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
