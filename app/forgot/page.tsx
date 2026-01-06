'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      const redirectTo = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) {
        alert(error.message)
        return
      }
      alert('Password reset email sent (if the account exists).')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-bold">Forgot password</h1>
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
        <button
          type="button"
          onClick={submit}
          disabled={loading || !email}
          className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 font-semibold"
        >
          {loading ? 'Sending…' : 'Send reset email'}
        </button>
        <div className="text-sm text-slate-300">
          <Link href="/login" className="hover:text-white">Back to login</Link>
        </div>
      </div>
    </main>
  )
}
