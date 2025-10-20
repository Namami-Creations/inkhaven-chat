import type { Metadata } from 'next'
import './globals.css'
import { SupabaseProvider } from '@/components/SupabaseProvider'
import ErrorBoundary from '@/components/ErrorBoundary'
import SkipNavigation from '@/components/SkipNavigation'
import ToastContainer from '@/components/ToastContainer'
import { Analytics } from '@vercel/analytics/next'
import '../lib/i18n' // Initialize i18n

export const metadata: Metadata = {
  title: 'Inkhaven Chat - Ultimate Anonymous Chat Platform',
  description: 'Experience the world\'s most advanced anonymous chat platform with AI-enhanced conversations and beautiful themes.',
  keywords: 'chat, anonymous, AI, social, conversations',
  authors: [{ name: 'Inkhaven Chat' }],
  viewport: 'width=device-width, initial-scale=1',
  // Accessibility metadata
  other: {
    'theme-color': '#1f2937',
    'color-scheme': 'dark light',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* Preload critical fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased min-h-screen bg-gray-900 text-white">
        <SkipNavigation />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded"
        >
          Skip to main content
        </a>
        <ErrorBoundary>
          <SupabaseProvider>
            {children}
            <ToastContainer />
          </SupabaseProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
