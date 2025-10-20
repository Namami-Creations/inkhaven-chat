// Rate limiting utilities for API routes
import { NextRequest, NextResponse } from 'next/server'
import { logWarn } from '@/lib/logger'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  totalRequests: number
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number; windowStart: number }>()

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now()
    const existing = rateLimitStore.get(identifier)

    if (!existing || now > existing.resetTime) {
      // New window or expired
      const resetTime = now + this.config.windowMs
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime,
        windowStart: now,
      })
      return {
        success: true,
        remaining: this.config.maxRequests - 1,
        resetTime,
        totalRequests: 1,
      }
    }

    if (existing.count >= this.config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime: existing.resetTime,
        totalRequests: existing.count,
      }
    }

    existing.count++
    return {
      success: true,
      remaining: this.config.maxRequests - existing.count,
      resetTime: existing.resetTime,
      totalRequests: existing.count,
    }
  }

  reset(identifier: string): void {
    rateLimitStore.delete(identifier)
  }
}

// Pre-configured rate limiters for different use cases
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
})

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 auth attempts per 15 minutes
})

export const messageRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 messages per minute
})

export const fileUploadRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 uploads per hour
})

// Helper function to get client identifier
export function getClientIdentifier(request: NextRequest): string {
  // Use IP address as primary identifier
  const ip = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  // For authenticated routes, you could also include user ID
  // const userId = await getUserIdFromRequest(request)
  // return userId ? `${ip}:${userId}` : ip

  return ip
}

// Middleware helper for API routes
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse,
  limiter: RateLimiter,
  identifierFn: (request: NextRequest) => string = getClientIdentifier
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const identifier = identifierFn(request)
    const result = limiter.check(identifier)

    if (!result.success) {
      logWarn('Rate limit exceeded', {
        identifier,
        limit: limiter['config'].maxRequests,
        windowMs: limiter['config'].windowMs,
        totalRequests: result.totalRequests,
        path: request.nextUrl.pathname,
        method: request.method,
      })

      return new NextResponse(JSON.stringify({
        error: 'Too many requests',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
        },
      })
    }

    // Add rate limit headers to successful responses
    const response = await handler(request, ...args)

    if (response instanceof NextResponse) {
      response.headers.set('X-RateLimit-Limit', limiter['config'].maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
    }

    return response
  }
}

// Clean up expired entries periodically (in production, this would be handled by Redis TTL)
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes
