import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { bearerFromAuthHeader } from '@/lib/auth'
import { createServerSupabaseServiceClient, createServerSupabaseUserClient } from '@/lib/supabase-server'

const reportSchema = z.object({
  sessionId: z.string().optional(),
  reportedUserId: z.string().optional(),
  reason: z.string().min(3).max(200),
  details: z.string().max(2000).optional()
})

export async function POST(request: NextRequest) {
  const bearer = bearerFromAuthHeader(request.headers.get('authorization'))
  if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseService = createServerSupabaseServiceClient()
  const { data: authData, error: authError } = await supabaseService.auth.getUser(bearer)
  if (authError || !authData?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = authData.user.id

  const supabase = createServerSupabaseUserClient(bearer)

  let payload
  try {
    payload = reportSchema.parse(await request.json())
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { sessionId, reportedUserId, reason, details } = payload

  if (sessionId) {
    const { data: session, error: sessionError } = await (supabase as any)
      .from('anonymous_sessions')
      .select('user1_id, user2_id, status')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.user1_id !== userId && session.user2_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { error: insertError } = await (supabase as any).from('reports').insert({
    reporter_user_id: userId,
    reported_user_id: reportedUserId || null,
    session_id: sessionId || null,
    reason,
    details: details || null
  })

  if (insertError) {
    console.error('report insert error', insertError)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
