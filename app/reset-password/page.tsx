'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Supabase may deliver reset tokens via URL; ensure the client processes it.
    supabase.auth.getSession().finally(() => setReady(true))
  }, [])

  const submit = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        alert('No active reset session found. Please open the reset link from your email again.')
        return
      }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        alert(error.message)
        return
      }
      alert('Password updated. You can now login.')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-bold">Reset password</h1>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        {!ready ? (
          <p className="text-slate-300">Preparing reset…</p>
        ) : (
          <>
            <label className="block text-sm text-slate-300">
              New password
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={submit}
              disabled={loading || password.length < 6}
              className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 font-semibold"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}
