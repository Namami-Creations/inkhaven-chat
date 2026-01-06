'use client'

import { useState } from 'react'

const INTERESTS = [
  'Gaming', 'Music', 'Movies', 'Sports', 'Technology', 'Art', 'Travel',
  'Food', 'Books', 'Fitness', 'Photography', 'Dancing', 'Cooking', 'Pets',
  'Fashion', 'Science', 'History', 'Languages', 'Nature', 'Anime'
]

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi'
]

const MOODS = [
  'Happy', 'Chill', 'Adventurous', 'Romantic', 'Funny', 'Deep', 'Energetic', 'Relaxed'
]

export default function InterestSelector({ onComplete }: { onComplete: (data: any) => void }) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [selectedMood, setSelectedMood] = useState('')

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleStart = () => {
    if (selectedInterests.length === 0) {
      alert('Please select at least one interest')
      return
    }
    if (!selectedLanguage) {
      alert('Please select your language')
      return
    }

    onComplete({
      interests: selectedInterests,
      language: selectedLanguage,
      ageGroup: ageGroup || '18-25',
      mood: selectedMood || null
    })
  }

  return (
    <div className="max-w-md w-full">
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          What are you interested in?
        </h2>

        {/* Interests */}
        <div className="mb-6">
          <h3 className="text-white font-medium mb-3">Select your interests:</h3>
          <div className="grid grid-cols-2 gap-2">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                type="button"
                className={`p-2 rounded text-sm transition-colors ${
                  selectedInterests.includes(interest)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="mb-6">
          <h3 className="text-white font-medium mb-3">Your language:</h3>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          >
            <option value="">Select language</option>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        {/* Age Group */}
        <div className="mb-6">
          <h3 className="text-white font-medium mb-3">Age group:</h3>
          <select
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          >
            <option value="18-25">18-25</option>
            <option value="26-35">26-35</option>
            <option value="36-45">36-45</option>
            <option value="46+">46+</option>
          </select>
        </div>

        {/* Mood (Freemium Feature) */}
        <div className="mb-6">
          <h3 className="text-white font-medium mb-3">How are you feeling? (Optional)</h3>
          <div className="grid grid-cols-2 gap-2">
            {MOODS.map((mood) => (
              <button
                key={mood}
                onClick={() => setSelectedMood(selectedMood === mood ? '' : mood)}
                type="button"
                className={`p-2 rounded text-sm transition-colors ${
                  selectedMood === mood
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          type="button"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
        >
          Find Chat Partner
        </button>
      </div>
    </div>
  )
}