export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Help Center</h1>

        <div className="space-y-8">
          {/* Getting Started */}
          <section className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">How do I start chatting?</h3>
                <p className="text-white/70">
                  You can start chatting immediately as an anonymous user, or create a registered account
                  to unlock premium features like groups and custom avatars.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">What's the difference between anonymous and registered users?</h3>
                <p className="text-white/70">
                  Anonymous users can chat freely but have limited features. Registered users get access
                  to groups, custom avatars, and premium AI features.
                </p>
              </div>
            </div>
          </section>

          {/* Avatar Creation */}
          <section className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold mb-4">Avatar Creation</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">How do I create an avatar?</h3>
                <p className="text-white/70">
                  During registration, you'll be guided through our AI-powered avatar creator.
                  Answer a few personality questions, then customize your appearance, outfit, and style.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Can I change my avatar later?</h3>
                <p className="text-white/70">
                  Yes! Premium users can edit their avatars anytime from their profile settings.
                </p>
              </div>
            </div>
          </section>

          {/* Groups & Chats */}
          <section className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold mb-4">Groups & Chats</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">How do groups work?</h3>
                <p className="text-white/70">
                  Groups allow multiple people to chat together. Free registered users can create groups
                  with up to 100 participants. Premium users can create unlimited groups with unlimited participants.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">How does matching work?</h3>
                <p className="text-white/70">
                  Our AI analyzes interests, conversation styles, and preferences to match you with
                  compatible chat partners. Premium users get more advanced matching options.
                </p>
              </div>
            </div>
          </section>

          {/* Premium Features */}
          <section className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold mb-4">Premium Features</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">What do I get with premium?</h3>
                <ul className="list-disc list-inside ml-4 text-white/70 space-y-1">
                  <li>Unlimited groups with unlimited participants</li>
                  <li>Full GIPHY access (unlimited stickers)</li>
                  <li>AI Entertainment Suite (horoscopes, personality tests)</li>
                  <li>Ad-free experience</li>
                  <li>Priority support</li>
                  <li>Advanced analytics</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">How do I upgrade?</h3>
                <p className="text-white/70">
                  Click the "Support" button in the navigation or visit your account settings.
                  We accept PayPal payments for secure, easy subscriptions.
                </p>
              </div>
            </div>
          </section>

          {/* Troubleshooting */}
          <section className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold mb-4">Troubleshooting</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">I'm not getting matched with anyone</h3>
                <p className="text-white/70">
                  Try updating your interests and bio in your profile. The more information you provide,
                  the better our AI can match you with compatible people.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Messages aren't sending</h3>
                <p className="text-white/70">
                  Check your internet connection and try refreshing the page. If the problem persists,
                  contact our support team.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Support */}
          <section className="bg-gradient-to-r from-cyan-400 to-purple-500 rounded-2xl p-6 text-center">
            <h2 className="text-2xl font-semibold mb-4">Still Need Help?</h2>
            <p className="text-white/90 mb-6">
              Our support team is here to help you make the most of Inkhaven Chat.
            </p>
            <div className="space-y-4">
              <p className="text-white">
                📧 <strong>Email:</strong> support@inkhaven.chat
              </p>
              <p className="text-white">
                💬 <strong>Live Chat:</strong> Available for Premium users
              </p>
              <p className="text-white">
                📱 <strong>Response Time:</strong> Within 24 hours
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
