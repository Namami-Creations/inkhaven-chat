// Security configuration and utilities
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMITS: {
    API: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 100,
    },
    AUTH: {
      WINDOW_MS: 15 * 60 * 1000,
      MAX_REQUESTS: 5, // Stricter for auth endpoints
    },
  },

  // Content Security Policy
  CSP: {
    DIRECTIVES: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      'font-src': ["'self'", "https://fonts.gstatic.com"],
      'img-src': ["'self'", "data:", "https:", "blob:"],
      'connect-src': [
        "'self'",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://api.openai.com",
        "https://generativelanguage.googleapis.com"
      ],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': [],
    },
  },

  // CORS configuration
  CORS: {
    ORIGINS: process.env.NODE_ENV === 'production'
      ? ['https://yourdomain.com'] // Add your production domains
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    METHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
    CREDENTIALS: true,
  },

  // Password policy
  PASSWORD_POLICY: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: false,
    MAX_LENGTH: 128,
    PREVENT_COMMON_PASSWORDS: true,
    PREVENT_SEQUENTIAL_CHARS: true,
  },

  // Session security
  SESSION: {
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    SECURE: process.env.NODE_ENV === 'production',
    HTTP_ONLY: true,
    SAME_SITE: 'strict' as const,
  },

  // File upload security
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'video/mp4',
      'application/pdf',
    ],
    MAX_FILES: 5,
    VIRUS_SCANNING: true,
  },

  // API security
  API: {
    API_KEY_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 days
    REQUEST_TIMEOUT: 30000, // 30 seconds
    MAX_REQUEST_SIZE: '10mb',
  },
}

// Security utility functions
export class SecurityUtils {
  // Sanitize HTML input
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return ''

    return input
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '')
      .replace(/<object[^>]*>.*?<\/object>/gis, '')
      .replace(/<embed[^>]*>.*?<\/embed>/gis, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }

  // Check password strength
  static validatePassword(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < SECURITY_CONFIG.PASSWORD_POLICY.MIN_LENGTH) {
      errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD_POLICY.MIN_LENGTH} characters long`)
    }

    if (password.length > SECURITY_CONFIG.PASSWORD_POLICY.MAX_LENGTH) {
      errors.push(`Password must be less than ${SECURITY_CONFIG.PASSWORD_POLICY.MAX_LENGTH} characters long`)
    }

    if (SECURITY_CONFIG.PASSWORD_POLICY.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (SECURITY_CONFIG.PASSWORD_POLICY.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (SECURITY_CONFIG.PASSWORD_POLICY.REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (/\s/.test(password)) {
      errors.push('Password cannot contain spaces')
    }

    if (SECURITY_CONFIG.PASSWORD_POLICY.PREVENT_SEQUENTIAL_CHARS && /(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain three or more consecutive identical characters')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Generate secure random string
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Hash sensitive data for logging (not for passwords)
  static hashForLogging(input: string): string {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  // Check if request is from a suspicious IP
  static isSuspiciousIP(ip: string): boolean {
    // Add your suspicious IP patterns here
    const suspiciousPatterns = [
      /^192\.168\./,  // Private networks
      /^10\./,        // Private networks
      /^172\./,       // Private networks
    ]

    return suspiciousPatterns.some(pattern => pattern.test(ip))
  }

  // Validate file upload
  static validateFile(file: File): {
    isValid: boolean
    error?: string
  } {
    if (file.size > SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds ${SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB limit`
      }
    }

    if (!SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not allowed'
      }
    }

    return { isValid: true }
  }

  // Rate limiting helper
  static checkRateLimit(
    requests: number[],
    windowMs: number,
    maxRequests: number
  ): boolean {
    const now = Date.now()
    const windowStart = now - windowMs

    // Filter requests within the window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart)

    return recentRequests.length < maxRequests
  }

  // CSRF token generation
  static generateCSRFToken(): string {
    return this.generateSecureToken(64)
  }

  // Input sanitization for database queries
  static sanitizeForDatabase(input: string): string {
    if (typeof input !== 'string') return ''

    // Remove potentially dangerous characters
    return input
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/['"`\\]/g, '') // Remove quotes and backslashes
      .trim()
      .substring(0, 1000) // Limit length
  }
}

// Security headers middleware helper
export function generateSecurityHeaders() {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Cross-Origin-Embedder-Policy': 'credentialless',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': Object.entries(SECURITY_CONFIG.CSP.DIRECTIVES)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; '),
  }
}
