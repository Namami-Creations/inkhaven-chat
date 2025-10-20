// Freedom-First Moderation System for Anonymous Users
// Light-touch moderation that preserves freedom while preventing extreme abuse

export interface ModerationResult {
  isAllowed: boolean
  confidence: number
  reasons: string[]
  category: 'safe' | 'borderline' | 'concerning' | 'dangerous'
  freedomScore: number // 0-1 scale measuring conversation quality
  behavioralFlags: string[]
  shadowBanRecommended: boolean
  temporaryRestriction?: {
    duration: number // minutes
    reason: string
  }
}

export interface UserBehaviorProfile {
  userId: string
  sessionCount: number
  averageMessageLength: number
  conversationQuality: number
  behavioralScore: number // -1 to 1 scale
  lastActivity: number
  flags: string[]
  shadowBanned: boolean
  shadowBanExpires?: number
}

export class FreedomFirstModerator {
  private static instance: FreedomFirstModerator
  private behaviorProfiles: Map<string, UserBehaviorProfile> = new Map()

  // EXTREME CONTENT ONLY - Freedom-first approach
  private static readonly EXTREME_KEYWORDS = new Set([
    'child', 'children', 'kid', 'kids', 'minor', 'minors',
    'bomb', 'explosive', 'weapon', 'kill', 'murder', 'suicide',
    'rape', 'sexual assault', 'child abuse',
    'nazi', 'hitler', 'terrorism', 'isis', 'taliban'
  ])

  // BORDERLINE CONTENT - Allow but monitor
  private static readonly BORDERLINE_PATTERNS = [
    /threat/i,
    /harm/i,
    /violence/i,
    /drugs/i,
    /illegal/i
  ]

  private constructor() {
    this.startBehaviorCleanup()
  }

  static getInstance(): FreedomFirstModerator {
    if (!FreedomFirstModerator.instance) {
      FreedomFirstModerator.instance = new FreedomFirstModerator()
    }
    return FreedomFirstModerator.instance
  }

  async moderateAnonymousContent(
    content: string,
    userId: string,
    context?: {
      conversationHistory?: string[]
      roomType?: string
      messageCount?: number
    }
  ): Promise<ModerationResult> {
    const profile = this.getOrCreateProfile(userId)

    // Update behavioral profile
    this.updateBehaviorProfile(userId, content, context)

    let isAllowed = true
    let confidence = 0.9
    let reasons: string[] = []
    let category: ModerationResult['category'] = 'safe'
    let behavioralFlags: string[] = []
    let shadowBanRecommended = false

    // LIGHT MODERATION - Only extreme content blocked
    const lowerContent = content.toLowerCase()

    // Check for extreme keywords
    const foundExtremeKeywords = Array.from(FreedomFirstModerator.EXTREME_KEYWORDS)
      .filter(keyword => lowerContent.includes(keyword))

    if (foundExtremeKeywords.length > 0) {
      isAllowed = false
      confidence = 0.95
      reasons.push(`Extreme content detected: ${foundExtremeKeywords.join(', ')}`)
      category = 'dangerous'
    }

    // Check for borderline patterns (allow but flag)
    const foundBorderlinePatterns = FreedomFirstModerator.BORDERLINE_PATTERNS
      .filter(pattern => pattern.test(content))

    if (foundBorderlinePatterns.length > 0) {
      reasons.push('Borderline content detected - allowed but monitored')
      category = 'borderline'
      behavioralFlags.push('borderline_content')
    }

    // Behavioral analysis (non-intrusive)
    const behavioralAnalysis = this.analyzeBehavior(profile, content, context)
    behavioralFlags.push(...behavioralAnalysis.flags)

    if (behavioralAnalysis.shadowBanRecommended) {
      shadowBanRecommended = true
      category = 'concerning'
    }

    // Calculate freedom score (higher = better conversation quality)
    const freedomScore = this.calculateFreedomScore(content, profile, behavioralAnalysis)

    // Temporary restrictions for concerning behavior
    let temporaryRestriction
    if (shadowBanRecommended && profile.behavioralScore < -0.5) {
      temporaryRestriction = {
        duration: 15, // 15 minutes
        reason: 'Concerning behavioral patterns detected'
      }
    }

    return {
      isAllowed,
      confidence,
      reasons,
      category,
      freedomScore,
      behavioralFlags,
      shadowBanRecommended,
      temporaryRestriction
    }
  }

