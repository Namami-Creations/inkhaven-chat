'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Play, Pause, Trash2, Send } from 'lucide-react'

interface VoiceMessageProps {
  onSend: (audioBlob: Blob, duration: number) => void
  disabled?: boolean
}

export default function VoiceMessage({ onSend, disabled = false }: VoiceMessageProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })

      streamRef.current = stream
      audioChunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)

        // Get duration
        const audio = new Audio(url)
        audio.onloadedmetadata = () => {
          setDuration(audio.duration)
        }
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setRecordingTime(0)

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 59) { // Max 60 seconds
            stopRecording()
            return 60
          }
          return prev + 1
        })
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }, [])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      // Clear recording timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }, [isRecording])

  // Play recorded audio
  const playAudio = useCallback(() => {
    if (!audioRef.current || !audioUrl) return

    audioRef.current.play()
    setIsPlaying(true)
    setPlaybackTime(0)

    // Start playback timer
    playbackIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setPlaybackTime(audioRef.current.currentTime)
      }
    }, 100)
  }, [audioUrl])

  // Pause recorded audio
  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)

      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
    }
  }, [])

  // Delete recorded audio
  const deleteAudio = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }

    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setRecordingTime(0)
    setPlaybackTime(0)
    setIsPlaying(false)

    if (audioRef.current) {
      audioRef.current = null
    }

    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current)
      playbackIntervalRef.current = null
    }
  }, [audioUrl])

  // Send voice message
  const sendVoiceMessage = useCallback(() => {
    if (audioBlob && duration > 0) {
      onSend(audioBlob, duration)
      deleteAudio() // Clear after sending
    }
  }, [audioBlob, duration, onSend, deleteAudio])

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
    }
  }, [audioUrl])

  if (audioBlob && audioUrl) {
    // Show recorded audio controls
    return (
      <div className="flex items-center space-x-2 bg-slate-700 rounded-lg p-3">
        <button
          onClick={isPlaying ? pauseAudio : playAudio}
          className="text-white hover:text-blue-400"
          disabled={disabled}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        <div className="flex-1">
          <div className="bg-slate-600 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${(playbackTime / duration) * 100}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {formatTime(playbackTime)} / {formatTime(duration)}
          </div>
        </div>

        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => {
            setIsPlaying(false)
            setPlaybackTime(0)
            if (playbackIntervalRef.current) {
              clearInterval(playbackIntervalRef.current)
              playbackIntervalRef.current = null
            }
          }}
          preload="metadata"
        />

        <button
          onClick={deleteAudio}
          className="text-red-400 hover:text-red-300"
          disabled={disabled}
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={sendVoiceMessage}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          disabled={disabled}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // Show recording controls
  return (
    <div className="flex items-center space-x-2">
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isRecording
            ? 'bg-red-600 hover:bg-red-700 animate-pulse'
            : 'bg-slate-700 hover:bg-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={disabled}
      >
        {isRecording ? (
          <MicOff className="w-5 h-5 text-white" />
        ) : (
          <Mic className="w-5 h-5 text-white" />
        )}
      </button>

      {isRecording && (
        <div className="flex items-center space-x-2 text-red-400">
          <div className="animate-pulse">
            <div className="w-2 h-2 bg-red-400 rounded-full" />
          </div>
          <span className="text-sm font-medium">
            {formatTime(recordingTime)}
          </span>
          <span className="text-xs text-slate-400">
            Recording... (max 60s)
          </span>
        </div>
      )}

      {!isRecording && !audioBlob && (
        <span className="text-xs text-slate-400">
          Hold to record voice message
        </span>
      )}
    </div>
  )
}
