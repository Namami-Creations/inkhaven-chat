import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { validateData, registrationSchema } from '@/lib/validation'
import { logError, logInfo } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Parse and validate request
    const body = await request.json()
    const validation = validateData(registrationSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid registration data', details: validation.errors.format() },
        { status: 400 }
      )
    }

    const { email, username, password, age, interests } = validation.data

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},display_name.eq.${username}`)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 409 }
      )
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: username,
          age,
        }
      }
    })

    if (authError || !authData.user) {
      logError('Supabase auth signup failed', authError)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        anonymous_id: authData.user.id,
        email,
        display_name: username,
        interests: interests || [],
        is_registered: true,
        user_tier: 'registered_free',
      })

    if (profileError) {
      logError('User profile creation failed', profileError)
      // Try to clean up auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    logInfo('User registered successfully', { userId: authData.user.id, email })

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        displayName: username,
        isRegistered: true,
      }
    })

  } catch (error) {
    logError('Registration API error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
