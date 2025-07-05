// SEO and meta tags utilities
interface MetaTagsConfig {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: string
  siteName?: string
  locale?: string
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  twitterSite?: string
  author?: string
  publishedTime?: string
  modifiedTime?: string
}

export class SEOUtils {
  private static readonly DEFAULT_CONFIG: MetaTagsConfig = {
    title: 'FinBuddy - AI-Powered Personal & Group Finance Manager',
    description: 'Modern AI-powered finance application for managing personal expenses and group spending. Track expenses, split bills, and get intelligent financial insights.',
    keywords: [
      'finance app',
      'expense tracker',
      'bill splitting',
      'personal finance',
      'group expenses',
      'AI financial assistant',
      'budgeting app',
      'money management'
    ],
    siteName: 'FinBuddy',
    locale: 'en_US',
    type: 'website',
    twitterCard: 'summary_large_image',
    twitterSite: '@finbuddy_app',
    author: 'FinBuddy Team'
  }

  // Set meta tags for current page
  static setMetaTags(config: MetaTagsConfig): void {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config }
    
    // Basic meta tags
    this.updateMetaTag('title', mergedConfig.title!)
    this.updateMetaTag('description', mergedConfig.description!)
    this.updateMetaTag('keywords', mergedConfig.keywords!.join(', '))
    this.updateMetaTag('author', mergedConfig.author!)

    // Open Graph tags
    this.updateMetaTag('og:title', mergedConfig.title!, 'property')
    this.updateMetaTag('og:description', mergedConfig.description!, 'property')
    this.updateMetaTag('og:type', mergedConfig.type!, 'property')
    this.updateMetaTag('og:site_name', mergedConfig.siteName!, 'property')
    this.updateMetaTag('og:locale', mergedConfig.locale!, 'property')
    
    if (mergedConfig.url) {
      this.updateMetaTag('og:url', mergedConfig.url, 'property')
    }
    
    if (mergedConfig.image) {
      this.updateMetaTag('og:image', mergedConfig.image, 'property')
      this.updateMetaTag('og:image:alt', mergedConfig.title!, 'property')
    }

    // Twitter Card tags
    this.updateMetaTag('twitter:card', mergedConfig.twitterCard!)
    this.updateMetaTag('twitter:title', mergedConfig.title!)
    this.updateMetaTag('twitter:description', mergedConfig.description!)
    
    if (mergedConfig.twitterSite) {
      this.updateMetaTag('twitter:site', mergedConfig.twitterSite)
    }
    
    if (mergedConfig.image) {
      this.updateMetaTag('twitter:image', mergedConfig.image)
    }

    // Article meta tags
    if (mergedConfig.publishedTime) {
      this.updateMetaTag('article:published_time', mergedConfig.publishedTime, 'property')
    }
    
    if (mergedConfig.modifiedTime) {
      this.updateMetaTag('article:modified_time', mergedConfig.modifiedTime, 'property')
    }

    // Update page title
    if (typeof document !== 'undefined') {
      document.title = mergedConfig.title!
    }
  }

  // Update or create meta tag
  private static updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name'): void {
    if (typeof document === 'undefined') return

    let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement
    
    if (!element) {
      element = document.createElement('meta')
      element.setAttribute(attribute, name)
      document.head.appendChild(element)
    }
    
    element.content = content
  }

  // Generate canonical URL
  static setCanonicalUrl(url?: string): void {
    if (typeof document === 'undefined') return

    const canonicalUrl = url || window.location.href.split('?')[0].split('#')[0]
    
    let linkElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    
    if (!linkElement) {
      linkElement = document.createElement('link')
      linkElement.rel = 'canonical'
      document.head.appendChild(linkElement)
    }
    
    linkElement.href = canonicalUrl
  }

  // Generate structured data (JSON-LD)
  static setStructuredData(data: Record<string, any>): void {
    if (typeof document === 'undefined') return

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'FinBuddy',
      description: 'AI-powered personal and group finance management application',
      url: window.location.origin,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      author: {
        '@type': 'Organization',
        name: 'FinBuddy Team'
      },
      ...data
    }

    let scriptElement = document.querySelector('script[type="application/ld+json"]')
    
    if (!scriptElement) {
      scriptElement = document.createElement('script')
      scriptElement.type = 'application/ld+json'
      document.head.appendChild(scriptElement)
    }
    
    scriptElement.textContent = JSON.stringify(structuredData)
  }

  // Page-specific SEO configurations
  static getPageConfigs() {
    return {
      home: {
        title: 'FinBuddy - AI-Powered Personal & Group Finance Manager',
        description: 'Take control of your finances with FinBuddy. Track expenses, split bills with friends, and get AI-powered financial insights. Start managing your money smarter today.',
        keywords: ['finance app', 'expense tracker', 'bill splitting', 'personal finance', 'AI financial assistant']
      },
      
      dashboard: {
        title: 'Dashboard - FinBuddy',
        description: 'Your financial dashboard with expense tracking, balance overview, and AI-powered insights to help you manage your money better.',
        keywords: ['financial dashboard', 'expense tracking', 'money management', 'financial insights']
      },
      
      login: {
        title: 'Login - FinBuddy',
        description: 'Log in to your FinBuddy account to access your personal finance dashboard and start tracking your expenses.',
        keywords: ['login', 'sign in', 'finance app access']
      },
      
      signup: {
        title: 'Sign Up - FinBuddy',
        description: 'Create your free FinBuddy account and start managing your personal finances with AI-powered insights and group expense tracking.',
        keywords: ['sign up', 'create account', 'free finance app', 'register']
      },
      
      balance: {
        title: 'Balance Overview - FinBuddy',
        description: 'View your financial balance, track receivables and payables, and analyze your spending patterns with detailed charts and insights.',
        keywords: ['balance overview', 'financial tracking', 'money balance', 'expense analysis']
      }
    }
  }
}

// Accessibility utilities
export class AccessibilityUtils {
  // Improve focus management
  static manageFocus(): void {
    // Add focus outline for keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation')
      }
    })

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation')
    })
  }

  // Announce dynamic content changes to screen readers
  static announceToScreenReader(message: string): void {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  // Add skip links for better navigation
  static addSkipLinks(): void {
    if (typeof document === 'undefined') return

    const skipLink = document.createElement('a')
    skipLink.href = '#main-content'
    skipLink.textContent = 'Skip to main content'
    skipLink.className = 'skip-link'
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 10000;
      transition: top 0.3s;
    `
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px'
    })
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px'
    })
    
    document.body.insertBefore(skipLink, document.body.firstChild)
  }

  // Enhance form accessibility
  static enhanceFormAccessibility(): void {
    if (typeof document === 'undefined') return

    // Add proper labels and descriptions
    document.querySelectorAll('input, select, textarea').forEach((element) => {
      const input = element as HTMLInputElement
      
      // Ensure required fields are properly marked
      if (input.required && !input.getAttribute('aria-required')) {
        input.setAttribute('aria-required', 'true')
      }
      
      // Add describedby for error messages
      const errorElement = document.querySelector(`[data-error-for="${input.id}"]`)
      if (errorElement && !input.getAttribute('aria-describedby')) {
        input.setAttribute('aria-describedby', errorElement.id)
      }
    })
  }

  // Add ARIA landmarks
  static addLandmarks(): void {
    if (typeof document === 'undefined') return

    // Ensure main content has proper landmark
    const mainContent = document.querySelector('main')
    if (mainContent && !mainContent.getAttribute('role')) {
      mainContent.setAttribute('role', 'main')
      mainContent.id = 'main-content'
    }

    // Add navigation landmarks
    document.querySelectorAll('nav').forEach((nav, index) => {
      if (!nav.getAttribute('aria-label')) {
        nav.setAttribute('aria-label', index === 0 ? 'Main navigation' : `Navigation ${index + 1}`)
      }
    })
  }

  // Improve color contrast and readability
  static checkColorContrast(): void {
    // This would typically be done during development/testing
    // In production, ensure all text meets WCAG AA standards (4.5:1 ratio)
    console.log('Color contrast should be checked during development')
  }

  // Add keyboard shortcuts
  static addKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Alt + H = Home
      if (e.altKey && e.key === 'h') {
        e.preventDefault()
        window.location.href = '/'
      }
      
      // Alt + D = Dashboard
      if (e.altKey && e.key === 'd') {
        e.preventDefault()
        window.location.href = '/dashboard'
      }
      
      // Esc = Close modals
      if (e.key === 'Escape') {
        const modal = document.querySelector('[role="dialog"]')
        if (modal) {
          const closeButton = modal.querySelector('[aria-label="Close"], .close-btn')
          if (closeButton) {
            (closeButton as HTMLElement).click()
          }
        }
      }
    })
  }
}
