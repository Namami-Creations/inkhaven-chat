'use client'

import { useState, useMemo } from 'react'

interface QuizOption {
  text: string
  scores: Record<string, number>
}

interface QuizQuestion {
  question: string
  options: QuizOption[]
}

interface AnimalResult {
  name: string
  emoji: string
  description: string
  traits: string[]
}

interface AnimalAvatarSelectorProps {
  isOpen: boolean
  onClose: () => void
  onAvatarSelected: (avatar: AnimalResult) => void
}

const questions: QuizQuestion[] = [
  {
    question: "What's your ideal weekend activity?",
    options: [
      { text: "Exploring nature trails and hiking", scores: { elephant: 3, wolf: 2, eagle: 2 } },
      { text: "Reading a book in a quiet spot", scores: { owl: 3, sloth: 2, panda: 2 } },
      { text: "Socializing with friends at a party", scores: { dolphin: 3, peacock: 2, bee: 2 } },
      { text: "Working on creative projects alone", scores: { octopus: 3, hummingbird: 2, cheetah: 2 } },
      { text: "Playing competitive sports or games", scores: { lion: 3, tiger: 2, rabbit: 2 } }
    ]
  },
  {
    question: "How do you handle stressful situations?",
    options: [
      { text: "Face it head-on with confidence", scores: { lion: 3, tiger: 2, wolf: 2 } },
      { text: "Take time to think and plan carefully", scores: { owl: 3, elephant: 2, turtle: 2 } },
      { text: "Seek support from friends or family", scores: { dolphin: 3, panda: 2, koala: 2 } },
      { text: "Find a quiet place to recharge", scores: { sloth: 3, rabbit: 2, penguin: 2 } },
      { text: "Use creativity to find new solutions", scores: { octopus: 3, peacock: 2, hummingbird: 2 } }
    ]
  },
  {
    question: "What's your communication style?",
    options: [
      { text: "Direct and confident", scores: { lion: 3, eagle: 2, wolf: 2 } },
      { text: "Thoughtful and wise", scores: { owl: 3, elephant: 2, turtle: 2 } },
      { text: "Friendly and social", scores: { dolphin: 3, peacock: 2, bee: 2 } },
      { text: "Creative and expressive", scores: { octopus: 3, hummingbird: 2, cheetah: 2 } },
      { text: "Gentle and caring", scores: { panda: 3, koala: 2, rabbit: 2 } }
    ]
  },
  {
    question: "How do you prefer to spend your free time?",
    options: [
      { text: "Being active and exploring", scores: { eagle: 3, cheetah: 2, wolf: 2 } },
      { text: "Relaxing in nature", scores: { sloth: 3, koala: 2, panda: 2 } },
      { text: "Learning new things", scores: { octopus: 3, owl: 2, elephant: 2 } },
      { text: "Creating art or music", scores: { peacock: 3, hummingbird: 2, bee: 2 } },
      { text: "Connecting with loved ones", scores: { dolphin: 3, rabbit: 2, penguin: 2 } }
    ]
  },
  {
    question: "What's your approach to new challenges?",
    options: [
      { text: "Jump in with energy and enthusiasm", scores: { cheetah: 3, lion: 2, tiger: 2 } },
      { text: "Study and learn everything first", scores: { owl: 3, elephant: 2, octopus: 2 } },
      { text: "Collaborate with others", scores: { wolf: 3, bee: 2, dolphin: 2 } },
      { text: "Take it slow and steady", scores: { turtle: 3, sloth: 2, penguin: 2 } },
      { text: "Find creative and unique solutions", scores: { peacock: 3, hummingbird: 2, octopus: 2 } }
    ]
  }
]

