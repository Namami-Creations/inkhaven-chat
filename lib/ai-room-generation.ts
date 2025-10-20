import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '@/lib/supabase'
import { ChatRoom, AI_GENERATED_ROOM_CATEGORIES, RoomCategory } from '@/utils/types'
import { DeepSeekService } from './deepseek-service'

// Initialize AI services
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export class AIRoomGenerationService {
  /**
   * Generate room suggestions based on current trends and user interests
   */
  static async generateRoomSuggestions(
    trendingTopics: string[],
    activeInterests: string[],
    currentRooms: ChatRoom[]
  ): Promise<Array<{
    name: string
    description: string
    category: RoomCategory
    interests: string[]
    estimatedParticipants: number
  }>> {
    try {
      const existingRoomNames = currentRooms.map(r => r.name.toLowerCase())
      const existingCategories = currentRooms.map(r => r.category)

      const prompt = `
        Generate 3 new chat room suggestions based on:
        - Trending topics: ${trendingTopics.join(', ')}
        - Popular interests: ${activeInterests.join(', ')}
        - Existing rooms: ${existingRoomNames.join(', ')}
        - Existing categories: ${existingCategories.join(', ')}

        Requirements:
        - Rooms should be unique and not overlap with existing ones
        - Focus on emerging or underrepresented topics
        - Make names engaging and descriptive
        - Ensure variety in categories
        - Estimate realistic participant numbers (10-100)

        Return JSON array with format:
        [{
          "name": "Room Name",
          "description": "Brief description",
          "category": "Category Name",
          "interests": ["interest1", "interest2"],
          "estimatedParticipants": 25
        }]
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.8,
      })

      const result = response.choices[0]?.message?.content
      if (result) {
        try {
          const suggestions = JSON.parse(result)
          return suggestions.filter((suggestion: any) =>
            !existingRoomNames.includes(suggestion.name.toLowerCase())
          )
        } catch {
          return this.generateFallbackSuggestions(trendingTopics, activeInterests)
        }
      }

      return this.generateFallbackSuggestions(trendingTopics, activeInterests)
    } catch (error) {
      console.error('Error generating room suggestions:', error)
      return this.generateFallbackSuggestions(trendingTopics, activeInterests)
    }
  }

  /**
   * Analyze chat patterns to identify emerging topics
   */
  static async analyzeEmergingTopics(
    recentMessages: Array<{ content: string; timestamp: Date; interests?: string[] }>,
    timeWindowHours: number = 24
  ): Promise<{
    trendingTopics: string[]
    emergingInterests: string[]
    conversationClusters: Array<{
      topic: string
      messageCount: number
      avgEngagement: number
    }>
  }> {
    const cutoffTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000)
    const recentMsgs = recentMessages.filter(m => m.timestamp > cutoffTime)

    if (recentMsgs.length < 10) {
      return {
        trendingTopics: [],
        emergingInterests: [],
        conversationClusters: []
      }
    }

    try {
      const allContent = recentMsgs.map(m => m.content).join(' ')
      const allInterests = recentMsgs.flatMap(m => m.interests || [])

      const prompt = `
        Analyze this collection of chat messages and identify:
        1. Trending topics (main discussion themes)
        2. Emerging interests (new or growing topics)
        3. Conversation clusters (groupings of related discussions)

        Messages: "${allContent.substring(0, 2000)}"

        Existing interests mentioned: ${allInterests.join(', ')}

        Return JSON with:
        {
          "trendingTopics": ["topic1", "topic2"],
          "emergingInterests": ["interest1", "interest2"],
          "conversationClusters": [
            {"topic": "topic", "messageCount": 5, "avgEngagement": 0.8}
          ]
        }
      `

      const response = await genAI.getGenerativeModel({ model: 'gemini-pro' }).generateContent(prompt)
      const result = response.response.text()

      try {
        return JSON.parse(result)
      } catch {
        // Fallback analysis
        return this.fallbackTopicAnalysis(recentMsgs)
      }
    } catch (error) {
      console.error('Error analyzing emerging topics:', error)
      return this.fallbackTopicAnalysis(recentMsgs)
    }
  }

  /**
   * Auto-create rooms based on trending topics
   */
  static async autoCreateRooms(
    trendingTopics: string[],
    minParticipantsThreshold: number = 5
  ): Promise<ChatRoom[]> {
    const createdRooms: ChatRoom[] = []

    for (const topic of trendingTopics.slice(0, 2)) { // Create max 2 rooms at a time
      try {
        const roomData = await this.generateRoomFromTopic(topic)

        if (roomData.estimatedParticipants >= minParticipantsThreshold) {
          const newRoom = await this.createRoomInDatabase(roomData)
          if (newRoom) {
            createdRooms.push(newRoom)
          }
        }
      } catch (error) {
        console.error(`Error creating room for topic ${topic}:`, error)
      }
    }

    return createdRooms
  }

  /**
   * Update room moderation rules based on room activity
   */
  static async updateRoomModerationRules(
    roomId: string,
    recentMessages: Array<{ content: string; userId: string; timestamp: Date }>,
    violationHistory: Array<{ type: string; timestamp: Date }>
  ): Promise<{
    updatedRules: Record<string, any>
    recommendedActions: string[]
  }> {
    try {
      const messageText = recentMessages.map(m => m.content).join(' ')
      const violationSummary = violationHistory
        .filter(v => Date.now() - v.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000) // Last 7 days
        .reduce((acc, v) => {
          acc[v.type] = (acc[v.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)

      const prompt = `
        Analyze this room's recent activity and suggest moderation rule updates.

        Recent messages: "${messageText.substring(0, 1000)}"
        Recent violations: ${JSON.stringify(violationSummary)}
        Total messages in period: ${recentMessages.length}

        Return JSON with:
        {
          "updatedRules": {"keyword_filters": [], "behavior_rules": []},
          "recommendedActions": ["action1", "action2"]
        }
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      })

      const result = response.choices[0]?.message?.content
      if (result) {
        try {
          return JSON.parse(result)
        } catch {
          return {
            updatedRules: {},
            recommendedActions: ['Monitor room activity closely']
          }
        }
      }

      return {
        updatedRules: {},
        recommendedActions: ['Monitor room activity closely']
      }
    } catch (error) {
      console.error('Error updating room moderation rules:', error)
      return {
        updatedRules: {},
        recommendedActions: ['Monitor room activity closely']
   */
  static async enhanceRoomDescription(
    roomName: string,
    category: string,
    interests: string[]
  ): Promise<string> {
    // Try DeepSeek first (faster and more creative)
    try {
      return await DeepSeekService.enhanceRoomDescription(roomName, category, interests)
    } catch (error) {
      console.warn('DeepSeek room description failed, falling back to Gemini:', error)
    }

    // Fallback to Gemini
    try {
      const prompt = `
        Create an engaging, welcoming description for a chat room called "${roomName}".
        Category: ${category}
        Related interests: ${interests.join(', ')}

        Make it:
        - Inviting and friendly (under 120 characters)
        - Clear about the room's purpose
        - Encouraging participation
        - Professional but warm
      `

      const response = await genAI.getGenerativeModel({ model: 'gemini-pro' }).generateContent(prompt)
      const result = response.response.text()

      return result || `Welcome to ${roomName}! A space for discussions about ${interests.join(', ')}.`
    } catch (error) {
      console.error('Error enhancing room description with Gemini:', error)
      return `Welcome to ${roomName}! Join discussions about ${interests.join(', ')}.`
    }
  }

  // Private helper methods
  private static generateFallbackSuggestions(
    trendingTopics: string[],
    activeInterests: string[]
  ): Array<{
    name: string
    description: string
    category: RoomCategory
    interests: string[]
    estimatedParticipants: number
  }> {
    const suggestions = []

    if (trendingTopics.includes('technology') || activeInterests.includes('coding')) {
      suggestions.push({
        name: 'Future of AI Development',
        description: 'Discuss cutting-edge AI technologies and their impact on development',
        category: 'Technology Help Desk',
        interests: ['ai', 'technology', 'development'],
        estimatedParticipants: 35
      })
    }

    if (trendingTopics.includes('gaming') || activeInterests.includes('gaming')) {
      suggestions.push({
        name: 'Indie Game Showcase',
        description: 'Discover and discuss amazing indie games and support developers',
        category: 'Gaming Discussions',
        interests: ['gaming', 'indie', 'developers'],
        estimatedParticipants: 28
      })
    }

    if (trendingTopics.includes('mental health') || activeInterests.includes('wellness')) {
      suggestions.push({
        name: 'Digital Wellness Hub',
        description: 'Share tips and experiences about maintaining wellness in the digital age',
        category: 'Mental Wellness Support',
        interests: ['wellness', 'mental health', 'digital life'],
        estimatedParticipants: 22
      })
    }

    return suggestions
  }

  private static fallbackTopicAnalysis(
    messages: Array<{ content: string; timestamp: Date; interests?: string[] }>
  ): {
    trendingTopics: string[]
    emergingInterests: string[]
    conversationClusters: Array<{
      topic: string
      messageCount: number
      avgEngagement: number
    }>
  } {
    const allContent = messages.map(m => m.content).join(' ').toLowerCase()
    const allInterests = messages.flatMap(m => m.interests || [])

    // Simple keyword frequency analysis
    const keywords = ['ai', 'gaming', 'technology', 'music', 'sports', 'movies', 'books', 'food', 'travel', 'coding']
    const trendingTopics = keywords
      .filter(keyword => allContent.includes(keyword))
      .sort((a, b) => (allContent.split(a).length - 1) - (allContent.split(b).length - 1))
      .slice(0, 3)

    const emergingInterests = [...new Set(allInterests)]
      .sort((a, b) => allInterests.filter(i => i === a).length - allInterests.filter(i => i === b).length)
      .slice(0, 3)

    const conversationClusters = trendingTopics.map(topic => ({
      topic,
      messageCount: messages.filter(m => m.content.toLowerCase().includes(topic)).length,
      avgEngagement: 0.7 // Placeholder
    }))

    return {
      trendingTopics,
      emergingInterests,
      conversationClusters
    }
  }

  private static async generateRoomFromTopic(topic: string): Promise<{
    name: string
    description: string
    category: RoomCategory
    interests: string[]
    estimatedParticipants: number
  }> {
    // Map topics to categories
    const categoryMap: Record<string, RoomCategory> = {
      'technology': 'Technology Help Desk',
      'gaming': 'Gaming Discussions',
      'mental health': 'Mental Wellness Support',
      'career': 'Career Advice',
      'books': 'Book Club',
      'travel': 'Travel Stories',
      'coding': 'Coding Help',
      'relationship': 'Relationship Advice'
    }

    const category = categoryMap[topic.toLowerCase()] || 'Technology Help Desk'

    const enhancedDescription = await this.enhanceRoomDescription(
      `${topic.charAt(0).toUpperCase() + topic.slice(1)} Discussions`,
      category,
      [topic]
    )

    return {
      name: `${topic.charAt(0).toUpperCase() + topic.slice(1)} Discussions`,
      description: enhancedDescription,
      category,
      interests: [topic],
      estimatedParticipants: Math.floor(Math.random() * 40) + 15 // 15-55 participants
    }
  }

  private static async createRoomInDatabase(roomData: {
    name: string
    description: string
    category: RoomCategory
    interests: string[]
    estimatedParticipants: number
  }): Promise<ChatRoom | null> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: roomData.name,
          description: roomData.description,
          category: roomData.category,
          is_ai_generated: true,
          participant_count: 0,
          max_participants: 100,
          interests: roomData.interests,
          moderation_rules: {
            auto_moderation: true,
            keyword_filters: [],
            behavior_monitoring: true
          }
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        isAiGenerated: data.is_ai_generated,
        participantCount: data.participant_count,
        maxParticipants: data.max_participants,
        interests: data.interests,
        moderationRules: data.moderation_rules,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Error creating room in database:', error)
      return null
    }
  }
}
