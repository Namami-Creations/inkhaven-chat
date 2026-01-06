'use client'

import { useState, useEffect } from 'react'
import { Hash, Users, Crown } from 'lucide-react'
import { useUser } from '@/hooks/useFeatureAccess'

interface ThemedRoom {
  id: string
  name: string
  description: string
  category: string
  is_premium: boolean
  active_users: number
}

const ROOM_CATEGORIES = {
  general: 'General',
  night_owls: 'Night Owls',
  gaming: 'Gaming',
  philosophy: 'Philosophy',
  book_club: 'Book Club',
  music: 'Music',
  art: 'Art',
  sports: 'Sports'
}

export default function ThemedRooms({ onJoinRoom }: { onJoinRoom?: (room: ThemedRoom) => void }) {
  const [rooms, setRooms] = useState<ThemedRoom[]>([])
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [isLoading, setIsLoading] = useState(true)
  const user = useUser()

  useEffect(() => {
    loadRooms()
  }, [selectedCategory])

  const loadRooms = async () => {
    setIsLoading(true)
    try {
      // TODO: API call to get rooms
      // Mock data
      const mockRooms: ThemedRoom[] = [
        {
          id: '1',
          name: 'Casual Chat',
          description: 'Just hanging out and talking about life',
          category: 'general',
          is_premium: false,
          active_users: 12
        },
        {
          id: '2',
          name: 'Late Night Thoughts',
          description: 'Deep conversations when the world sleeps',
          category: 'night_owls',
          is_premium: false,
          active_users: 8
        },
        {
          id: '3',
          name: 'Gaming Squad',
          description: 'Talk about games, strategies, and esports',
          category: 'gaming',
          is_premium: false,
          active_users: 25
        },
        {
          id: '4',
          name: 'Philosophy Corner',
          description: 'Discuss life, existence, and the universe',
          category: 'philosophy',
          is_premium: true,
          active_users: 5
        }
      ]
      setRooms(mockRooms.filter(room => room.category === selectedCategory))
    } catch (error) {
      console.error('Failed to load rooms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const availableCategories = user?.isPremium
    ? Object.keys(ROOM_CATEGORIES)
    : ['general', 'night_owls', 'gaming'] // Freemium limit

  return (
    <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Themed Rooms</h3>
        </div>
        {!user?.isPremium && (
          <span className="text-amber-400 bg-amber-500/10 px-2 py-1 rounded text-xs">
            3 rooms limit
          </span>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {availableCategories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {ROOM_CATEGORIES[category as keyof typeof ROOM_CATEGORIES]}
          </button>
        ))}
        {!user?.isPremium && (
          <div className="flex items-center gap-1 px-3 py-2 bg-slate-700/50 text-slate-400 rounded-lg text-sm">
            <Crown size={14} />
            More with Premium
          </div>
        )}
      </div>

      {/* Rooms list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-700 rounded-lg p-4">
              <div className="h-4 bg-slate-600 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-slate-600 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-medium">{room.name}</h4>
                    {room.is_premium && <Crown size={14} className="text-yellow-400" />}
                  </div>
                  <p className="text-slate-300 text-sm mb-2">{room.description}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Users size={12} />
                    <span>{room.active_users} active</span>
                  </div>
                </div>
                <button
                  onClick={() => onJoinRoom?.(room)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}