'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  SparklesIcon,
  StarIcon,
  HeartIcon,
  LightBulbIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface EntertainmentModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'horoscope' | 'animal_identity' | 'iq_test' | null
}

export default function EntertainmentModal({ isOpen, onClose, type }: EntertainmentModalProps) {
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && type) {
      generateResult()
    }
  }, [isOpen, type])

  const generateResult = async () => {
    setIsLoading(true)
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      switch (type) {
        case 'horoscope':
          setResult({
            sign: 'Leo',
            date: new Date().toLocaleDateString(),
            prediction: "Today brings opportunities for creative expression. Your natural charisma will attract positive attention. Trust your instincts in social situations.",
            luckyColor: "Gold",
            luckyNumber: 7,
            mood: "Confident and creative"
          })
          break

        case 'animal_identity':
          setResult({
            animal: 'Phoenix',
            traits: ['Resilient', 'Transformative', 'Charismatic', 'Visionary'],
            description: "You are a Phoenix - a being of rebirth and transformation. Like the mythical bird that rises from ashes, you have an incredible capacity for renewal and growth.",
            strengths: ['Adaptability', 'Leadership', 'Inspiration', 'Recovery from setbacks'],
            compatibleWith: ['Dragon', 'Eagle', 'Lion']
          })
          break

        case 'iq_test':
          setResult({
            score: 128,
            percentile: 92,
            category: 'Superior Intelligence',
            breakdown: {
              logical: 135,
              spatial: 125,
              verbal: 130,
              memory: 122
            },
            insights: "Your exceptional logical reasoning and spatial abilities suggest strong analytical thinking. Consider careers in technology, engineering, or research."
          })
          break
      }
    } catch (error) {
      console.error('Error generating result:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {type === 'horoscope' && 'Daily Horoscope'}
                {type === 'animal_identity' && 'Hidden Animal Identity'}
                {type === 'iq_test' && 'IQ Assessment'}
              </h2>
              <p className="text-white/60 text-sm">AI-powered insights just for you</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white/80">Analyzing your unique energy...</p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {type === 'horoscope' && (
                <HoroscopeResult data={result} />
              )}

              {type === 'animal_identity' && (
                <AnimalIdentityResult data={result} />
              )}

              {type === 'iq_test' && (
                <IQTestResult data={result} />
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/80">Something went wrong. Please try again.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function HoroscopeResult({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <StarIcon className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{data.sign}</h3>
        <p className="text-white/60">{data.date}</p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h4 className="text-lg font-semibold text-white mb-4">Your Daily Guidance</h4>
        <p className="text-white/80 leading-relaxed">{data.prediction}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
          <div className="text-2xl mb-2">🎨</div>
          <div className="text-white font-semibold">{data.luckyColor}</div>
          <div className="text-white/60 text-sm">Lucky Color</div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
          <div className="text-2xl mb-2">🔢</div>
          <div className="text-white font-semibold">{data.luckyNumber}</div>
          <div className="text-white/60 text-sm">Lucky Number</div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
          <div className="text-2xl mb-2">😊</div>
          <div className="text-white font-semibold">{data.mood}</div>
          <div className="text-white/60 text-sm">Today's Mood</div>
        </div>
      </div>
    </div>
  )
}

function AnimalIdentityResult({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-r from-red-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🔥</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{data.animal}</h3>
        <p className="text-white/60">Your Spirit Animal</p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <p className="text-white/80 leading-relaxed">{data.description}</p>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Your Key Traits</h4>
        <div className="flex flex-wrap gap-2">
          {data.traits.map((trait: string, index: number) => (
            <span
              key={index}
              className="bg-gradient-to-r from-cyan-400 to-purple-500 text-white px-3 py-1 rounded-full text-sm"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Your Strengths</h4>
        <div className="grid grid-cols-2 gap-3">
          {data.strengths.map((strength: string, index: number) => (
            <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-cyan-400 text-sm font-semibold">{strength}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Most Compatible With</h4>
        <div className="flex flex-wrap gap-2">
          {data.compatibleWith.map((animal: string, index: number) => (
            <span
              key={index}
              className="bg-white/10 text-white px-3 py-1 rounded-full text-sm border border-white/20"
            >
              {animal}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function IQTestResult({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <LightBulbIcon className="w-12 h-12 text-white" />
        </div>
        <div className="text-6xl font-bold text-white mb-2">{data.score}</div>
        <p className="text-white/60">IQ Score</p>
        <p className="text-cyan-400 font-semibold">{data.category}</p>
        <p className="text-white/80">{data.percentile}nd percentile</p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h4 className="text-lg font-semibold text-white mb-3">Cognitive Profile</h4>
        <div className="space-y-4">
          {Object.entries(data.breakdown).map(([skill, score]: [string, any]) => (
            <div key={skill} className="flex items-center justify-between">
              <span className="text-white/80 capitalize">{skill}</span>
              <div className="flex items-center space-x-3">
                <div className="w-24 bg-white/20 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2 rounded-full"
                    style={{ width: `${(score / 160) * 100}%` }}
                  />
                </div>
                <span className="text-white font-semibold w-12 text-right">{score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-cyan-400/20 to-purple-500/20 rounded-xl p-6 border border-cyan-400/30">
        <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
          <EyeIcon className="w-5 h-5 mr-2" />
          AI Insights
        </h4>
        <p className="text-white/90 leading-relaxed">{data.insights}</p>
      </div>
    </div>
  )
}
