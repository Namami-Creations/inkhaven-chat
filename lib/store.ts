'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { persist, createJSONStorage } from 'zustand/middleware'

// Types for global state
export interface User {
  id: string
  anonymousId?: string
  email?: string
  displayName?: string
  avatarUrl?: string
  isRegistered: boolean
  isVerified?: boolean
  userTier: 'anonymous' | 'registered_free' | 'premium'
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: boolean
  soundEnabled: boolean
  chatTheme: string
}

export interface ChatSession {
  id: string
  partnerId?: string
  partnerName?: string
  status: 'connecting' | 'connected' | 'disconnected'
  messages: Message[]
  startTime: Date
  endTime?: Date
}

export interface Message {
  id: string
  content: string
  senderId: string
  timestamp: Date
  type: 'text' | 'image' | 'file' | 'voice' | 'giphy'
  isRead: boolean
  reactions?: string[]
}

export interface UIState {
  isLoading: boolean
  isSidebarOpen: boolean
  activeModal: string | null
  currentView: 'chat' | 'rooms' | 'profile' | 'settings'
  toastMessage: string | null
  errorMessage: string | null
}

export interface AppState {
  // User state
  user: User | null
  isAuthenticated: boolean

  // Chat state
  currentSession: ChatSession | null
  sessions: ChatSession[]
  isTyping: boolean

  // UI state
  ui: UIState

  // Preferences
  preferences: UserPreferences

  // Actions
  setUser: (user: User | null) => void
  updateUser: (updates: Partial<User>) => void
  setAuthenticated: (isAuthenticated: boolean) => void

  setCurrentSession: (session: ChatSession | null) => void
  addSession: (session: ChatSession) => void
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void
  removeSession: (sessionId: string) => void

  addMessage: (sessionId: string, message: Message) => void
  updateMessage: (sessionId: string, messageId: string, updates: Partial<Message>) => void

  setTyping: (isTyping: boolean) => void

  // UI actions
  setLoading: (isLoading: boolean) => void
  setSidebarOpen: (isOpen: boolean) => void
  setActiveModal: (modal: string | null) => void
  setCurrentView: (view: 'chat' | 'rooms' | 'profile' | 'settings') => void
  showToast: (message: string) => void
  showError: (message: string) => void
  clearMessages: () => void

  // Preferences
  updatePreferences: (updates: Partial<UserPreferences>) => void
}

// Default preferences
const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  notifications: true,
  soundEnabled: true,
  chatTheme: 'modern'
}

// Default UI state
const defaultUIState: UIState = {
  isLoading: false,
  isSidebarOpen: false,
  activeModal: null,
  currentView: 'chat',
  toastMessage: null,
  errorMessage: null
}

// Create the store with persistence
export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        currentSession: null,
        sessions: [],
        isTyping: false,
        ui: defaultUIState,
        preferences: defaultPreferences,

        // User actions
        setUser: (user) => set({ user }),
        updateUser: (updates) => set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        })),
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

        // Session actions
        setCurrentSession: (session) => set({ currentSession: session }),
        addSession: (session) => set((state) => ({
          sessions: [...state.sessions, session]
        })),
        updateSession: (sessionId, updates) => set((state) => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId ? { ...session, ...updates } : session
          ),
          currentSession: state.currentSession?.id === sessionId
            ? { ...state.currentSession, ...updates }
            : state.currentSession
        })),
        removeSession: (sessionId) => set((state) => ({
          sessions: state.sessions.filter(session => session.id !== sessionId),
          currentSession: state.currentSession?.id === sessionId ? null : state.currentSession
        })),

        // Message actions
        addMessage: (sessionId, message) => set((state) => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, messages: [...session.messages, message] }
              : session
          ),
          currentSession: state.currentSession?.id === sessionId
            ? { ...state.currentSession, messages: [...state.currentSession.messages, message] }
            : state.currentSession
        })),
        updateMessage: (sessionId, messageId, updates) => set((state) => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: session.messages.map(msg =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                  )
                }
              : session
          ),
          currentSession: state.currentSession?.id === sessionId
            ? {
                ...state.currentSession,
                messages: state.currentSession.messages.map(msg =>
                  msg.id === messageId ? { ...msg, ...updates } : msg
                )
              }
            : state.currentSession
        })),

        setTyping: (isTyping) => set({ isTyping }),

        // UI actions
        setLoading: (isLoading) => set((state) => ({
          ui: { ...state.ui, isLoading }
        })),
        setSidebarOpen: (isOpen) => set((state) => ({
          ui: { ...state.ui, isSidebarOpen: isOpen }
        })),
        setActiveModal: (modal) => set((state) => ({
          ui: { ...state.ui, activeModal: modal }
        })),
        setCurrentView: (view) => set((state) => ({
          ui: { ...state.ui, currentView: view }
        })),
        showToast: (message) => set((state) => ({
          ui: { ...state.ui, toastMessage: message }
        })),
        showError: (message) => set((state) => ({
          ui: { ...state.ui, errorMessage: message }
        })),
        clearMessages: () => set((state) => ({
          ui: { ...state.ui, toastMessage: null, errorMessage: null }
        })),

        // Preferences actions
        updatePreferences: (updates) => set((state) => ({
          preferences: { ...state.preferences, ...updates }
        }))
      }),
      {
        name: 'inkhaven-chat-storage',
        storage: createJSONStorage(() => localStorage),
        // Only persist certain parts of the state
        partialize: (state) => ({
          user: state.user,
          preferences: state.preferences,
          sessions: state.sessions.slice(-10), // Keep last 10 sessions
          isAuthenticated: state.isAuthenticated
        }),
        // Skip hydration for certain properties
        skipHydration: true
      }
    )
  )
)

// Selectors for commonly used state
export const useUser = () => useAppStore((state) => state.user)
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated)
export const useCurrentSession = () => useAppStore((state) => state.currentSession)
export const useSessions = () => useAppStore((state) => state.sessions)
export const useUI = () => useAppStore((state) => state.ui)
export const usePreferences = () => useAppStore((state) => state.preferences)
export const useIsTyping = () => useAppStore((state) => state.isTyping)

// Actions
export const useUserActions = () => useAppStore((state) => ({
  setUser: state.setUser,
  updateUser: state.updateUser,
  setAuthenticated: state.setAuthenticated
}))

export const useSessionActions = () => useAppStore((state) => ({
  setCurrentSession: state.setCurrentSession,
  addSession: state.addSession,
  updateSession: state.updateSession,
  removeSession: state.removeSession
}))

export const useMessageActions = () => useAppStore((state) => ({
  addMessage: state.addMessage,
  updateMessage: state.updateMessage
}))

export const useUIActions = () => useAppStore((state) => ({
  setLoading: state.setLoading,
  setSidebarOpen: state.setSidebarOpen,
  setActiveModal: state.setActiveModal,
  setCurrentView: state.setCurrentView,
  showToast: state.showToast,
  showError: state.showError,
  clearMessages: state.clearMessages
}))

export const usePreferenceActions = () => useAppStore((state) => ({
  updatePreferences: state.updatePreferences
}))
