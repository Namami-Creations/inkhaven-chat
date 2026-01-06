'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useFeatureAccess'
import { canAccessFeature } from '@/lib/feature-gate'
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, Users } from 'lucide-react'

interface MusicTrack {
  id: string
  title: string
  artist: string
  url: string
  duration: number
}

interface MusicSession {
  id: string
  session_id: string
  current_track: MusicTrack | null
  is_playing: boolean
  current_time: number
  volume: number
  participants: string[]
  created_at: string
  updated_at: string
}

interface MusicSyncProps {
  sessionId: string
  onClose: () => void
}

export default function MusicSync({ sessionId, onClose }: MusicSyncProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [musicSession, setMusicSession] = useState<MusicSession | null>(null)
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isPlaying, setIsPlaying] = useState(false)
  const [participants, setParticipants] = useState<string[]>([])
  const user = useUser()

  const canUseMusic = canAccessFeature(user, 'music_sync')

  useEffect(() => {
    if (!canUseMusic) return

    // Subscribe to music session updates
    const channel = supabase
      .channel(`music-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'music_sessions',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updatedSession = payload.new as MusicSession
          setMusicSession(updatedSession)
          syncPlayback(updatedSession)
        }
      })
      .subscribe()

    // Load or create music session
    loadMusicSession()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, canUseMusic])

  const loadMusicSession = async () => {
    // Try to find existing session
    const { data: existing } = await (supabase as any)
      .from('music_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (existing) {
      setMusicSession(existing)
      syncPlayback(existing)
    } else {
      // Create new session
      const newSession = {
        session_id: sessionId,
        current_track: null,
        is_playing: false,
        current_time: 0,
        volume: 0.7,
        participants: user ? [user.id] : []
      }

      const { data } = await (supabase as any)
        .from('music_sessions')
        .insert(newSession)
        .select()
        .single()

      if (data) {
        setMusicSession(data)
      }
    }

    // Load sample tracks (in a real app, this would come from a music service)
    loadSampleTracks()
  }

  const loadSampleTracks = () => {
    // Sample tracks - in production, integrate with Spotify, YouTube, etc.
    const sampleTracks: MusicTrack[] = [
      {
        id: '1',
        title: 'Sample Track 1',
        artist: 'Artist 1',
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
        duration: 180
      },
      {
        id: '2',
        title: 'Sample Track 2',
        artist: 'Artist 2',
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
        duration: 240
      }
    ]
    setTracks(sampleTracks)
  }

  const syncPlayback = (session: MusicSession) => {
    if (!audioRef.current) return

    setIsPlaying(session.is_playing)
    setCurrentTime(session.current_time)
    setVolume(session.volume)

    if (Math.abs(audioRef.current.currentTime - session.current_time) > 1) {
      audioRef.current.currentTime = session.current_time
    }

    audioRef.current.volume = session.volume

    if (session.is_playing && audioRef.current.paused) {
      audioRef.current.play().catch(console.error)
    } else if (!session.is_playing && !audioRef.current.paused) {
      audioRef.current.pause()
    }
  }

  const updateSession = async (updates: Partial<MusicSession>) => {
    if (!musicSession) return

    const { data } = await (supabase as any)
      .from('music_sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', musicSession.id)
      .select()
      .single()

    if (data) {
      setMusicSession(data)
    }
  }

  const playTrack = async (track: MusicTrack) => {
    if (!audioRef.current) return

    audioRef.current.src = track.url
    audioRef.current.currentTime = 0

    await updateSession({
      current_track: track,
      current_time: 0,
      is_playing: true
    })
  }

  const togglePlayPause = async () => {
    const newPlayingState = !isPlaying
    await updateSession({ is_playing: newPlayingState })
  }

  const seekTo = async (time: number) => {
    await updateSession({ current_time: time })
  }

  const changeVolume = async (newVolume: number) => {
    setVolume(newVolume)
    await updateSession({ volume: newVolume })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = async () => {
      await updateSession({ is_playing: false, current_time: 0 })
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  if (!canUseMusic) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Premium Feature</h3>
          <p className="text-gray-600 mb-4">
            Music Sync is available for premium users only.
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">Close</button>
            <button onClick={() => {/* Open pricing modal */}} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">Upgrade</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            <span className="font-semibold">Music Sync</span>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{participants.length} listening</span>
            </div>
          </div>
          <button onClick={onClose} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">Close</button>
        </div>

        <div className="flex-1 p-4 flex flex-col lg:flex-row gap-4">
          {/* Track List */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-4">Available Tracks</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                    musicSession?.current_track?.id === track.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => playTrack(track)}
                >
                  <div className="font-medium">{track.title}</div>
                  <div className="text-sm text-gray-600">{track.artist}</div>
                  <div className="text-xs text-gray-500">{formatTime(track.duration)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Player Controls */}
          <div className="lg:w-80">
            <h3 className="text-lg font-semibold mb-4">Now Playing</h3>

            {musicSession?.current_track ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="font-medium text-lg">{musicSession.current_track.title}</div>
                  <div className="text-gray-600">{musicSession.current_track.artist}</div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={musicSession.current_track.duration}
                    value={currentTime}
                    onChange={(e) => seekTo(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(musicSession.current_track.duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button
                    onClick={togglePlayPause}
                    className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => changeVolume(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">{Math.round(volume * 100)}%</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select a track to start playing
              </div>
            )}
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio ref={audioRef} />
      </div>
    </div>
  )
}