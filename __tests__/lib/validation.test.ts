import { validateData, validateAndSanitize, sanitizeString, sanitizeHtml } from '@/lib/validation'
import { registrationSchema, loginSchema, messageSchema, userSchema } from '@/lib/validation'

describe('Validation Utilities', () => {
  describe('validateData', () => {
    it('returns success for valid data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'ValidPass123',
        confirmPassword: 'ValidPass123',
        username: 'testuser',
        age: 25,
        agreeToTerms: true,
      }

      const result = validateData(registrationSchema, validData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(validData)
    })

    it('returns error for invalid data', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'weak',
        username: 'u', // too short
      }

      const result = validateData(loginSchema, invalidData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('validateAndSanitize', () => {
    it('returns validated data for valid input', () => {
      const validMessage = {
        content: 'Hello world',
        userId: 'user123',
      }

      const result = validateAndSanitize(messageSchema, validMessage)

      expect(result).toEqual(validMessage)
    })

    it('returns null for invalid input', () => {
      const invalidMessage = {
        content: '', // empty content
        userId: 'user123',
      }

      const result = validateAndSanitize(messageSchema, invalidMessage)

      expect(result).toBeNull()
    })
  })

  describe('Registration Schema', () => {
    it('validates correct registration data', () => {
      const validRegistration = {
        email: 'user@example.com',
        username: 'validuser',
        password: 'StrongPass123',
        confirmPassword: 'StrongPass123',
        age: 25,
        agreeToTerms: true,
      }

      const result = validateData(registrationSchema, validRegistration)
      expect(result.success).toBe(true)
    })

    it('rejects passwords that do not match', () => {
      const invalidRegistration = {
        email: 'user@example.com',
        username: 'validuser',
        password: 'StrongPass123',
        confirmPassword: 'DifferentPass123',
        age: 25,
        agreeToTerms: true,
      }

      const result = validateData(registrationSchema, invalidRegistration)
      expect(result.success).toBe(false)
      expect(result.errors?.issues.some(issue => issue.path.includes('confirmPassword'))).toBe(true)
    })

    it('rejects users under 18', () => {
      const invalidRegistration = {
        email: 'user@example.com',
        username: 'validuser',
        password: 'StrongPass123',
        confirmPassword: 'StrongPass123',
        age: 16,
        agreeToTerms: true,
      }

      const result = validateData(registrationSchema, invalidRegistration)
      expect(result.success).toBe(false)
    })

    it('rejects weak passwords', () => {
      const invalidRegistration = {
        email: 'user@example.com',
        username: 'validuser',
        password: 'weak',
        confirmPassword: 'weak',
        age: 25,
        agreeToTerms: true,
      }

      const result = validateData(registrationSchema, invalidRegistration)
      expect(result.success).toBe(false)
    })

    it('rejects invalid usernames', () => {
      const invalidUsernames = ['u', 'user@domain', 'user-name', '-username', 'username-']

      invalidUsernames.forEach(username => {
        const invalidRegistration = {
          email: 'user@example.com',
          username,
          password: 'StrongPass123',
          confirmPassword: 'StrongPass123',
          age: 25,
          agreeToTerms: true,
        }

        const result = validateData(registrationSchema, invalidRegistration)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Message Schema', () => {
    it('validates correct message data', () => {
      const validMessage = {
        content: 'This is a valid message',
        userId: 'user123',
        messageType: 'text' as const,
      }

      const result = validateData(messageSchema, validMessage)
      expect(result.success).toBe(true)
    })

    it('rejects XSS attempts', () => {
      const xssMessage = {
        content: '<script>alert("xss")</script>',
        userId: 'user123',
      }

      const result = validateData(messageSchema, xssMessage)
      expect(result.success).toBe(false)
    })

    it('rejects empty messages', () => {
      const emptyMessage = {
        content: '',
        userId: 'user123',
      }

      const result = validateData(messageSchema, emptyMessage)
      expect(result.success).toBe(false)
    })

    it('rejects overly long messages', () => {
      const longMessage = {
        content: 'a'.repeat(2001), // Over 2000 characters
        userId: 'user123',
      }

      const result = validateData(messageSchema, longMessage)
      expect(result.success).toBe(false)
    })
  })

  describe('sanitizeString', () => {
    it('removes script tags', () => {
      const malicious = '<script>alert("xss")</script>Hello world'
      const sanitized = sanitizeString(malicious)

      expect(sanitized).toBe('Hello world')
    })

    it('removes iframe tags', () => {
      const malicious = '<iframe src="evil.com"></iframe>Content'
      const sanitized = sanitizeString(malicious)

      expect(sanitized).toBe('Content')
    })

    it('trims whitespace', () => {
      const input = '  hello world  '
      const sanitized = sanitizeString(input)

      expect(sanitized).toBe('hello world')
    })
  })

  describe('sanitizeHtml', () => {
    it('removes dangerous tags', () => {
      const malicious = '<script>evil()</script><iframe></iframe><object></object><embed></embed>safe content'
      const sanitized = sanitizeHtml(malicious)

      expect(sanitized).toBe('safe content')
    })

    it('removes javascript protocols', () => {
      const malicious = '<a href="javascript:alert(1)">click me</a>'
      const sanitized = sanitizeHtml(malicious)

      expect(sanitized).toBe('<a href="">click me</a>')
    })

    it('removes event handlers', () => {
      const malicious = '<button onclick="evil()">click</button>'
      const sanitized = sanitizeHtml(malicious)

      expect(sanitized).toBe('<button >click</button>')
    })
  })
})
