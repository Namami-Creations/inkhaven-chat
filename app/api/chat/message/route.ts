import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { bearerFromAuthHeader } from '@/lib/auth'
import { createServerSupabaseServiceClient, createServerSupabaseUserClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'
import { moderateText } from '@/lib/moderation'

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  sessionId: z.string()
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const bearer = bearerFromAuthHeader(request.headers.get('authorization'))
  if (!bearer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate JWT (service client so this doesn't depend on anon key config)
  const supabaseService = createServerSupabaseServiceClient()
  const { data: authData, error: authError } = await supabaseService.auth.getUser(bearer)
  if (authError || !authData?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tokenUserId = authData.user.id
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limiterKey = `${ip}:${tokenUserId}:chat:send`
  const limitCheck = await checkRateLimit(limiterKey, 30, 60)
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  let parsed
  try {
    parsed = sendMessageSchema.parse(await request.json())
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
  }

  const { content, sessionId } = parsed
  const userId = tokenUserId

  // All DB access should respect RLS for this user
  const supabase = createServerSupabaseUserClient(bearer)

  const moderation = moderateText(content)
  if (!moderation.allowed) {
    return NextResponse.json({ error: 'Message blocked by moderation' }, { status: 422 })
  }

  const { data: session, error: sessionError } = await (supabase as any)
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

  const { data: inserted, error: insertError } = await (supabase as any)
    .from('messages')
    .insert({
      session_id: sessionId,
      user_id: userId,
      content,
      type: 'text'
    })
    .select('id, created_at')
    .single()

  if (insertError || !inserted) {
    console.error('message insert error', insertError)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  return NextResponse.json({ success: true, messageId: inserted.id, createdAt: inserted.created_at })
}