// Animal database
const animals: Record<string, AnimalResult> = {
  lion: {
    name: "Lion",
    emoji: "🦁",
    description: "A natural leader with courage and confidence",
    traits: ["Leadership", "Courage", "Strength", "Charisma"]
  },
  dolphin: {
    name: "Dolphin",
    emoji: "🐬",
    description: "Intelligent and social with a playful spirit",
    traits: ["Intelligence", "Social", "Playful", "Adaptable"]
  },
  owl: {
    name: "Owl",
    emoji: "🦉",
    description: "Wise and observant with deep insight",
    traits: ["Wisdom", "Observation", "Patience", "Intelligence"]
  },
  wolf: {
    name: "Wolf",
    emoji: "🐺",
    description: "Loyal and intuitive with strong instincts",
    traits: ["Loyalty", "Intuition", "Independence", "Teamwork"]
  },
  panda: {
    name: "Panda",
    emoji: "🐼",
    description: "Gentle and peaceful with a love for harmony",
    traits: ["Gentle", "Peaceful", "Balanced", "Nurturing"]
  },
  eagle: {
    name: "Eagle",
    emoji: "🦅",
    description: "Visionary and focused with great perspective",
    traits: ["Vision", "Focus", "Independence", "Perspective"]
  },
  elephant: {
    name: "Elephant",
    emoji: "🐘",
    description: "Wise and reliable with excellent memory",
    traits: ["Wisdom", "Reliability", "Memory", "Strength"]
  },
  penguin: {
    name: "Penguin",
    emoji: "🐧",
    description: "Adaptable and social with great endurance",
    traits: ["Adaptable", "Social", "Endurance", "Family-oriented"]
  },
  rabbit: {
    name: "Rabbit",
    emoji: "🐰",
    description: "Gentle and quick with a nurturing nature",
    traits: ["Gentle", "Quick", "Nurturing", "Alert"]
  },
  koala: {
    name: "Koala",
    emoji: "🐨",
    description: "Calm and relaxed with a love for comfort",
    traits: ["Calm", "Relaxed", "Patient", "Comfort-loving"]
  },
  tiger: {
    name: "Tiger",
    emoji: "🐯",
    description: "Powerful and confident with inner strength",
    traits: ["Power", "Confidence", "Independence", "Strength"]
  },
  bee: {
    name: "Bee",
    emoji: "🐝",
    description: "Hardworking and social with great attention to detail",
    traits: ["Hardworking", "Social", "Detail-oriented", "Productive"]
  },
  sloth: {
    name: "Sloth",
    emoji: "🦥",
    description: "Patient and relaxed with a calm demeanor",
    traits: ["Patient", "Relaxed", "Calm", "Mindful"]
  },
  cheetah: {
    name: "Cheetah",
    emoji: "🐆",
    description: "Fast and focused with incredible speed and determination",
    traits: ["Speed", "Focus", "Determination", "Agility"]
  },
  octopus: {
    name: "Octopus",
    emoji: "🐙",
    description: "Intelligent and adaptable with creative problem-solving",
    traits: ["Intelligent", "Adaptable", "Creative", "Problem-solver"]
  },
  peacock: {
    name: "Peacock",
    emoji: "🦚",
    description: "Beautiful and confident with creative expression",
    traits: ["Beautiful", "Confident", "Creative", "Expressive"]
  },
  hummingbird: {
    name: "Hummingbird",
    emoji: "🐦",
    description: "Energetic and joyful with a love for beauty and freedom",
    traits: ["Energetic", "Joyful", "Beautiful", "Free-spirited"]
  },
  turtle: {
    name: "Turtle",
    emoji: "🐢",
    description: "Wise and patient with steady progress and longevity",
    traits: ["Wise", "Patient", "Steady", "Long-lived"]
  }
}

export default function AnimalAvatarSelector({
  isOpen,
  onClose,
  onAvatarSelected
}: AnimalAvatarSelectorProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})

  const currentQuestion = questions[currentStep]

  const selectedAnimal = useMemo(() => {
    const animalScores = { ...scores }
    const maxScore = Math.max(...Object.values(animalScores))
    const topAnimals = Object.entries(animalScores)
      .filter(([, score]) => score === maxScore)
      .map(([animal]) => animal)

    // If tie, randomly select one of the top animals
    const selected = topAnimals[Math.floor(Math.random() * topAnimals.length)]
    return animals[selected] || animals.lion // fallback to lion
  }, [scores])

  const selectOption = (option: QuizOption) => {
    // Add scores to total
    const newScores = { ...scores }
    Object.entries(option.scores).forEach(([animal, score]) => {
      newScores[animal] = (newScores[animal] || 0) + score
    })

    setScores(newScores)
    setCurrentStep(currentStep + 1)
  }

  const confirmSelection = () => {
    onAvatarSelected(selectedAnimal)
    resetQuiz()
  }

  const closeModal = () => {
    onClose()
    resetQuiz()
  }

  const resetQuiz = () => {
    setCurrentStep(0)
    setScores({})
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🧠 Discover Your Spirit Animal
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              aria-label="Close animal selector"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quiz State */}
          {currentStep < questions.length && (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Question {currentStep + 1} of {questions.length}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{currentQuestion.question}</p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => selectOption(option)}
                    className="w-full p-4 text-left rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">{option.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results State */}
          {currentStep >= questions.length && (
            <div className="text-center space-y-6">
              {/* Celebration Animation */}
              <div className="text-6xl animate-bounce">🎉</div>

              {/* Animal Avatar */}
              <div className="space-y-4">
                <div className="text-8xl">{selectedAnimal.emoji}</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedAnimal.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedAnimal.description}</p>
              </div>

              {/* Traits */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Your Traits:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAnimal.traits.map(trait => (
                    <span
                      key={trait}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={confirmSelection}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Continue with {selectedAnimal.name}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
