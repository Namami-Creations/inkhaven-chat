// AI Service Orchestration Engine - Intelligent Routing & Load Balancing
// Dynamically selects best AI service based on performance, cost, and availability

export interface AIServiceMetrics {
  service: string
  latency: number
  costPerToken: number
  errorRate: number
  tokenLimit: number
  tokensUsed: number
  lastUsed: number
  status: 'healthy' | 'degraded' | 'failed'
}

export interface AIRequest {
  type: 'chat' | 'moderation' | 'translation' | 'analysis' | 'generation'
  priority: 'low' | 'medium' | 'high' | 'critical'
  content: string
  context?: any
  userType?: 'anonymous' | 'registered'
  maxTokens?: number
}

export interface AIResponse {
  service: string
  content: string
  latency: number
  cost: number
  tokensUsed: number
  confidence?: number
  metadata?: any
}

export class AIOrchestrator {
  private static instance: AIOrchestrator
  private metrics: Map<string, AIServiceMetrics> = new Map()
  private requestQueue: AIRequest[] = []
  private isProcessing = false

  // AI Service Configuration with your API keys
  private static readonly AI_SERVICES = {
    deepseek: {
      name: 'deepseek',
      apiKey: process.env.DEEPSEEK_API_KEY!,
      baseUrl: 'https://api.deepseek.com/v1',
      models: {
        chat: 'deepseek-chat',
        reasoning: 'deepseek-r1'
      },
      freeTier: false, // Paid but cost-effective
      costPerInputToken: 0.00014,   // $0.14 per 1M tokens
      costPerOutputToken: 0.00028,  // $0.28 per 1M tokens
      maxTokens: 32768,
      priority: 1 // Primary service
    },
    openai: {
      name: 'openai',
      apiKey: process.env.OPENAI_API_KEY!,
      baseUrl: 'https://api.openai.com/v1',
      models: {
        chat: 'gpt-4o-mini',
        moderation: 'gpt-4o-mini'
      },
      freeTier: true, // 5M tokens/month free
      costPerInputToken: 0.00015,
      costPerOutputToken: 0.0006,
      maxTokens: 128000,
      priority: 2 // Secondary service
    },
    gemini: {
      name: 'gemini',
      apiKey: process.env.GEMINI_API_KEY!,
      baseUrl: 'https://generativelanguage.googleapis.com',
      models: {
        chat: 'gemini-pro',
        analysis: 'gemini-pro-vision'
      },
      freeTier: true, // 1M tokens/month free
      costPerInputToken: 0, // Free tier
      costPerOutputToken: 0, // Free tier
      maxTokens: 32768,
      priority: 3 // Tertiary service
    },
    huggingface: {
      name: 'huggingface',
      apiKey: process.env.HUGGINGFACE_API_KEY!,
      baseUrl: 'https://api-inference.huggingface.co',
      models: {
        moderation: 'martin-ha/toxic-comment-model'
      },
      freeTier: true, // Unlimited free tier
      costPerInputToken: 0,
      costPerOutputToken: 0,
      maxTokens: 512,
      priority: 4 // Quaternary service
    }
  }

  // Routing rules based on user type and request type
  private static readonly ROUTING_RULES = {
    anonymous: {
      chat: ['deepseek', 'openai', 'gemini'],
      moderation: ['huggingface', 'gemini'], // Light moderation
      icebreakers: ['deepseek', 'openai'],
      matching: ['deepseek', 'gemini'],
      analysis: ['gemini', 'deepseek']
    },
    registered: {
      chat: ['deepseek', 'openai', 'gemini'],
      moderation: ['openai', 'deepseek', 'huggingface'], // Strict moderation
      icebreakers: ['deepseek', 'openai'],
      matching: ['deepseek', 'openai'],
      analysis: ['deepseek', 'gemini']
    }
  }

  private constructor() {
    this.initializeMetrics()
    this.startHealthMonitoring()
    this.startQueueProcessor()
  }

  static getInstance(): AIOrchestrator {
    if (!AIOrchestrator.instance) {
      AIOrchestrator.instance = new AIOrchestrator()
    }
    return AIOrchestrator.instance
  }

