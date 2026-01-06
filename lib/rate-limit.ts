import crypto from 'crypto'

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

export type LimitResult = {
  allowed: boolean
  remaining?: number
  reset?: number
  reason?: string
}

async function redisIncrWithTtl(key: string, ttlSeconds: number): Promise<{ value: number; reset: number }> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    // Fallback: allow when redis is not configured
    return { value: 0, reset: Date.now() + ttlSeconds * 1000 }
  }

  const url = `${REDIS_URL}/pipeline`
  const nowSeconds = Math.floor(Date.now() / 1000)
  const reset = nowSeconds + ttlSeconds

  const body = [
    ['INCR', key],
    ['EXPIRE', key, ttlSeconds]
  ]

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    throw new Error(`Redis error: ${res.status}`)
  }

  const data = (await res.json()) as any[]
  const incrReply = Array.isArray(data) && data[0]?.result
  return { value: Number(incrReply ?? 0), reset: reset * 1000 }
}

export async function checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<LimitResult> {
  try {
    const hashedKey = crypto.createHash('sha256').update(identifier).digest('hex')
    const key = `rl:${windowSeconds}:${hashedKey}`
    const { value, reset } = await redisIncrWithTtl(key, windowSeconds)
    const remaining = Math.max(0, limit - value)
    if (value > limit) {
      return { allowed: false, remaining: 0, reset, reason: 'rate_limit_exceeded' }
    }
    return { allowed: true, remaining, reset }
  } catch (error) {
    console.error('Rate limit error', error)
    // Fail-open to avoid blocking users if Redis is unavailable
    return { allowed: true, reason: 'rate_limit_bypass' }
  }
}
