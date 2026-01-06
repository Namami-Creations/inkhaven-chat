import Link from 'next/link'
import { Sparkles, ShieldCheck, Globe2, Zap, Users, MessageSquare } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">InkHaven</p>
              <p className="font-semibold">Anonymous chat, reimagined</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold"
            >
              Launch chat
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        <section className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-slate-200">
              <Sparkles className="w-4 h-4" /> Smart matching • Safe by default
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              A safer, smarter anonymous chat for real conversations.
            </h1>
            <p className="text-slate-300 text-lg">
              Instant matching with interest signals, live moderation, and optional voice/video. No accounts required to start; privacy-first when you stay.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/chat"
                className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                Start chatting
              </Link>
              <a
                href="#safety"
                className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 font-semibold"
              >
                Safety first
              </a>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Multi-layer moderation</div>
              <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-300" /> Low-latency realtime</div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <p className="text-sm text-slate-300">Why InkHaven</p>
            <div className="space-y-3 text-sm text-slate-200">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-300 mt-0.5" />
                <div>
                  <p className="font-semibold">Smart pairing</p>
                  <p className="text-slate-300">Match on interests, language, and vibe—not just random roulette.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <p className="font-semibold">Anonymity with guardrails</p>
                  <p className="text-slate-300">Client + server moderation, one-tap report, immediate separation.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe2 className="w-5 h-5 text-indigo-300 mt-0.5" />
                <div>
                  <p className="font-semibold">Global, low-friction</p>
                  <p className="text-slate-300">No signup required to start; progressive unlocks for premium users.</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-white/10 text-sm text-slate-300">
              <p className="font-semibold text-white mb-1">How it works</p>
              <ol className="space-y-2 list-decimal list-inside text-slate-300">
                <li>Choose interests and language.</li>
                <li>Get paired instantly with a compatible partner.</li>
                <li>Chat via text, optional voice/video. Report to separate.</li>
              </ol>
            </div>
          </div>
        </section>

        <section id="safety" className="grid md:grid-cols-3 gap-4">
          {[{
            title: 'Zero-friction start',
            desc: 'Start as a guest; upgrade when you want persistence.',
            icon: <Zap className="w-5 h-5" />
          }, {
            title: 'Multi-layer safety',
            desc: 'Client pre-filter, server moderation, one-tap report.',
            icon: <ShieldCheck className="w-5 h-5" />
          }, {
            title: 'Quality-first matching',
            desc: 'Interests + language + vibe scoring to avoid bad fits.',
            icon: <Sparkles className="w-5 h-5" />
          }].map((card, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-blue-200">{card.icon}</div>
              <p className="font-semibold">{card.title}</p>
              <p className="text-sm text-slate-300">{card.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
