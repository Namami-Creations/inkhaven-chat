export type ModerationResult = {
  allowed: boolean
  reason?: string
}

// Lightweight, on-edge text moderation without external calls
// You can replace this with OpenAI/Gemini if keys are provided
const bannedPatterns: RegExp[] = [
  /suicide|self-harm|kill myself/i,
  /terror|bomb|shoot(?:ing)?/i,
  /child\s*(abuse|porn|sex)/i,
  /rape|sexual\s+assault/i,
  /hate\s*speech|slur/i,
  /nazi|kkk|white\s*power/i,
  /(?<![\w])(?:fuck|shit|bitch|cunt|asshole)(?![\w])/i,
  /http[s]?:\/\//i // links often used for spam/phishing
]

export function moderateText(text: string): ModerationResult {
  if (!text || !text.trim()) return { allowed: false, reason: 'empty' }
  for (const pattern of bannedPatterns) {
    if (pattern.test(text)) {
      return { allowed: false, reason: `blocked_by_pattern:${pattern.source}` }
    }
  }
  // Length guard
  if (text.length > 2000) {
    return { allowed: false, reason: 'too_long' }
  }
  return { allowed: true }
}
