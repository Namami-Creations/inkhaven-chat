// Strict Moderation System for Registered Users
// Comprehensive protection with progressive enforcement and appeal system

export interface StrictModerationResult {
  isAllowed: boolean
  confidence: number
  reasons: string[]
  category: 'safe' | 'warning' | 'violation' | 'severe'
  enforcement: {
    action: 'allow' | 'warn' | 'restrict' | 'ban'
    duration?: number // minutes for temporary actions
    appealable: boolean
  }
  metadata: {
    contentAnalysis: any
    behavioralContext: any
    communityImpact: number // 0-1 scale
  }
}

export interface UserModerationProfile {
  userId: string
  trustScore: number // 0-1 scale
  violationHistory: Array<{
    timestamp: number
    category: string
    severity: number
    action: string
    appealed: boolean
    appealResult?: 'upheld' | 'overturned'
  }>
  currentRestrictions: Array<{
    type: 'warning' | 'mute' | 'ban'
    expires: number
    reason: string
  }>
  behavioralMetrics: {
    messageQuality: number
    communityEngagement: number
    reportingAccuracy: number
    conflictResolution: number
  }
}

export interface ModerationAppeal {
  appealId: string
  userId: string
  violationId: string
  appealText: string
  submittedAt: number
  status: 'pending' | 'under_review' | 'approved' | 'denied'
  reviewedBy?: string
  reviewedAt?: number
  decisionReason?: string
}

export class StrictModerator {
  private static instance: StrictModerator
  private userProfiles: Map<string, UserModerationProfile> = new Map()
  private appeals: Map<string, ModerationAppeal> = new Map()

  // Comprehensive content rules for registered users
  private static readonly CONTENT_RULES = {
    prohibited: {
      hate: [
        /racist|racism/i,
        /sexist|sexism/i,
        /homophobic|homophobia/i,
        /transphobic|transphobia/i,
        /xenophobic|xenophobia/i
      ],
      harassment: [
        /threat|threaten/i,
        /harass|harassment/i,
        /stalk|stalking/i,
        /dox|doxing/i
      ],
      violence: [
        /violence|violent/i,
        /harm|hurt/i,
        /kill|murder/i,
        /suicide|self-harm/i
      ],
      illegal: [
        /drugs?|narcotics/i,
        /illegal/i,
        /exploit|exploitation/i
      ]
    },
    restricted: {
      spam: [
        /http|https|www\./i, // Links without permission
        /(.)\1{5,}/, // Character repetition
        /caps lock|shouting/i
      ],
      inappropriate: [
        /nsfw|adult/i,
        /sexual|sex/i,
        /graphic|explicit/i
      ]
    }
  }

  private constructor() {
    this.startMaintenanceTasks()
  }

  static getInstance(): StrictModerator {
    if (!StrictModerator.instance) {
      StrictModerator.instance = new StrictModerator()
    }
    return StrictModerator.instance
  }

  async moderateRegisteredContent(
    content: string,
    userId: string,
    context: {
      roomId?: string
      messageHistory?: Array<{ content: string; timestamp: number }>
      reportedCount?: number
      roomRules?: any
    }
  ): Promise<StrictModerationResult> {
    const profile = this.getOrCreateProfile(userId)

    // Check current restrictions
    const activeRestriction = this.getActiveRestriction(profile)
    if (activeRestriction) {
      return {
        isAllowed: false,
        confidence: 0.95,
        reasons: [`Active ${activeRestriction.type}: ${activeRestriction.reason}`],
        category: 'severe',
        enforcement: {
          action: activeRestriction.type === 'ban' ? 'ban' : 'restrict',
          duration: Math.ceil((activeRestriction.expires - Date.now()) / (60 * 1000)),
          appealable: true
        },
        metadata: {
          contentAnalysis: { restricted: true },
          behavioralContext: { restriction: activeRestriction },
          communityImpact: 0.8
        }
      }
    }

    // Multi-layer content analysis
    const contentAnalysis = await this.analyzeContent(content, context)
    const behavioralAnalysis = this.analyzeBehavior(profile, content, context)
    const communityAnalysis = await this.analyzeCommunityImpact(content, context)

    // Determine enforcement action
    const enforcement = this.determineEnforcement(
      contentAnalysis,
      behavioralAnalysis,
      communityAnalysis,
      profile
    )

    // Update user profile
    this.updateProfile(profile, contentAnalysis, enforcement)

    const result: StrictModerationResult = {
      isAllowed: enforcement.action === 'allow',
      confidence: Math.max(contentAnalysis.confidence, behavioralAnalysis.confidence),
      reasons: [
        ...contentAnalysis.reasons,
        ...behavioralAnalysis.reasons,
        ...communityAnalysis.reasons
      ],
      category: contentAnalysis.category,
      enforcement,
      metadata: {
        contentAnalysis,
        behavioralContext: behavioralAnalysis,
        communityImpact: communityAnalysis.impact
      }
    }

    return result
  }