  private analyzeBehavior(
    profile: UserBehaviorProfile,
    content: string,
    context?: any
  ): { flags: string[]; shadowBanRecommended: boolean } {
    const flags: string[] = []
    let shadowBanRecommended = false

    // Message frequency analysis
    const recentActivity = Date.now() - profile.lastActivity
    if (recentActivity < 1000) { // Messages less than 1 second apart
      flags.push('rapid_messaging')
      if (profile.sessionCount > 10) {
        shadowBanRecommended = true
      }
    }

    // Message length analysis
    if (content.length < 5) {
      flags.push('too_short')
    } else if (content.length > 1000) {
      flags.push('too_long')
    }

    // Conversation quality analysis
    if (context?.conversationHistory) {
      const quality = this.analyzeConversationQuality(context.conversationHistory)
      if (quality < 0.3) {
        flags.push('low_quality_conversation')
      }
    }

    // Pattern detection (spam, harassment networks)
    if (this.detectSpamPatterns(content, profile)) {
      flags.push('spam_pattern')
      shadowBanRecommended = true
    }

    return { flags, shadowBanRecommended }
  }

  private detectSpamPatterns(content: string, profile: UserBehaviorProfile): boolean {
    // Simple spam detection
    const spamIndicators = [
      content.includes('http'), // Links
      content.length > 500, // Very long messages
      /(.)\1{4,}/.test(content), // Character repetition
      profile.sessionCount > 50 // Too many messages in session
    ]

    return spamIndicators.filter(Boolean).length >= 2
  }

  private analyzeConversationQuality(history: string[]): number {
    if (history.length < 2) return 0.5

    let quality = 0.5

    // Check for engagement (responses to previous messages)
    const hasResponses = history.some((msg, i) =>
      i > 0 && this.isResponse(history[i-1], msg)
    )
    if (hasResponses) quality += 0.2

    // Check for meaningful content
    const meaningfulMessages = history.filter(msg =>
      msg.length > 20 && !this.isGibberish(msg)
    ).length
    quality += (meaningfulMessages / history.length) * 0.3

    return Math.min(1, quality)
  }

  private isResponse(previous: string, current: string): boolean {
    // Simple response detection
    const prevWords = previous.toLowerCase().split(' ')
    const currWords = current.toLowerCase().split(' ')

    // Check if current message references previous topics
    const commonWords = prevWords.filter(word =>
      word.length > 3 && currWords.includes(word)
    )

    return commonWords.length >= 2
  }

  private isGibberish(text: string): boolean {
    // Simple gibberish detection
    const vowels = text.match(/[aeiou]/gi)?.length || 0
    const consonants = text.match(/[bcdfghjklmnpqrstvwxyz]/gi)?.length || 0
    const ratio = vowels / (consonants || 1)

    return ratio < 0.1 || ratio > 3 // Unnatural vowel/consonant ratio
  }

  private calculateFreedomScore(
    content: string,
    profile: UserBehaviorProfile,
    behavioralAnalysis: any
  ): number {
    let score = 0.8 // Start with high freedom score

    // Content quality factors
    if (content.length > 50) score += 0.1 // Substantial content
    if (content.includes('?')) score += 0.05 // Asking questions
    if (!this.isGibberish(content)) score += 0.05 // Coherent content

    // Behavioral factors
    score += profile.behavioralScore * 0.1 // Historical behavior
    if (behavioralAnalysis.flags.length === 0) score += 0.1 // No flags

    // Conversation quality
    score += profile.conversationQuality * 0.2

    return Math.max(0, Math.min(1, score))
  }

