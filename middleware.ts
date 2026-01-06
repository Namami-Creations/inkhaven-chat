/**
 * Next.js Middleware
 * Handles request processing and security headers.
 *
 * NOTE: Do not implement in-memory rate limiting here.
 * Middleware runs on the Edge and does not provide stable in-memory state.
 * Rate limiting is enforced in route handlers via `lib/rate-limit`.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next()
  }

  // Add security headers
  const response = NextResponse.next()
  
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(self), camera=(self), fullscreen=(self), payment=()'
  )

  const csp = [
    "default-src 'self'",
    "frame-ancestors 'none'",
    "script-src 'self' 'unsafe-inline' https://*.vercel-insights.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.metered.live wss://*.metered.live",
    "img-src 'self' data: blob:",
    "media-src 'self' blob: https://*.supabase.co",
    "font-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "upgrade-insecure-requests"
  ].join('; ')
  response.headers.set('Content-Security-Policy', csp)
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
