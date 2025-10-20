'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ChatTheme, CHAT_THEMES } from '@/utils/types'

interface ChatHeaderProps {
  theme: ChatTheme
  onThemeChange: (theme: ChatTheme) => void
  onNextChat: () => void
}

export default function ChatHeader({ theme, onThemeChange, onNextChat }: ChatHeaderProps) {
  const [showThemeSelector, setShowThemeSelector] = useState(false)

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-sm border-b border-white/20 px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div>
            <div className="text-white font-medium">Anonymous User</div>
            <div className="text-white/60 text-sm">Online</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowThemeSelector(!showThemeSelector)}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNextChat}
            className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-full text-sm font-medium transition-colors"
          >
            Next Chat
          </motion.button>
        </div>
      </motion.div>

      {/* Theme Selector Panel */}
      <AnimatePresence>
        {showThemeSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 backdrop-blur-sm border-b border-white/10 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Choose Theme</h3>
                <button
                  onClick={() => setShowThemeSelector(false)}
                  className="text-white/70 hover:text-white"
                  aria-label="Close theme selector"
                  title="Close theme selector"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Object.keys(CHAT_THEMES).map((themeKey) => (
                  <button
                    key={themeKey}
                    onClick={() => {
                      onThemeChange(themeKey as ChatTheme)
                      setShowThemeSelector(false)
                    }}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      theme === themeKey
                        ? 'bg-white/20 text-white ring-2 ring-white/50'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                    aria-label={`Select ${themeKey} theme`}
                    title={`Switch to ${themeKey} theme`}
                    aria-pressed={theme === themeKey}
                  >
                    {themeKey.charAt(0).toUpperCase() + themeKey.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