  private getOrCreateProfile(userId: string): UserBehaviorProfile {
    if (!this.behaviorProfiles.has(userId)) {
      this.behaviorProfiles.set(userId, {
        userId,
        sessionCount: 0,
        averageMessageLength: 0,
        conversationQuality: 0.5,
        behavioralScore: 0,
        lastActivity: Date.now(),
        flags: [],
        shadowBanned: false
      })
    }

    return this.behaviorProfiles.get(userId)!
  }

  private updateBehaviorProfile(
    userId: string,
    content: string,
    context?: any
  ): void {
    const profile = this.behaviorProfiles.get(userId)!
    const messageCount = profile.sessionCount + 1

    // Update averages
    profile.averageMessageLength =
      (profile.averageMessageLength * profile.sessionCount + content.length) / messageCount

    profile.sessionCount = messageCount
    profile.lastActivity = Date.now()

    // Update behavioral score based on content quality
    const qualityDelta = this.getContentQualityDelta(content)
    profile.behavioralScore = Math.max(-1, Math.min(1,
      profile.behavioralScore + qualityDelta * 0.1
    ))

    // Update conversation quality if we have context
    if (context?.conversationHistory) {
      profile.conversationQuality = this.analyzeConversationQuality(context.conversationHistory)
    }
  }

  private getContentQualityDelta(content: string): number {
    let delta = 0

    // Positive factors
    if (content.includes('?')) delta += 0.1 // Questions
    if (content.length > 20) delta += 0.1 // Substantial
    if (/[.!?]$/.test(content.trim())) delta += 0.05 // Proper punctuation

    // Negative factors
    if (content.length < 5) delta -= 0.2 // Too short
    if (this.isGibberish(content)) delta -= 0.3 // Gibberish
    if (FreedomFirstModerator.EXTREME_KEYWORDS.has(content.toLowerCase())) delta -= 0.5 // Extreme content

    return delta
  }

  private startBehaviorCleanup(): void {
    // Clean up old profiles every hour
    setInterval(() => {
      const now = Date.now()
      const oneHour = 60 * 60 * 1000

      for (const [userId, profile] of this.behaviorProfiles) {
        if (now - profile.lastActivity > oneHour) {
          // Reset shadow bans after 1 hour of inactivity
          if (profile.shadowBanned && (!profile.shadowBanExpires || now > profile.shadowBanExpires)) {
            profile.shadowBanned = false
            profile.shadowBanExpires = undefined
            profile.behavioralScore = Math.max(-0.5, profile.behavioralScore) // Partial reset
          }
        }

        // Remove very old profiles (24 hours inactive)
        if (now - profile.lastActivity > 24 * oneHour) {
          this.behaviorProfiles.delete(userId)
        }
      }
    }, 60 * 60 * 1000) // Every hour
  }

  // Public API methods
  applyShadowBan(userId: string, duration: number): void {
    const profile = this.getOrCreateProfile(userId)
    profile.shadowBanned = true
    profile.shadowBanExpires = Date.now() + (duration * 60 * 1000)
  }

  isShadowBanned(userId: string): boolean {
    const profile = this.behaviorProfiles.get(userId)
    if (!profile?.shadowBanned) return false

    if (profile.shadowBanExpires && Date.now() > profile.shadowBanExpires) {
      profile.shadowBanned = false
      profile.shadowBanExpires = undefined
      return false
    }

    return true
  }

  getUserProfile(userId: string): UserBehaviorProfile | null {
    return this.behaviorProfiles.get(userId) || null
  }

  getFreedomStats(): {
    totalProfiles: number
    activeShadowBans: number
    averageFreedomScore: number
  } {
    const profiles = Array.from(this.behaviorProfiles.values())
    const activeShadowBans = profiles.filter(p => p.shadowBanned).length
    const averageFreedomScore = profiles.length > 0
      ? profiles.reduce((sum, p) => sum + p.conversationQuality, 0) / profiles.length
      : 0

    return {
      totalProfiles: profiles.length,
      activeShadowBans,
      averageFreedomScore
    }
  }
}
