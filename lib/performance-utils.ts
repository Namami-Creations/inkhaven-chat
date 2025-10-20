// Performance monitoring utilities
import React, { useEffect, useRef, useCallback } from 'react'
import { logPerformance } from '@/lib/logger'

// Performance measurement hook
export function usePerformanceMonitor(name: string) {
  const startTimeRef = useRef<number>()

  useEffect(() => {
    startTimeRef.current = performance.now()
    return () => {
      if (startTimeRef.current) {
        const duration = performance.now() - startTimeRef.current
        logPerformance(name, duration)
      }
    }
  }, [name])
}

// Measure function execution time
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now()
    try {
      const result = fn(...args)
      const duration = performance.now() - start
      logPerformance(name, duration)
      return result
    } catch (error) {
      const duration = performance.now() - start
      logPerformance(`${name}_error`, duration)
      throw error
    }
  }) as T
}

// Web Vitals measurement (for Core Web Vitals)
export function useWebVitals() {
  useEffect(() => {
    // CLS (Cumulative Layout Shift)
    let clsValue = 0
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
      logPerformance('CLS', clsValue)
    })
    observer.observe({ type: 'layout-shift', buffered: true })

    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as any
      logPerformance('LCP', lastEntry.startTime)
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

    // FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        logPerformance('FID', (entry as any).processingStart - entry.startTime)
      }
    })
    fidObserver.observe({ type: 'first-input', buffered: true })

    return () => {
      observer.disconnect()
      lcpObserver.disconnect()
      fidObserver.disconnect()
    }
  }, [])
}

// Memoization helpers
import { memo, useMemo, useCallback as reactUseCallback } from 'react'

// Enhanced memo with display name for debugging
export function memoizedComponent<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
) {
  const Memoized = memo(Component)
  Memoized.displayName = displayName || Component.displayName || 'MemoizedComponent'
  return Memoized
}

// Stable callback creator (prevents unnecessary re-renders)
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useMemo(() => callback, deps) as T
}

// Deep comparison memo (for complex objects)
export function useDeepMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>()

  if (!ref.current || !shallowEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() }
  }

  return ref.current.value
}

// Shallow equal utility
function shallowEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

// Bundle size monitoring
export function logBundleSize() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Log bundle size on first load
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      const { transferSize, decodedBodySize } = navigation
      logPerformance('bundle_transfer_size', transferSize)
      logPerformance('bundle_decoded_size', decodedBodySize)
    }
  }
}

// Image lazy loading hook
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = React.useState(placeholder || '')
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImageSrc(src)
      setIsLoading(false)
    }
    img.onerror = () => {
      setError('Failed to load image')
      setIsLoading(false)
    }
    img.src = src
  }, [src])

  return { imageSrc, isLoading, error }
}
