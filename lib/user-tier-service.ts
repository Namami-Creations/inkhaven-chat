import { subscriptionService } from './subscription-service'
import { supabase } from './supabase'

export type UserTier = 'anonymous' | 'registered_free' | 'premium'

export interface FeatureLimits {
  giphy_stickers: number
  ai_features: number
  group_participants: number
  file_upload_mb: number
  storage_mb: number
}

export interface FeatureAccess {
  canCreateGroups: boolean
  canJoinUnlimitedGroups: boolean
  unlimitedGiphy: boolean
  aiEntertainment: boolean
  adFree: boolean
  customThemes: boolean
  advancedAnalytics: boolean
  apiAccess: boolean
  prioritySupport: boolean
}

const TIER_LIMITS: Record<UserTier, FeatureLimits> = {
  anonymous: {
    giphy_stickers: 5,
    ai_features: 3,
    group_participants: 0, // Cannot create/join groups
    file_upload_mb: 0,
    storage_mb: 0
  },
  registered_free: {
    giphy_stickers: 20,
    ai_features: 10,
    group_participants: 100,
    file_upload_mb: 10,
    storage_mb: 100
  },
  premium: {
    giphy_stickers: -1, // Unlimited
    ai_features: -1, // Unlimited
    group_participants: -1, // Unlimited
    file_upload_mb: 100,
    storage_mb: 1000
  }
}

const TIER_FEATURES: Record<UserTier, FeatureAccess> = {
  anonymous: {
    canCreateGroups: false,
    canJoinUnlimitedGroups: false,
    unlimitedGiphy: false,
    aiEntertainment: false,
    adFree: false,
    customThemes: false,
    advancedAnalytics: false,
    apiAccess: false,
    prioritySupport: false
  },
  registered_free: {
    canCreateGroups: true,
    canJoinUnlimitedGroups: false,
    unlimitedGiphy: false,
    aiEntertainment: false,
    adFree: false,
    customThemes: false,
    advancedAnalytics: false,
    apiAccess: false,
    prioritySupport: false
  },
  premium: {
    canCreateGroups: true,
    canJoinUnlimitedGroups: true,
    unlimitedGiphy: true,
    aiEntertainment: true,
    adFree: true,
    customThemes: true,
    advancedAnalytics: true,
    apiAccess: true,
    prioritySupport: true
  }
}

export class UserTierService {
  // Get user tier
  async getUserTier(userId: string): Promise<UserTier> {
    // Check if user has active premium subscription
    const isPremium = await subscriptionService.isPremiumUser(userId)
    if (isPremium) {
      return 'premium'
    }

    // Check database for registered status
    const { data, error } = await supabase
      .from('users')
      .select('is_registered, user_tier')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return 'anonymous'
    }

    if (data.user_tier) {
      return data.user_tier
    }

    return data.is_registered ? 'registered_free' : 'anonymous'
  }

  // Get feature limits for user
  async getFeatureLimits(userId: string): Promise<FeatureLimits> {
    const tier = await this.getUserTier(userId)
    return TIER_LIMITS[tier]
  }

  // Get feature access for user
  async getFeatureAccess(userId: string): Promise<FeatureAccess> {
    const tier = await this.getUserTier(userId)
    return TIER_FEATURES[tier]
  }

  // Check if user can use a feature
  async canUseFeature(userId: string, feature: keyof FeatureAccess): Promise<boolean> {
    const access = await this.getFeatureAccess(userId)
    return access[feature]
  }

  // Check if user is within usage limits
  async checkUsageLimit(userId: string, featureType: string, requestedAmount: number = 1): Promise<boolean> {
    const limits = await this.getFeatureLimits(userId)
    const limitKey = featureType as keyof FeatureLimits

    if (!(limitKey in limits)) {
      return true // No limit defined
    }

    const limit = limits[limitKey]
    if (limit === -1) {
      return true // Unlimited
    }

    // Check current usage from database
    const { data: usage, error } = await supabase
      .from('user_usage')
      .select('usage_count, limit_count')
      .eq('user_id', userId)
      .eq('feature_type', featureType)
      .eq('reset_date', new Date().toISOString().split('T')[0])
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error checking usage:', error)
      return false
    }

    const currentUsage = usage?.usage_count || 0
    return (currentUsage + requestedAmount) <= limit
  }

  // Increment usage counter
  async incrementUsage(userId: string, featureType: string): Promise<void> {
    const limits = await this.getFeatureLimits(userId)
    const limitKey = featureType as keyof FeatureLimits
    const maxLimit = limits[limitKey] || 10

    const { error } = await supabase
      .from('user_usage')
      .upsert({
        user_id: userId,
        feature_type: featureType,
        usage_count: 1,
        limit_count: maxLimit,
        reset_date: new Date().toISOString().split('T')[0]
      }, {
        onConflict: 'user_id,feature_type,reset_date'
      })

    if (error) {
      console.error('Error incrementing usage:', error)
    }
  }

  // Check if user can join/create rooms
  async canJoinRoom(userId: string, roomId: string): Promise<{ allowed: boolean; reason?: string }> {
    const access = await this.getFeatureAccess(userId)
    const limits = await this.getFeatureLimits(userId)

    // Check if room is premium-only
    const { data: room, error } = await supabase
      .from('chat_rooms')
      .select('is_premium_only, current_participants, max_participants')
      .eq('id', roomId)
      .single()

    if (error) {
      return { allowed: false, reason: 'Room not found' }
    }

    // Premium-only room check
    if (room.is_premium_only && !access.canJoinUnlimitedGroups) {
      return { allowed: false, reason: 'This room requires a premium subscription' }
    }

    // Participant limit check
    if (limits.group_participants !== -1 && room.current_participants >= limits.group_participants) {
      return { allowed: false, reason: `Room is full (max ${limits.group_participants} participants for your tier)` }
    }

    return { allowed: true }
  }

  // Check if user can create rooms
  async canCreateRoom(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const access = await this.getFeatureAccess(userId)

    if (!access.canCreateGroups) {
      return { allowed: false, reason: 'Group creation requires registration' }
    }

    return { allowed: true }
  }

  // Upgrade user tier
  async upgradeUser(userId: string, newTier: UserTier): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        user_tier: newTier,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      throw new Error('Failed to upgrade user tier')
    }
  }

  // Award achievement/badge
  async awardAchievement(userId: string, achievementKey: string, title: string, description?: string, iconUrl?: string): Promise<void> {
    const { error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_type: 'activity_based',
        achievement_key: achievementKey,
        title,
        description,
        icon_url: iconUrl
      })

    if (error && error.code !== '23505') { // Ignore duplicate key error
      console.error('Error awarding achievement:', error)
    }
  }

  // Get user achievements
  async getUserAchievements(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })

    if (error) {
      console.error('Error fetching achievements:', error)
      return []
    }

    return data || []
  }

  // Get tier upgrade suggestions
  getUpgradeSuggestions(currentTier: UserTier): string[] {
    switch (currentTier) {
      case 'anonymous':
        return [
          'Create unlimited groups with up to 100 participants',
          'Send 20 GIPHY stickers per day',
          'Access 10 AI features daily',
          'Upload files and images',
          'Earn achievement badges'
        ]
      case 'registered_free':
        return [
          'Unlimited groups with 500+ participants',
          'Unlimited GIPHY access',
          'AI Entertainment Suite (horoscopes, personality tests)',
          'Ad-free experience',
          'Custom themes and avatars',
          'Advanced analytics',
          'Priority support'
        ]
      default:
        return []
    }
  }
}

// Export singleton instance
export const userTierService = new UserTierService()
