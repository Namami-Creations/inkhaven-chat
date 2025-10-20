'use client'

import { useState, useEffect } from 'react'

interface UserProfile {
  animalType?: string
  [key: string]: any
}

interface OnboardingStep {
  id: string
  title: string
  description: string
}

interface UserOnboardingProps {
  userProfile?: UserProfile
  showOnboarding: boolean
  onStartQuiz?: () => void
  onSelectIcebreaker?: (icebreaker: string) => void
  onUpgradePremium?: () => void
  onCompleteOnboarding?: () => void
  onSkipOnboarding?: () => void
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Discover Your Spirit Animal',
    description: 'Your personality determines your animal avatar and chat experience. Take our 5-question quiz to find your perfect match!'
  },
  {
    id: 'animal-quiz',
    title: 'Personality Quiz',
    description: 'Answer a few questions about yourself to unlock your unique animal personality and connect with like-minded people.'
  },
  {
    id: 'first-message',
    title: 'Start Chatting',
    description: 'Now that you have your animal avatar, it\'s time to make your first connection! Use personalized conversation starters to break the ice.'
  },
  {
    id: 'explore-features',
    title: 'Explore Features',
    description: 'Inkhaven Chat has many features to enhance your conversations. Try GIFs, themes, and animal emojis to express yourself better.'
  },
  {
    id: 'premium-benefits',
    title: 'Unlock Premium Features',
    description: 'Ready for the full experience? Upgrade to premium for AI-powered features, file sharing, and cloud storage.'
  }
]

const emojiMap: Record<string, string> = {
  lion: '🦁',
  dolphin: '🐬',
  owl: '🦉',
  wolf: '🐺',
  fox: '🦊',
  bear: '🐻',
  rabbit: '🐰',
  tiger: '🐯',
  eagle: '🦅',
  panda: '🐼',
  cat: '🐱',
  dog: '🐶',
  elephant: '🐘',
  monkey: '🐵',
  horse: '🐴',
  deer: '🦌',
  butterfly: '🦋',
  peacock: '🦚'
}

