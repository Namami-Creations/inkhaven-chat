'use client'

import { useState } from 'react'

interface MatchPreferences {
  animalTypes: string[]
  minAge: number
  maxAge: number
  interests: string[]
  conversationStyle: string
}

interface MatchPreferencesProps {
  isOpen: boolean
  onClose: () => void
  onSave: (preferences: MatchPreferences) => void
}

// Animal types data
const animalTypes = [
  { id: 'lion', name: 'Lion', emoji: '🦁' },
  { id: 'dolphin', name: 'Dolphin', emoji: '🐬' },
  { id: 'owl', name: 'Owl', emoji: '🦉' },
  { id: 'wolf', name: 'Wolf', emoji: '🐺' },
  { id: 'panda', name: 'Panda', emoji: '🐼' },
  { id: 'eagle', name: 'Eagle', emoji: '🦅' },
  { id: 'elephant', name: 'Elephant', emoji: '🐘' },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰' }
]

// Available interests
const availableInterests = [
  { id: 'technology', name: 'Technology', emoji: '💻' },
  { id: 'art', name: 'Art & Design', emoji: '🎨' },
  { id: 'music', name: 'Music', emoji: '🎵' },
  { id: 'sports', name: 'Sports', emoji: '⚽' },
  { id: 'travel', name: 'Travel', emoji: '✈️' },
  { id: 'books', name: 'Books', emoji: '📚' },
  { id: 'cooking', name: 'Cooking', emoji: '👨‍🍳' },
  { id: 'gaming', name: 'Gaming', emoji: '🎮' },
  { id: 'nature', name: 'Nature', emoji: '🌿' },
  { id: 'science', name: 'Science', emoji: '🔬' }
]

// Conversation styles
const conversationStyles = [
  { id: 'casual', name: 'Casual & Fun', emoji: '😊' },
  { id: 'deep', name: 'Deep & Meaningful', emoji: '🤔' },
  { id: 'intellectual', name: 'Intellectual', emoji: '🧠' },
  { id: 'adventurous', name: 'Adventurous', emoji: '🏔️' }
]

export default function MatchPreferencesModal({
  isOpen,
  onClose,
  onSave
}: MatchPreferencesProps) {
  const [preferences, setPreferences] = useState<MatchPreferences>({
    animalTypes: [],
    minAge: 18,
    maxAge: 99,
    interests: [],
    conversationStyle: 'casual'
  })

  const handleAnimalTypeChange = (animalId: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      animalTypes: checked
        ? [...prev.animalTypes, animalId]
        : prev.animalTypes.filter(id => id !== animalId)
    }))
  }

  const handleInterestChange = (interestId: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      interests: checked
        ? [...prev.interests, interestId]
        : prev.interests.filter(id => id !== interestId)
    }))
  }

  const handleConversationStyleChange = (styleId: string) => {
    setPreferences(prev => ({
      ...prev,
      conversationStyle: styleId
    }))
  }

  const savePreferences = () => {
    // Validate preferences
    if (preferences.minAge > preferences.maxAge) {
      alert('Minimum age cannot be greater than maximum age')
      return
    }

    onSave(preferences)
    onClose()
  }

  const resetToDefaults = () => {
    setPreferences({
      animalTypes: [],
      minAge: 18,
      maxAge: 99,
      interests: [],
      conversationStyle: 'casual'
    })
  }

  const closeModal = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🎯 Match Preferences</h2>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              aria-label="Close preferences"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Customize how we find your perfect conversation partner
          </p>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-6">
            {/* Animal Compatibility */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                🐾 Preferred Animal Types
              </label>
              <div className="grid grid-cols-2 gap-3">
                {animalTypes.map(animal => (
                  <label key={animal.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.animalTypes.includes(animal.id)}
                      onChange={(e) => handleAnimalTypeChange(animal.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {animal.emoji} {animal.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                🎂 Age Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Minimum</label>
                  <input
                    type="number"
                    min="18"
                    max="99"
                    value={preferences.minAge}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      minAge: parseInt(e.target.value) || 18
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Maximum</label>
                  <input
                    type="number"
                    min="18"
                    max="99"
                    value={preferences.maxAge}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      maxAge: parseInt(e.target.value) || 99
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                🎨 Interests & Hobbies
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableInterests.map(interest => (
                  <label key={interest.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.interests.includes(interest.id)}
                      onChange={(e) => handleInterestChange(interest.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {interest.emoji} {interest.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Conversation Style */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                💬 Conversation Style
              </label>
              <div className="space-y-2">
                {conversationStyles.map(style => (
                  <label key={style.id} className="flex items-center">
                    <input
                      type="radio"
                      name="conversationStyle"
                      value={style.id}
                      checked={preferences.conversationStyle === style.id}
                      onChange={() => handleConversationStyleChange(style.id)}
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {style.emoji} {style.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={savePreferences}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Save & Find Match
          </button>
        </div>
      </div>
    </div>
  )
}
