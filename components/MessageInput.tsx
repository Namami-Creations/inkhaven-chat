'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { PaperAirplaneIcon, UserPlusIcon } from '@heroicons/react/24/outline'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  onReport: () => void
  onBlock: () => void
  onRegister: () => void
  disabled?: boolean
}

export default function MessageInput({
  onSendMessage,
  onReport,
  onBlock,
  onRegister,
  disabled = false
}: MessageInputProps) {
  const [message, setMessage] = useState('')

  const handleSendMessage = () => {
    if (!message.trim() || disabled) return

    onSendMessage(message.trim())
    setMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    {/* Input Area */}
    <div className="bg-white/10 backdrop-blur-sm border-t border-white/20 p-4">
      <div className="flex gap-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 bg-white/5 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
          rows={1}
          disabled={disabled}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSendMessage}
          disabled={!message.trim() || disabled}
          aria-label="Send message"
          className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-2xl transition-colors"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4 mt-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReport}
          className="text-red-400 hover:text-red-300 text-sm font-medium"
        >
          Report
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBlock}
          className="text-orange-400 hover:text-orange-300 text-sm font-medium"
        >
          Block
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRegister}
          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-1"
        >
          <UserPlusIcon className="w-4 h-4" />
          Register
        </motion.button>
      </div>
    </div>
  )
}
