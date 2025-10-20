'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { CHAT_THEMES, ChatTheme } from '@/utils/types'

interface ThemeCustomizerProps {
  currentTheme: ChatTheme
  onThemeChange: (theme: ChatTheme) => void
  onSave: (theme: ChatTheme) => void
}

export default function ThemeCustomizer({
  currentTheme,
  onThemeChange,
  onSave
}: ThemeCustomizerProps) {
  const [customColors, setCustomColors] = useState({
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#06b6d4'
  })

  const handleColorChange = (colorType: keyof typeof customColors, value: string) => {
    setCustomColors(prev => ({ ...prev, [colorType]: value }))
    // Apply custom colors to CSS variables
    document.documentElement.style.setProperty(`--custom-${colorType}`, value)
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <h2 className="text-2xl font-bold text-white mb-6">Customize Your Chat Theme</h2>

      {/* Live Preview */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3">Live Preview</h3>
        <div className={`h-32 rounded-xl ${CHAT_THEMES[currentTheme]} border border-white/20 flex items-center justify-center`}>
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white font-medium">
            This is how your chat will look!
          </div>
        </div>
      </div>

      {/* Theme Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3">Choose Base Theme</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.keys(CHAT_THEMES).map((themeKey) => (
            <motion.button
              key={themeKey}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onThemeChange(themeKey as ChatTheme)}
              className={`p-4 rounded-xl text-sm font-medium transition-all ${
                currentTheme === themeKey
                  ? 'ring-2 ring-cyan-400 bg-white/20 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <div className={`h-12 rounded-lg mb-2 ${CHAT_THEMES[themeKey as ChatTheme]}`} />
              {themeKey.charAt(0).toUpperCase() + themeKey.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3">Customize Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(customColors).map(([colorType, value]) => (
            <div key={colorType} className="space-y-2">
              <label className="text-white/80 text-sm font-medium capitalize">
                {colorType} Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => handleColorChange(colorType as keyof typeof customColors, e.target.value)}
                  className="w-12 h-10 rounded border border-white/20 bg-white/5"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleColorChange(colorType as keyof typeof customColors, e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Pattern Options */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3">Background Patterns</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Solid', value: 'solid' },
            { name: 'Gradient', value: 'gradient' },
            { name: 'Animated', value: 'animated' },
            { name: 'Pattern', value: 'pattern' }
          ].map((pattern) => (
            <motion.button
              key={pattern.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-colors"
            >
              <div className="h-12 rounded-lg mb-2 bg-gradient-to-br from-cyan-400 to-purple-600" />
              {pattern.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Save Actions */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSave(currentTheme)}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          Save Theme
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
        >
          Reset
        </motion.button>
      </div>

      {/* Pro Tip */}
      <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="text-cyan-400 text-lg">💡</div>
          <div>
            <div className="text-cyan-300 font-medium mb-1">Pro Tip</div>
            <div className="text-white/80 text-sm">
              Register for free to save your favorite themes and unlock advanced customization options!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