  private async analyzeContent(
    content: string,
    context: any
  ): Promise<{
    category: StrictModerationResult['category']
    confidence: number
    reasons: string[]
    violations: string[]
  }> {
    const violations: string[] = []
    const reasons: string[] = []
    let category: StrictModerationResult['category'] = 'safe'
    let confidence = 0.8

    // Check prohibited content
    for (const [type, patterns] of Object.entries(StrictModerator.CONTENT_RULES.prohibited)) {
      for (const pattern of patterns as RegExp[]) {
        if (pattern.test(content)) {
          violations.push(`${type}_prohibited`)
          reasons.push(`Prohibited ${type} content detected`)
          category = 'severe'
          confidence = 0.95
        }
      }
    }

    // Check restricted content
    if (category === 'safe') {
      for (const [type, patterns] of Object.entries(StrictModerator.CONTENT_RULES.restricted)) {
        for (const pattern of patterns as RegExp[]) {
          if (pattern.test(content)) {
            violations.push(`${type}_restricted`)
            reasons.push(`Restricted ${type} content detected`)
            category = 'violation'
            confidence = 0.85
          }
        }
      }
    }

    // Context-aware analysis
    if (context.roomRules) {
      const ruleViolations = this.checkRoomRules(content, context.roomRules)
      violations.push(...ruleViolations.violations)
      reasons.push(...ruleViolations.reasons)
      if (ruleViolations.category !== 'safe') {
        category = ruleViolations.category
      }
    }

    // AI-powered analysis (would integrate with orchestrator)
    const aiAnalysis = await this.performAIAnalysis(content, context)

    return {
      category,
      confidence: Math.max(confidence, aiAnalysis.confidence),
      reasons: [...reasons, ...aiAnalysis.reasons],
      violations
    }
  }

  private checkRoomRules(
    content: string,
    roomRules: any
  ): { violations: string[]; reasons: string[]; category: StrictModerationResult['category'] } {
    const violations: string[] = []
    const reasons: string[] = []
    let category: StrictModerationResult['category'] = 'safe'

    // Example room rule checks
    if (roomRules.noSpam && content.length > 500) {
      violations.push('room_spam')
      reasons.push('Message too long for room rules')
      category = 'violation'
    }

    if (roomRules.familyFriendly && /nsfw|adult/i.test(content)) {
      violations.push('room_inappropriate')
      reasons.push('Inappropriate content for family-friendly room')
      category = 'severe'
    }

    return { violations, reasons, category }
  }

  private async performAIAnalysis(
    content: string,
    context: any
  ): Promise<{ confidence: number; reasons: string[] }> {
    // This would integrate with the AI Orchestrator
    // For now, return basic analysis
    return {
      confidence: 0.7,
      reasons: []
    }
  }

