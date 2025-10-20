'use client'

import { useState, useEffect } from 'react'

interface ThemeSelectorProps {
  isOpen: boolean
  onClose: () => void
}

const themes = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean and bright interface'
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Easy on the eyes in low light'
  },
  {
    id: 'auto',
    name: 'Auto',
    description: 'Follows your system preference'
  }
]

export default function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState('auto')

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'auto'
    setSelectedTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  const applyTheme = (theme: string) => {
    const root = document.documentElement

    if (theme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.toggle('dark', systemTheme === 'dark')
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }

    localStorage.setItem('theme', theme)
  }

  const selectTheme = (themeId: string) => {
    setSelectedTheme(themeId)
    applyTheme(themeId)
  }

  const closeModal = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🎨 Choose Theme</h2>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label="Close theme selector"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {themes.map(theme => (
            <div
              key={theme.id}
              onClick={() => selectTheme(theme.id)}
              className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                selectedTheme === theme.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">{theme.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{theme.description}</div>
              </div>
              <div className="ml-4">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  selectedTheme === theme.id ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {selectedTheme === theme.id && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
