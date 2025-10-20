'use client'

import { useState, useEffect, useMemo } from 'react'

interface EmojiItem {
  emoji: string
  label: string
  category: string
  keywords: string[]
  animalRelated?: boolean
}

interface Reaction {
  emoji: string
  label: string
  type: 'animal' | 'emotion'
}

interface AnimalEmojiSystemProps {
  showEmojiPicker?: boolean
  currentMessage?: string
  userAnimal?: string
  mood?: string
  onEmojiSelected?: (emoji: EmojiItem) => void
  onReactionSent?: (reaction: Reaction) => void
}

// Emoji categories
const emojiCategories = [
  { id: 'animals', icon: '🐾', label: 'Animals' },
  { id: 'emotions', icon: '😊', label: 'Emotions' },
  { id: 'nature', icon: '🌿', label: 'Nature' },
  { id: 'food', icon: '🍎', label: 'Food' },
  { id: 'activities', icon: '⚽', label: 'Activities' },
]

// Comprehensive emoji library with animal themes
const emojiLibrary: EmojiItem[] = [
  // Animals
  {
    emoji: '🦁',
    label: 'Lion',
    category: 'animals',
    keywords: ['lion', 'king', 'strong', 'leader'],
    animalRelated: true,
  },
  {
    emoji: '🐬',
    label: 'Dolphin',
    category: 'animals',
    keywords: ['dolphin', 'smart', 'playful', 'ocean'],
    animalRelated: true,
  },
  {
    emoji: '🦉',
    label: 'Owl',
    category: 'animals',
    keywords: ['owl', 'wise', 'night', 'think'],
    animalRelated: true,
  },
  {
    emoji: '🐺',
    label: 'Wolf',
    category: 'animals',
    keywords: ['wolf', 'pack', 'loyal', 'howl'],
    animalRelated: true,
  },
  {
    emoji: '🐼',
    label: 'Panda',
    category: 'animals',
    keywords: ['panda', 'cute', 'bamboo', 'china'],
    animalRelated: true,
  },
  {
    emoji: '🦅',
    label: 'Eagle',
    category: 'animals',
    keywords: ['eagle', 'freedom', 'vision', 'fly'],
    animalRelated: true,
  },
  {
    emoji: '🐘',
    label: 'Elephant',
    category: 'animals',
    keywords: ['elephant', 'memory', 'strong', 'trunk'],
    animalRelated: true,
  },
  {
    emoji: '🐧',
    label: 'Penguin',
    category: 'animals',
    keywords: ['penguin', 'antarctica', 'cute', 'waddle'],
    animalRelated: true,
  },
  {
    emoji: '🐰',
    label: 'Rabbit',
    category: 'animals',
    keywords: ['rabbit', 'bunny', 'cute', 'hop'],
    animalRelated: true,
  },
  {
    emoji: '🐨',
    label: 'Koala',
    category: 'animals',
    keywords: ['koala', 'australia', 'sleepy', 'eucalyptus'],
    animalRelated: true,
  },
  {
    emoji: '🐯',
    label: 'Tiger',
    category: 'animals',
    keywords: ['tiger', 'stripe', 'powerful', 'asia'],
    animalRelated: true,
  },
  {
    emoji: '🐝',
    label: 'Bee',
    category: 'animals',
    keywords: ['bee', 'buzz', 'honey', 'hive'],
    animalRelated: true,
  },
  {
    emoji: '🦥',
    label: 'Sloth',
    category: 'animals',
    keywords: ['sloth', 'slow', 'hang', 'sleepy'],
    animalRelated: true,
  },
  {
    emoji: '🐆',
    label: 'Cheetah',
    category: 'animals',
    keywords: ['cheetah', 'fast', 'spots', 'speed'],
    animalRelated: true,
  },
  {
    emoji: '🐙',
    label: 'Octopus',
    category: 'animals',
    keywords: ['octopus', 'tentacle', 'smart', 'ocean'],
    animalRelated: true,
  },
  {
    emoji: '🦚',
    label: 'Peacock',
    category: 'animals',
    keywords: ['peacock', 'beautiful', 'feather', 'dance'],
    animalRelated: true,
  },
  {
    emoji: '🐦',
    label: 'Hummingbird',
    category: 'animals',
    keywords: ['bird', 'small', 'fast', 'flower'],
    animalRelated: true,
  },
  {
    emoji: '🐢',
    label: 'Turtle',
    category: 'animals',
    keywords: ['turtle', 'slow', 'wise', 'shell'],
    animalRelated: true,
  },

  // Emotions
  {
    emoji: '😊',
    label: 'Happy',
    category: 'emotions',
    keywords: ['happy', 'smile', 'good', 'joy'],
  },
  {
    emoji: '😂',
    label: 'Laughing',
    category: 'emotions',
    keywords: ['laugh', 'funny', 'lol', 'haha'],
  },
  {
    emoji: '😍',
    label: 'Love',
    category: 'emotions',
    keywords: ['love', 'heart', 'cute', 'adorable'],
  },
  {
    emoji: '🤔',
    label: 'Thinking',
    category: 'emotions',
    keywords: ['think', 'wonder', 'hmm', 'confused'],
  },
  {
    emoji: '😮',
    label: 'Wow',
    category: 'emotions',
    keywords: ['wow', 'surprise', 'amazing', 'shock'],
  },
  { emoji: '😢', label: 'Sad', category: 'emotions', keywords: ['sad', 'cry', 'unhappy', 'tear'] },
  {
    emoji: '😠',
    label: 'Angry',
    category: 'emotions',
    keywords: ['angry', 'mad', 'upset', 'furious'],
  },
  {
    emoji: '🤩',
    label: 'Excited',
    category: 'emotions',
    keywords: ['excited', 'wow', 'amazing', 'star'],
  },
  {
    emoji: '😴',
    label: 'Sleepy',
    category: 'emotions',
    keywords: ['sleepy', 'tired', 'sleep', ' yawn'],
  },
  {
    emoji: '😎',
    label: 'Cool',
    category: 'emotions',
    keywords: ['cool', 'awesome', 'sunglasses', 'stylish'],
  },

  // Nature
  {
    emoji: '🌿',
    label: 'Herb',
    category: 'nature',
    keywords: ['plant', 'green', 'nature', 'leaf'],
  },
  {
    emoji: '🌸',
    label: 'Flower',
    category: 'nature',
    keywords: ['flower', 'pink', 'pretty', 'garden'],
  },
  { emoji: '🌊', label: 'Wave', category: 'nature', keywords: ['ocean', 'water', 'beach', 'sea'] },
  { emoji: '🌙', label: 'Moon', category: 'nature', keywords: ['moon', 'night', 'sky', 'stars'] },
  { emoji: '☀️', label: 'Sun', category: 'nature', keywords: ['sun', 'bright', 'day', 'warm'] },
  {
    emoji: '🌈',
    label: 'Rainbow',
    category: 'nature',
    keywords: ['rainbow', 'colorful', 'beautiful', 'rain'],
  },

  // Food
  { emoji: '🍎', label: 'Apple', category: 'food', keywords: ['apple', 'fruit', 'red', 'healthy'] },
  {
    emoji: '🍕',
    label: 'Pizza',
    category: 'food',
    keywords: ['pizza', 'food', 'cheese', 'italian'],
  },
  {
    emoji: '🍦',
    label: 'Ice Cream',
    category: 'food',
    keywords: ['ice cream', 'sweet', 'cold', 'dessert'],
  },
  {
    emoji: '☕',
    label: 'Coffee',
    category: 'food',
    keywords: ['coffee', 'drink', 'morning', 'energy'],
  },

  // Activities
  {
    emoji: '⚽',
    label: 'Soccer',
    category: 'activities',
    keywords: ['soccer', 'football', 'sport', 'game'],
  },
  {
    emoji: '🎵',
    label: 'Music',
    category: 'activities',
    keywords: ['music', 'song', 'sound', 'melody'],
  },
  {
    emoji: '🎨',
    label: 'Art',
    category: 'activities',
    keywords: ['art', 'paint', 'draw', 'create'],
  },
  {
    emoji: '📚',
    label: 'Books',
    category: 'activities',
    keywords: ['book', 'read', 'learn', 'study'],
  },
]

