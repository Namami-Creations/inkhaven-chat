import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { HfInference } from '@huggingface/inference'
import { MatchPreferences, Message } from '@/utils/types'
import { DeepSeekService } from './deepseek-service'

// Initialize AI services
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

export class AIMatchingEngine {
  /**
   * Analyze first messages to extract interests and conversation style
   */
  static async analyzeInterests(messages: Message[]): Promise<string[]> {
    try {
      const messageText = messages.map(m => m.content).join(' ')

      const prompt = `
        Analyze this conversation and extract the main interests and topics being discussed.
        Return a JSON array of interest keywords (max 5).

        Conversation: "${messageText}"

        Format: ["interest1", "interest2", "interest3"]
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.3,
      })

      const result = response.choices[0]?.message?.content
      if (result) {
        try {
          return JSON.parse(result)
        } catch {
          // Fallback: extract basic keywords
          return this.extractBasicKeywords(messageText)
        }
      }

      return this.extractBasicKeywords(messageText)
    } catch (error) {
      console.error('Error analyzing interests:', error)
      return []
    }
  }

  /**
   * Detect conversation style and language
   */
  static async detectConversationStyle(messages: Message[]): Promise<{
    style: 'casual' | 'deep' | 'funny'
    language: string
    formality: number // 0-1 scale
  }> {
    try {
      const messageText = messages.slice(-5).map(m => m.content).join(' ') // Last 5 messages

      const prompt = `
        Analyze this conversation snippet and determine:
        1. Conversation style: casual, deep, or funny
        2. Primary language (ISO code)
        3. Formality level (0-1, where 0 is very casual and 1 is very formal)

        Conversation: "${messageText}"

        Return JSON: {"style": "casual|deep|funny", "language": "en", "formality": 0.5}
      `

      const response = await genAI.getGenerativeModel({ model: 'gemini-pro' }).generateContent(prompt)
      const result = response.response.text()

      try {
        return JSON.parse(result)
      } catch {
        return { style: 'casual', language: 'en', formality: 0.5 }
      }
    } catch (error) {
      console.error('Error detecting conversation style:', error)
      return { style: 'casual', language: 'en', formality: 0.5 }
    }
  }

  /**
   * Calculate matching score between two users
   */
  static async calculateMatchScore(
    user1Prefs: MatchPreferences,
    user2Prefs: MatchPreferences,
    messages: Message[] = []
  ): Promise<number> {
    let score = 0
    let factors = 0

    // Interest overlap (40% weight)
    const interestOverlap = this.calculateInterestOverlap(user1Prefs.interests, user2Prefs.interests)
    score += interestOverlap * 0.4
    factors++

    // Language compatibility (20% weight)
    const languageMatch = user1Prefs.language === user2Prefs.language ? 1 : 0.3
    score += languageMatch * 0.2
    factors++

    // Chat style compatibility (20% weight)
    const styleMatch = user1Prefs.chatStyle === user2Prefs.chatStyle ? 1 : 0.5
    score += styleMatch * 0.2
    factors++

    // Timezone compatibility (10% weight)
    const timezoneMatch = this.calculateTimezoneCompatibility(user1Prefs.timezone, user2Prefs.timezone)
    score += timezoneMatch * 0.1
    factors++

    // Conversation flow analysis (10% weight) - if messages provided
    if (messages.length > 0) {
      const flowScore = await this.analyzeConversationFlow(messages)
      score += flowScore * 0.1
      factors++
    }

    return Math.min(score / factors, 1) // Normalize to 0-1
  }

  /**
   * Find optimal matches from available users
   */
  static async findOptimalMatches(
    currentUserPrefs: MatchPreferences,
    availableUsers: Array<{ id: string; preferences: MatchPreferences; messages?: Message[] }>,
    limit: number = 5
  ): Promise<Array<{ userId: string; score: number; reasons: string[] }>> {
    const matches = await Promise.all(
      availableUsers.map(async (user) => {
        const score = await this.calculateMatchScore(currentUserPrefs, user.preferences, user.messages)
        const reasons = this.generateMatchReasons(currentUserPrefs, user.preferences, score)
        return { userId: user.id, score, reasons }
      })
    )

    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  /**
   * Generate AI icebreakers based on interests (DeepSeek primary, OpenAI fallback)
   */
  static async generateIcebreakers(interests: string[]): Promise<string[]> {
    // Try DeepSeek first (faster and cheaper)
    try {
      const context = "anonymous chat platform for meaningful conversations"
      return await DeepSeekService.generateIcebreakers(context, interests, 3)
    } catch (error) {
      console.warn('DeepSeek icebreakers failed, falling back to OpenAI:', error)
    }

    // Fallback to OpenAI
    try {
      const interestsText = interests.join(', ')

      const prompt = `
        Generate 3 creative, engaging icebreaker questions based on these interests: ${interestsText}

        Make them natural, fun, and conversation-starting. Return as JSON array.
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      })

