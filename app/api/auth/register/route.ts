import { NextRequest, NextResponse } from 'next/server'
import { registerUser, createUserProfile } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const { data, error } = await registerUser(email, password)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data?.user) {
      // Create profile
      await createUserProfile(data.user.id, email)
    }

    return NextResponse.json({ success: true, user: { id: data.user.id, email: data.user.email } })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}