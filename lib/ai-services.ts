// AI Services Configuration - All Free Tier
// Enhanced with self-healing capabilities using executeWithRetryAndFallback from ai-fallback.ts
export const AI_SERVICES = {
  moderation: [
    'huggingface/moderation-check',  // Free
    'openai/moderation',             // Free 1M tokens/month
    'deepseek/moderation',           // Alternative moderation
  ],
  chatEnhancement: [
    'deepseek/deepseek-chat',        // Fast and cost-effective
    'openai/gpt-4o-mini',            // Free 5M tokens/month
    'google/gemini-flash',           // Free 1M tokens/month
  ],
  icebreakers: [
    'deepseek/deepseek-chat',        // Creative responses
    'openai/gpt-4o-mini',            // Fallback
  ],
  contentAnalysis: [
    'google/gemini-flash',           // Best for analysis
    'deepseek/deepseek-chat',        // Good alternative
  ],
  translation: 'libretranslate',     // Completely free
  imageAnalysis: 'google/vision',    // Free 1000 units/month
} as const

export type AIServiceType = keyof typeof AI_SERVICES
export type AIModerationService = typeof AI_SERVICES.moderation[number]
export type AIChatService = typeof AI_SERVICES.chatEnhancement[number]

// Service optimization based on usage and cost
export const optimizeAICosts = () => {
  return {
    primaryChat: 'deepseek/deepseek-chat' as AIChatService,     // Fast & cheap
    fallbackChat: 'openai/gpt-4o-mini' as AIChatService,        // Free tier
    emergencyChat: 'google/gemini-flash' as AIChatService,      // Backup
    moderation: 'huggingface/moderation-check' as AIModerationService,
    icebreakers: 'deepseek/deepseek-chat' as AIChatService,     // Creative
  }
}