      const result = response.choices[0]?.message?.content
      if (result) {
        try {
          return JSON.parse(result)
        } catch {
          return [
            `What's your favorite thing about ${interests[0] || 'this topic'}?`,
            `How did you get interested in ${interests[1] || interests[0] || 'this'}?`,
            `What's the most interesting thing you've learned recently about ${interests[2] || interests[0] || 'this subject'}?`
          ]
        }
      }

      return []
    } catch (error) {
      console.error('Error generating icebreakers:', error)
      return []
    }
  }

  // Helper methods
  private static extractBasicKeywords(text: string): string[] {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'i', 'you', 'it', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'])
    const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 3 && !commonWords.has(word))
    return [...new Set(words)].slice(0, 5)
  }

  private static calculateInterestOverlap(interests1: string[], interests2: string[]): number {
    const set1 = new Set(interests1.map(i => i.toLowerCase()))
    const set2 = new Set(interests2.map(i => i.toLowerCase()))
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    return intersection.size / union.size
  }

  private static calculateTimezoneCompatibility(tz1: string, tz2: string): number {
    // Simple timezone compatibility - same timezone gets 1, adjacent get 0.7, etc.
    if (tz1 === tz2) return 1

    // Parse timezone offsets (simplified)
    const offset1 = this.parseTimezoneOffset(tz1)
    const offset2 = this.parseTimezoneOffset(tz2)

    if (offset1 === null || offset2 === null) return 0.5

    const diff = Math.abs(offset1 - offset2)
    if (diff <= 1) return 0.8 // Within 1 hour
    if (diff <= 3) return 0.6 // Within 3 hours
    if (diff <= 6) return 0.4 // Within 6 hours
    return 0.2 // More than 6 hours apart
  }

  private static parseTimezoneOffset(tz: string): number | null {
    // Very simplified timezone parsing
    const tzMap: Record<string, number> = {
      'UTC': 0, 'GMT': 0, 'EST': -5, 'PST': -8, 'CET': 1, 'JST': 9
    }
    return tzMap[tz.toUpperCase()] || null
  }

  private static async analyzeConversationFlow(messages: Message[]): Promise<number> {
    if (messages.length < 2) return 0.5

    // Simple flow analysis based on message lengths and response times
    const avgLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length
    const hasBackAndForth = messages.length >= 4 // At least 2 exchanges

    let score = 0.5 // Base score

    if (avgLength > 20) score += 0.2 // Good engagement
    if (hasBackAndForth) score += 0.3 // Good conversation flow

    return Math.min(score, 1)
  }

  private static generateMatchReasons(
    prefs1: MatchPreferences,
    prefs2: MatchPreferences,
    score: number
  ): string[] {
    const reasons: string[] = []

    if (prefs1.language === prefs2.language) {
      reasons.push('Same language')
    }

    if (prefs1.chatStyle === prefs2.chatStyle) {
      reasons.push(`Both prefer ${prefs1.chatStyle} conversations`)
    }

    const commonInterests = prefs1.interests.filter(i =>
      prefs2.interests.some(i2 => i2.toLowerCase() === i.toLowerCase())
    )

    if (commonInterests.length > 0) {
      reasons.push(`Shared interests: ${commonInterests.slice(0, 2).join(', ')}`)
    }

    if (score > 0.8) {
      reasons.push('Excellent compatibility match')
    } else if (score > 0.6) {
      reasons.push('Good compatibility match')
    }

    return reasons
  }
}
