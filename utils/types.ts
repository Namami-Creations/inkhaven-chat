// Core Types for Ultimate Anonymous Chat Platform

export interface MatchPreferences {
  interests: string[]
  language: string
  timezone: string
  chatStyle: 'casual' | 'deep' | 'funny'
  topics: string[]
}

export interface ChatSession {
  id: string
  users: string[]              // Anonymous IDs
  messages: Message[]
  interests: string[]          // AI-matched topics
  qualityScore: number         // AI-calculated engagement
  startedAt: Date
  endedAt?: Date
}

export interface Message {
  id: string
  sessionId: string | null  // Can be null for room messages
  roomId?: string | null    // For room-based messages
  userId: string
  content: string
  messageType: 'text' | 'image' | 'file' | 'voice' | 'giphy'
  fileUrl?: string | null
  giphyData?: any
  reactions?: any
  isModerated: boolean
  moderationReason?: string | null
  aiEnhanced?: boolean
  createdAt: Date
}

export interface ChatRoom {
  id: string
  name: string
  description: string
  category: string
  isAiGenerated: boolean
  participantCount: number
  maxParticipants: number
  interests: string[]
  moderationRules: Record<string, any>
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  anonymousId?: string
  email?: string
  displayName?: string
  avatarUrl?: string
  preferences: MatchPreferences
  isRegistered: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Interest {
  id: string
  name: string
  category: string
  popularityScore: number
  createdAt: Date
}

// Chat Themes
export const CHAT_THEMES = {
  // Colorful Backgrounds
  cosmic: 'gradient-space animated-stars',
  forest: 'animated-nature woodland-bg',
  neon: 'cyberpunk-grid glowing-borders',
  ocean: 'wave-animation underwater',
  gradient: 'dynamic-gradient shifting-colors',

  // Playful Themes
  bubble: 'floating-bubbles rounded-corners',
  glass: 'glass-morphism blur-effects',
  retro: 'pixel-art 8bit-style',
  modern: 'minimal-clean sharp-edges'
} as const

export type ChatTheme = keyof typeof CHAT_THEMES

// Registration Benefits
export const REGISTRATION_BENEFITS = {
  savePartners: 'Bookmark interesting anonymous users',
  continueChats: 'Resume conversations with consent',
  createRooms: 'Build themed discussion groups',
  fileSharing: 'Share images, files, voice notes',
  advancedThemes: 'Unlock premium chat skins',
  aiAssistant: 'Personal conversation coach',
  analytics: 'Chat insights and matching history'
} as const

// AI-Generated Room Categories
export const AI_GENERATED_ROOM_CATEGORIES = [
  'Technology Help Desk',
  'Mental Wellness Support',
  'Gaming Discussions',
  'Career Advice',
  'Book Club',
  'Travel Stories',
  'Coding Help',
  'Relationship Advice'
] as const

export type RoomCategory = typeof AI_GENERATED_ROOM_CATEGORIES[number]

// AI Moderation Layers
export const AI_MODERATION_LAYERS = {
  1: 'Real-time content filtering (keywords)',
  2: 'Context-aware sentiment analysis',
  3: 'Behavior pattern recognition',
  4: 'Image/text multimodal checking',
  5: 'Cultural sensitivity adaptation',
  6: 'Spam/bot detection algorithms',
  7: 'Continuous learning from user reports'
} as const

// Free Tier Optimization
export const FREE_TIER_LIMITS = {
  supabase: {
    maxUsers: '50,000 monthly active',
    storage: '500MB free',
    bandwidth: '5GB/month'
  },
  aiServices: {
    openai: '5M tokens/month free',
    gemini: '1M tokens/month free',
    huggingface: 'Unlimited community models'
  }
}
