'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from 'lucide-react'

interface VideoChatProps {
  sessionId: string
  userId: string
  partnerId: string
  onEndCall: () => void
}

export default function VideoChat({ sessionId, userId, partnerId, onEndCall }: VideoChatProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isPartnerAudioEnabled, setIsPartnerAudioEnabled] = useState(true)
  const [isPartnerVideoEnabled, setIsPartnerVideoEnabled] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const callStartTimeRef = useRef<number | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const signalingCleanupRef = useRef<null | (() => void | Promise<void>)>(null)

  // WebRTC configuration with STUN (always) and TURN (only when configured)
  const iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]

  const meteredDomain = process.env.NEXT_PUBLIC_METERED_DOMAIN
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL

  if (meteredDomain && turnUsername && turnCredential) {
    iceServers.push({
      urls: [
        `turn:${meteredDomain}:80`,
        `turn:${meteredDomain}:80?transport=tcp`,
        `turn:${meteredDomain}:443`,
        `turn:${meteredDomain}:443?transport=tcp`
      ],
      username: turnUsername,
      credential: turnCredential
    })
  }

  const rtcConfiguration: RTCConfiguration = { iceServers }

  // Initialize call duration timer
  useEffect(() => {
    if (isConnected) {
      callStartTimeRef.current = Date.now()
      durationIntervalRef.current = setInterval(() => {
        if (callStartTimeRef.current) {
          setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000))
        }
      }, 1000)
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
      callStartTimeRef.current = null
      setCallDuration(0)
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [isConnected])

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Initialize WebRTC peer connection
  const initializePeerConnection = useCallback(async () => {
    try {
      peerConnectionRef.current = new RTCPeerConnection(rtcConfiguration)

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to partner via Supabase
          sendSignalingMessage('ice-candidate', event.candidate)
        }
      }

      // Handle connection state changes
      peerConnectionRef.current.onconnectionstatechange = () => {
        const state = peerConnectionRef.current?.connectionState
        console.log('Connection state:', state)

        if (state === 'connected') {
          setIsConnected(true)
          setIsInitializing(false)
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          setIsConnected(false)
          void endCall({ notifyPartner: false })
        }
      }

      // Handle remote stream + audio/video state changes
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteStreamRef.current = event.streams[0]
          remoteVideoRef.current.srcObject = event.streams[0]

          // Monitor remote audio tracks
          const audioTracks = event.streams[0].getAudioTracks()
          setIsPartnerAudioEnabled(audioTracks.some(track => track.enabled))

          // Monitor remote video tracks
          const videoTracks = event.streams[0].getVideoTracks()
          setIsPartnerVideoEnabled(videoTracks.some(track => track.enabled))
        }
      }

    } catch (error) {
      console.error('Failed to initialize peer connection:', error)
      void endCall({ notifyPartner: false })
    }
  }, [])

  // Get user media (camera and microphone)
  const getUserMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      localStreamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Add tracks to peer connection
      if (peerConnectionRef.current) {
        stream.getTracks().forEach(track => {
          peerConnectionRef.current!.addTrack(track, stream)
        })
      }

      return stream
    } catch (error) {
      console.error('Failed to get user media:', error)
      throw error
    }
  }, [])

  // Send signaling messages via Supabase
  const sendSignalingMessage = async (type: string, data: any) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase
        .from('call_signals')
        .insert({
          session_id: sessionId,
          from_user_id: userId,
          to_user_id: partnerId,
          signal_type: type,
          signal_data: data,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to send signaling message:', error)
    }
  }

  // Listen for signaling messages
  const listenForSignalingMessages = useCallback(async () => {
    const { supabase } = await import('@/lib/supabase')

    const channel = supabase
      .channel(`call-signals-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `session_id=eq.${sessionId}`
        },
        async (payload) => {
          const signal = payload.new
          if (signal.to_user_id !== userId) return

          try {
            switch (signal.signal_type) {
              case 'offer':
                await handleOffer(signal.signal_data)
                break
              case 'answer':
                await handleAnswer(signal.signal_data)
                break
              case 'ice-candidate':
                await handleIceCandidate(signal.signal_data)
                break
              case 'audio-toggle':
                setIsPartnerAudioEnabled(signal.signal_data.enabled)
                break
              case 'video-toggle':
                setIsPartnerVideoEnabled(signal.signal_data.enabled)
                break
              case 'end-call':
                void endCall({ notifyPartner: false })
                break
            }
          } catch (error) {
            console.error('Error handling signaling message:', error)
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [sessionId, userId])

  const endCall = useCallback(
    async ({ notifyPartner }: { notifyPartner: boolean }) => {
      if (notifyPartner) {
        try {
          await sendSignalingMessage('end-call', {})
        } catch (error) {
          console.error('Error sending end-call signal:', error)
        }
      }

      if (signalingCleanupRef.current) {
        try {
          await signalingCleanupRef.current()
        } catch (error) {
          console.error('Error cleaning up signaling channel:', error)
        }
        signalingCleanupRef.current = null
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }

      setIsConnected(false)
      setIsInitializing(false)
      onEndCall()
    },
    [onEndCall]
  )

  // Handle incoming offer
  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peerConnectionRef.current.createAnswer()
      await peerConnectionRef.current.setLocalDescription(answer)
      await sendSignalingMessage('answer', answer)
    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }

  // Handle incoming answer
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  // Handle ICE candidate
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return

    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (error) {
      console.error('Error handling ICE candidate:', error)
    }
  }

  // Start call (create offer)
  const startCall = async () => {
    try {
      setIsInitializing(true)
      await initializePeerConnection()
      await getUserMedia()
      signalingCleanupRef.current = await listenForSignalingMessages()

      if (peerConnectionRef.current) {
        const offer = await peerConnectionRef.current.createOffer()
        await peerConnectionRef.current.setLocalDescription(offer)
        await sendSignalingMessage('offer', offer)
      }
    } catch (error) {
      console.error('Failed to start call:', error)
      void endCall({ notifyPartner: false })
    }
  }

  // Toggle audio
  const toggleAudio = async () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      const enabled = audioTracks.some(track => track.enabled)
      setIsAudioEnabled(enabled)
      await sendSignalingMessage('audio-toggle', { enabled })
    }
  }

  // Toggle video
  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      const enabled = videoTracks.some(track => track.enabled)
      setIsVideoEnabled(enabled)
      await sendSignalingMessage('video-toggle', { enabled })
    }
  }

  // Toggle mute (local mute)
  const toggleMute = () => {
    setIsMuted(!isMuted)
    // This is local mute - doesn't affect the stream sent to partner
  }

  const handleEndCall = useCallback(async () => {
    await endCall({ notifyPartner: true })
  }, [endCall])

  // Initialize call on mount
  useEffect(() => {
    startCall()

    return () => {
      void endCall({ notifyPartner: true })
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
    }
  }, [])

  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-white text-lg font-semibold mb-2">Connecting...</h3>
          <p className="text-slate-400">Setting up video call</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Remote video (full screen) */}
      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        {!isPartnerVideoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <div className="text-center">
              <div className="w-24 h-24 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <VideoOff className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-slate-400">Partner's camera is off</p>
            </div>
          </div>
        )}
        {!isPartnerAudioEnabled && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
            <MicOff className="w-4 h-4 inline mr-1" />
            Partner muted
          </div>
        )}

        {/* Call duration */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg">
          {formatDuration(callDuration)}
        </div>
      </div>

      {/* Local video (picture-in-picture) */}
      <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
            <VideoOff className="w-8 h-8 text-slate-400" />
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="bg-slate-900 p-6">
        <div className="flex items-center justify-center space-x-4">
          {/* Audio toggle */}
          <button
            onClick={toggleAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isAudioEnabled
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {/* Video toggle */}
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isVideoEnabled
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          {/* Mute toggle (local) */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              !isMuted
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>

          {/* End call */}
          <button
            onClick={handleEndCall}
            className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}