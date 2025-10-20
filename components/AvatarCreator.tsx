'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  XMarkIcon,
  PhotoIcon,
  SwatchIcon,
  FaceSmileIcon,
  EyeIcon,
  ScissorsIcon,
  CogIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface AvatarCustomization {
  baseStyle: string
  hairStyle: string
  hairColor: string
  eyeStyle: string
  eyeColor: string
  skinTone: string
  outfit: string
  accessory: string
  background: string
  expression: string
}

interface AvatarCreatorProps {
  userId: string
  onComplete: (avatarData: any) => void
  onSkip?: () => void
  initialData?: Partial<AvatarCustomization>
}

const AVATAR_OPTIONS = {
  baseStyle: ['minimal', 'detailed', 'anime', 'realistic'],
  hairStyle: ['short', 'medium', 'long', 'curly', 'wavy', 'straight'],
  hairColor: ['#000000', '#8B4513', '#FFD700', '#FF69B4', '#4169E1', '#FF4500', '#32CD32'],
  eyeStyle: ['round', 'almond', 'hooded', 'cat'],
  eyeColor: ['#000000', '#4169E1', '#228B22', '#8B4513', '#DC143C', '#FFD700'],
  skinTone: ['#F5DEB3', '#DEB887', '#D2B48C', '#BC8F8F', '#CD853F', '#A0522D'],
  outfit: ['casual', 'professional', 'fantasy', 'sporty', 'elegant', 'tech'],
  accessory: ['none', 'glasses', 'hat', 'earrings', 'necklace', 'mask'],
  background: ['gradient', 'space', 'nature', 'urban', 'abstract', 'solid'],
  expression: ['neutral', 'happy', 'confident', 'mysterious', 'friendly', 'creative']
}

