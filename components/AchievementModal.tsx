'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrophyIcon,
  StarIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  SparklesIcon,
  FireIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: string
  progress?: number
  total?: number
}

interface AchievementModalProps {
  isOpen: boolean
  onClose: () => void
  achievements: Achievement[]
  isLoading?: boolean
}

export default function AchievementModal({ isOpen, onClose, achievements, isLoading }: AchievementModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'time' | 'activity' | 'special'>('all')

  const categories = [
    { key: 'all', label: 'All Badges', icon: TrophyIcon },
    { key: 'time', label: 'Time-Based', icon: ClockIcon },
    { key: 'activity', label: 'Activity', icon: StarIcon },
    { key: 'special', label: 'Special', icon: SparklesIcon }
  ]

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.icon.includes(selectedCategory))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <TrophyIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Achievements</h2>
              <p className="text-white/60 text-sm">{achievements.length} badges unlocked</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === category.key
                    ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
                }`}
              >
                <category.icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="p-6 overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white/80">Loading achievements...</p>
              </div>
            </div>
          ) : filteredAchievements.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAchievements.map(achievement => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      {achievement.icon === 'time' && <ClockIcon className="w-6 h-6 text-white" />}
                      {achievement.icon === 'activity' && <StarIcon className="w-6 h-6 text-white" />}
                      {achievement.icon === 'special' && <SparklesIcon className="w-6 h-6 text-white" />}
                      {achievement.icon === 'chat' && <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />}
                      {achievement.icon === 'group' && <UserGroupIcon className="w-6 h-6 text-white" />}
                      {achievement.icon === 'heart' && <HeartIcon className="w-6 h-6 text-white" />}
                      {achievement.icon === 'fire' && <FireIcon className="w-6 h-6 text-white" />}
                    </div>

                    <h4 className="text-white font-semibold text-sm mb-1">{achievement.title}</h4>
                    <p className="text-white/60 text-xs leading-tight">{achievement.description}</p>

                    {achievement.progress && achievement.total && (
                      <div className="mt-3">
                        <div className="w-full bg-white/20 rounded-full h-1">
                          <div
                            className="bg-gradient-to-r from-cyan-400 to-purple-500 h-1 rounded-full"
                            style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                          />
                        </div>
                        <p className="text-white/50 text-xs mt-1">
                          {achievement.progress}/{achievement.total}
                        </p>
                      </div>
                    )}

                    <p className="text-white/40 text-xs mt-2">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrophyIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">
                {selectedCategory === 'all'
                  ? "No achievements yet. Start chatting to unlock your first badge!"
                  : `No ${selectedCategory} achievements unlocked yet.`
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/20">
          <div className="flex justify-between items-center text-sm">
            <div className="text-white/60">
              Total Badges: <span className="text-white font-semibold">{achievements.length}</span>
            </div>
            <div className="text-white/60">
              Completion: <span className="text-cyan-400 font-semibold">
                {achievements.length > 0 ? Math.round((achievements.length / 50) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Achievement notification component
interface AchievementNotificationProps {
  achievement: Achievement | null
  onClose: () => void
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  if (!achievement) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      className="fixed top-4 right-4 z-50 max-w-sm"
    >
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 shadow-2xl border border-white/20">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <TrophyIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-bold text-sm">Achievement Unlocked!</h4>
            <h5 className="text-white font-semibold">{achievement.title}</h5>
            <p className="text-white/90 text-sm">{achievement.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Sparkle effect */}
        <div className="absolute -top-2 -right-2">
          <SparklesIcon className="w-6 h-6 text-yellow-300 animate-pulse" />
        </div>
      </div>
    </motion.div>
  )
}