export default function AnimalEmojiSystem({
  showEmojiPicker = true,
  currentMessage,
  userAnimal,
  mood,
  onEmojiSelected,
  onReactionSent
}: AnimalEmojiSystemProps) {
  const [activeCategory, setActiveCategory] = useState('animals')
  const [smartSuggestions, setSmartSuggestions] = useState<EmojiItem[]>([])

  // Quick reactions based on context
  const quickReactions = useMemo(() => {
    const reactions: Reaction[] = [
      { emoji: '👍', label: 'Like', type: 'emotion' },
      { emoji: '❤️', label: 'Love', type: 'emotion' },
      { emoji: '😂', label: 'Funny', type: 'emotion' },
      { emoji: '😮', label: 'Wow', type: 'emotion' },
      { emoji: '🤔', label: 'Think', type: 'emotion' },
    ]

    // Add animal-specific reactions based on user's animal
    if (userAnimal) {
      const animalKey = userAnimal.toLowerCase()
      const animalEmojis: Record<string, string> = {
        lion: '🦁',
        dolphin: '🐬',
        owl: '🦉',
        wolf: '🐺',
        panda: '🐼',
        eagle: '🦅',
        elephant: '🐘',
        penguin: '🐧',
        rabbit: '🐰',
        koala: '🐨',
        tiger: '🐯',
        bee: '🐝',
        sloth: '🦥',
        cheetah: '🐆',
        octopus: '🐙',
        peacock: '🦚',
        hummingbird: '🐦',
        turtle: '🐢'
      }

      if (animalEmojis[animalKey]) {
        reactions.unshift({
          emoji: animalEmojis[animalKey],
          label: `${userAnimal} Power`,
          type: 'animal',
        })
      }
    }

    return reactions.slice(0, 5) // Limit to 5 quick reactions
  }, [userAnimal])

  const filteredEmojis = useMemo(() => {
    return emojiLibrary.filter(emoji => emoji.category === activeCategory)
  }, [activeCategory])

  // Generate smart suggestions based on message content
  const generateSmartSuggestions = () => {
    if (!currentMessage) {
      setSmartSuggestions([])
      return
    }

    const message = currentMessage.toLowerCase()

    // Simple keyword matching for suggestions
    const suggestions: EmojiItem[] = []

    // Animal-related keywords
    if (message.includes('happy') || message.includes('good') || message.includes('great')) {
      const happyEmoji = emojiLibrary.find(e => e.emoji === '😊')
      const excitedEmoji = emojiLibrary.find(e => e.emoji === '🤩')
      if (happyEmoji) suggestions.push(happyEmoji)
      if (excitedEmoji) suggestions.push(excitedEmoji)
    }

    if (message.includes('sad') || message.includes('bad') || message.includes('sorry')) {
      const sadEmoji = emojiLibrary.find(e => e.emoji === '😢')
      if (sadEmoji) suggestions.push(sadEmoji)
    }

    if (message.includes('think') || message.includes('wonder') || message.includes('hmm')) {
      const thinkingEmoji = emojiLibrary.find(e => e.emoji === '🤔')
      const owlEmoji = emojiLibrary.find(e => e.emoji === '🦉')
      if (thinkingEmoji) suggestions.push(thinkingEmoji)
      if (owlEmoji) suggestions.push(owlEmoji)
    }

    if (message.includes('love') || message.includes('cute') || message.includes('adorable')) {
      const loveEmoji = emojiLibrary.find(e => e.emoji === '😍')
      if (loveEmoji) suggestions.push(loveEmoji)
    }

    if (message.includes('laugh') || message.includes('funny') || message.includes('lol')) {
      const laughingEmoji = emojiLibrary.find(e => e.emoji === '😂')
      if (laughingEmoji) suggestions.push(laughingEmoji)
    }

    // Add animal-specific suggestions based on user's animal
    if (userAnimal) {
      const userAnimalEmoji = emojiLibrary.find(
        e => e.label.toLowerCase() === userAnimal.toLowerCase()
      )
      if (userAnimalEmoji) {
        suggestions.unshift(userAnimalEmoji)
      }
    }

    // Limit to 4 suggestions and remove duplicates
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 4)
    setSmartSuggestions(uniqueSuggestions)
  }

  const selectEmoji = (emoji: EmojiItem) => {
    onEmojiSelected?.(emoji)
  }

  const sendReaction = (reaction: Reaction) => {
    onReactionSent?.(reaction)
  }

  useEffect(() => {
    generateSmartSuggestions()
  }, [currentMessage, userAnimal])

  if (!showEmojiPicker) return null

  return (
    <div className="animal-emoji-system">
      {/* Quick reaction bar */}
      {quickReactions.length > 0 && (
        <div className="quick-reactions">
          {quickReactions.map((reaction, index) => (
            <button
              key={index}
              onClick={() => sendReaction(reaction)}
              className="quick-reaction-btn"
              title={reaction.label}
            >
              <span className="reaction-emoji">{reaction.emoji}</span>
              <span className="reaction-label">{reaction.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji categories */}
      <div className="emoji-categories">
        {emojiCategories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
          >
            <span className="category-icon">{category.icon}</span>
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="emoji-grid">
        {filteredEmojis.map(emoji => (
          <div
            key={emoji.emoji}
            onClick={() => selectEmoji(emoji)}
            className="emoji-item"
            title={emoji.label}
          >
            <span className="emoji">{emoji.emoji}</span>
            <span className="emoji-name">{emoji.label}</span>
          </div>
        ))}
      </div>

      {/* Smart suggestions based on message */}
      {smartSuggestions.length > 0 && (
        <div className="smart-suggestions">
          <h4>Suggested for your message:</h4>
          <div className="suggestion-row">
            {smartSuggestions.map(suggestion => (
              <button
                key={suggestion.emoji}
                onClick={() => selectEmoji(suggestion)}
                className="suggestion-btn"
              >
                <span className="suggestion-emoji">{suggestion.emoji}</span>
                <span className="suggestion-label">{suggestion.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .animal-emoji-system {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 16px;
          margin: 8px 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .quick-reactions {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .quick-reactions::-webkit-scrollbar {
          display: none;
        }

        .quick-reaction-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 60px;
        }

        .quick-reaction-btn:hover {
          background: rgba(102, 126, 234, 0.2);
          transform: translateY(-2px);
        }

        .reaction-emoji {
          font-size: 20px;
        }

        .reaction-label {
          font-size: 10px;
          font-weight: 500;
          color: #2c3e50;
        }

        .emoji-categories {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          justify-content: center;
        }

        .category-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 2px solid #e0e0e0;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 18px;
        }

        .category-btn:hover {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }

        .category-btn.active {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
          gap: 8px;
          margin-bottom: 16px;
          max-height: 200px;
          overflow-y: auto;
        }

        .emoji-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(255, 255, 255, 0.5);
        }

        .emoji-item:hover {
          background: rgba(102, 126, 234, 0.1);
          transform: scale(1.05);
        }

        .emoji {
          font-size: 24px;
        }

        .emoji-name {
          font-size: 10px;
          color: #666;
          text-align: center;
          line-height: 1.2;
        }

        .smart-suggestions {
          border-top: 1px solid #f0f0f0;
          padding-top: 12px;
        }

        .smart-suggestions h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #2c3e50;
          font-weight: 600;
        }

        .suggestion-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .suggestion-row::-webkit-scrollbar {
          display: none;
        }

        .suggestion-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
        }

        .suggestion-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .suggestion-emoji {
          font-size: 16px;
        }

        .suggestion-label {
          font-size: 12px;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .animal-emoji-system {
            margin: 8px 4px;
            padding: 12px;
          }

          .emoji-grid {
            grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
            gap: 6px;
            max-height: 160px;
          }

          .emoji-item {
            padding: 6px;
          }

          .emoji {
            font-size: 20px;
          }

          .emoji-name {
            font-size: 9px;
          }

          .quick-reactions {
            gap: 6px;
          }

          .quick-reaction-btn {
            min-width: 50px;
            padding: 6px 8px;
          }

          .reaction-emoji {
            font-size: 18px;
          }

          .reaction-label {
            font-size: 9px;
          }

          .suggestion-btn {
            padding: 6px 10px;
            font-size: 12px;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .animal-emoji-system {
            background: rgba(30, 30, 30, 0.95);
            border-color: rgba(255, 255, 255, 0.1);
          }

          .quick-reaction-btn {
            background: rgba(102, 126, 234, 0.2);
            border-color: rgba(102, 126, 234, 0.3);
          }

          .category-btn {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
          }

          .emoji-item {
            background: rgba(255, 255, 255, 0.1);
          }

          .emoji-name {
            color: #ccc;
          }
        }
      `}</style>
    </div>
  )
}
