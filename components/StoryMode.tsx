'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Send, Users, Clock } from 'lucide-react'
import { useUser } from '@/hooks/useFeatureAccess'

interface StorySession {
  id: string
  participants: string[]
  current_turn: number
  story_parts: string[]
  status: string
}

interface StoryModeProps {
  onClose?: () => void
}

export default function StoryMode({ onClose }: StoryModeProps) {
  const [session, setSession] = useState<StorySession | null>(null)
  const [currentPart, setCurrentPart] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const user = useUser()

  useEffect(() => {
    loadOrCreateSession()
  }, [])

  const loadOrCreateSession = async () => {
    try {
      // TODO: API call to find or create story session
      // For now, mock
      setSession({
        id: 'mock-story',
        participants: ['user1', 'user2'],
        current_turn: 0,
        story_parts: ['Once upon a time, in a magical forest...'],
        status: 'active'
      })
    } catch (error) {
      console.error('Failed to load story session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const submitPart = async () => {
    if (!currentPart.trim() || isSubmitting || !session) return

    setIsSubmitting(true)
    try {
      // TODO: API call to submit story part
      const newParts = [...session.story_parts, currentPart.trim()]
      setSession({
        ...session,
        story_parts: newParts,
        current_turn: session.current_turn + 1
      })
      setCurrentPart('')
    } catch (error) {
      console.error('Failed to submit story part:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-1/3"></div>
          <div className="h-32 bg-slate-700 rounded"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full">
        <p className="text-white">Failed to load story session.</p>
      </div>
    )
  }

  const isMyTurn = session.current_turn % session.participants.length === 0 // Mock: assume first participant
  const storyText = session.story_parts.join(' ')

  return (
    <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">Collaborative Story</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          ✕
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-slate-300">
        <div className="flex items-center gap-1">
          <Users size={16} />
          <span>{session.participants.length} writers</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={16} />
          <span>Turn {session.current_turn + 1}</span>
        </div>
        {!user?.isPremium && (
          <span className="text-amber-400 bg-amber-500/10 px-2 py-1 rounded text-xs">
            1/day limit
          </span>
        )}
      </div>

      <div className="bg-slate-900 rounded-lg p-4 mb-4 min-h-[200px]">
        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{storyText}</p>
      </div>

      {isMyTurn ? (
        <div className="space-y-3">
          <textarea
            value={currentPart}
            onChange={(e) => setCurrentPart(e.target.value)}
            placeholder="Continue the story..."
            className="w-full h-24 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            maxLength={200}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{currentPart.length}/200</span>
            <button
              onClick={submitPart}
              disabled={!currentPart.trim() || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send size={16} />
                  Add to Story
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-slate-300">Waiting for the next writer to continue...</p>
        </div>
      )}
    </div>
  )
}