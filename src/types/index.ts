// Core application types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
}

export interface Expense {
  id: string
  amount: number
  currency: string
  category: string
  description: string
  date: string
  paidBy: string
  participants: string[]
  splitMethod: 'equal' | 'percentage' | 'custom'
  customSplits?: Record<string, number>
  recurring: boolean
  location?: string
  attachment?: File | null
  groupId?: string
  createdAt: string
  updatedAt: string
}

export interface Group {
  id: string
  name: string
  purpose: string
  members: string[]
  isPersonal: boolean
  createdBy: string
  createdAt: string
  totalExpenses: number
  balances: Record<string, number>
}

export interface BalanceData {
  month: string
  receivables: number
  payables: number
  net: number
  label: string
}

export interface AITipResponse {
  tip: string
  confidence: number
  category: 'warning' | 'suggestion' | 'insight'
}

export interface FormErrors {
  [key: string]: string | undefined
}

export interface AnalyticsEvent {
  eventType: string
  sessionId: string
  step: number
  maxStep: number
  action: string
  timestamp: string
  isGroup: boolean
  participants: string[]
  recurring: boolean
  attachment: boolean
  fieldsFilled: number
  timeSpent: number
  historyLength: number
  aiDropoffLikely: boolean
}

export interface Payment {
  id: string
  amount: number
  currency: string
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  groupId?: string
  description: string
  status: 'completed' | 'pending' | 'cancelled'
  date: string
  createdAt: string
}

export interface ActivityItem {
  id: string
  type: 'expense' | 'group' | 'payment'
  timestamp: string
  title: string
  category: string
  amount?: number
  currency?: string
  metadata: string
  icon: string
  originalData: Expense | Group | Payment
}

// Component Props Types
export interface ExpenseFormData {
  amount: string
  currency: string
  category: string
  date: string
  description: string
  participants: string
  splitMethod: 'equal' | 'percentage' | 'custom'
  customSplits: Record<string, string>
  paidBy: string
  recurring: boolean
  location: string
  attachment: File | null
}

export interface StepComponentProps {
  form: ExpenseFormData
  errors: FormErrors
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  aiConfig?: any
}

export interface AuthContextType {
  isAuthenticated: boolean
  user?: User
  login: (user: User) => void
  logout: () => void
}
