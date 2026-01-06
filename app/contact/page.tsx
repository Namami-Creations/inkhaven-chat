export default function ContactPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="text-slate-300">
        We're here to help. Reach out for support, feedback, or reporting issues.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">Support</h2>
          <p className="text-slate-300 mb-4">
            For technical issues, account problems, or general questions.
          </p>
          <p className="text-white font-semibold">support@inkhaven.in</p>
          <p className="text-slate-400 text-sm mt-2">Response time: 24-48 hours</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">Abuse Reports</h2>
          <p className="text-slate-300 mb-4">
            Report violations, harassment, or inappropriate behavior.
          </p>
          <p className="text-white font-semibold">abuse@inkhaven.in</p>
          <p className="text-slate-400 text-sm mt-2">Urgent reports reviewed within 24 hours</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-3">Business Inquiries</h2>
        <p className="text-slate-300 mb-4">
          Partnerships, press, or business opportunities.
        </p>
        <p className="text-white font-semibold">business@inkhaven.in</p>
      </div>

      <div className="text-center pt-6">
        <p className="text-slate-400">
          Before contacting, check our <a href="/faq" className="text-blue-400 hover:underline">FAQ</a> for quick answers.
        </p>
      </div>
    </main>
  )
}
