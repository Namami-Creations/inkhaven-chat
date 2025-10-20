import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { HfInference } from '@huggingface/inference'
import { AI_MODERATION_LAYERS } from '@/utils/types'

// Initialize AI services
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

export interface ModerationResult {
  isAllowed: boolean
  confidence: number
  reasons: string[]
  suggestedAction: 'allow' | 'warn' | 'block' | 'review'
  category?: string
}

export interface ContentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative'
  toxicity: number // 0-1 scale
  topics: string[]
  language: string
  intent: 'casual' | 'aggressive' | 'supportive' | 'questioning' | 'spam'
}

export class AIModerationService {
  /**
   * Multi-layer content moderation using free tier services
   */
  static async moderateContent(content: string, context?: string): Promise<ModerationResult> {
    const results = await Promise.allSettled([
      this.checkWithOpenAI(content, context),
      this.checkWithHuggingFace(content),
      this.checkWithGemini(content, context),
    ])

    // Combine results from all services
    const validResults = results
      .filter((r): r is PromiseFulfilledResult<ModerationResult> => r.status === 'fulfilled')
      .map(r => r.value)

    if (validResults.length === 0) {
      return {
        isAllowed: true,
        confidence: 0.5,
        reasons: ['Unable to analyze content'],
        suggestedAction: 'review'
      }
    }

    // Weighted voting system
    return this.combineModerationResults(validResults)
  }

  /**
   * Analyze content for deeper understanding
   */
  static async analyzeContent(content: string): Promise<ContentAnalysis> {
    try {
      const prompt = `
        Analyze this message and return JSON with:
        - sentiment: positive|neutral|negative
        - toxicity: number 0-1 (0=safe, 1=toxic)
        - topics: array of main topics
        - language: ISO language code
        - intent: casual|aggressive|supportive|questioning|spam

        Message: "${content}"
      `

      const response = await genAI.getGenerativeModel({ model: 'gemini-pro' }).generateContent(prompt)
      const result = response.response.text()

      try {
        return JSON.parse(result)
      } catch {
        return {
          sentiment: 'neutral',
          toxicity: 0.1,
          topics: [],
          language: 'en',
          intent: 'casual'
        }
      }
    } catch (error) {
      console.error('Error analyzing content:', error)
      return {
        sentiment: 'neutral',
        toxicity: 0.1,
        topics: [],
        language: 'en',
        intent: 'casual'
      }
    }
  }

