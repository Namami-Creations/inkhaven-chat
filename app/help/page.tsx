export default function HelpPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-bold">Help Center</h1>
      <p className="text-slate-300">
        Get started with InkHaven Chat and troubleshoot common issues.
      </p>

      <div className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <ol className="list-decimal list-inside text-slate-300 space-y-2">
            <li>Click "Launch chat" on the homepage</li>
            <li>Select your interests from the list</li>
            <li>Choose your language and age group</li>
            <li>Click "Find Chat Partner" to start matching</li>
            <li>Once matched, start chatting!</li>
          </ol>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Using Voice & Video</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-2">
            <li>Voice messages: Click the microphone icon to record</li>
            <li>Video calls: Click the video icon when both users agree</li>
            <li>Allow camera/microphone permissions when prompted</li>
            <li>Video calls require stable internet connection</li>
          </ul>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Safety & Privacy</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-2">
            <li>Never share personal information</li>
            <li>Use the report button for inappropriate behavior</li>
            <li>Messages are automatically deleted after 24 hours</li>
            <li>You can end any chat at any time</li>
          </ul>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-white">Can't find a match?</p>
              <p className="text-slate-300 text-sm">Try selecting different interests or check your internet connection.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Video not working?</p>
              <p className="text-slate-300 text-sm">Ensure your browser allows camera access and try refreshing the page.</p>
            </div>
            <div>
              <p className="font-semibold text-white">App not loading?</p>
              <p className="text-slate-300 text-sm">Clear your browser cache or try a different browser.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-6">
        <p className="text-slate-400">
          Still need help? <a href="/contact" className="text-blue-400 hover:underline">Contact our support team</a>.
        </p>
      </div>
    </main>
  )
}