  private initializeMetrics(): void {
    Object.keys(AIOrchestrator.AI_SERVICES).forEach(serviceName => {
      this.metrics.set(serviceName, {
        service: serviceName,
        latency: 0,
        costPerToken: AIOrchestrator.AI_SERVICES[serviceName as keyof typeof AIOrchestrator.AI_SERVICES].costPerOutputToken,
        errorRate: 0,
        tokenLimit: AIOrchestrator.AI_SERVICES[serviceName as keyof typeof AIOrchestrator.AI_SERVICES].maxTokens,
        tokensUsed: 0,
        lastUsed: Date.now(),
        status: 'healthy'
      })
    })
  }

  private startHealthMonitoring(): void {
    // Monitor service health every 30 seconds
    setInterval(() => {
      this.checkServiceHealth()
    }, 30000)

    // Reset usage counters daily
    setInterval(() => {
      this.resetDailyUsage()
    }, 24 * 60 * 60 * 1000)
  }

  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.isProcessing && this.requestQueue.length > 0) {
        this.processQueue()
      }
    }, 100) // Process every 100ms
  }

  private async checkServiceHealth(): Promise<void> {
    for (const [serviceName, service] of Object.entries(AIOrchestrator.AI_SERVICES)) {
      try {
        const startTime = Date.now()
        // Simple health check - try to get a response
        await this.makeTestRequest(service)
        const latency = Date.now() - startTime

        const metric = this.metrics.get(serviceName)!
        metric.latency = latency
        metric.status = latency < 5000 ? 'healthy' : 'degraded'
        metric.lastUsed = Date.now()
      } catch (error) {
        const metric = this.metrics.get(serviceName)!
        metric.status = 'failed'
        metric.errorRate += 1
      }
    }
  }

  private async makeTestRequest(service: any): Promise<void> {
    // Implement simple health check for each service
    switch (service.name) {
      case 'deepseek':
        const response = await fetch(`${service.baseUrl}/models`, {
          headers: { 'Authorization': `Bearer ${service.apiKey}` }
        })
        if (!response.ok) throw new Error('DeepSeek health check failed')
        break
      case 'openai':
        // OpenAI health check
        break
      case 'gemini':
        // Gemini health check
        break
      case 'huggingface':
        // HuggingFace health check
        break
    }
  }

  private resetDailyUsage(): void {
    this.metrics.forEach(metric => {
      metric.tokensUsed = 0
    })
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) return

    this.isProcessing = true

    try {
      const request = this.requestQueue.shift()!
      const response = await this.routeRequest(request)
      // Handle response (would typically be returned to caller)
    } catch (error) {
      console.error('Queue processing error:', error)
    } finally {
      this.isProcessing = false
    }
  }

  private selectBestService(request: AIRequest): string {
    const userType = request.userType || 'anonymous'
    const allowedServices = AIOrchestrator.ROUTING_RULES[userType as keyof typeof AIOrchestrator.ROUTING_RULES][request.type as keyof typeof AIOrchestrator.ROUTING_RULES.anonymous] as string[]

    // Score each service based on multiple factors
    const serviceScores = allowedServices.map(serviceName => {
      const metric = this.metrics.get(serviceName)!
      const service = AIOrchestrator.AI_SERVICES[serviceName as keyof typeof AIOrchestrator.AI_SERVICES]

      let score = service.priority * 10 // Base priority score

      // Latency score (lower is better)
      score -= metric.latency / 100

      // Cost score (lower is better)
      score -= service.costPerOutputToken * 1000000

      // Health score
      if (metric.status === 'healthy') score += 20
      else if (metric.status === 'degraded') score += 5
      else score -= 50

      // Token availability
      const tokenUsageRatio = metric.tokensUsed / metric.tokenLimit
      score -= tokenUsageRatio * 10

      // Recent usage bonus (prefer recently used services)
      const timeSinceLastUse = Date.now() - metric.lastUsed
      score += Math.max(0, 10 - timeSinceLastUse / 60000) // Bonus for used in last 10 minutes

      return { service: serviceName, score }
    })

    // Select highest scoring service
    serviceScores.sort((a, b) => b.score - a.score)
    return serviceScores[0].service
  }

  async routeRequest(request: AIRequest): Promise<AIResponse> {
    const serviceName = this.selectBestService(request)
    const service = AIOrchestrator.AI_SERVICES[serviceName as keyof typeof AIOrchestrator.AI_SERVICES]
    const metric = this.metrics.get(serviceName)!

    const startTime = Date.now()

    try {
      const response = await this.executeRequest(service, request)

      const latency = Date.now() - startTime
      const cost = this.calculateCost(service, response.tokensUsed)

      // Update metrics
      metric.latency = (metric.latency + latency) / 2 // Rolling average
      metric.tokensUsed += response.tokensUsed
      metric.lastUsed = Date.now()

      return {
        service: serviceName,
        content: response.content,
        latency,
        cost,
        tokensUsed: response.tokensUsed,
        confidence: response.confidence,
        metadata: response.metadata
      }
    } catch (error) {
      // Update error metrics
      metric.errorRate += 1
      metric.status = 'degraded'

      throw error
    }
  }

  private async executeRequest(service: any, request: AIRequest): Promise<any> {
    switch (service.name) {
      case 'deepseek':
        return await this.callDeepSeek(service, request)
      case 'openai':
        return await this.callOpenAI(service, request)
      case 'gemini':
        return await this.callGemini(service, request)
      case 'huggingface':
        return await this.callHuggingFace(service, request)
      default:
        throw new Error(`Unknown service: ${service.name}`)
    }
  }

  private async callDeepSeek(service: any, request: AIRequest): Promise<any> {
    const response = await fetch(`${service.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${service.apiKey}`
      },
      body: JSON.stringify({
        model: service.models.chat,
        messages: [{ role: 'user', content: request.content }],
        max_tokens: request.maxTokens || 1000,
        temperature: request.priority === 'high' ? 0.7 : 0.3
      })
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage.total_tokens,
      confidence: 0.9
    }
  }

  private async callOpenAI(service: any, request: AIRequest): Promise<any> {
    // OpenAI implementation
    const response = await fetch(`${service.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${service.apiKey}`
      },
      body: JSON.stringify({
        model: service.models.chat,
        messages: [{ role: 'user', content: request.content }],
        max_tokens: request.maxTokens || 1000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage.total_tokens,
      confidence: 0.95
    }
  }

  private async callGemini(service: any, request: AIRequest): Promise<any> {
    // Gemini implementation (simplified)
    const response = await fetch(`${service.baseUrl}/v1beta/models/${service.models.chat}:generateContent?key=${service.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: request.content }]
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    return {
      content: data.candidates[0].content.parts[0].text,
      tokensUsed: Math.ceil(request.content.length / 4), // Rough estimate
      confidence: 0.85
    }
  }

  private async callHuggingFace(service: any, request: AIRequest): Promise<any> {
    // HuggingFace implementation for moderation
    const response = await fetch(`${service.baseUrl}/models/${service.models.moderation}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${service.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: request.content
      })
    })

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`)
    }

    const data = await response.json()
    return {
      content: JSON.stringify(data),
      tokensUsed: request.content.length,
      confidence: 0.8
    }
  }

  private calculateCost(service: any, tokensUsed: number): number {
    return (service.costPerInputToken + service.costPerOutputToken) * tokensUsed / 1000000
  }

  // Public API methods
  async processRequest(request: AIRequest): Promise<AIResponse> {
    return await this.routeRequest(request)
  }

  getMetrics(): Map<string, AIServiceMetrics> {
    return new Map(this.metrics)
  }

  getQueueLength(): number {
    return this.requestQueue.length
  }

  async getHealthStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {}
    for (const [name, metric] of this.metrics) {
      status[name] = {
        status: metric.status,
        latency: metric.latency,
        errorRate: metric.errorRate,
        tokensUsed: metric.tokensUsed,
        lastUsed: new Date(metric.lastUsed).toISOString()
      }
    }
    return status
  }
}
