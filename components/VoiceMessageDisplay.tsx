'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'

interface VoiceMessageDisplayProps {
  fileUrl: string
  duration: number
  isOwn: boolean
  timestamp: string
}

export default function VoiceMessageDisplay({
  fileUrl,
  duration,
  isOwn,
  timestamp
}: VoiceMessageDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const audio = new Audio(fileUrl)
    audioRef.current = audio

    audio.onloadedmetadata = () => {
      setIsLoaded(true)
    }

    audio.onended = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }

    audio.onerror = () => {
      console.error('Failed to load audio')
      setIsLoaded(false)
    }

    return () => {
      audio.pause()
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [fileUrl])

  const togglePlayback = () => {
    if (!audioRef.current || !isLoaded) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    } else {
      audioRef.current.play()
      setIsPlaying(true)

      // Start progress tracking
      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
        }
      }, 100)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-xs px-4 py-3 rounded-lg ${
          isOwn
            ? 'bg-blue-600 text-white'
            : 'bg-slate-700 text-slate-200'
        }`}
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={togglePlayback}
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isPlaying
                ? 'bg-white bg-opacity-20'
                : 'bg-white bg-opacity-10 hover:bg-opacity-20'
            } transition-colors`}
            disabled={!isLoaded}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <Volume2 className="w-3 h-3 opacity-70" />
              <span className="text-xs opacity-70">
                {isPlaying ? formatTime(currentTime) : formatTime(duration)}
              </span>
            </div>

            <div className="bg-black bg-opacity-20 rounded-full h-1.5">
              <div
                className="bg-white bg-opacity-70 h-1.5 rounded-full transition-all duration-100"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="text-xs opacity-70 mt-2">
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}