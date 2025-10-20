// Monitoring and analytics utilities
import { useEffect } from 'react'
import { logInfo, logError } from '@/lib/logger'

// Analytics event types
export type AnalyticsEvent =
  | 'page_view'
  | 'user_action'
  | 'error'
  | 'performance_metric'
  | 'feature_usage'
  | 'conversion'

// Analytics event data
export interface AnalyticsData {
  event: AnalyticsEvent
  category?: string
  action?: string
  label?: string
  value?: number
  userId?: string
  sessionId?: string
  timestamp?: number
  metadata?: Record<string, any>
}

// Privacy-compliant analytics
class AnalyticsService {
  private events: AnalyticsData[] = []
  private sessionId: string
  private userId: string | null = null

  constructor() {
    this.sessionId = this.generateSessionId()
    this.loadUserId()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private loadUserId() {
    if (typeof window !== 'undefined') {
      this.userId = localStorage.getItem('analytics_user_id') || this.generateUserId()
      localStorage.setItem('analytics_user_id', this.userId)
    }
  }

  private generateUserId(): string {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_user_id', userId)
    }
    return userId
  }

  // Track an event
  track(event: AnalyticsData) {
    const enrichedEvent: AnalyticsData = {
      ...event,
      userId: this.userId || undefined,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    }

    this.events.push(enrichedEvent)

    // Log to our logging system
    logInfo(`Analytics: ${event.event}`, {
      category: event.category,
      action: event.action,
      label: event.label,
      value: event.value,
      ...event.metadata,
    })

    // Send to analytics service (placeholder)
    this.sendToAnalytics(enrichedEvent)

    // Keep only last 100 events in memory
    if (this.events.length > 100) {
      this.events = this.events.slice(-50)
    }
  }

  private async sendToAnalytics(event: AnalyticsData) {
    // In production, send to your analytics service
    // For now, just log (you could send to Google Analytics, Mixpanel, etc.)
    if (process.env.NODE_ENV === 'production') {
      try {
        // Example: Send to Google Analytics 4
        if (typeof window !== 'undefined' && (window as any).gtag) {
          ;(window as any).gtag('event', event.event, {
            event_category: event.category,
            event_label: event.label,
            value: event.value,
            custom_user_id: event.userId,
            custom_session_id: event.sessionId,
            ...event.metadata,
          })
        }
      } catch (error) {
        logError('Failed to send analytics event', error as Error)
      }
    }
  }

  // Track page views
  trackPageView(pathname: string, search?: string) {
    this.track({
      event: 'page_view',
      category: 'navigation',
      action: 'page_view',
      label: pathname + (search || ''),
      metadata: {
        pathname,
        search,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      },
    })
  }

  // Track user actions
  trackUserAction(action: string, category: string, label?: string, value?: number) {
    this.track({
      event: 'user_action',
      category,
      action,
      label,
      value,
      metadata: {
        element: label,
      },
    })
  }

  // Track feature usage
  trackFeatureUsage(feature: string, action: string, metadata?: Record<string, any>) {
    this.track({
      event: 'feature_usage',
      category: 'feature',
      action,
      label: feature,
      metadata,
    })
  }

  // Track conversions
  trackConversion(conversionType: string, value?: number, metadata?: Record<string, any>) {
    this.track({
      event: 'conversion',
      category: 'conversion',
      action: conversionType,
      value,
      metadata,
    })
  }

  // Get analytics data (for debugging)
  getEvents(): AnalyticsData[] {
    return [...this.events]
  }

  // Export data for analysis
  exportData(): AnalyticsData[] {
    return this.events.map(event => ({
      ...event,
      // Remove sensitive data before export
      userId: event.userId ? this.hashUserId(event.userId) : undefined,
    }))
  }

  private hashUserId(userId: string): string {
    // Simple hash for privacy (use a proper hashing library in production)
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }
}

// Global analytics instance
export const analytics = new AnalyticsService()

// React hook for analytics
export function useAnalytics() {
  useEffect(() => {
    // Track page views
    const handleRouteChange = (pathname: string) => {
      analytics.trackPageView(pathname, window.location.search)
    }

    // Track initial page view
    handleRouteChange(window.location.pathname)

    // Listen for navigation events (simplified - in Next.js you'd use router events)
    const handlePopState = () => {
      handleRouteChange(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return {
    track: analytics.track.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
  }
}

// Performance monitoring hook
export function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()

    return () => {
      const duration = performance.now() - startTime
      analytics.track({
        event: 'performance_metric',
        category: 'component',
        action: 'render_time',
        label: componentName,
        value: Math.round(duration),
        metadata: {
          component: componentName,
        },
      })
    }
  }, [componentName])
}

// Error tracking hook
export function useErrorTracking(componentName: string) {
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      analytics.track({
        event: 'error',
        category: 'javascript',
        action: 'runtime_error',
        label: componentName,
        metadata: {
          message: error.message,
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno,
          component: componentName,
        },
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.track({
        event: 'error',
        category: 'promise',
        action: 'unhandled_rejection',
        label: componentName,
        metadata: {
          reason: event.reason,
          component: componentName,
        },
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [componentName])
}

// User engagement tracking
export function useEngagementTracking(threshold = 30000) {
  useEffect(() => {
    let lastActivity = Date.now()
    let engaged = false

    const updateActivity = () => {
      lastActivity = Date.now()
      if (!engaged) {
        engaged = true
        analytics.track({
          event: 'user_action',
          category: 'engagement',
          action: 'session_start',
          metadata: {
            timestamp: lastActivity,
          },
        })
      }
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    const checkEngagement = () => {
      const now = Date.now()
      if (engaged && now - lastActivity > threshold) {
        engaged = false
        analytics.track({
          event: 'user_action',
          category: 'engagement',
          action: 'session_end',
          metadata: {
            duration: now - lastActivity,
            timestamp: now,
          },
        })
      }
    }

    const interval = setInterval(checkEngagement, 10000) // Check every 10 seconds

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity)
      })
      clearInterval(interval)
    }
  }, [threshold])
}
