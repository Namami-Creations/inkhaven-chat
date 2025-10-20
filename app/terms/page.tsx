export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <div className="space-y-6 text-white/80">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Inkhaven Chat, you accept and agree to be bound by the terms
              and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. User Accounts</h2>
            <p>
              When you create an account with us, you must provide information that is accurate,
              complete, and current at all times. You are responsible for safeguarding the password
              and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Acceptable Use</h2>
            <p>
              You agree not to use the service to:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Transmit harmful or malicious code</li>
              <li>Harass, abuse, or harm others</li>
              <li>Impersonate others or provide false information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Premium Services</h2>
            <p>
              Premium features are provided on a subscription basis. You may cancel your subscription
              at any time. Refunds are provided according to our refund policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Content Ownership</h2>
            <p>
              You retain ownership of your content. By using our service, you grant us a license to
              use, display, and distribute your content as necessary to provide the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
            <p>
              We may terminate or suspend your account immediately for violations of these terms.
              You may also terminate your account at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contact Information</h2>
            <p>
              For questions about these terms, please contact us at support@inkhaven.chat
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/20">
          <p className="text-white/60 text-sm">
            Last updated: October 2025
          </p>
        </div>
      </div>
    </div>
  )
}
