export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="space-y-6 text-white/80">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Create an account or profile</li>
              <li>Use our chat services</li>
              <li>Contact customer support</li>
              <li>Subscribe to our premium services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Communicate with you about products, services, and promotions</li>
              <li>Personalize your experience and provide content recommendations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties
              without your consent, except as described in this policy. We may share your information
              with trusted third parties who assist us in operating our website, conducting our business,
              or servicing you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information against
              unauthorized access, alteration, disclosure, or destruction. However, no method of
              transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate personal information</li>
              <li>Delete your personal information</li>
              <li>Object to or restrict processing of your personal information</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@inkhaven.chat
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
