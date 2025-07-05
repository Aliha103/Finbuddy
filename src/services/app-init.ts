// Application initialization service
import { SecurityUtils } from '../utils/security'
import { MonitoringService, PerformanceMonitor, UserAnalytics } from './monitoring'
import { SEOUtils, AccessibilityUtils } from '../utils/seo'
import { AuthService } from './auth'

export class AppInitService {
  private static isInitialized = false

  static async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // 1. Initialize security
      await this.initializeSecurity()

      // 2. Initialize monitoring
      await this.initializeMonitoring()

      // 3. Initialize SEO and accessibility
      await this.initializeSEOAndAccessibility()

      // 4. Initialize authentication
      await this.initializeAuthentication()

      // 5. Start performance monitoring
      this.startPerformanceMonitoring()

      this.isInitialized = true
      console.log('✅ FinBuddy application initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize application:', error)
      // Don't throw to prevent app from breaking
    }
  }

  private static async initializeSecurity(): Promise<void> {
    // Apply Content Security Policy
    SecurityUtils.applyCSP()

    // Log security initialization
    MonitoringService.addBreadcrumb('Security initialized', 'app-init')
  }

  private static async initializeMonitoring(): Promise<void> {
    // Initialize Sentry error tracking
    MonitoringService.init()

    // Initialize user analytics session
    UserAnalytics.initSession()

    // Set application context
    MonitoringService.setContext('application', {
      name: 'FinBuddy',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: import.meta.env.MODE,
      buildTime: new Date().toISOString(),
    })

    // Set technology tags
    MonitoringService.setTag('framework', 'React')
    MonitoringService.setTag('bundler', 'Vite')
    MonitoringService.setTag('language', 'TypeScript')

    MonitoringService.addBreadcrumb('Monitoring initialized', 'app-init')
  }

  private static async initializeSEOAndAccessibility(): Promise<void> {
    // Set default SEO meta tags
    const pageConfig = SEOUtils.getPageConfigs().home
    SEOUtils.setMetaTags(pageConfig)

    // Set canonical URL
    SEOUtils.setCanonicalUrl()

    // Add structured data
    SEOUtils.setStructuredData({
      '@type': 'WebApplication',
      name: 'FinBuddy',
      description: pageConfig.description,
      url: window.location.origin,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web Browser',
      browserRequirements: 'HTML5, CSS3, JavaScript ES6+',
      softwareVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      releaseNotes: 'AI-powered financial management with enhanced security and accessibility',
    })

    // Initialize accessibility features
    AccessibilityUtils.manageFocus()
    AccessibilityUtils.addSkipLinks()
    AccessibilityUtils.addLandmarks()
    AccessibilityUtils.addKeyboardShortcuts()

    // Enhance forms when available
    setTimeout(() => {
      AccessibilityUtils.enhanceFormAccessibility()
    }, 1000)

    MonitoringService.addBreadcrumb('SEO and Accessibility initialized', 'app-init')
  }

  private static async initializeAuthentication(): Promise<void> {
    // Check for existing authentication
    if (AuthService.isAuthenticated()) {
      const user = AuthService.getCurrentUser()
      if (user) {
        MonitoringService.setUser(user)
        MonitoringService.addBreadcrumb('User session restored', 'auth')
      }
    } else if (AuthService.getRefreshToken()) {
      // Try to refresh token
      const refreshed = await AuthService.refreshAccessToken()
      if (refreshed) {
        const user = AuthService.getCurrentUser()
        if (user) {
          MonitoringService.setUser(user)
          MonitoringService.addBreadcrumb('User session refreshed', 'auth')
        }
      }
    }
  }

  private static startPerformanceMonitoring(): void {
    // Mark application start
    PerformanceMonitor.mark('app-init-complete')

    // Observe web vitals
    PerformanceMonitor.observeWebVitals()

    // Monitor route changes
    if (typeof window !== 'undefined') {
      let currentPath = window.location.pathname

      const observer = new MutationObserver(() => {
        if (window.location.pathname !== currentPath) {
          const newPath = window.location.pathname
          UserAnalytics.trackPageView(newPath)
          
          // Update SEO for new page
          this.updateSEOForRoute(newPath)
          
          currentPath = newPath
        }
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })
    }

    MonitoringService.addBreadcrumb('Performance monitoring started', 'app-init')
  }

  private static updateSEOForRoute(path: string): void {
    const pageConfigs = SEOUtils.getPageConfigs()
    let config = pageConfigs.home // default

    if (path === '/login') config = pageConfigs.login
    else if (path === '/signup') config = pageConfigs.signup
    else if (path.startsWith('/dashboard/balance')) config = pageConfigs.balance
    else if (path.startsWith('/dashboard')) config = pageConfigs.dashboard

    SEOUtils.setMetaTags(config)
    SEOUtils.setCanonicalUrl()
  }

  // Error handling for unhandled errors
  static setupGlobalErrorHandlers(): void {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      MonitoringService.captureError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      })
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      MonitoringService.captureError(
        new Error(event.reason?.message || 'Unhandled Promise Rejection'),
        {
          reason: event.reason,
          promise: event.promise,
        }
      )
    })

    // Handle console errors
    const originalConsoleError = console.error
    console.error = (...args) => {
      MonitoringService.captureMessage(
        args.join(' '),
        'error',
        { source: 'console.error' }
      )
      originalConsoleError.apply(console, args)
    }
  }

  // Cleanup on app unmount
  static cleanup(): void {
    this.isInitialized = false
    MonitoringService.addBreadcrumb('Application cleanup', 'app-cleanup')
  }
}
