'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import { User, UserPreferences } from '@/lib/store'

interface SupabaseContextType {
  user: SupabaseUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  const { setUser: setStoreUser, setAuthenticated, updateUser } = useAppStore()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        const supabaseUser = session?.user ?? null
        setUser(supabaseUser)

        if (supabaseUser) {
          // Fetch user profile from database
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', supabaseUser.id)
            .single()

          if (profileError) {
            console.error('Error fetching user profile:', profileError)
            // Create a basic user object if profile doesn't exist
            const basicUser: User = {
              id: supabaseUser.id,
              email: supabaseUser.email,
              anonymousId: supabaseUser.id,
              displayName: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0],
              avatarUrl: supabaseUser.user_metadata?.avatar_url,
              isRegistered: true,
              userTier: 'registered_free',
              preferences: {
                theme: 'system',
                language: 'en',
                notifications: true,
                soundEnabled: true,
                chatTheme: 'modern'
              }
            }
            setStoreUser(basicUser)
            setAuthenticated(true)
          } else {
            // Map database profile to store user
            const storeUser: User = {
              id: profile.id,
              anonymousId: profile.anonymous_id || undefined,
              email: profile.email || undefined,
              displayName: profile.display_name || undefined,
              avatarUrl: undefined, // avatar_data is complex, we'll handle this separately
              isRegistered: profile.is_registered,
              isVerified: profile.is_verified || undefined,
              userTier: profile.user_tier,
              preferences: typeof profile.preferences === 'object' && profile.preferences !== null && !Array.isArray(profile.preferences)
                ? (profile.preferences as unknown as UserPreferences)
                : {
                    theme: 'system',
                    language: 'en',
                    notifications: true,
                    soundEnabled: true,
                    chatTheme: 'modern'
                  }
            }
            setStoreUser(storeUser)
            setAuthenticated(true)
          }
        } else {
          setStoreUser(null)
          setAuthenticated(false)
        }

        setLoading(false)
      } catch (error) {
        console.error('Session initialization error:', error)
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)

        const supabaseUser = session?.user ?? null
        setUser(supabaseUser)

        if (supabaseUser && event === 'SIGNED_IN') {
          // Fetch user profile when signed in
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', supabaseUser.id)
            .single()

          if (!profileError && profile) {
            const storeUser: User = {
              id: profile.id,
              anonymousId: profile.anonymous_id,
              email: profile.email,
              displayName: profile.display_name,
              avatarUrl: profile.avatar_url,
              isRegistered: profile.is_registered,
              isVerified: profile.is_verified,
              userTier: profile.user_tier,
              preferences: profile.preferences || {
                theme: 'system',
                language: 'en',
                notifications: true,
                soundEnabled: true,
                chatTheme: 'modern'
              }
            }
            setStoreUser(storeUser)
            setAuthenticated(true)
          } else {
            // Create basic user profile
            const basicUser: User = {
              id: supabaseUser.id,
              email: supabaseUser.email,
              anonymousId: supabaseUser.id,
              displayName: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0],
              avatarUrl: supabaseUser.user_metadata?.avatar_url,
              isRegistered: true,
              userTier: 'registered_free',
              preferences: {
                theme: 'system',
                language: 'en',
                notifications: true,
                soundEnabled: true,
                chatTheme: 'modern'
              }
            }
            setStoreUser(basicUser)
            setAuthenticated(true)
          }
        } else if (event === 'SIGNED_OUT') {
          setStoreUser(null)
          setAuthenticated(false)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [setStoreUser, setAuthenticated, updateUser])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setStoreUser(null)
      setAuthenticated(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error refreshing session:', error)
        return
      }

      const supabaseUser = session?.user ?? null
      setUser(supabaseUser)

      if (supabaseUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single()

        if (profile) {
          const storeUser: User = {
            id: profile.id,
            anonymousId: profile.anonymous_id,
            email: profile.email,
            displayName: profile.display_name,
            avatarUrl: profile.avatar_url,
            isRegistered: profile.is_registered,
            isVerified: profile.is_verified,
            userTier: profile.user_tier,
            preferences: profile.preferences || {
              theme: 'system',
              language: 'en',
              notifications: true,
              soundEnabled: true,
              chatTheme: 'modern'
            }
          }
          setStoreUser(storeUser)
          setAuthenticated(true)
        }
      } else {
        setStoreUser(null)
        setAuthenticated(false)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  return (
    <SupabaseContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}
