// Accessibility utilities and hooks
import { useEffect, useRef, useState, useCallback } from 'react'

// ARIA live region for screen reader announcements
export function useAriaLive(delay = 100) {
  const [announcement, setAnnouncement] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout>()

  const announce = useCallback((message: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setAnnouncement(message)
      // Clear after announcement
      setTimeout(() => setAnnouncement(''), 1000)
    }, delay)
  }, [delay])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { announcement, announce }
}

// Focus management hook
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement>(null)

  const setFocus = useCallback(() => {
    if (focusRef.current) {
      focusRef.current.focus()
    }
  }, [])

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { focusRef, setFocus, trapFocus }
}

// Skip link hook for keyboard navigation
export function useSkipLink(targetId: string) {
  const handleSkip = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const target = document.getElementById(targetId)
      if (target) {
        target.focus()
        target.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [targetId])

  return { handleSkip }
}

// Keyboard navigation hook
export function useKeyboardNavigation(
  items: any[],
  onSelect: (item: any, index: number) => void
) {
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          onSelect(items[focusedIndex], focusedIndex)
        }
        break
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setFocusedIndex(items.length - 1)
        break
    }
  }, [items, focusedIndex, onSelect])

  return { focusedIndex, handleKeyDown, setFocusedIndex }
}

// Screen reader utilities
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.style.position = 'absolute'
  announcement.style.left = '-10000px'
  announcement.style.width = '1px'
  announcement.style.height = '1px'
  announcement.style.overflow = 'hidden'

  document.body.appendChild(announcement)
  announcement.textContent = message

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Color contrast utilities
export function getContrastRatio(color1: string, color2: string): number {
  // Simple contrast calculation (in production, use a proper library)
  const getLuminance = (color: string) => {
    // Convert hex to RGB, then to relative luminance
    // This is a simplified version
    return color === '#000000' ? 0 : 1
  }

  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)

  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

// Reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// High contrast mode detection
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false)

  useEffect(() => {
    // Detect high contrast mode (simplified)
    const testElement = document.createElement('div')
    testElement.style.color = 'rgb(255, 255, 255)'
    testElement.style.backgroundColor = 'rgb(0, 0, 0)'
    document.body.appendChild(testElement)

    const computedStyle = window.getComputedStyle(testElement)
    const isHighContrast = computedStyle.color === 'rgb(255, 255, 255)' &&
                          computedStyle.backgroundColor === 'rgb(0, 0, 0)'

    document.body.removeChild(testElement)
    setPrefersHighContrast(isHighContrast)
  }, [])

  return prefersHighContrast
}

// Accessible form validation
export function useAccessibleValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const setFieldTouched = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const getFieldProps = useCallback((field: string) => ({
    'aria-invalid': errors[field] ? 'true' : 'false',
    'aria-describedby': errors[field] ? `${field}-error` : undefined,
    onBlur: () => setFieldTouched(field),
  }), [errors, setFieldTouched])

  const getErrorProps = useCallback((field: string) => ({
    id: `${field}-error`,
    role: 'alert',
    'aria-live': 'polite',
  }), [])

  return {
    errors,
    touched,
    setFieldError,
    clearFieldError,
    setFieldTouched,
    getFieldProps,
    getErrorProps,
  }
}
