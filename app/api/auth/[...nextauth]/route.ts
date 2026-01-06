import NextAuth, { type NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { supabase } from '@/lib/supabase'
import { getUserProfile } from '@/lib/auth'
import type { JWT } from 'next-auth/jwt'

type SessionUser = {
  plan?: string
  isPremium?: boolean
}

type Creds = {
  email?: string
  password?: string
}

const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: 'InkHaven',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials?: Creds) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error || !data?.user) return null

          // Get profile
          const profile = await getUserProfile(data.user.id)

          return {
            id: data.user.id,
            email: data.user.email,
            name: profile?.display_name || data.user.email?.split('@')[0],
            plan: profile?.plan || 'free',
            isPremium: profile?.isPremium || false
          }
        } catch {
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user && (user as SessionUser).plan) {
        ;(token as JWT & SessionUser).plan = (user as SessionUser).plan
        ;(token as JWT & SessionUser).isPremium = (user as SessionUser).isPremium
      }
      return token
    },
    async session({ session, token }: { session: any; token: JWT }) {
      if (session.user) {
        ;(session.user as SessionUser).plan = (token as JWT & SessionUser).plan || 'free'
        ;(session.user as SessionUser).isPremium = (token as JWT & SessionUser).isPremium || false
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }