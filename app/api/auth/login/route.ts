import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { validateData, loginSchema } from '@/lib/validation'
import { logError, logInfo } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Parse and validate request
    const body = await request.json()
    const validation = validateData(loginSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid login data', details: validation.errors.format() },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logError('Login failed', error, { email })
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Login failed' }, { status: 401 })
    }

    logInfo('User logged in successfully', { userId: data.user.id, email })

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.display_name,
      },
      session: data.session
    })

  } catch (error) {
    logError('Login API error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
