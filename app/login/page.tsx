'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Turnstile from '@/components/Turnstile'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState<string | null>(null)

  const submit = async () => {
    setLoading(true)
    try {
      const { error } = await (supabase.auth as any).signInWithPassword({
        email,
        password,
        options: captchaToken ? { captchaToken } : undefined
      })
      if (error) {
        alert(error.message)
        return
      }
      router.push('/chat')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-bold">Login</h1>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <label className="block text-sm text-slate-300">
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
          />
        </label>
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <div className="bg-white rounded-lg p-3">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              onToken={(t) => {
                setCaptchaToken(t)
                setCaptchaError(null)
              }}
              onError={(m) => setCaptchaError(m)}
            />
          </div>
        )}

        {captchaError && (
          <div className="text-sm text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            {captchaError}
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={loading || !email || !password || (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? !captchaToken : false)}
          className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 font-semibold"
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>
        <div className="flex items-center justify-between text-sm text-slate-300">
          <Link href="/forgot" className="hover:text-white">Forgot password?</Link>
          <Link href="/register" className="hover:text-white">Create account</Link>
        </div>
      </div>
    </main>
  )
}
