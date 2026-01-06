import { supabase } from './supabase'
import type { User } from '@/types/user'

export function bearerFromAuthHeader(header?: string | null): string | null {
  if (!header) return null
  const [scheme, value] = header.split(' ')
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !value) return null
  return value.trim()
}

export async function registerUser(email: string, password: string): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export async function signInUser(email: string, password: string): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  return {
    id: data.user_id,
    isAnonymous: false, // registered users
    isPremium: data.plan === 'premium' || (data.premium_until && new Date(data.premium_until) > new Date()),
    premiumUntil: data.premium_until ? new Date(data.premium_until) : undefined,
    karma: data.reputation || 0,
    achievements: data.achievements || [],
    plan: data.plan,
    display_name: data.display_name
  }
}

export async function createUserProfile(userId: string, email: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('profiles')
    .insert({
      user_id: userId,
      display_name: email.split('@')[0], // simple default
      plan: 'free',
      reputation: 0,
      interests: [],
      achievements: []
    })

  if (error) throw error
}

export async function updateUserPremium(userId: string, isPremium: boolean, premiumUntil?: Date): Promise<void> {
  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      plan: isPremium ? 'premium' : 'free',
      premium_until: premiumUntil?.toISOString()
    })
    .eq('user_id', userId)

  if (error) throw error
}
