import { z } from 'zod'

// Password validation helper
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
  .refine(
    (password) => !/\s/.test(password),
    'Password cannot contain spaces'
  )
  .refine(
    (password) => !/(.)\1{2,}/.test(password),
    'Password cannot contain three or more consecutive identical characters'
  )

// Registration validation schema
export const registrationSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .toLowerCase()
    .trim(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .refine(
      (username) => !username.startsWith('_') && !username.startsWith('-'),
      'Username cannot start with underscore or hyphen'
    )
    .refine(
      (username) => !username.endsWith('_') && !username.endsWith('-'),
      'Username cannot end with underscore or hyphen'
    ),
  password: passwordSchema,
  confirmPassword: z.string(),
  age: z.number()
    .int('Age must be a whole number')
    .min(18, 'You must be at least 18 years old')
    .max(120, 'Please enter a valid age'),
  agreeToTerms: z.boolean()
    .refine((val) => val === true, 'You must agree to the terms of service'),
  interests: z.array(z.string().max(50))
    .max(10, 'You can select up to 10 interests')
    .optional(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
)

// Login validation schema
export const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Password is required'),
})

// Password reset schema
export const passwordResetSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
})

// New password schema
export const newPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
)

// User input validation schemas
export const userSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email is too long'),
  displayName: z.string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be less than 50 characters')
    .trim(),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  interests: z.array(z.string().max(50))
    .max(10, 'Maximum 10 interests allowed')
    .optional(),
})

export const messageSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message is too long')
    .refine(
      (content) => !/<script|<iframe|<object|<embed/i.test(content),
      'Invalid content detected'
    ),
  roomId: z.string().uuid('Invalid room ID').optional(),
})

export const roomSchema = z.object({
  name: z.string()
    .min(1, 'Room name is required')
    .max(100, 'Room name is too long')
    .refine(
      (name) => !/<script|<iframe|<object|<embed/i.test(name),
      'Invalid room name'
    ),
  description: z.string()
    .max(500, 'Description is too long')
    .optional(),
})

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB
      'File size must be less than 10MB'
    )
    .refine(
      (file) => {
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/quicktime', 'video/x-msvideo',
          'audio/mpeg', 'audio/wav', 'audio/ogg',
          'application/pdf', 'text/plain'
        ]
        return allowedTypes.includes(file.type)
      },
      'File type not allowed'
    ),
})

// AI service validation
export const aiRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message is required')
    .max(4000, 'Message is too long'),
  context: z.string()
    .max(2000, 'Context is too long')
    .optional(),
  temperature: z.number()
    .min(0, 'Temperature must be at least 0')
    .max(2, 'Temperature must be at most 2')
    .optional(),
})

// Payment validation
export const paymentSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(1000, 'Amount is too large'),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  description: z.string()
    .max(200, 'Description is too long')
    .optional(),
})

// Search validation
export const searchSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(100, 'Search query is too long')
    .refine(
      (query) => !/<script|<iframe|<object|<embed/i.test(query),
      'Invalid search query'
    ),
  limit: z.number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100')
    .optional()
    .default(20),
  offset: z.number()
    .min(0, 'Offset must be non-negative')
    .optional()
    .default(0),
})

// Validation helper functions
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  try {
    return schema.parse(data)
  } catch (error) {
    return null
  }
}

// Sanitization helpers
export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .trim()
}

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return input
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '')
    .replace(/<object[^>]*>.*?<\/object>/gis, '')
    .replace(/<embed[^>]*>.*?<\/embed>/gis, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}
