import type { User } from '@/types/user'

export type Feature =
  | 'text_chat'
  | 'voice_unlimited'
  | 'video_unlimited'
  | 'video_limited'
  | 'mood_matching'
  | 'conversation_starters'
  | 'bottle_messages'
  | 'story_mode'
  | 'whisper_mode'
  | 'themed_rooms'
  | 'ambient_themes'
  | 'collaborative_canvas'
  | 'music_sync'
  | 'time_capsule'
  | 'karma_full'
  | 'achievements_full'

export function canAccessFeature(user: User | null, feature: Feature): boolean {
  if (!user) {
    // Anonymous user rules
    return ['text_chat', 'voice_unlimited', 'video_limited'].includes(feature)
  }

  if (user.isPremium) {
    return true // Full access
  }

  // Freemium rules (70% access)
  const freemiumLimits: Record<Feature, boolean> = {
    text_chat: true,
    voice_unlimited: true,
    video_unlimited: false,
    video_limited: true,
    mood_matching: true,
    conversation_starters: true, // will be limited by count
    bottle_messages: true, // limited by count
    story_mode: true, // limited
    whisper_mode: true, // limited
    themed_rooms: true, // limited count
    ambient_themes: true, // limited
    collaborative_canvas: false,
    music_sync: false,
    time_capsule: false,
    karma_full: false,
    achievements_full: false
  }

  return freemiumLimits[feature] || false
}

export async function checkUsageLimit(userId: string, feature: string, limit: number): Promise<boolean> {
  // This will be implemented with database checks
  // For now, return true (allow) - implement in next phase
  return true
}

export function getFeatureLimit(feature: Feature): number | null {
  const limits: Partial<Record<Feature, number>> = {
    conversation_starters: 5,
    bottle_messages: 1,
    story_mode: 1,
    whisper_mode: 3,
    themed_rooms: 3,
    ambient_themes: 1
  }
  return limits[feature] || null
}