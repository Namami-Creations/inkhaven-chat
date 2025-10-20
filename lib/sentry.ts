// Sentry configuration for error tracking
import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: process.env.NODE_ENV === 'development',

    // Performance monitoring
    integrations: [
      new Sentry.BrowserTracing({
        // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
        tracePropagationTargets: ['localhost', /^https:\/\/your-domain\.com/],
      }),
      new Sentry.Replay({
        // Capture replays for 10% of all sessions, plus for 100% of sessions with an error
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Release health tracking
    environment: process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    // Performance monitoring
    tracesSampleRate: 0.1,

    // Session replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive data from events
      if (event.request?.data) {
        // Remove passwords, tokens, etc.
        const data = event.request.data as any
        if (data.password) data.password = '[FILTERED]'
        if (data.token) data.token = '[FILTERED]'
        if (data.apiKey) data.apiKey = '[FILTERED]'
      }

      return event
    },

    // Ignore certain errors
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'Script error',
      'Non-Error promise rejection captured',
    ],
  })
}

export default Sentry
