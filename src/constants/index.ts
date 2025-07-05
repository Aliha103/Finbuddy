// Application constants
export const APP_NAME = 'FinBuddy'
export const APP_VERSION = '1.0.0'

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh'
  },
  EXPENSES: {
    BASE: '/expenses',
    BY_ID: (id: string) => `/expenses/${id}`,
    BY_GROUP: (groupId: string) => `/expenses?groupId=${groupId}`
  },
  GROUPS: {
    BASE: '/groups',
    BY_ID: (id: string) => `/groups/${id}`,
    JOIN: (id: string) => `/groups/${id}/join`,
    LEAVE: (id: string) => `/groups/${id}/leave`
  },
  AI: {
    TIP: '/ai/tip',
    SUGGESTIONS: '/ai/suggestions',
    ANALYZE: '/ai/analyze'
  }
} as const

// Form constants
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
] as const

export const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: '🍽️', color: '#ff6b6b' },
  { id: 'transport', name: 'Transportation', icon: '🚗', color: '#4ecdc4' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#45b7d1' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#f9ca24' },
  { id: 'utilities', name: 'Utilities', icon: '💡', color: '#f0932b' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: '#eb4d4b' },
  { id: 'education', name: 'Education', icon: '📚', color: '#6c5ce7' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#74b9ff' },
  { id: 'other', name: 'Other', icon: '📝', color: '#a29bfe' }
] as const

export const SPLIT_METHODS = [
  { id: 'equal', name: 'Split Equally', description: 'Divide amount equally among participants' },
  { id: 'percentage', name: 'By Percentage', description: 'Split by custom percentages' },
  { id: 'custom', name: 'Custom Amounts', description: 'Enter exact amounts for each person' }
] as const

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'finbuddy_auth_token',
  USER_PREFERENCES: 'finbuddy_user_preferences',
  EXPENSE_DRAFT: 'finbuddy_expense_draft',
  ANALYTICS_SESSION: 'finbuddy_analytics_session',
  ANALYTICS_HISTORY: 'finbuddy_analytics_history',
  ANALYTICS_LAST_TIME: 'finbuddy_analytics_last_time'
} as const

// UI constants
export const MODAL_TYPES = {
  NONE: null,
  ADD_EXPENSE: 'add-expense',
  EDIT_EXPENSE: 'edit-expense',
  CREATE_GROUP: 'create-group',
  JOIN_GROUP: 'join-group',
  CONFIRM_DELETE: 'confirm-delete'
} as const

export const ANIMATION_DURATIONS = {
  FAST: 0.2,
  NORMAL: 0.3,
  SLOW: 0.5
} as const

// File upload constraints
export const FILE_CONSTRAINTS = {
  MAX_SIZE_MB: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf']
} as const

// Validation constraints
export const VALIDATION_CONSTRAINTS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_EXPENSE_AMOUNT: 999999.99,
  MIN_GROUP_NAME_LENGTH: 2,
  MAX_GROUP_NAME_LENGTH: 50,
  MIN_DESCRIPTION_LENGTH: 3,
  MAX_DESCRIPTION_LENGTH: 500
} as const

// Feature flags
export const FEATURE_FLAGS = {
  AI_ASSISTANT: true,
  RECURRING_EXPENSES: true,
  GROUP_CHAT: false,
  ADVANCED_ANALYTICS: true,
  DARK_MODE: true
} as const

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  CHART: 'MMM yy',
  FULL: 'MMMM dd, yyyy HH:mm'
} as const
