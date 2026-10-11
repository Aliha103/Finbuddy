import { apiService } from './api'
import { SecurityUtils } from '../utils/security'
import type { User } from '../types'

interface LoginCredentials {
  email: string
  password: string
}

interface SignupData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

interface AuthResponse {
  user: User
  tokens: AuthTokens
}

export class AuthService {
  private static readonly ACCESS_TOKEN_KEY = 'finbuddy_access_token'
  private static readonly REFRESH_TOKEN_KEY = 'finbuddy_refresh_token'
  private static readonly USER_KEY = 'finbuddy_user'
  private static readonly TOKEN_EXPIRY_KEY = 'finbuddy_token_expiry'

  // Enhanced login with security measures
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Rate limiting
    const rateLimitKey = `login_${credentials.email}`
    if (!SecurityUtils.rateLimit(rateLimitKey, 5, 300000)) { // 5 attempts per 5 minutes
      throw new Error('Too many login attempts. Please try again later.')
    }

    // Input sanitization
    const sanitizedCredentials = {
      email: SecurityUtils.sanitizeInput(credentials.email).toLowerCase(),
      password: credentials.password // Don't sanitize password to avoid breaking valid characters
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedCredentials.email)) {
      throw new Error('Invalid email format')
    }

    // Password strength validation
    if (!this.validatePasswordStrength(credentials.password)) {
      throw new Error('Password does not meet security requirements')
    }

    try {
      const response = await apiService.login(sanitizedCredentials.email, credentials.password)
      
      // Store tokens securely
      this.storeTokens(response.tokens)
      this.storeUser(response.user)

      return response
    } catch (error) {
      // Don't expose internal error details
      throw new Error('Invalid email or password')
    }
  }

  // Enhanced signup with validation
  static async signup(data: SignupData): Promise<AuthResponse> {
    // Input validation and sanitization
    const sanitizedData = {
      name: SecurityUtils.sanitizeInput(data.name),
      email: SecurityUtils.sanitizeInput(data.email).toLowerCase(),
      password: data.password,
      confirmPassword: data.confirmPassword
    }

    // Validation
    const validationErrors = this.validateSignupData(sanitizedData)
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('. '))
    }

    try {
      const response = await apiService.signup(sanitizedData)
      
      // Store tokens securely
      this.storeTokens(response.tokens)
      this.storeUser(response.user)

      return response
    } catch (error) {
      throw error
    }
  }

  // Secure logout
  static async logout(): Promise<void> {
    try {
      await apiService.logout()
    } catch (error) {
      console.warn('Failed to logout from server:', error)
    } finally {
      // Always clear local data
      this.clearAuthData()
    }
  }

  // Token management
  private static storeTokens(tokens: AuthTokens): void {
    const expiryTime = Date.now() + (tokens.expiresIn * 1000)
    
    SecurityUtils.secureStorageSet(this.ACCESS_TOKEN_KEY, tokens.accessToken)
    SecurityUtils.secureStorageSet(this.REFRESH_TOKEN_KEY, tokens.refreshToken)
    SecurityUtils.secureStorageSet(this.TOKEN_EXPIRY_KEY, expiryTime)
  }

  private static storeUser(user: User): void {
    SecurityUtils.secureStorageSet(this.USER_KEY, user)
  }

  static getAccessToken(): string | null {
    return SecurityUtils.secureStorageGet(this.ACCESS_TOKEN_KEY)
  }

  static getRefreshToken(): string | null {
    return SecurityUtils.secureStorageGet(this.REFRESH_TOKEN_KEY)
  }

  static getCurrentUser(): User | null {
    return SecurityUtils.secureStorageGet(this.USER_KEY)
  }

  static isTokenExpired(): boolean {
    const expiryTime = SecurityUtils.secureStorageGet(this.TOKEN_EXPIRY_KEY)
    if (!expiryTime) return true
    return Date.now() > expiryTime
  }

  static isAuthenticated(): boolean {
    const token = this.getAccessToken()
    return !!token && !this.isTokenExpired()
  }

  // Refresh token functionality
  static async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) return false

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      })

      if (!response.ok) throw new Error('Failed to refresh token')

      const data = await response.json()
      this.storeTokens(data.tokens)
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      this.clearAuthData()
      return false
    }
  }

  private static clearAuthData(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
    localStorage.removeItem(this.USER_KEY)
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY)
  }

  // Password strength validation
  private static validatePasswordStrength(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return passwordRegex.test(password)
  }

  // Signup data validation
  private static validateSignupData(data: SignupData): string[] {
    const errors: string[] = []

    if (!data.name || data.name.length < 2) {
      errors.push('Name must be at least 2 characters long')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format')
    }

    if (!this.validatePasswordStrength(data.password)) {
      errors.push('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
    }

    if (data.password !== data.confirmPassword) {
      errors.push('Passwords do not match')
    }

    return errors
  }

  // Security headers for API requests
  static getAuthHeaders(): Record<string, string> {
    const token = this.getAccessToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }
}
