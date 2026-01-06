import { User } from '@/types/user'

const ALL_STARTERS = [
  "If you could time travel, where would you go?",
  "What's your most useless talent?",
  "If you could have dinner with any historical figure, who would it be?",
  "What's the best book you've read recently?",
  "If you could instantly master any skill, what would it be?",
  "What's your go-to comfort food?",
  "If you could live in any fictional universe, which one?",
  "What's the most interesting place you've ever visited?",
  "If you could switch lives with someone for a day, who would it be?",
  "What's your favorite way to spend a lazy Sunday?",
  "If you could invent anything, what would it be?",
  "What's the best piece of advice you've ever received?",
  "If you could have any superpower, what would it be?",
  "What's your favorite childhood memory?",
  "If you could relive one day of your life, which would it be?",
  "What's the most challenging thing you've ever done?",
  "If you could meet your younger self, what would you say?",
  "What's your favorite season and why?",
  "If you could change one thing about the world, what would it be?",
  "What's the best concert or live event you've been to?",
  "If you could have any job in the world, what would it be?",
  "What's your favorite way to unwind after a long day?",
  "If you could learn any language instantly, which one?",
  "What's the most beautiful place you've ever seen?",
  "If you could be any animal for a day, what would you be?",
  "What's your favorite movie and why?",
  "If you could have a conversation with anyone, living or dead, who?",
  "What's your favorite hobby and how did you get into it?",
  "If you could teleport anywhere right now, where would you go?",
  "What's the best gift you've ever received?"
]

export function getDailyStarters(user: User | null): string[] {
  if (!user || user.isPremium) {
    return ALL_STARTERS
  }

  // Freemium: return 5 random starters
  const shuffled = [...ALL_STARTERS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 5)
}

export function getRandomStarter(user: User | null): string {
  const starters = getDailyStarters(user)
  return starters[Math.floor(Math.random() * starters.length)]
}