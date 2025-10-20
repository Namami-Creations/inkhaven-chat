'use client'

import { useState, useEffect, useRef } from 'react'
import { CHAT_THEMES, ChatTheme, Message } from '@/utils/types'
import { supabase } from '@/lib/supabase'
import { AIModerationService } from '@/lib/ai-moderation'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

interface ChatInterfaceProps {
  theme: ChatTheme
  onThemeChange: (theme: ChatTheme) => void
  onNextChat: () => void
  onReport: () => void
  onBlock: () => void
  onRegister: () => void
  sessionId?: string
  userId: string
  isOnline: boolean
}

export default function ChatInterface({
  theme,
  onThemeChange,
  onNextChat,
  onReport,
  onBlock,
  onRegister,
  sessionId,
  userId,
  isOnline
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load messages when session changes
  useEffect(() => {
    if (!sessionId || sessionId === 'demo') {
      // Demo messages for offline/testing
      const demoMessages: Message[] = [
        {
          id: '1',
          sessionId: 'demo',
          userId: 'other',
          content: 'Hey! How are you doing today?',
          messageType: 'text',
          isModerated: false,
          createdAt: new Date(Date.now() - 300000)
        },
        {
          id: '2',
          sessionId: 'demo',
          userId: 'me',
          content: 'Hi! I\'m doing great, thanks for asking. How about you?',
          messageType: 'text',
          isModerated: false,
          createdAt: new Date(Date.now() - 240000)
        }
      ]
      setMessages(demoMessages)
      return
    }

    // Load messages from database
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        sessionId: msg.session_id,
        userId: msg.user_id === userId ? 'me' : 'other',
        content: msg.content,
        messageType: msg.message_type,
        fileUrl: msg.file_url,
        isModerated: msg.is_moderated,
        moderationReason: msg.moderation_reason,
        createdAt: new Date(msg.created_at)
      }))

      setMessages(formattedMessages)
    }

    loadMessages()

    // Set up real-time subscription
    const channel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newMessage: Message = {
            id: payload.new.id,
            sessionId: payload.new.session_id,
            userId: payload.new.user_id === userId ? 'me' : 'other',
            content: payload.new.content,
            messageType: payload.new.message_type,
            fileUrl: payload.new.file_url,
            isModerated: payload.new.is_moderated,
            moderationReason: payload.new.moderation_reason,
            createdAt: new Date(payload.new.created_at)
          }

          setMessages(prev => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, userId])

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    // AI Moderation check
    try {
      const moderationResult = await AIModerationService.moderateContent(message.trim())

      if (!moderationResult.isAllowed) {
        // Use toast notification instead of alert
        console.error(`Message blocked: ${moderationResult.reasons.join(', ')}`)
        return
      }
    } catch (error) {
      console.warn('Moderation check failed, proceeding with message:', error)
    }

    // Clear input immediately for better UX
    const messageContent = message.trim()
    setNewMessage('')

    if (!sessionId || sessionId === 'demo') {
      // Demo mode - add to local state
      const messageObj: Message = {
        id: Date.now().toString(),
        sessionId: sessionId || 'demo',
        userId: 'me',
        content: messageContent,
        messageType: 'text',
        isModerated: false,
        createdAt: new Date()
      }
      setMessages(prev => [...prev, messageObj])

      // Simulate response for demo
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        const response: Message = {
          id: (Date.now() + 1).toString(),
          sessionId: sessionId || 'demo',
          userId: 'other',
          content: 'That\'s interesting! Tell me more about that.',
          messageType: 'text',
          isModerated: false,
          createdAt: new Date()
        }
        setMessages(prev => [...prev, response])
      }, 1500)
      return
    }

    // Send to database
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          content: messageContent,
          message_type: 'text',
          is_moderated: false
        })
        .select()
        .single()

      if (error) throw error

      // Message will be added via real-time subscription
      console.log('Message sent:', data)
    } catch (error) {
      console.error('Error sending message:', error)
      // Revert input on error
      setNewMessage(messageContent)
      // Use toast or proper error UI instead of alert
      console.error('Failed to send message. Please try again.')
    }
  }

  return (
    <div className={`flex flex-col h-screen ${CHAT_THEMES[theme]}`}>
      <ChatHeader
        theme={theme}
        onThemeChange={onThemeChange}
        onNextChat={onNextChat}
      />

      <MessageList
        messages={messages}
        isTyping={isTyping}
      />

      <MessageInput
        onSendMessage={handleSendMessage}
        onReport={onReport}
        onBlock={onBlock}
        onRegister={onRegister}
      />

      <div ref={messagesEndRef} />
    </div>
  )
}
