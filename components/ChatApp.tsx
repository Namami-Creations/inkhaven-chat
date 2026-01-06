'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import InterestSelector from './InterestSelector'
import VoiceMessage from './VoiceMessage'
import VoiceMessageDisplay from './VoiceMessageDisplay'
import VideoChat from './VideoChat'
import Turnstile from './Turnstile'
import BottleMessage from './BottleMessage'
import StoryMode from './StoryMode'
import ThemedRooms from './ThemedRooms'
import CollaborativeCanvas from './CollaborativeCanvas'
import MusicSync from './MusicSync'
import TimeCapsule from './TimeCapsule'
import PricingModal from './PricingModal'
import { useUser } from '@/hooks/useFeatureAccess'
import { getRandomStarter } from '@/lib/conversation-starters'
import {
  Sparkles,
  ShieldCheck,
  Mic,
  Video,
  Flag,
  RefreshCw,
  Loader2,
  LogOut,
  Send,
  Crown
} from 'lucide-react'

type Stage = 'pref' | 'matching' | 'chat' | 'video'

type Message = {
  id: string
  session_id: string
  user_id: string
  content: string
  created_at: string
  type?: 'text' | 'voice'
  voice_message?: any
}

export default function ChatApp() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('pref')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const sessionInitPromiseRef = useRef<Promise<{ userId: string; token: string } | null> | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRequired, setCaptchaRequired] = useState(false)
  const [captchaError, setCaptchaError] = useState<string | null>(null)
  const [partner, setPartner] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isVideo, setIsVideo] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [showBottle, setShowBottle] = useState(false)
  const [showStory, setShowStory] = useState(false)
  const [showRooms, setShowRooms] = useState(false)
  const [showCanvas, setShowCanvas] = useState(false)
  const [showMusic, setShowMusic] = useState(false)
  const [showTimeCapsule, setShowTimeCapsule] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [prefData, setPrefData] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const user = useUser()

  // Scroll helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Bootstrap Supabase anonymous auth once (required for RLS-protected Realtime)
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        let session = sessionData.session

        if (!session) {
          const { data, error } = await supabase.auth.signInAnonymously()
          if (error) throw error
          session = data.session
        }

        if (!session?.user?.id || !session.access_token) {
          throw new Error('Supabase session unavailable')
        }

        if (cancelled) return
        setUserId(session.user.id)
        setSessionToken(session.access_token)
      } catch (err) {
        console.error(err)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  const ensureSession = async (tokenOverride?: string | null): Promise<{ userId: string; token: string } | null> => {
    if (userId && sessionToken) return { userId, token: sessionToken }

    if (!sessionInitPromiseRef.current) {
      sessionInitPromiseRef.current = (async () => {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        let session = sessionData.session
        if (!session) {
          const { data, error } = await (supabase.auth as any).signInAnonymously(
            tokenOverride
              ? { options: { captchaToken: tokenOverride } }
              : undefined
          )
          if (error) throw error
          session = data.session
        }

        const resolvedUserId = session?.user?.id
        const resolvedToken = session?.access_token
        if (!resolvedUserId || !resolvedToken) {
          throw new Error('Supabase session unavailable')
        }

        setUserId(resolvedUserId)
        setSessionToken(resolvedToken)
        return { userId: resolvedUserId, token: resolvedToken }
      })()
        .catch((err) => {
          console.error(err)

          const msg = (err && typeof err === 'object' && 'message' in err) ? String((err as any).message) : String(err)
          if (msg.toLowerCase().includes('captcha')) {
            setCaptchaRequired(true)
          }
          return null
        })
        .finally(() => {
          sessionInitPromiseRef.current = null
        })
    }

    return sessionInitPromiseRef.current
  }

  // Subscribe to text messages
  useEffect(() => {
    if (!sessionId) return

    const channel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const incoming = payload.new as Message
          if (incoming.user_id !== userId) {
            setMessages((prev) => [...prev, incoming])
          }
        }
      )

    channel.subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [sessionId, userId])

  // Subscribe to voice messages
  useEffect(() => {
    if (!sessionId) return

    const channel = supabase
      .channel(`voice-messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voice_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const voice = payload.new
          if (voice.user_id !== userId) {
            const m: Message = {
              id: voice.id,
              session_id: voice.session_id,
              user_id: voice.user_id,
              content: '',
              created_at: voice.created_at,
              type: 'voice',
              voice_message: voice
            }
            setMessages((prev) => [...prev, m])
          }
        }
      )

    channel.subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [sessionId, userId])

  const matchingCopy = useMemo(() => {
    if (!partner) return 'Finding someone who matches your vibe…'
    return `Connected to ${partner.language || 'a new friend'}`
  }, [partner])

  const startMatching = async (data: any) => {
    const session = await ensureSession(captchaToken)
    if (!session) {
      if (captchaRequired) {
        alert('Please complete the captcha to start chatting.')
      } else {
        alert('Could not start chat session. Please try again in a moment.')
      }
      return
    }
    setPrefData(data)
    setStage('matching')
    setMessages([])
    setPartner(null)
    setSessionId(null)

    try {
      const res = await fetch('/api/matching/smart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({ userId: session.userId, ...data })
      })

      const result = await res.json()
      if (result.success) {
        setSessionId(result.sessionId)
        setPartner(result.partner)
        setStage('chat')
      } else {
        // Poll a few times
        const started = Date.now()
        const poll = setInterval(async () => {
          const pr = await fetch('/api/matching/smart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.token}`
            },
            body: JSON.stringify({ userId: session.userId, ...data })
          })
          const rj = await pr.json()
          if (rj.success) {
            clearInterval(poll)
            setSessionId(rj.sessionId)
            setPartner(rj.partner)
            setStage('chat')
          }
          if (Date.now() - started > 30000) {
            clearInterval(poll)
            setStage('pref')
          }
        }, 2000)
      }
    } catch (err) {
      console.error(err)
      setStage('pref')
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !sessionId || !sessionToken || !userId) return
    const content = newMessage.trim()
    setNewMessage('')

    const temp: Message = {
      id: Math.random().toString(36),
      session_id: sessionId,
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
      type: 'text'
    }
    setMessages((prev) => [...prev, temp])

    const res = await fetch('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ content, sessionId, userId })
    })

    if (!res.ok) {
      // rollback
      setMessages((prev) => prev.filter((m) => m.id !== temp.id))
      setNewMessage(content)
    }
  }

  const handleVoiceSend = async (blob: Blob, duration: number) => {
    if (!sessionId || !sessionToken || !userId) return
    const formData = new FormData()
    formData.append('audio', blob)
    formData.append('sessionId', sessionId)
    formData.append('userId', userId)
    formData.append('duration', duration.toString())

    const res = await fetch('/api/voice/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: formData
    })

    if (!res.ok) return
    const data = await res.json()
    const voice = data.voiceMessage
    const msg: Message = {
      id: voice.id,
      session_id: sessionId,
      user_id: userId,
      content: '',
      created_at: voice.created_at,
      type: 'voice',
      voice_message: voice
    }
    setMessages((prev) => [...prev, msg])
  }

  const submitReport = async () => {
    if (!sessionToken || !userId) return
    setIsSubmitting(true)
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          sessionId,
          reportedUserId: partner?.userId,
          reason: reportReason || 'other',
          details: reportDetails || undefined
        })
      })
      setReportOpen(false)
      setReportReason('')
      setReportDetails('')
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetChat = () => {
    setStage('pref')
    setMessages([])
    setSessionId(null)
    setPartner(null)
    setIsVideo(false)
    setShowVoice(false)
  }

  const useConversationStarter = () => {
    const starter = getRandomStarter(user)
    setNewMessage(starter)
  }

  const PrefStage = (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300"><Sparkles className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-slate-400">InkHaven Match</p>
              <h2 className="text-xl font-semibold text-white">Dial in your vibe</h2>
            </div>
          </div>
          <p className="text-slate-300 text-sm mb-4">Pick interests and language; we will pair you with someone compatible. Safety first, anonymity always.</p>
          <div className="rounded-xl border border-white/10 bg-slate-800/60 p-4 text-slate-300 text-sm flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Safety baked in</p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
                <li>Client + server moderation</li>
                <li>One-tap report & auto-separate</li>
                <li>No accounts required to start</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl">
          <InterestSelector onComplete={(d) => startMatching(d)} />
        </div>
      </div>

      {captchaRequired && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-sm text-slate-400">Security</p>
              <h3 className="text-lg font-semibold">Complete captcha</h3>
              <p className="text-sm text-slate-300 mt-1">
                This project has Supabase Auth captcha enabled. Please verify to continue.
              </p>
            </div>
            {captchaError && (
              <div className="text-sm text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                {captchaError}
              </div>
            )}

            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
              <div className="bg-white rounded-lg p-3">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  onToken={(t) => {
                    setCaptchaToken(t)
                    setCaptchaError(null)
                  }}
                  onError={(m) => setCaptchaError(m)}
                />
              </div>
            ) : (
              <div className="text-sm text-slate-300 bg-white/5 border border-white/10 rounded-lg p-3">
                Missing <span className="font-mono">NEXT_PUBLIC_TURNSTILE_SITE_KEY</span> in <span className="font-mono">.env.local</span>.
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCaptchaRequired(false)
                  setCaptchaToken(null)
                  setCaptchaError(null)
                }}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!captchaToken}
                onClick={async () => {
                  const s = await ensureSession(captchaToken)
                  if (s) {
                    setCaptchaRequired(false)
                    setCaptchaError(null)
                  } else {
                    setCaptchaError('Captcha verification did not succeed. Please retry.')
                  }
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 font-semibold"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const MatchingStage = (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
      <div className="bg-slate-900/70 border border-white/10 rounded-2xl px-10 py-8 shadow-xl text-center max-w-lg w-full">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Finding your match</h2>
        <p className="text-slate-300 text-sm">{matchingCopy}</p>
        <button
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
          onClick={resetChat}
        >
          <LogOut className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  )

  const ChatStage = (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <div>
                <p className="text-xs text-slate-300">Status</p>
                <p className="font-semibold">Connected {partner?.language ? `• ${partner.language}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.isPremium && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-lg text-xs font-medium">
                  <Crown size={12} />
                  Premium
                </div>
              )}
              <button
                onClick={() => setIsVideo(true)}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-2"
                disabled={!partner}
              >
                <Video className="w-4 h-4" /> Video
              </button>
              <button
                onClick={() => setReportOpen(true)}
                className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 flex items-center gap-2"
              >
                <Flag className="w-4 h-4" /> Report
              </button>
              <button
                onClick={resetChat}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> New chat
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4">
          <div className="bg-slate-900/70 border border-white/10 rounded-xl flex flex-col min-h-[70vh]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                if (m.type === 'voice' && m.voice_message) {
                  return (
                    <VoiceMessageDisplay
                      key={m.id}
                      fileUrl={m.voice_message.file_url}
                      duration={m.voice_message.duration}
                      isOwn={m.user_id === userId}
                      timestamp={m.created_at}
                    />
                  )
                }
                return (
                  <div
                    key={m.id}
                    className={`flex ${m.user_id === userId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm shadow ${
                        m.user_id === userId ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      <p className="text-[11px] text-white/60 mt-1">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-white/10 p-3 flex items-center gap-2">
              <button
                onClick={() => setShowVoice((v) => !v)}
                className={`p-2 rounded-lg border border-white/10 ${showVoice ? 'bg-white/15' : 'bg-transparent'} hover:bg-white/10`}
              >
                <Mic className="w-5 h-5" />
              </button>
              <div className="flex-1 flex items-center gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Say hi…"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={useConversationStarter}
                  className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm"
                  title="Get a conversation starter"
                >
                  💬
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
            {showVoice && (
              <div className="border-t border-white/10 p-3 bg-slate-900/80">
                <VoiceMessage onSend={handleVoiceSend} disabled={!sessionId} />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Partner</p>
              <p className="text-lg font-semibold">{partner ? 'Connected' : 'Matching'}</p>
              <p className="text-sm text-slate-300">{partner?.language || 'Language adaptive'}</p>
              <div className="mt-3 text-xs text-slate-400 space-y-1">
                <p>Shared interests guide matching.</p>
                <p>Press Report to immediately separate.</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold">Safety tips</p>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                <li>Never share personal info.</li>
                <li>Use Report for bad behavior.</li>
                <li>Voice/video optional; blur/cover if unsure.</li>
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm font-semibold mb-2">Bottle Messages</p>
              <p className="text-xs text-slate-300 mb-3">Send anonymous messages that might reach someone special.</p>
              <button
                onClick={() => setShowBottle(true)}
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
              >
                Write a Bottle
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm font-semibold mb-2">Story Mode</p>
              <p className="text-xs text-slate-300 mb-3">Create collaborative stories with other users.</p>
              <button
                onClick={() => setShowStory(true)}
                className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
              >
                Start Story
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm font-semibold mb-2">Themed Rooms</p>
              <p className="text-xs text-slate-300 mb-3">Join topic-specific chat rooms.</p>
              <button
                onClick={() => setShowRooms(true)}
                className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium"
              >
                Browse Rooms
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm font-semibold mb-2">Collaborative Canvas</p>
              <p className="text-xs text-slate-300 mb-3">Draw and create art together in real-time.</p>
              <button
                onClick={() => setShowCanvas(true)}
                className="w-full px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium"
              >
                Open Canvas
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm font-semibold mb-2">Music Sync</p>
              <p className="text-xs text-slate-300 mb-3">Share and sync music playback with your chat partner.</p>
              <button
                onClick={() => setShowMusic(true)}
                className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
              >
                Start Music
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm font-semibold mb-2">Time Capsule</p>
              <p className="text-xs text-slate-300 mb-3">Send messages that arrive at a future date.</p>
              <button
                onClick={() => setShowTimeCapsule(true)}
                className="w-full px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium"
              >
                Send to Future
              </button>
            </div>            {!user?.isPremium && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-purple-500/10 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <p className="text-sm font-semibold text-yellow-300">Upgrade to Premium</p>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  Unlock unlimited features, exclusive rooms, and premium experiences.
                </p>
                <button
                  onClick={() => setShowPricing(true)}
                  className="w-full px-3 py-2 bg-gradient-to-r from-yellow-500 to-purple-600 hover:from-yellow-600 hover:to-purple-700 text-white rounded-lg text-sm font-medium"
                >
                  View Plans - ₹199/month
                </button>
              </div>
            )}            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div className="text-sm text-slate-200">Moderation runs automatically; abusive content is blocked.</div>
            </div>
          </div>
        </div>
      </div>

      {reportOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Safety</p>
                <h3 className="text-lg font-semibold">Report user</h3>
              </div>
              <button onClick={() => setReportOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-sm"
                >
                  <option value="">Select</option>
                  <option value="abuse">Abusive / harassment</option>
                  <option value="spam">Spam / scams</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="safety">Safety risk</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Details (optional)</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-sm h-24"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReportOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                disabled={!reportReason || isSubmitting}
                onClick={submitReport}
                className="px-4 py-2 rounded-lg bg-amber-500 text-black font-semibold disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBottle && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <BottleMessage
            onSend={(message) => {
              // Optional: Show success message
              console.log('Bottle sent:', message)
            }}
            onClose={() => setShowBottle(false)}
          />
        </div>
      )}

      {showStory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <StoryMode onClose={() => setShowStory(false)} />
        </div>
      )}

      {showRooms && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <ThemedRooms onJoinRoom={(room) => {
            // TODO: Handle joining room
            console.log('Joining room:', room)
            setShowRooms(false)
          }} />
        </div>
      )}

      {showCanvas && sessionId && (
        <CollaborativeCanvas
          sessionId={sessionId}
          onClose={() => setShowCanvas(false)}
        />
      )}

      {showMusic && sessionId && (
        <MusicSync
          sessionId={sessionId}
          onClose={() => setShowMusic(false)}
        />
      )}

      {showTimeCapsule && partner && user && (
        <TimeCapsule
          onSend={async (message, deliveryDate) => {
            // Send time capsule message
            await (supabase as any).from('time_capsules').insert({
              sender_id: user.id,
              recipient_id: partner.userId,
              content: message,
              delivery_date: deliveryDate.toISOString()
            })
          }}
          onClose={() => setShowTimeCapsule(false)}
        />
      )}

      {showPricing && (
        <PricingModal onClose={() => setShowPricing(false)} />
      )}

      {isVideo && sessionId && partner && userId && (
        <VideoChat
          sessionId={sessionId}
          userId={userId}
          partnerId={partner.userId}
          onEndCall={() => setIsVideo(false)}
        />
      )}
    </div>
  )

  if (stage === 'pref') return PrefStage
  if (stage === 'matching') return MatchingStage
  return ChatStage
}