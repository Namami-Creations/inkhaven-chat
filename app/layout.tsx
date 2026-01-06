import type { Metadata } from 'next'
import './globals.css'
import SiteHeader from '@/components/SiteHeader'
import { SessionProvider } from '@/components/SessionProvider'

export const metadata: Metadata = {
  title: 'Inkhaven Chat - Anonymous Random Chat',
  description: 'Free anonymous chat with strangers. Simple, fast, and safe random messaging.',
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icons/icon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/icons/icon.ico', type: 'image/x-icon' }
    ],
    apple: [{ url: '/icons/icon-192x192.png', type: 'image/png', sizes: '192x192' }]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-white">
        <SessionProvider>
          <SiteHeader />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
