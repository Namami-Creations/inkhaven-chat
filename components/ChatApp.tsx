'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import LandingPage from '@/components/LandingPage'
import ChatInterface from '@/components/ChatInterface'
import RoomBrowser from '@/components/RoomBrowser'
import ThemeCustomizer from '@/components/ThemeCustomizer'
import { SidebarAd, BannerAd, AdSenseScript } from '@/components/AdSense'
import { ChatTheme, CHAT_THEMES } from '@/utils/types'
import { supabase } from '@/lib/supabase'
import { AIMatchingEngine } from '@/lib/ai-matching'
import { AIModerationService } from '@/lib/ai-moderation'
import { AIRoomGenerationService } from '@/lib/ai-room-generation'
import { HeartIcon, CoffeeIcon } from '@heroicons/react/24/outline'

type AppState = 'landing' | 'chat' | 'rooms' | 'customize'

export default function ChatApp() {
  const [appState, setAppState] = useState<AppState>('landing')
  const [currentTheme, setCurrentTheme] = useState<ChatTheme>('cosmic')
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substr(2, 9))
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [isOnline, setIsOnline] = useState(true)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleStartChat = async () => {
    try {
      // Create anonymous session
      const { data: session, error } = await supabase
        .from('anonymous_sessions')
        .insert({
          users: [userId],
          interests: [],
          quality_score: 0.0
        })
        .select()
        .single()

      if (error) throw error

      setCurrentSession(session)
      setAppState('chat')
    } catch (error) {
      console.error('Error creating chat session:', error)
      // Fallback to demo mode
      setCurrentSession({ id: 'demo', users: [userId] })
      setAppState('chat')
    }
  }

  const handleThemeChange = (theme: ChatTheme) => {
    setCurrentTheme(theme)
  }

  const handleSaveTheme = (theme: ChatTheme) => {
    setCurrentTheme(theme)
    setAppState('chat')
  }

  const handleNextChat = async () => {
    // End current session
    if (currentSession && currentSession.id !== 'demo') {
      await supabase
        .from('anonymous_sessions')
        .update({
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSession.id)
    }

    // Start new session
    await handleStartChat()
  }

  const handleReport = async () => {
    // TODO: Implement reporting functionality
    console.log('Reporting user...')
  }

  const handleBlock = async () => {
    // TODO: Implement blocking functionality
    console.log('Blocking user...')
  }

  const handleRegister = async () => {
    // TODO: Implement user registration
    console.log('Starting registration...')
  }

  const handleSupport = () => {
    // Trigger Buy Me Coffee widget
    if (typeof window !== 'undefined' && (window as any).BuyMeCoffee) {
      (window as any).BuyMeCoffee.showWidget()
    } else {
      // Fallback: open Buy Me Coffee page
      window.open('https://www.buymeacoffee.com/Twinklet', '_blank')
    }
  }

  const renderCurrentView = () => {
    switch (appState) {
      case 'landing':
        return (
          <LandingPage />
        )

      case 'chat':
        return (
          <div className="relative">
            {/* Sidebar Ad */}
            <div className="fixed right-4 top-24 z-40 hidden lg:block">
              <SidebarAd />
            </div>

            <ChatInterface
              theme={currentTheme}
              onThemeChange={handleThemeChange}
              onNextChat={handleNextChat}
              onReport={handleReport}
              onBlock={handleBlock}
              onRegister={handleRegister}
              sessionId={currentSession?.id}
              userId={userId}
              isOnline={isOnline}
            />
          </div>
        )

      case 'rooms':
        return (
          <RoomBrowser />
        )

      case 'customize':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <button
                  onClick={() => setAppState('landing')}
                  className="text-white/70 hover:text-white flex items-center gap-2"
                >
                  ← Back to Home
                </button>
              </div>
              <ThemeCustomizer
                currentTheme={currentTheme}
                onThemeChange={handleThemeChange}
                onSave={handleSaveTheme}
              />
            </div>
          </div>
        )

      default:
        return <LandingPage />
    }
  }

  return (
    <div className="relative">
      {/* AdSense Script */}
      <AdSenseScript />

      {/* Navigation Header (when not on landing) */}
      {appState !== 'landing' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm border-b border-white/10"
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setAppState('landing')}
              className="text-white font-bold text-xl"
            >
              Inkhaven Chat
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setAppState('rooms')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  appState === 'rooms'
                    ? 'bg-cyan-500 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Rooms
              </button>

              <button
                onClick={() => setAppState('chat')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  appState === 'chat'
                    ? 'bg-cyan-500 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Chat
              </button>

              <button
                onClick={() => setAppState('customize')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  appState === 'customize'
                    ? 'bg-cyan-500 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Themes
              </button>

              {/* Support Button */}
              <button
                onClick={handleSupport}
                className="px-4 py-2 rounded-full text-sm font-medium transition-colors text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 flex items-center gap-2"
                title="Support the project ☕"
              >
                <CoffeeIcon className="w-4 h-4" />
                Support
              </button>

              {/* Online Status */}
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-white/70">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        key={appState}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={appState !== 'landing' ? 'pt-20' : ''}
      >
        {renderCurrentView()}
      </motion.div>

      {/* Banner Ad */}
      {appState !== 'landing' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-sm border-t border-white/10"
        >
          <div className="flex justify-center py-2">
            <BannerAd />
          </div>
        </motion.div>
      )}

      {/* Demo Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="fixed bottom-4 right-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-white/80 text-sm"
      >
        🚀 Ultimate Anonymous Chat Platform - AI-Powered
      </motion.div>
    </div>
  )
}
