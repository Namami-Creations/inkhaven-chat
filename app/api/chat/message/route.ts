import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { AIModerationService } from '@/lib/ai-moderation'
import { validateData, messageSchema } from '@/lib/validation'
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
    const validation = validateData(messageSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid message data', details: validation.errors.format() },
        { status: 400 }
      )
    }

    const { content, sessionId, roomId } = validation.data

    // AI Moderation check
    try {
      const moderationResult = await AIModerationService.moderateContent(content)

      if (!moderationResult.isAllowed) {
        return NextResponse.json(
          { error: 'Message blocked by moderation', reasons: moderationResult.reasons },
          { status: 400 }
        )
      }
    } catch (error) {
      console.warn('Moderation check failed, proceeding with message:', error)
    }

    // Insert message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        room_id: roomId,
        user_id: user.id,
        content,
        message_type: 'text',
        is_moderated: false
      })
      .select()
      .single()

    if (error) {
      logError('Failed to send message', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    logInfo('Message sent successfully', { messageId: data.id, userId: user.id })

    return NextResponse.json({ success: true, message: data })

  } catch (error) {
    logError('Message API error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
