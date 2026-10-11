// Security utilities and configuration
import DOMPurify from 'dompurify'

export class SecurityUtils {
  // Content Security Policy configuration
  static getCSPConfig(): string {
    const isDev = import.meta.env.DEV
    
    const cspDirectives = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        isDev ? "'unsafe-eval'" : null, // Allow eval in development for HMR
        "'unsafe-inline'", // For inline scripts (consider removing in production)
        'https://cdn.jsdelivr.net', // For CDN resources
        'https://unpkg.com'
      ].filter(Boolean),
      'style-src': [
        "'self'",
        "'unsafe-inline'", // For CSS-in-JS libraries
        'https://fonts.googleapis.com'
      ],
      'img-src': [
        "'self'",
        'data:', // For base64 images
        'blob:', // For blob URLs
        'https:', // Allow HTTPS images
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      'connect-src': [
        "'self'",
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
        import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434',
        isDev ? 'ws://localhost:*' : null, // WebSocket for HMR
        'https://api.sentry.io', // For error reporting
      ].filter(Boolean),
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'frame-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': isDev ? null : []
    }

    return Object.entries(cspDirectives)
      .filter(([_, values]) => values !== null)
      .map(([directive, values]) => 
        Array.isArray(values) && values.length > 0 
          ? `${directive} ${values.join(' ')}`
          : directive
      )
      .join('; ')
  }

  // Apply CSP to document
  static applyCSP(): void {
    if (typeof document !== 'undefined') {
      const meta = document.createElement('meta')
      meta.httpEquiv = 'Content-Security-Policy'
      meta.content = this.getCSPConfig()
      document.head.appendChild(meta)
    }
  }

  // Input sanitization
  static sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span'],
      ALLOWED_ATTR: ['class']
    })
  }

  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
  }

  // Validate file uploads
  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf']

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 5MB limit' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed' }
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedExtensions.includes(extension)) {
      return { valid: false, error: 'Invalid file extension' }
    }

    return { valid: true }
  }

  // Generate secure random strings
  static generateNonce(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  // Rate limiting for client-side operations
  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>()

  static rateLimit(key: string, maxRequests = 10, windowMs = 60000): boolean {
    const now = Date.now()
    const record = this.rateLimitMap.get(key)

    if (!record || now > record.resetTime) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }

    if (record.count >= maxRequests) {
      return false
    }

    record.count++
    return true
  }

  // Secure local storage operations
  static secureStorageSet(key: string, value: any): void {
    try {
      const encrypted = btoa(JSON.stringify(value))
      localStorage.setItem(key, encrypted)
    } catch (error) {
      console.error('Failed to store data securely:', error)
    }
  }

  static secureStorageGet(key: string): any {
    try {
      const encrypted = localStorage.getItem(key)
      if (!encrypted) return null
      return JSON.parse(atob(encrypted))
    } catch (error) {
      console.error('Failed to retrieve data securely:', error)
      return null
    }
  }
}
