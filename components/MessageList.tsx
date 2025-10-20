'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Message } from '@/utils/types'

interface MessageListProps {
  messages: Message[]
  isTyping: boolean
}

export default function MessageList({ messages, isTyping }: MessageListProps) {
  return (
    {/* Messages Area */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <AnimatePresence>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`flex ${message.userId === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`chat-bubble max-w-xs lg:max-w-md ${
                message.userId === 'me'
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                  : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
              }`}
            >
              {message.content}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Typing Indicator */}
      <AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-start"
          >
            <div className="bg-white/10 backdrop-blur-sm text-white border border-white/20 chat-bubble">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div />
    </div>
  )
}
