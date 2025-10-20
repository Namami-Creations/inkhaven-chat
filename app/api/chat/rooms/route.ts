import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { validateData, roomSchema } from '@/lib/validation'
import { logError, logInfo } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request
    const body = await request.json()
    const validation = validateData(roomSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid room data', details: validation.errors.format() },
        { status: 400 }
      )
    }

    const { name, description, category } = validation.data

    // Check user tier for room creation limits
    const { data: userData } = await supabase
      .from('users')
      .select('user_tier')
      .eq('id', user.id)
      .single()

    // Free users limited to 3 rooms
    if (userData?.user_tier === 'registered_free') {
      const { count } = await supabase
        .from('chat_rooms')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)

      if (count && count >= 3) {
        return NextResponse.json(
          { error: 'Free tier limited to 3 rooms. Upgrade for unlimited rooms.' },
          { status: 403 }
        )
      }
    }

    // Create room
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({
        name,
        description,
        category,
        is_ai_generated: false,
        is_premium_only: false,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      logError('Failed to create room', error)
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
    }

    // Add creator as room participant with admin role
    await supabase
      .from('room_participants')
      .insert({
        room_id: data.id,
        user_id: user.id,
        user_tier: userData?.user_tier || 'registered_free',
        role: 'admin'
      })

    logInfo('Room created successfully', { roomId: data.id, userId: user.id })

    return NextResponse.json({ success: true, room: data })

  } catch (error) {
    logError('Room creation API error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
