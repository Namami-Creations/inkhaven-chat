'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/useFeatureAccess'
import { MessageSquare, Send, X } from 'lucide-react'

interface BottleMessageProps {
  onSend?: (message: string) => void
  onClose?: () => void
}

export default function BottleMessage({ onSend, onClose }: BottleMessageProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const user = useUser()

  const handleSend = async () => {
    if (!message.trim() || isSending) return

    setIsSending(true)
    try {
      const response = await fetch('/api/bottle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add auth header if needed
        },
        body: JSON.stringify({ content: message.trim() })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send')
      }

      onSend?.(message.trim())
      setMessage('')
      onClose?.()
    } catch (error) {
      console.error('Failed to send bottle message:', error)
      // TODO: Show error to user
    } finally {
      setIsSending(false)
    }
  }

  const canSend = user?.isPremium || true // TODO: Check usage limit

  return (
    <div className="bg-slate-800 rounded-lg p-4 max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Send a Bottle Message</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <p className="text-slate-300 text-sm mb-4">
        Write a message in a bottle. It might wash up on someone's shore! ✨
      </p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full h-32 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        maxLength={500}
      />

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-slate-400">{message.length}/500</span>
        <div className="flex gap-2">
          {!user?.isPremium && (
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
              1/day limit
            </span>
          )}
          <button
            onClick={handleSend}
            disabled={!message.trim() || isSending || !canSend}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Send size={16} />
                Send Bottle
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}