import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { bearerFromAuthHeader } from '@/lib/auth'
import { createServerSupabaseServiceClient, createServerSupabaseUserClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24

export async function POST(request: NextRequest) {
  const bearer = bearerFromAuthHeader(request.headers.get('authorization'))
  if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseService = createServerSupabaseServiceClient()
  const { data: authData, error: authError } = await supabaseService.auth.getUser(bearer)
  if (authError || !authData?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tokenUserId = authData.user.id

  const supabaseUser = createServerSupabaseUserClient(bearer)

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limiterKey = `${ip}:${tokenUserId}:voice:upload`
  const limitCheck = await checkRateLimit(limiterKey, 6, 60)
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  const formData = await request.formData()
  const audioFile = formData.get('audio') as File | null
  const sessionId = formData.get('sessionId') as string | null
  const userIdRaw = formData.get('userId') as string | null
  const durationRaw = formData.get('duration') as string | null

  if (!audioFile || !sessionId || !durationRaw) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (userIdRaw && userIdRaw !== tokenUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userId = tokenUserId

  const duration = Number(durationRaw)
  if (!Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
  }

  if (!audioFile.type.startsWith('audio/')) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  if (audioFile.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 })
  }

  const { data: session, error: sessionError } = await (supabaseUser as any)
    .from('anonymous_sessions')
    .select('id, user1_id, user2_id, status')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.status !== 'active') {
    return NextResponse.json({ error: 'Session closed' }, { status: 409 })
  }

  if (session.user1_id !== userId && session.user2_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ext = audioFile.type.split('/')[1] || 'webm'
  const fileName = `${sessionId}/${userId}/${randomUUID()}.${ext}`

  const { error: uploadError } = await supabaseService.storage
    .from('voice-messages')
    .upload(fileName, audioFile, {
      contentType: audioFile.type,
      upsert: false
    })

  if (uploadError) {
    console.error('upload error', uploadError)
    return NextResponse.json({ error: 'Failed to upload voice message' }, { status: 500 })
  }

  const { data: signed, error: signedError } = await supabaseService.storage
    .from('voice-messages')
    .createSignedUrl(fileName, SIGNED_URL_TTL_SECONDS)

  if (signedError || !signed?.signedUrl) {
    await supabaseService.storage.from('voice-messages').remove([fileName])
    return NextResponse.json({ error: 'Failed to sign voice URL' }, { status: 500 })
  }

  const { data: voiceMessage, error: insertError } = await (supabaseUser as any)
    .from('voice_messages')
    .insert({
      session_id: sessionId,
      user_id: userId,
      file_path: fileName,
      file_url: signed.signedUrl,
      duration,
      file_size: audioFile.size
    })
    .select()
    .single()

  if (insertError || !voiceMessage) {
    console.error('voice message insert error', insertError)
    await supabaseService.storage.from('voice-messages').remove([fileName])
    return NextResponse.json({ error: 'Failed to save voice message' }, { status: 500 })
  }

  return NextResponse.json({ success: true, voiceMessage })
}
