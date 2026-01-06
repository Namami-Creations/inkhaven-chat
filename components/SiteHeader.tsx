'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SiteHeader() {
  const pathname = usePathname()

  // Keep the chat experience full-screen and distraction-free.
  if (pathname?.startsWith('/chat')) return null

  return (
    <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-white">
          InkHaven
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/chat" className="text-slate-200 hover:text-white">
            Chat
          </Link>
          <Link href="/pricing" className="text-slate-200 hover:text-white">
            Pricing
          </Link>
          <Link href="/about" className="text-slate-200 hover:text-white">
            About
          </Link>
          <Link href="/faq" className="text-slate-200 hover:text-white">
            FAQ
          </Link>
          <Link href="/help" className="text-slate-200 hover:text-white">
            Help
          </Link>
          <Link href="/contact" className="text-slate-200 hover:text-white">
            Contact
          </Link>
          <Link href="/settings" className="text-slate-200 hover:text-white">
            Settings
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-white">
            Login
          </Link>
          <Link href="/register" className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white">
            Register
          </Link>
        </div>
      </div>
    </header>
  )
}
