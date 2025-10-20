'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ChatRoom, AI_GENERATED_ROOM_CATEGORIES, RoomCategory } from '@/utils/types'
import { UsersIcon, SparklesIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { AIRoomGenerationService } from '@/lib/ai-room-generation'

export default function RoomBrowser() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    description: '',
    category: 'Technology Help Desk' as RoomCategory
  })

  // Load rooms from database
  useEffect(() => {
    loadRooms()

    // Set up real-time subscription for room updates
    const channel = supabase
      .channel('rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms'
        },
        () => {
          loadRooms() // Reload rooms on any change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('participant_count', { ascending: false })

      if (error) throw error

      const formattedRooms: ChatRoom[] = data.map(room => ({
        id: room.id,
        name: room.name,
        description: room.description,
        category: room.category,
        isAiGenerated: room.is_ai_generated,
        participantCount: room.participant_count,
        maxParticipants: room.max_participants,
        interests: room.interests,
        moderationRules: room.moderation_rules,
        createdBy: room.created_by,
        createdAt: new Date(room.created_at),
        updatedAt: new Date(room.updated_at)
      }))

      setRooms(formattedRooms)
    } catch (error) {
      console.error('Error loading rooms:', error)
      // Fallback to demo rooms
      loadDemoRooms()
    } finally {
      setIsLoading(false)
    }
  }

  const loadDemoRooms = () => {
    const demoRooms: ChatRoom[] = [
      {
        id: '1',
        name: 'Tech Talk Hub',
        description: 'Discuss latest technology trends, programming, and innovation',
        category: 'Technology Help Desk',
        isAiGenerated: true,
        participantCount: 24,
        maxParticipants: 50,
        interests: ['programming', 'ai', 'tech'],
        moderationRules: {},
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Mental Wellness Circle',
        description: 'A supportive space for sharing experiences and finding encouragement',
        category: 'Mental Wellness Support',
        isAiGenerated: true,
        participantCount: 18,
        maxParticipants: 30,
        interests: ['wellness', 'support', 'mindfulness'],
        moderationRules: {},
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        name: 'Gaming Universe',
        description: 'Connect with fellow gamers, share strategies and find teammates',
        category: 'Gaming Discussions',
        isAiGenerated: true,
        participantCount: 42,
        maxParticipants: 100,
        interests: ['gaming', 'esports', 'fun'],
        moderationRules: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    setRooms(demoRooms)
  }

  const filteredRooms = rooms.filter(room => {
    const matchesCategory = selectedCategory === 'all' || room.category === selectedCategory
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleJoinRoom = async (roomId: string) => {
    // TODO: Implement room joining logic with user authentication
    console.log('Joining room:', roomId)
    alert('Room joining will be implemented with user authentication!')
  }

  const handleCreateRoom = async () => {
    if (!newRoomData.name.trim() || !newRoomData.description.trim()) {
      alert('Please fill in all fields')
      return
    }

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: newRoomData.name.trim(),
          description: newRoomData.description.trim(),
          category: newRoomData.category,
          is_ai_generated: false, // User-created
          participant_count: 1,
          max_participants: 50,
          interests: [], // TODO: Extract interests from description
          moderation_rules: {
            auto_moderation: true,
            keyword_filters: [],
            behavior_monitoring: true
          }
        })
        .select()
        .single()

      if (error) throw error

      // Reset form and close modal
      setNewRoomData({ name: '', description: '', category: 'Technology Help Desk' })
      setShowCreateRoom(false)

      // Reload rooms
      loadRooms()

      console.log('Room created:', data)
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Failed to create room. Please try again.')
    }
  }

  const generateAIRooms = async () => {
    try {
      // Get trending topics from recent messages
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('content, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(100)

      const messageData = recentMessages?.map(msg => ({
        content: msg.content,
        timestamp: new Date(msg.created_at)
      })) || []

      const { trendingTopics } = await AIRoomGenerationService.analyzeEmergingTopics(messageData)

      if (trendingTopics.length > 0) {
        await AIRoomGenerationService.autoCreateRooms(trendingTopics, 3)
        loadRooms() // Reload to show new rooms
      }
    } catch (error) {
      console.error('Error generating AI rooms:', error)
    }
  }

  const filteredRooms = rooms.filter(room => {
    const matchesCategory = selectedCategory === 'all' || room.category === selectedCategory
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleJoinRoom = (roomId: string) => {
    // TODO: Implement room joining logic
    console.log('Joining room:', roomId)
  }

  const handleCreateRoom = () => {
    // TODO: Implement room creation logic
    console.log('Creating new room...')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Discover Chat Rooms
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Join AI-curated discussion spaces or create your own. Connect with people who share your interests.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            {/* Create Room Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateRoom}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              <SparklesIcon className="w-5 h-5" />
              Create Room
            </motion.button>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              All Rooms
            </motion.button>
            {AI_GENERATED_ROOM_CATEGORIES.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Rooms Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
            >
              {/* Room Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-white">{room.name}</h3>
                    {room.isAiGenerated && (
                      <SparklesIcon className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  <p className="text-white/70 text-sm">{room.description}</p>
                </div>
              </div>

              {/* Room Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-white/60">
                    <UsersIcon className="w-4 h-4" />
                    <span className="text-sm">{room.participantCount}/{room.maxParticipants}</span>
                  </div>
                  <span className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded-full">
                    {room.category}
                  </span>
                </div>
              </div>

              {/* Interests */}
              <div className="flex flex-wrap gap-1 mb-4">
                {room.interests.map((interest) => (
                  <span
                    key={interest}
                    className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full"
                  >
                    #{interest}
                  </span>
                ))}
              </div>

              {/* Join Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleJoinRoom(room.id)}
                disabled={room.participantCount >= room.maxParticipants}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                {room.participantCount >= room.maxParticipants ? 'Room Full' : 'Join Room'}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredRooms.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-white mb-2">No rooms found</h3>
            <p className="text-white/70 mb-6">Try adjusting your search or create a new room!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateRoom}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              Create Your Own Room
            </motion.button>
          </motion.div>
        )}

        {/* AI Generation Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3">
            <SparklesIcon className="w-5 h-5 text-cyan-400" />
            <span className="text-white/80 text-sm">
              Rooms are AI-generated based on current trends and user interests
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
