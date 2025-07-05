import type { Expense, Group, User, BalanceData, AITipResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new ApiError(response.status, `API Error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(0, `Network Error: ${error.message}`)
    }
  }

  // Auth API
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async signup(userData: Partial<User> & { password: string }): Promise<{ user: User; token: string }> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' })
    localStorage.removeItem('authToken')
  }

  // Expenses API
  async getExpenses(): Promise<Expense[]> {
    return this.request('/expenses')
  }

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    })
  }

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    })
  }

  async deleteExpense(id: string): Promise<void> {
    return this.request(`/expenses/${id}`, { method: 'DELETE' })
  }

  // Groups API
  async getGroups(): Promise<Group[]> {
    return this.request('/groups')
  }

  async createGroup(group: Omit<Group, 'id' | 'createdAt' | 'totalExpenses' | 'balances'>): Promise<Group> {
    return this.request('/groups', {
      method: 'POST',
      body: JSON.stringify(group),
    })
  }

  async joinGroup(groupId: string): Promise<Group> {
    return this.request(`/groups/${groupId}/join`, { method: 'POST' })
  }

  // Balance/Analytics API
  async getBalanceData(): Promise<BalanceData[]> {
    return this.request('/analytics/balance')
  }

  async getSpendingAnalytics(period: string = '6m'): Promise<any> {
    return this.request(`/analytics/spending?period=${period}`)
  }

  // AI Integration API
  async getAITip(context: string, question: string): Promise<AITipResponse> {
    return this.request('/ai/tip', {
      method: 'POST',
      body: JSON.stringify({ context, question }),
    })
  }

  async getAISuggestions(step: number): Promise<any> {
    return this.request(`/ai/suggestions?step=${step}`)
  }
}

export const apiService = new ApiService()
export { ApiError }
