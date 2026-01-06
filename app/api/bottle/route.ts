import { NextRequest, NextResponse } from 'next/server'
import { bearerFromAuthHeader } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createServerSupabaseClient()

  const bearer = bearerFromAuthHeader(request.headers.get('authorization'))
  if (!bearer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(bearer)
  if (authError || !authData?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = authData.user.id
  const { content } = await request.json()

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  if (content.length > 500) {
    return NextResponse.json({ error: 'Content too long' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limiterKey = `${ip}:${userId}:bottle`
  const limitCheck = await checkRateLimit(limiterKey, 1, 86400) // 1 per day
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: 'Daily bottle message limit reached' }, { status: 429, headers: { 'Retry-After': '86400' } })
  }

  const { error } = await (supabase as any)
    .from('bottle_messages')
    .insert({
      user_id: userId,
      content: content.trim()
    })

  if (error) {
    console.error('Bottle message insert error:', error)
    return NextResponse.json({ error: 'Failed to send bottle message' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// GET endpoint to receive a bottle message (for premium users or randomly)
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createServerSupabaseClient()

  const bearer = bearerFromAuthHeader(request.headers.get('authorization'))
  if (!bearer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(bearer)
  if (authError || !authData?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = authData.user.id

  // Find an undelivered bottle message
  const { data, error } = await (supabase as any)
    .from('bottle_messages')
    .select('*')
    .eq('delivered', false)
    .neq('user_id', userId) // Don't send own messages
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error || !data) {
    return NextResponse.json({ message: null })
  }

  // Mark as delivered
  await (supabase as any)
    .from('bottle_messages')
    .update({
      delivered: true,
      delivered_at: new Date().toISOString()
    })
    .eq('id', data.id)

  return NextResponse.json({
    message: {
      id: data.id,
      content: data.content,
      created_at: data.created_at
    }
  })
}