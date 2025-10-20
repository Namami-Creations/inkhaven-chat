'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { CHAT_THEMES, ChatTheme } from '@/utils/types'

export default function LandingPage() {
  const [currentTheme, setCurrentTheme] = useState<ChatTheme>('cosmic')
  const [userCount, setUserCount] = useState(0)

  // Simulate live user count
  useEffect(() => {
    const interval = setInterval(() => {
      setUserCount(prev => prev + Math.floor(Math.random() * 5))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleStartChat = () => {
    // TODO: Implement chat start logic
    console.log('Starting anonymous chat...')
  }

  return (
    <div className={`min-h-screen ${CHAT_THEMES[currentTheme]} transition-all duration-1000`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.6, 0.3, 0.6],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Theme Selector */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex gap-2 flex-wrap justify-center"
        >
          {Object.keys(CHAT_THEMES).map((theme) => (
            <button
              key={theme}
              onClick={() => setCurrentTheme(theme as ChatTheme)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                currentTheme === theme
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center max-w-4xl"
        >
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
            Welcome to
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Inkhaven Chat
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto"
          >
            Experience the world's most advanced anonymous chat platform.
            AI-enhanced conversations, beautiful themes, and instant connections.
          </motion.p>

          {/* Live User Count */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/90 font-medium">
                {userCount.toLocaleString()} people online now
              </span>
            </div>
          </motion.div>

          {/* Start Chat Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartChat}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold py-4 px-12 rounded-full text-xl shadow-2xl transition-all duration-300 glow"
          >
            Start Anonymous Chat
          </motion.button>
        </motion.div>

        {/* Feature Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl"
        >
          {[
            {
              title: 'AI-Powered Matching',
              description: 'Smart algorithms connect you with people who share your interests',
              icon: '🤖'
            },
            {
              title: 'Beautiful Themes',
              description: 'Choose from dynamic, animated chat skins and backgrounds',
              icon: '🎨'
            },
            {
              title: 'Zero Registration',
              description: 'Start chatting instantly - registration unlocks premium features',
              icon: '⚡'
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/70">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
