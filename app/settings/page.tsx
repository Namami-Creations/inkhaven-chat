'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [isAnonymous, setIsAnonymous] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      const session = data.session
      setUserId(session?.user?.id ?? null)
      setIsAnonymous(Boolean(session?.user?.is_anonymous))
      setLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUserId(null)
    setIsAnonymous(null)
    alert('Signed out.')
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
        <p className="font-semibold">Account</p>
        {loading ? (
          <p className="text-slate-300">Loading…</p>
        ) : userId ? (
          <>
            <p className="text-slate-300">Signed in as: <span className="text-white">{userId}</span></p>
            <p className="text-slate-300">Type: <span className="text-white">{isAnonymous ? 'Guest (anonymous)' : 'Registered'}</span></p>
          </>
        ) : (
          <p className="text-slate-300">Not signed in.</p>
        )}
      </div>

      <button
        type="button"
        onClick={signOut}
        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
      >
        Sign out
      </button>
    </main>
  )
}
