export interface User {
  id: string
  isAnonymous: boolean
  isPremium: boolean
  premiumUntil?: Date
  karma: number
  achievements: string[]
  plan?: string
  display_name?: string
}