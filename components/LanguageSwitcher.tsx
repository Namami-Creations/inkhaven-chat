'use client'

import { useTranslation } from 'react-i18next'
import { useState, useRef, useEffect } from 'react'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'ur', name: 'اردو', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'or', name: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'as', name: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'mai', name: 'मैथिली', flag: '🇮🇳' },
  { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ', flag: '🇮🇳' },
  { code: 'ks', name: 'کٲشُر', flag: '🇮🇳' },
  { code: 'sd', name: 'سنڌي', flag: '🇮🇳' },
  { code: 'kok', name: 'कोंकणी', flag: '🇮🇳' },
  { code: 'dgo', name: 'डोगरी', flag: '🇮🇳' },
  { code: 'mni', name: 'মৈতৈলোন্', flag: '🇮🇳' },
  { code: 'brx', name: 'बोड़ो', flag: '🇮🇳' },
  { code: 'ne', name: 'नेपाली', flag: '🇳🇵' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current language: ${currentLanguage.name}. Click to change language`}
        aria-describedby="language-selector-description"
      >
        <span className="text-base" aria-hidden="true">{currentLanguage.flag}</span>
        <span>{currentLanguage.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div id="language-selector-description" className="sr-only">
        Use arrow keys to navigate options, Enter to select, Escape to close
      </div>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50"
          role="listbox"
          aria-label="Language selection"
          aria-activedescendant={`language-${i18n.language}`}
        >
          {languages.map((language) => (
            <button
              key={language.code}
              id={`language-${language.code}`}
              onClick={() => handleLanguageChange(language.code)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleLanguageChange(language.code)
                }
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-700 ${
                i18n.language === language.code
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
              role="option"
              aria-selected={i18n.language === language.code}
            >
              <span className="text-base" aria-hidden="true">{language.flag}</span>
              <span>{language.name}</span>
              {i18n.language === language.code && (
                <svg
                  className="w-4 h-4 ml-auto text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
