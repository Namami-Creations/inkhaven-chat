// DeepSeek API Integration for Enhanced Chat Features
// DeepSeek provides fast, cost-effective AI models

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface DeepSeekResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class DeepSeekService {
  private static readonly BASE_URL = 'https://api.deepseek.com/v1'
  private static readonly DEFAULT_MODEL = 'deepseek-chat'

  /**
   * Generate chat completion using DeepSeek
   */
  static async generateChatCompletion(
    messages: DeepSeekMessage[],
    options: {
      model?: string
      temperature?: number
      max_tokens?: number
      stream?: boolean
    } = {}
  ): Promise<DeepSeekResponse> {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      throw new Error('DeepSeek API key not configured')
    }

    const response = await fetch(`${this.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || this.DEFAULT_MODEL,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 1000,
        stream: options.stream ?? false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  /**
   * Generate icebreaker suggestions
   */
  static async generateIcebreakers(
    context: string,
    interests: string[],
    count: number = 3
  ): Promise<string[]> {
    const prompt = `
      Generate ${count} creative and engaging icebreaker questions for an anonymous chat based on:
      Context: ${context}
      Interests: ${interests.join(', ')}

      Make them natural, fun, and conversation-starting. Focus on being inclusive and respectful.
      Return only the questions, one per line, numbered 1-${count}.
    `

    try {
      const response = await this.generateChatCompletion([
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.8,
        max_tokens: 300
      })

      const content = response.choices[0]?.message?.content || ''
      return content
        .split('\n')
        .filter(line => line.trim() && /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, count)
    } catch (error) {
      console.error('Error generating icebreakers with DeepSeek:', error)
      return [
        "What's something you're passionate about?",
        "What's the most interesting thing you've learned recently?",
        "If you could travel anywhere right now, where would you go?"
      ].slice(0, count)
    }
  }

  /**
   * Analyze conversation sentiment and suggest improvements
   */
  static async analyzeConversationFlow(
    messages: Array<{ content: string; sender: 'me' | 'other' }>
  ): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative'
    engagement: number // 0-1 scale
    suggestions: string[]
  }> {
    const conversationText = messages
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n')

    const prompt = `
      Analyze this anonymous chat conversation and provide:
      1. Overall sentiment (positive/neutral/negative)
      2. Engagement level (0-1, where 1 is highly engaged)
      3. 2-3 specific suggestions to improve the conversation

      Conversation:
      ${conversationText}

      Return in JSON format: {"sentiment": "positive", "engagement": 0.8, "suggestions": ["suggestion1", "suggestion2"]}
    `

    try {
      const response = await this.generateChatCompletion([
        {
          role: 'system',
          content: 'You are a conversation analyst. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.3,
        max_tokens: 400
      })

      const content = response.choices[0]?.message?.content || '{}'
      return JSON.parse(content)
    } catch (error) {
      console.error('Error analyzing conversation with DeepSeek:', error)
      return {
        sentiment: 'neutral' as const,
        engagement: 0.5,
        suggestions: [
          'Try asking open-ended questions',
          'Share something personal to build connection'
        ]
      }
    }
  }

  /**
   * Generate conversation topics based on interests
   */
  static async suggestTopics(
    interests: string[],
    conversationHistory: string[],
    count: number = 5
  ): Promise<string[]> {
    const historySummary = conversationHistory.slice(-3).join(' ') // Last 3 messages

    const prompt = `
      Based on these interests: ${interests.join(', ')}
      And recent conversation: "${historySummary}"

      Suggest ${count} engaging conversation topics that would be appropriate for anonymous chat.
      Make them specific, interesting, and conversation-starting.
      Return as a numbered list.
    `

    try {
      const response = await this.generateChatCompletion([
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.9,
        max_tokens: 300
      })

      const content = response.choices[0]?.message?.content || ''
      return content
        .split('\n')
        .filter(line => line.trim() && /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, count)
    } catch (error) {
      console.error('Error suggesting topics with DeepSeek:', error)
      return [
        'Favorite hobbies and why you enjoy them',
        'Dream travel destinations',
        'Books or movies that changed your perspective',
        'Life lessons learned the hard way',
        'Future goals and aspirations'
      ].slice(0, count)
    }
  }

  /**
   * Moderate content using DeepSeek (alternative to other services)
   */
  static async moderateContent(
    content: string
  ): Promise<{
    isAllowed: boolean
    confidence: number
    reasons: string[]
    category: string
  }> {
    const prompt = `
      Analyze this message for appropriateness in an anonymous chat platform.
      Consider: hate speech, harassment, spam, explicit content, threats.

      Message: "${content}"

      Return JSON: {"isAllowed": boolean, "confidence": number, "reasons": string[], "category": "safe|hate|spam|explicit|other"}
    `

    try {
      const response = await this.generateChatCompletion([
        {
          role: 'system',
          content: 'You are a content moderator. Be strict but fair. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.1,
        max_tokens: 200
      })

      const result = JSON.parse(response.choices[0]?.message?.content || '{}')

      return {
        isAllowed: result.isAllowed ?? true,
        confidence: result.confidence ?? 0.5,
        reasons: result.reasons ?? [],
        category: result.category ?? 'safe'
      }
    } catch (error) {
      console.error('Error moderating content with DeepSeek:', error)
      return {
        isAllowed: true,
        confidence: 0.3,
        reasons: [],
        category: 'safe'
      }
    }
  }

  /**
   * Generate creative room descriptions
   */
  static async enhanceRoomDescription(
    roomName: string,
    category: string,
    interests: string[]
  ): Promise<string> {
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

    try {
      const response = await this.generateChatCompletion([
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.7,
        max_tokens: 150
      })

      return response.choices[0]?.message?.content?.trim() ||
             `Welcome to ${roomName}! A space for discussions about ${interests.join(', ')}.`
    } catch (error) {
      console.error('Error enhancing room description with DeepSeek:', error)
      return `Welcome to ${roomName}! Join discussions about ${interests.join(', ')}.`
    }
  }
}
