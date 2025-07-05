import * as Sentry from '@sentry/react'
import type { User } from '../types'

export class MonitoringService {
  private static isInitialized = false

  // Initialize Sentry
  static init(): void {
    if (this.isInitialized || import.meta.env.DEV) return

    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.VITE_ENVIRONMENT || 'production',
      
      integrations: [
        // Basic browser integrations
      ],

      // Performance monitoring
      tracesSampleRate: import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE 
        ? parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE) 
        : 0.1,

      // Error sampling
      sampleRate: 1.0,

      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',

      // Privacy settings
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request?.data) {
          // Remove password fields
          if (typeof event.request.data === 'object') {
            delete event.request.data.password
            delete event.request.data.confirmPassword
            delete event.request.data.token
          }
        }

        // Don't send certain errors in development
        if (import.meta.env.DEV && hint.originalException?.message?.includes('ResizeObserver')) {
          return null
        }

        return event
      },

      // Ignore certain errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Script error.',
        'Non-Error promise rejection captured',
        'Network Error',
        'NetworkError',
        'TypeError: Failed to fetch',
        'TypeError: NetworkError when attempting to fetch resource',
        'ChunkLoadError',
        'Loading CSS chunk'
      ],

      // Capture unhandled promise rejections
      captureUnhandledRejections: true,
    })

    this.isInitialized = true
  }

  // Set user context
  static setUser(user: User | null): void {
    if (!this.isInitialized) return

    Sentry.setUser(user ? {
      id: user.id,
      email: user.email,
      username: user.name,
    } : null)
  }

  // Add breadcrumb for debugging
  static addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.isInitialized) return

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    })
  }

  // Capture custom errors
  static captureError(error: Error, context?: Record<string, any>): void {
    if (!this.isInitialized) {
      console.error('Monitoring Error:', error, context)
      return
    }

    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value)
        })
      }
      Sentry.captureException(error)
    })
  }

  // Capture custom messages
  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>): void {
    if (!this.isInitialized) {
      console[level]('Monitoring Message:', message, context)
      return
    }

    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value)
        })
      }
      Sentry.captureMessage(message, level)
    })
  }

  // Track custom events
  static trackEvent(eventName: string, properties?: Record<string, any>): void {
    this.addBreadcrumb(`Event: ${eventName}`, 'user', 'info')
    
    // Also send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties)
    }
  }

  // Performance monitoring
  static startTransaction(name: string, description?: string): any {
    if (!this.isInitialized) return null

    // Using Sentry hub for transaction creation
    const hub = Sentry.getCurrentHub()
    return hub.startTransaction({
      name,
      description,
      op: 'navigation',
    })
  }

  // Set tags for filtering
  static setTag(key: string, value: string): void {
    if (!this.isInitialized) return
    Sentry.setTag(key, value)
  }

  // Set context
  static setContext(key: string, context: Record<string, any>): void {
    if (!this.isInitialized) return
    Sentry.setContext(key, context)
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map()

  static mark(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(name)
      this.metrics.set(name, performance.now())
    }
  }

  static measure(name: string, startMark: string): number | null {
    if (typeof performance === 'undefined') return null

    try {
      const endTime = performance.now()
      const startTime = this.metrics.get(startMark)
      
      if (startTime) {
        const duration = endTime - startTime
        
        // Send to Sentry
        MonitoringService.addBreadcrumb(
          `Performance: ${name} took ${duration.toFixed(2)}ms`,
          'performance',
          duration > 1000 ? 'warning' : 'info'
        )

        // Log slow operations
        if (duration > 2000) {
          MonitoringService.captureMessage(
            `Slow operation detected: ${name}`,
            'warning',
            { duration, operation: name }
          )
        }

        return duration
      }
    } catch (error) {
      console.warn('Performance measurement failed:', error)
    }

    return null
  }

  // Monitor Core Web Vitals
  static observeWebVitals(): void {
    if (typeof window === 'undefined') return

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        MonitoringService.addBreadcrumb(
          `FID: ${entry.processingStart - entry.startTime}ms`,
          'web-vitals'
        )
      }
    }).observe({ entryTypes: ['first-input'] })

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      MonitoringService.addBreadcrumb(
        `LCP: ${lastEntry.startTime}ms`,
        'web-vitals'
      )
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
      MonitoringService.addBreadcrumb(
        `CLS: ${clsValue}`,
        'web-vitals'
      )
    }).observe({ entryTypes: ['layout-shift'] })
  }
}

// User Analytics
export class UserAnalytics {
  private static sessionId: string = ''
  private static sessionStart: number = 0

  static initSession(): void {
    this.sessionId = this.generateSessionId()
    this.sessionStart = Date.now()
    
    MonitoringService.setContext('session', {
      sessionId: this.sessionId,
      startTime: this.sessionStart,
    })
  }

  static trackPageView(page: string): void {
    MonitoringService.trackEvent('page_view', {
      page,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    })
  }

  static trackUserAction(action: string, details?: Record<string, any>): void {
    MonitoringService.trackEvent('user_action', {
      action,
      ...details,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    })
  }

  static trackError(error: Error, context?: Record<string, any>): void {
    MonitoringService.captureError(error, {
      ...context,
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.sessionStart,
    })
  }

  private static generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }
}