  private analyzeBehavior(
    profile: UserModerationProfile,
    content: string,
    context: any
  ): { confidence: number; reasons: string[]; patterns: string[] } {
    const reasons: string[] = []
    const patterns: string[] = []
    let confidence = 0.75

    // Check violation history
    const recentViolations = profile.violationHistory.filter(
      v => Date.now() - v.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    )

    if (recentViolations.length > 0) {
      reasons.push(`Recent violations: ${recentViolations.length}`)
      confidence += 0.1
    }

    // Check trust score
    if (profile.trustScore < 0.5) {
      reasons.push('Low trust score')
      patterns.push('low_trust')
    }

    // Behavioral pattern detection
    if (context.messageHistory) {
      const patternsFound = this.detectBehavioralPatterns(context.messageHistory)
      patterns.push(...patternsFound)
      if (patternsFound.length > 0) {
        reasons.push(`Behavioral patterns: ${patternsFound.join(', ')}`)
      }
    }

    return { confidence, reasons, patterns }
  }

  private detectBehavioralPatterns(history: Array<{ content: string; timestamp: number }>): string[] {
    const patterns: string[] = []

    // Rapid messaging
    const recentMessages = history.filter(
      m => Date.now() - m.timestamp < 60 * 1000 // Last minute
    )
    if (recentMessages.length > 5) {
      patterns.push('rapid_messaging')
    }

    // Repetitive content
    const uniqueContent = new Set(history.slice(-10).map(m => m.content))
    if (uniqueContent.size < 3) {
      patterns.push('repetitive_content')
    }

    return patterns
  }

  private async analyzeCommunityImpact(
    content: string,
    context: any
  ): Promise<{ impact: number; reasons: string[] }> {
    let impact = 0.3 // Base impact
    const reasons: string[] = []

    // Consider room size and activity
    if (context.roomId) {
      // Higher impact in larger rooms
      impact += 0.2
      reasons.push('Community room context')
    }

    // Consider reporting history
    if (context.reportedCount && context.reportedCount > 0) {
      impact += context.reportedCount * 0.1
      reasons.push(`Previous reports: ${context.reportedCount}`)
    }

    return { impact: Math.min(1, impact), reasons }
  }

  private determineEnforcement(
    contentAnalysis: any,
    behavioralAnalysis: any,
    communityAnalysis: any,
    profile: UserModerationProfile
  ): StrictModerationResult['enforcement'] {
    // Progressive enforcement based on severity and history
    const severityScore =
      (contentAnalysis.category === 'severe' ? 3 :
       contentAnalysis.category === 'violation' ? 2 :
       contentAnalysis.category === 'warning' ? 1 : 0) +
      behavioralAnalysis.patterns.length * 0.5 +
      communityAnalysis.impact

    // Consider user's history
    const recentViolations = profile.violationHistory.filter(
      v => Date.now() - v.timestamp < 7 * 24 * 60 * 60 * 1000 // Last week
    ).length

    const baseThresholds = {
      warn: 1,
      restrict: 2,
      ban: 3
    }

    // Adjust thresholds based on trust score
    const adjustedThresholds = {
      warn: baseThresholds.warn + (1 - profile.trustScore),
      restrict: baseThresholds.restrict + (1 - profile.trustScore),
      ban: baseThresholds.ban + (1 - profile.trustScore) + recentViolations * 0.5
    }

    if (severityScore >= adjustedThresholds.ban) {
      return {
        action: 'ban',
        duration: recentViolations > 2 ? undefined : 60 * 24, // Permanent or 24 hours
        appealable: true
      }
    } else if (severityScore >= adjustedThresholds.restrict) {
      return {
        action: 'restrict',
        duration: 60, // 1 hour
        appealable: true
      }
    } else if (severityScore >= adjustedThresholds.warn) {
      return {
        action: 'warn',
        appealable: false
      }
    }

    return {
      action: 'allow',
      appealable: false
    }
  }