export default function AvatarCreator({ userId, onComplete, onSkip, initialData }: AvatarCreatorProps) {
  const [step, setStep] = useState(0)
  const [customization, setCustomization] = useState<AvatarCustomization>({
    baseStyle: 'minimal',
    hairStyle: 'medium',
    hairColor: '#000000',
    eyeStyle: 'round',
    eyeColor: '#000000',
    skinTone: '#F5DEB3',
    outfit: 'casual',
    accessory: 'none',
    background: 'gradient',
    expression: 'neutral',
    ...initialData
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const steps = [
    { title: 'Personality Quiz', icon: HeartIcon, description: 'Tell us about yourself' },
    { title: 'Base Style', icon: PhotoIcon, description: 'Choose your avatar style' },
    { title: 'Appearance', icon: FaceSmileIcon, description: 'Customize your look' },
    { title: 'Outfit & Accessories', icon: SwatchIcon, description: 'Dress up your avatar' },
    { title: 'Background & Expression', icon: CogIcon, description: 'Final touches' },
    { title: 'Review & Save', icon: CheckIcon, description: 'Perfect your creation' }
  ]

  const updateCustomization = (key: keyof AvatarCustomization, value: string) => {
    setCustomization(prev => ({ ...prev, [key]: value }))
  }

  const generateAvatar = async () => {
    setIsGenerating(true)
    try {
      // Simulate AI avatar generation
      // In production, this would call an AI avatar generation service
      await new Promise(resolve => setTimeout(resolve, 2000))

      // For now, create a simple SVG-based avatar
      const avatarSvg = generateAvatarSVG(customization)
      const blob = new Blob([avatarSvg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
    } catch (error) {
      console.error('Error generating avatar:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateAvatarSVG = (config: AvatarCustomization): string => {
    // Simple SVG avatar generation based on customization
    return `
      <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea"/>
            <stop offset="100%" style="stop-color:#764ba2"/>
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#bg)"/>

        <!-- Head -->
        <circle cx="100" cy="80" r="35" fill="${config.skinTone}"/>

        <!-- Eyes -->
        <circle cx="88" cy="75" r="3" fill="${config.eyeColor}"/>
        <circle cx="112" cy="75" r="3" fill="${config.eyeColor}"/>

        <!-- Mouth -->
        <path d="M 90 90 Q 100 95 110 90" stroke="#000" stroke-width="2" fill="none"/>
      </svg>
    `
  }

  const saveAvatar = async () => {
    try {
      await supabase
        .from('users')
        .update({
          avatar_data: customization,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      onComplete({
        customization,
        previewUrl,
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error saving avatar:', error)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 0: // Personality Quiz
        return (
          <PersonalityQuiz
            onComplete={(traits) => {
              // Update customization based on personality
              setCustomization(prev => ({
                ...prev,
                expression: traits.mood || 'neutral',
                outfit: traits.style || 'casual',
                background: traits.theme || 'gradient'
              }))
              setStep(1)
            }}
          />
        )

      case 1: // Base Style
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white text-center">Choose Your Avatar Style</h3>
            <div className="grid grid-cols-2 gap-4">
              {AVATAR_OPTIONS.baseStyle.map(style => (
                <button
                  key={style}
                  onClick={() => updateCustomization('baseStyle', style)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    customization.baseStyle === style
                      ? 'border-cyan-400 bg-cyan-400/20'
                      : 'border-white/20 bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg mx-auto mb-2"></div>
                  <span className="text-white capitalize">{style}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 2: // Appearance
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white text-center">Customize Your Appearance</h3>

            {/* Hair */}
            <div>
              <label className="text-white font-semibold mb-3 block">Hair Style</label>
              <div className="grid grid-cols-3 gap-3">
                {AVATAR_OPTIONS.hairStyle.map(style => (
                  <button
                    key={style}
                    onClick={() => updateCustomization('hairStyle', style)}
                    className={`p-3 rounded-lg border transition-all ${
                      customization.hairStyle === style
                        ? 'border-cyan-400 bg-cyan-400/20'
                        : 'border-white/20 bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <span className="text-white text-sm capitalize">{style}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-white font-semibold mb-3 block">Hair Color</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.hairColor.map(color => (
                    <button
                      key={color}
                      onClick={() => updateCustomization('hairColor', color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        customization.hairColor === color ? 'border-white' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select hair color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white font-semibold mb-3 block">Eye Color</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.eyeColor.map(color => (
                    <button
                      key={color}
                      onClick={() => updateCustomization('eyeColor', color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        customization.eyeColor === color ? 'border-white' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select eye color ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 3: // Outfit & Accessories
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white text-center">Dress Up Your Avatar</h3>

            <div>
              <label className="text-white font-semibold mb-3 block">Outfit Style</label>
              <div className="grid grid-cols-2 gap-4">
                {AVATAR_OPTIONS.outfit.map(outfit => (
                  <button
                    key={outfit}
                    onClick={() => updateCustomization('outfit', outfit)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      customization.outfit === outfit
                        ? 'border-cyan-400 bg-cyan-400/20'
                        : 'border-white/20 bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <span className="text-white capitalize">{outfit}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-white font-semibold mb-3 block">Accessories</label>
              <div className="grid grid-cols-2 gap-4">
                {AVATAR_OPTIONS.accessory.map(accessory => (
                  <button
                    key={accessory}
                    onClick={() => updateCustomization('accessory', accessory)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      customization.accessory === accessory
                        ? 'border-cyan-400 bg-cyan-400/20'
                        : 'border-white/20 bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <span className="text-white capitalize">{accessory}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 4: // Background & Expression
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white text-center">Final Touches</h3>

            <div>
              <label className="text-white font-semibold mb-3 block">Background</label>
              <div className="grid grid-cols-2 gap-4">
                {AVATAR_OPTIONS.background.map(bg => (
                  <button
                    key={bg}
                    onClick={() => updateCustomization('background', bg)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      customization.background === bg
                        ? 'border-cyan-400 bg-cyan-400/20'
                        : 'border-white/20 bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <span className="text-white capitalize">{bg}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-white font-semibold mb-3 block">Expression</label>
              <div className="grid grid-cols-2 gap-4">
                {AVATAR_OPTIONS.expression.map(expression => (
                  <button
                    key={expression}
                    onClick={() => updateCustomization('expression', expression)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      customization.expression === expression
                        ? 'border-cyan-400 bg-cyan-400/20'
                        : 'border-white/20 bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <span className="text-white capitalize">{expression}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 5: // Review & Save
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white text-center">Your Avatar is Ready!</h3>

            <div className="text-center">
              {!previewUrl ? (
                <button
                  onClick={generateAvatar}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 disabled:opacity-50 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300"
                >
                  {isGenerating ? 'Generating...' : 'Generate Avatar'}
                </button>
              ) : (
                <div className="space-y-6">
                  <div className="w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-cyan-400">
                    <img src={previewUrl} alt="Your avatar" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={saveAvatar}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                    >
                      Save Avatar
                    </button>
                    <button
                      onClick={() => setPreviewUrl(null)}
                      className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Avatar Creator</h1>
              <p className="text-white/60 text-sm">Create your unique digital identity</p>
            </div>
          </div>

          {onSkip && step < 5 && (
            <button
              onClick={onSkip}
              className="text-white/60 hover:text-white text-sm underline"
            >
              Skip for now
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
      {step > 0 && step < 5 && (
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
              onClick={() => setStep(step + 1)}
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

// Personality Quiz Component
function PersonalityQuiz({ onComplete }: { onComplete: (traits: any) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)

  const questions = [
    {
      question: "What's your typical mood?",
      options: ['Energetic', 'Calm', 'Creative', 'Adventurous', 'Mysterious', 'Friendly'],
      key: 'mood'
    },
    {
      question: "What's your style preference?",
      options: ['Casual', 'Professional', 'Artsy', 'Sporty', 'Elegant', 'Tech'],
      key: 'style'
    },
    {
      question: "What's your favorite color theme?",
      options: ['Ocean', 'Forest', 'Sunset', 'Space', 'Urban', 'Abstract'],
      key: 'theme'
    }
  ]

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [questions[currentQuestion].key]: answer }))

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      onComplete(answers)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-4">
          Let's Get to Know You
        </h3>
        <p className="text-white/70">
          Answer a few questions to create your perfect avatar
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
        <h4 className="text-xl font-semibold text-white mb-6 text-center">
          {questions[currentQuestion].question}
        </h4>

        <div className="grid grid-cols-2 gap-4">
          {questions[currentQuestion].options.map(option => (
            <button
              key={option}
              onClick={() => handleAnswer(option.toLowerCase())}
              className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 border border-white/20 hover:border-white/40"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <div className="flex space-x-2">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index <= currentQuestion ? 'bg-cyan-400' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
