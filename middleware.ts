import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logAPI } from '@/lib/logger-edge'

// Enhanced security headers
const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': [
    // Default to self
    "default-src 'self'",
    // Allow scripts from self and trusted sources
    "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://www.paypal.com https://*.paypal.com https://*.paypalobjects.com",
    // Allow styles from self and trusted sources
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Allow fonts from trusted sources
    "font-src 'self' https://fonts.gstatic.com",
    // Allow images from self, data URIs, and HTTPS sources
    "img-src 'self' data: https: blob:",
    // Allow connections to self and Supabase
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com https://*.googleapis.com https://www.google-analytics.com https://www.googletagmanager.com https://www.paypal.com https://*.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://*.paypalobjects.com",
    // Allow PayPal frames
    "frame-src https://www.paypal.com https://*.paypal.com https://*.paypalobjects.com",
    // Block object/embed/applet
    "object-src 'none'",
    // Restrict base URI
    "base-uri 'self'",
    // Restrict form actions
    "form-action 'self'",
    // Upgrade insecure requests
    "upgrade-insecure-requests",
  ].join('; '),
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy (restrict features)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()',
  // HSTS (HTTP Strict Transport Security)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

// Rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number; blockedUntil?: number }>()

const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100 // requests per window
const BLOCK_DURATION = 60 * 60 * 1000 // 1 hour block for abuse

function isRateLimited(ip: string, userAgent: string): { limited: boolean; remainingTime?: number } {
  const now = Date.now()
  const key = `${ip}:${userAgent}` // Include user agent to prevent IP spoofing
  const userData = rateLimitStore.get(key)

  // Check if user is currently blocked
  if (userData?.blockedUntil && now < userData.blockedUntil) {
    return { limited: true, remainingTime: userData.blockedUntil - now }
  }

  if (!userData || now > userData.resetTime) {
    // Reset or new user
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { limited: false }
  }

  if (userData.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Block the user for abuse
    const blockedUntil = now + BLOCK_DURATION
    rateLimitStore.set(key, {
      ...userData,
      count: userData.count + 1,
      blockedUntil
    })
    return { limited: true, remainingTime: blockedUntil - now }
  }

  userData.count++
  return { limited: false }
}

// Enhanced suspicious pattern detection
const suspiciousPatterns = [
  /sqlmap|nmap|masscan|gobuster|nikto|acunetix|openvas/i,
  /union.*select|select.*from.*where|script.*alert|javascript.*void/i,
  /\b(eval|exec|system|shell_exec|passthru|popen|proc_open)\b/i,
  /<\s*script[^>]*>.*<\s*\/\s*script\s*>/i,
  /on\w+\s*=\s*["'][^"']*["']/i,
  /\b(document\.|window\.|location\.|navigator\.)\w+\s*=/i,
  /base64_decode|eval\(base64|atob\s*\(/i,
  /php|asp|jsp|cfm/i,
]

// Input sanitization for query parameters
function sanitizeQueryParam(value: string): boolean {
  if (typeof value !== 'string') return false

  // Check for suspicious patterns
  if (suspiciousPatterns.some(pattern => pattern.test(value))) {
    return false
  }

  // Check for common injection patterns
  const injectionPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(select|from|where|into|values)\b)/i,
    /(-{2,}|\/\*|\*\/)/,
    /('|(\\x27)|(\\x2D\\x2D)|(\\\\x)|(\\')|(\\";)|(\\";)|(%27)|(%3B)|(%22)|(%2D%2D))/i,
  ]

  return !injectionPatterns.some(pattern => pattern.test(value))
}

export function middleware(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             request.headers.get('x-client-ip') ||
             'unknown'
  const userAgent = request.headers.get('user-agent') || ''
  const method = request.method
  const url = request.url

  // Enhanced rate limiting
  const rateLimitResult = isRateLimited(ip, userAgent)
  if (rateLimitResult.limited) {
    logAPI(method, url, 429, Date.now() - startTime)
    const response = new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': Math.ceil((rateLimitResult.remainingTime || 60000) / 1000).toString(),
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + (rateLimitResult.remainingTime || 60000)).toISOString(),
      },
    })

    // Apply security headers even to blocked requests
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }

  // Enhanced suspicious user agent detection
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    logAPI(method, url, 403, Date.now() - startTime)
    const response = new NextResponse('Forbidden', { status: 403 })

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }

  const pathname = request.nextUrl.pathname

  // API routes - stricter security
  if (pathname.startsWith('/api/')) {
    // Only allow specific HTTP methods
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    if (!allowedMethods.includes(method)) {
      logAPI(method, url, 405, Date.now() - startTime)
      const response = new NextResponse('Method Not Allowed', { status: 405 })

      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
    }

    // Enhanced query parameter validation
    const searchParams = request.nextUrl.searchParams
    for (const [key, value] of searchParams) {
      if (!sanitizeQueryParam(value)) {
        logAPI(method, url, 400, Date.now() - startTime)
        const response = new NextResponse('Bad Request', { status: 400 })

        Object.entries(securityHeaders).forEach(([key, value]) => {
          response.headers.set(key, value)
        })

        return response
      }
    }

    // Check for suspicious headers
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-client-ip']
    const hasSuspiciousHeaders = suspiciousHeaders.some(header =>
      request.headers.has(header) && request.headers.get(header) !== request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    )

    if (hasSuspiciousHeaders) {
      logAPI(method, url, 400, Date.now() - startTime)
      const response = new NextResponse('Bad Request', { status: 400 })

      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
    }
  }

  // Admin routes protection
  if (pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/')) {
    // In production, implement proper authentication check
    // For now, block all admin routes
    logAPI(method, url, 403, Date.now() - startTime)
    const response = new NextResponse('Forbidden', { status: 403 })

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }

  // Create response with enhanced security headers
  const response = NextResponse.next()

  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Add rate limit headers
  const userData = rateLimitStore.get(`${ip}:${userAgent}`)
  if (userData) {
    const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - userData.count)
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(userData.resetTime).toISOString())
  }

  // Log successful request
  const duration = Date.now() - startTime
  logAPI(method, url, 200, duration)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