  /**
   * Detect behavioral patterns across multiple messages
   */
  static async analyzeBehaviorPattern(
    userId: string,
    messages: Array<{ content: string; timestamp: Date }>
  ): Promise<{
    pattern: 'normal' | 'spam' | 'harassment' | 'troll'
    confidence: number
    flags: string[]
  }> {
    if (messages.length < 3) {
      return { pattern: 'normal', confidence: 0.5, flags: [] }
    }

    const recentMessages = messages.slice(-10) // Last 10 messages

    // Check for spam patterns
    const spamIndicators = this.detectSpamPatterns(recentMessages)

    // Check for harassment patterns
    const harassmentIndicators = await this.detectHarassmentPatterns(recentMessages)

    // Check for trolling patterns
    const trollIndicators = this.detectTrollPatterns(recentMessages)

    const allFlags = [...spamIndicators, ...harassmentIndicators, ...trollIndicators]

    if (allFlags.length === 0) {
      return { pattern: 'normal', confidence: 0.8, flags: [] }
    }

    // Determine most likely pattern
    const patternCounts = allFlags.reduce((acc, flag) => {
      const category = flag.split(':')[0]
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const dominantPattern = Object.entries(patternCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'normal'

    const confidence = Math.min(allFlags.length / 5, 1) // More flags = higher confidence

    return {
      pattern: dominantPattern as any,
      confidence,
      flags: allFlags
    }
  }

  /**
   * Generate appeal response for flagged content
   */
  static async generateAppealResponse(
    originalContent: string,
    violation: string,
    userHistory: Array<{ flagged: boolean; reason?: string }>
  ): Promise<string> {
    try {
      const historySummary = userHistory.slice(-5).map(h =>
        h.flagged ? `Flagged: ${h.reason}` : 'Clean'
      ).join(', ')

      const prompt = `
        Generate a polite but firm appeal response for content moderation.

        Original content: "${originalContent}"
        Violation: ${violation}
        Recent history: ${historySummary}

        Response should:
        - Explain the issue clearly
        - Provide guidance on improvement
        - Encourage positive behavior
        - Keep it under 150 words
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      })

      return response.choices[0]?.message?.content || 'Your content has been flagged for review. Please ensure all messages follow our community guidelines.'
    } catch (error) {
      console.error('Error generating appeal response:', error)
      return 'Your content has been flagged for review. Please ensure all messages follow our community guidelines.'
    }
  }

  /**
   * Progressive action system based on violation history
   */
  static determineProgressiveAction(
    userId: string,
    violationHistory: Array<{ timestamp: Date; severity: 'low' | 'medium' | 'high' }>,
    currentViolation: 'low' | 'medium' | 'high'
  ): 'warn' | 'temp_ban_1h' | 'temp_ban_24h' | 'perm_ban' {
    const recentViolations = violationHistory.filter(v =>
      Date.now() - v.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    )

    const severityWeights = { low: 1, medium: 2, high: 3 }
    const totalScore = recentViolations.reduce((sum, v) => sum + severityWeights[v.severity], 0) +
                      severityWeights[currentViolation]

    if (totalScore <= 2) return 'warn'
    if (totalScore <= 5) return 'temp_ban_1h'
    if (totalScore <= 10) return 'temp_ban_24h'
    return 'perm_ban'
  }

  // Private methods for individual service checks
  private static async checkWithOpenAI(content: string, context?: string): Promise<ModerationResult> {
    try {
      const response = await openai.moderations.create({
        input: content,
      })

      const result = response.results[0]
      const isAllowed = !result.flagged

      return {
        isAllowed,
        confidence: result.flagged ? 0.9 : 0.1,
        reasons: Object.entries(result.categories)
          .filter(([, flagged]) => flagged)
          .map(([category]) => category),
        suggestedAction: result.flagged ? 'block' : 'allow'
      }
    } catch (error) {
      console.error('OpenAI moderation error:', error)
      throw error
    }
  }

  private static async checkWithHuggingFace(content: string): Promise<ModerationResult> {
    try {
      const result = await hf.textClassification({
        model: 'martin-ha/toxic-comment-model',
        inputs: content,
      })

      const toxicScore = result.find(r => r.label === 'toxic')?.score || 0
      const isAllowed = toxicScore < 0.7

      return {
        isAllowed,
        confidence: toxicScore,
        reasons: toxicScore > 0.5 ? ['toxicity'] : [],
        suggestedAction: toxicScore > 0.8 ? 'block' : toxicScore > 0.5 ? 'warn' : 'allow'
      }
    } catch (error) {
      console.error('HuggingFace moderation error:', error)
      throw error
    }
  }

  private static async checkWithGemini(content: string, context?: string): Promise<ModerationResult> {
    try {
      const prompt = `
        Analyze this message for appropriateness. Consider context: ${context || 'general chat'}

        Message: "${content}"

        Return JSON: {"isAppropriate": boolean, "confidence": number, "issues": string[]}
      `

      const response = await genAI.getGenerativeModel({ model: 'gemini-pro' }).generateContent(prompt)
      const result = response.response.text()

      const parsed = JSON.parse(result)

      return {
        isAllowed: parsed.isAppropriate,
        confidence: parsed.confidence,
        reasons: parsed.issues || [],
        suggestedAction: !parsed.isAppropriate ? 'block' : 'allow'
      }
    } catch (error) {
      console.error('Gemini moderation error:', error)
      throw error
    }
  }

  private static combineModerationResults(results: ModerationResult[]): ModerationResult {
    const totalWeight = results.length
    let weightedAllowed = 0
    let totalConfidence = 0
    const allReasons: string[] = []
    const actionCounts: Record<string, number> = {}

    results.forEach(result => {
      weightedAllowed += result.isAllowed ? 1 : 0
      totalConfidence += result.confidence
      allReasons.push(...result.reasons)
      actionCounts[result.suggestedAction] = (actionCounts[result.suggestedAction] || 0) + 1
    })

    const avgAllowed = weightedAllowed / totalWeight > 0.5
    const avgConfidence = totalConfidence / totalWeight

    const mostCommonAction = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'review'

    const uniqueReasons = [...new Set(allReasons)]

    return {
      isAllowed: avgAllowed,
      confidence: avgConfidence,
      reasons: uniqueReasons,
      suggestedAction: mostCommonAction as any
    }
  }

  private static detectSpamPatterns(messages: Array<{ content: string; timestamp: Date }>): string[] {
    const flags: string[] = []

    // Check for repeated messages
    const uniqueMessages = new Set(messages.map(m => m.content.toLowerCase()))
    if (uniqueMessages.size < messages.length * 0.5) {
      flags.push('spam:repeated_messages')
    }

    // Check for rapid-fire messages (more than 5 in 30 seconds)
    const recentTimestamps = messages
      .map(m => m.timestamp.getTime())
      .sort((a, b) => b - a)

    for (let i = 0; i < recentTimestamps.length - 5; i++) {
      const timeSpan = recentTimestamps[i] - recentTimestamps[i + 4]
      if (timeSpan < 30000) { // 30 seconds
        flags.push('spam:rapid_fire')
        break
      }
    }

    // Check for excessive caps
    const capsRatio = messages.reduce((sum, m) => {
      const caps = (m.content.match(/[A-Z]/g) || []).length
      const total = m.content.replace(/\s/g, '').length
      return sum + (total > 0 ? caps / total : 0)
    }, 0) / messages.length

    if (capsRatio > 0.7) {
      flags.push('spam:excessive_caps')
    }

    return flags
  }

  private static async detectHarassmentPatterns(messages: Array<{ content: string; timestamp: Date }>): Promise<string[]> {
    const flags: string[] = []

    // Use AI to detect harassment patterns
    const combinedText = messages.map(m => m.content).join(' ')

    try {
      const analysis = await this.analyzeContent(combinedText)

      if (analysis.intent === 'aggressive' && analysis.toxicity > 0.6) {
        flags.push('harassment:aggressive_language')
      }

      if (analysis.sentiment === 'negative' && analysis.toxicity > 0.5) {
        flags.push('harassment:negative_sentiment')
      }
    } catch (error) {
      // Fallback to keyword detection
      const harassmentKeywords = ['hate', 'stupid', 'idiot', 'dumb', 'loser', 'ugly', 'worthless']
      const hasHarassment = messages.some(m =>
        harassmentKeywords.some(word => m.content.toLowerCase().includes(word))
      )

      if (hasHarassment) {
        flags.push('harassment:keyword_detection')
      }
    }

    return flags
  }

  private static detectTrollPatterns(messages: Array<{ content: string; timestamp: Date }>): string[] {
    const flags: string[] = []

    // Check for contradictory statements
    const sentiments = messages.map(m => {
      const positive = (m.content.match(/\b(good|great|awesome|love|like|happy|excited)\b/gi) || []).length
      const negative = (m.content.match(/\b(bad|terrible|awful|hate|dislike|sad|angry)\b/gi) || []).length
      return positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral'
    })

    const sentimentChanges = sentiments.reduce((changes, sentiment, i) => {
      if (i > 0 && sentiment !== sentiments[i - 1] && sentiment !== 'neutral') {
        return changes + 1
      }
      return changes
    }, 0)

    if (sentimentChanges > messages.length * 0.6) {
      flags.push('troll:inconsistent_sentiment')
    }

    // Check for provocative questions
    const provocativePatterns = /\b(why are you|what's wrong with|don't you|aren't you)\b/i
    const provocativeCount = messages.filter(m => provocativePatterns.test(m.content)).length

    if (provocativeCount > messages.length * 0.4) {
      flags.push('troll:provocative_questions')
    }

    return flags
  }
}
