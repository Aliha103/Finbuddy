import type { FormErrors } from '../types'

// Validation utilities
export const validators = {
  required: (value: any, fieldName: string): string | undefined => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`
    }
    return undefined
  },

  email: (value: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address'
    }
    return undefined
  },

  amount: (value: string | number): string | undefined => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue) || numValue <= 0) {
      return 'Please enter a valid amount greater than 0'
    }
    return undefined
  },

  date: (value: string): string | undefined => {
    if (isNaN(Date.parse(value))) {
      return 'Please enter a valid date'
    }
    return undefined
  },

  minLength: (value: string, min: number): string | undefined => {
    if (value.length < min) {
      return `Must be at least ${min} characters long`
    }
    return undefined
  },

  fileSize: (file: File, maxSizeMB: number): string | undefined => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`
    }
    return undefined
  },

  fileType: (file: File, allowedTypes: string[]): string | undefined => {
    if (!allowedTypes.includes(file.type)) {
      return `File type must be one of: ${allowedTypes.join(', ')}`
    }
    return undefined
  }
}

export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, Array<(value: any) => string | undefined>>
): FormErrors {
  const errors: FormErrors = {}

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field]
    
    for (const rule of fieldRules) {
      const error = rule(value)
      if (error) {
        errors[field] = error
        break // Stop at first error for this field
      }
    }
  }

  return errors
}

// Specific form validators
export const expenseValidationRules = {
  amount: [
    (value: string) => validators.required(value, 'Amount'),
    validators.amount
  ],
  category: [
    (value: string) => validators.required(value, 'Category')
  ],
  date: [
    (value: string) => validators.required(value, 'Date'),
    validators.date
  ],
  description: [
    (value: string) => validators.required(value, 'Description'),
    (value: string) => validators.minLength(value, 3)
  ]
}

export const groupValidationRules = {
  name: [
    (value: string) => validators.required(value, 'Group name'),
    (value: string) => validators.minLength(value, 2)
  ],
  purpose: [
    (value: string) => validators.required(value, 'Purpose'),
    (value: string) => validators.minLength(value, 5)
  ]
}
