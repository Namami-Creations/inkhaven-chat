export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-bold">Terms of Service</h1>

      <div className="prose prose-invert max-w-none space-y-6">
        <p className="text-slate-300">
          Last updated: January 4, 2026
        </p>

        <section>
          <h2 className="text-xl font-semibold mb-3">Acceptance of Terms</h2>
          <p className="text-slate-300">
            By using InkHaven Chat, you agree to these terms. If you disagree, please don't use our service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Service Description</h2>
          <p className="text-slate-300">
            InkHaven provides anonymous chat services with smart matching based on interests, language, and age groups.
            We offer text messaging, voice messages, and video calls.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">User Conduct</h2>
          <p className="text-slate-300">
            You agree to:
          </p>
          <ul className="list-disc list-inside text-slate-300 space-y-1 mt-2">
            <li>Respect other users</li>
            <li>Not engage in harassment, spam, or illegal activities</li>
            <li>Report abusive behavior</li>
            <li>Not share personal information</li>
            <li>Use the service appropriately</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Content and Moderation</h2>
          <p className="text-slate-300">
            We moderate content to ensure safety. Reported users may be banned. We reserve the right to terminate
            service for violations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
          <p className="text-slate-300">
            The service is provided "as is". We are not liable for user interactions or content.
            Use at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
          <p className="text-slate-300">
            We may update these terms. Continued use constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Contact</h2>
          <p className="text-slate-300">
            For questions, contact support@inkhaven.in
          </p>
        </section>
      </div>
    </main>
  )
}