import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { bearerFromAuthHeader } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

const matchRequestSchema = z.object({
  interests: z.array(z.string()).min(1),
  language: z.string(),
  ageGroup: z.string(),
  mood: z.string().optional()
})

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

  let body: z.infer<typeof matchRequestSchema>
  try {
    body = matchRequestSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
  }
  const userId = authData.user.id
  const { interests, language, ageGroup, mood } = body

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limiterKey = `${ip}:${userId}:match`
  const limitCheck = await checkRateLimit(limiterKey, 20, 60)
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  const { data: rpcData, error: rpcError } = await (supabase as any).rpc('matchmake', {
    p_user_id: userId,
    p_interests: interests,
    p_language: language,
    p_age_group: ageGroup,
    p_mood: mood || null
  })

  if (rpcError) {
    console.error('matchmake rpc error', rpcError)
    return NextResponse.json({ error: 'Matching failed' }, { status: 500 })
  }

  const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
  if (row?.success && row.session_id && row.partner_user_id) {
    return NextResponse.json({
      success: true,
      sessionId: row.session_id,
      partner: {
        userId: row.partner_user_id,
        interests: row.partner_interests ?? [],
        language: row.partner_language ?? language
      }
    })
  }

  return NextResponse.json({ success: false, status: 'waiting' })
}