  private updateProfile(
    profile: UserModerationProfile,
    contentAnalysis: any,
    enforcement: any
  ): void {
    // Update trust score
    if (enforcement.action === 'allow') {
      profile.trustScore = Math.min(1, profile.trustScore + 0.01)
    } else {
      profile.trustScore = Math.max(0, profile.trustScore - 0.1)
    }

    // Record violations
    if (enforcement.action !== 'allow') {
      profile.violationHistory.push({
        timestamp: Date.now(),
        category: contentAnalysis.category,
        severity: enforcement.action === 'ban' ? 3 : enforcement.action === 'restrict' ? 2 : 1,
        action: enforcement.action,
        appealed: false
      })
    }

    // Update current restrictions
    if (enforcement.action === 'restrict' || enforcement.action === 'ban') {
      profile.currentRestrictions.push({
        type: enforcement.action,
        expires: Date.now() + ((enforcement.duration || 60) * 60 * 1000),
        reason: contentAnalysis.reasons.join('; ')
      })
    }
  }

  private getActiveRestriction(profile: UserModerationProfile): any {
    const now = Date.now()
    return profile.currentRestrictions.find(r => r.expires > now)
  }

  private getOrCreateProfile(userId: string): UserModerationProfile {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        userId,
        trustScore: 0.8, // Start with neutral trust
        violationHistory: [],
        currentRestrictions: [],
        behavioralMetrics: {
          messageQuality: 0.5,
          communityEngagement: 0.5,
          reportingAccuracy: 0.5,
          conflictResolution: 0.5
        }
      })
    }

    return this.userProfiles.get(userId)!
  }

  private startMaintenanceTasks(): void {
    // Clean up expired restrictions every hour
    setInterval(() => {
      const now = Date.now()
      for (const profile of this.userProfiles.values()) {
        profile.currentRestrictions = profile.currentRestrictions.filter(
          r => r.expires > now
        )
      }
    }, 60 * 60 * 1000)

    // Archive old violation history (older than 90 days)
    setInterval(() => {
      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
      for (const profile of this.userProfiles.values()) {
        profile.violationHistory = profile.violationHistory.filter(
          v => v.timestamp > ninetyDaysAgo
        )
      }
    }, 24 * 60 * 60 * 1000) // Daily
  }

  // Public API methods
  submitAppeal(
    userId: string,
    violationId: string,
    appealText: string
  ): string {
    const appealId = `appeal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    this.appeals.set(appealId, {
      appealId,
      userId,
      violationId,
      appealText,
      submittedAt: Date.now(),
      status: 'pending'
    })

    return appealId
  }

  async reviewAppeal(
    appealId: string,
    reviewerId: string,
    decision: 'approved' | 'denied',
    reason: string
  ): Promise<boolean> {
    const appeal = this.appeals.get(appealId)
    if (!appeal || appeal.status !== 'pending') {
      return false
    }

    appeal.status = decision === 'approved' ? 'approved' : 'denied'
    appeal.reviewedBy = reviewerId
    appeal.reviewedAt = Date.now()
    appeal.decisionReason = reason

    // Update user profile if approved
    if (decision === 'approved') {
      const profile = this.userProfiles.get(appeal.userId)
      if (profile) {
        // Remove the restriction
        profile.currentRestrictions = profile.currentRestrictions.filter(
          r => r.reason !== appeal.violationId // Simplified matching
        )
        // Restore some trust
        profile.trustScore = Math.min(1, profile.trustScore + 0.1)
      }
    }

    return true
  }

  getModerationStats(): {
    totalProfiles: number
    activeRestrictions: number
    pendingAppeals: number
    averageTrustScore: number
  } {
    const profiles = Array.from(this.userProfiles.values())
    const activeRestrictions = profiles.reduce(
      (sum, p) => sum + p.currentRestrictions.length, 0
    )
    const pendingAppeals = Array.from(this.appeals.values()).filter(
      a => a.status === 'pending'
    ).length
    const averageTrustScore = profiles.length > 0
      ? profiles.reduce((sum, p) => sum + p.trustScore, 0) / profiles.length
      : 0

    return {
      totalProfiles: profiles.length,
      activeRestrictions,
      pendingAppeals,
      averageTrustScore
    }
  }
}