export default function UserOnboarding({
  userProfile,
  showOnboarding,
  onStartQuiz,
  onSelectIcebreaker,
  onUpgradePremium,
  onCompleteOnboarding,
  onSkipOnboarding
}: UserOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [sampleIcebreakers, setSampleIcebreakers] = useState<string[]>([
    "What's your favorite animal and why?",
    "What's your spirit animal telling you today?",
    "What's the most interesting thing you've learned recently?"
  ])
  const [animalEmoji, setAnimalEmoji] = useState('🐾')

  useEffect(() => {
    updateAnimalEmoji()
    generateSampleIcebreakers()
  }, [userProfile])

  const updateAnimalEmoji = () => {
    if (userProfile?.animalType) {
      setAnimalEmoji(emojiMap[userProfile.animalType] || '🐾')
    } else {
      setAnimalEmoji('🐾')
    }
  }

  const generateSampleIcebreakers = async () => {
    if (!userProfile) return

    try {
      // Mock AI service - replace with actual implementation
      const mockIcebreakers = [
        "What's your favorite animal and why?",
        "What's your spirit animal telling you today?",
        "What's the most interesting thing you've learned recently?"
      ]
      setSampleIcebreakers(mockIcebreakers)
    } catch (error) {
      console.error('Failed to generate sample icebreakers:', error)
      // Keep default icebreakers
    }
  }

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!showOnboarding) return null

  return (
    <div className="user-onboarding-overlay">
      <div className="onboarding-modal">
        {/* Header */}
        <div className="onboarding-header">
          <div className="animal-avatar">
            {animalEmoji}
          </div>
          <h2 className="onboarding-title">
            Welcome to Inkhaven Chat, {userProfile?.animalType || 'Friend'}!
          </h2>
          <p className="onboarding-subtitle">
            Let's get you started with some personalized tips
          </p>
        </div>

        {/* Onboarding Steps */}
        <div className="onboarding-steps">
          {onboardingSteps.map((step, index) => (
            <div
              key={step.id}
              className={`onboarding-step ${
                currentStep === index ? 'active' : ''
              } ${
                index < currentStep ? 'completed' : ''
              }`}
            >
              <div className="step-number">
                {index + 1}
              </div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>

                {/* Step-specific content */}
                {step.id === 'animal-quiz' && (
                  <div className="step-actions">
                    <button
                      onClick={onStartQuiz}
                      className="btn-primary"
                    >
                      🐾 Take Personality Quiz
                    </button>
                  </div>
                )}

                {step.id === 'first-message' && (
                  <div className="step-actions">
                    <div className="icebreaker-examples">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Try these conversation starters:
                      </p>
                      <div className="icebreaker-buttons">
                        {sampleIcebreakers.map(icebreaker => (
                          <button
                            key={icebreaker}
                            onClick={() => onSelectIcebreaker?.(icebreaker)}
                            className="icebreaker-btn"
                          >
                            {icebreaker}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step.id === 'explore-features' && (
                  <div className="step-actions">
                    <div className="features-grid">
                      <div className="feature-item">
                        <span className="feature-icon">🎬</span>
                        <span className="feature-text">Share GIFs</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">✨</span>
                        <span className="feature-text">AI Suggestions</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">🐾</span>
                        <span className="feature-text">Animal Emojis</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">🎨</span>
                        <span className="feature-text">Themes</span>
                      </div>
                    </div>
                  </div>
                )}

                {step.id === 'premium-benefits' && (
                  <div className="step-actions">
                    <div className="premium-features">
                      <div className="premium-item">
                        <span className="premium-icon">💾</span>
                        <div className="premium-text">
                          <strong>Save Conversations</strong>
                          <br />
                          <small>Cloud storage for chat history</small>
                        </div>
                      </div>
                      <div className="premium-item">
                        <span className="premium-icon">🤖</span>
                        <div className="premium-text">
                          <strong>AI-Powered Features</strong>
                          <br />
                          <small>Smart replies & matchmaking</small>
                        </div>
                      </div>
                      <div className="premium-item">
                        <span className="premium-icon">📎</span>
                        <div className="premium-text">
                          <strong>File Sharing</strong>
                          <br />
                          <small>Upload images & documents</small>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={onUpgradePremium}
                      className="btn-premium"
                    >
                      🚀 Upgrade to Premium
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="onboarding-navigation">
          {currentStep > 0 && (
            <button
              onClick={previousStep}
              className="btn-secondary"
            >
              ← Previous
            </button>
          )}

          <div className="step-indicators">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`step-indicator ${
                  currentStep === index ? 'active' : ''
                } ${
                  index < currentStep ? 'completed' : ''
                }`}
              />
            ))}
          </div>

          {currentStep < onboardingSteps.length - 1 ? (
            <button
              onClick={nextStep}
              className="btn-primary"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={onCompleteOnboarding}
              className="btn-success"
            >
              🎉 Get Started!
            </button>
          )}
        </div>

        {/* Skip option */}
        <div className="onboarding-skip">
          <button
            onClick={onSkipOnboarding}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Skip tutorial
          </button>
        </div>
      </div>

      <style jsx>{`
        .user-onboarding-overlay {
          @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4;
        }

        .onboarding-modal {
          @apply bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden;
        }

        .onboarding-header {
          @apply text-center p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white;
        }

        .animal-avatar {
          @apply text-6xl mb-4;
        }

        .onboarding-title {
          @apply text-2xl font-bold mb-2;
        }

        .onboarding-subtitle {
          @apply text-blue-100;
        }

        .onboarding-steps {
          @apply p-6 max-h-96 overflow-y-auto;
        }

        .onboarding-step {
          @apply flex items-start space-x-4 mb-6 p-4 rounded-lg transition-all;
        }

        .onboarding-step.active {
          @apply bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800;
        }

        .onboarding-step.completed {
          @apply bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800;
        }

        .step-number {
          @apply flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center font-bold;
        }

        .onboarding-step.active .step-number {
          @apply bg-blue-500 text-white;
        }

        .onboarding-step.completed .step-number {
          @apply bg-green-500 text-white;
        }

        .step-title {
          @apply font-semibold text-lg mb-1 text-gray-900 dark:text-gray-100;
        }

        .step-description {
          @apply text-gray-600 dark:text-gray-400 mb-3;
        }

        .step-actions {
          @apply space-y-3;
        }

        .btn-primary {
          @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors;
        }

        .btn-secondary {
          @apply bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors;
        }

        .btn-success {
          @apply bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors;
        }

        .btn-premium {
          @apply bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-lg;
        }

        .icebreaker-examples {
          @apply bg-gray-50 dark:bg-gray-800 p-3 rounded-lg;
        }

        .icebreaker-buttons {
          @apply flex flex-wrap gap-2;
        }

        .icebreaker-btn {
          @apply bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors;
        }

        .features-grid {
          @apply grid grid-cols-2 gap-3;
        }

        .feature-item {
          @apply flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg;
        }

        .feature-icon {
          @apply text-xl;
        }

        .feature-text {
          @apply text-sm font-medium text-gray-700 dark:text-gray-300;
        }

        .premium-features {
          @apply space-y-3 mb-4;
        }

        .premium-item {
          @apply flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800;
        }

        .premium-icon {
          @apply text-2xl;
        }

        .premium-text strong {
          @apply text-gray-900 dark:text-gray-100;
        }

        .premium-text small {
          @apply text-gray-600 dark:text-gray-400;
        }

        .onboarding-navigation {
          @apply flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
        }

        .step-indicators {
          @apply flex space-x-2;
        }

        .step-indicator {
          @apply w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full;
        }

        .step-indicator.active {
          @apply bg-blue-500;
        }

        .step-indicator.completed {
          @apply bg-green-500;
        }

        .onboarding-skip {
          @apply text-center p-3 bg-gray-100 dark:bg-gray-900;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .onboarding-modal {
            @apply mx-4 max-h-[95vh];
          }

          .onboarding-steps {
            @apply p-4 max-h-80;
          }

          .features-grid {
            @apply grid-cols-1;
          }

          .onboarding-navigation {
            @apply flex-col space-y-4;
          }

          .step-indicators {
            @apply order-1;
          }
        }
      `}</style>
    </div>
  )
}
