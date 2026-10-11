import { useState, useEffect, useCallback } from 'react'
import { apiService, ApiError } from '../services/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const data = await apiCall()
      setState({ data, loading: false, error: null })
    } catch (error) {
      const message = error instanceof ApiError 
        ? error.message 
        : 'An unexpected error occurred'
      setState({ data: null, loading: false, error: message })
    }
  }, dependencies)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    ...state,
    refetch: fetchData,
  }
}

export function useMutation<T, P>(
  apiCall: (params: P) => Promise<T>
): {
  mutate: (params: P) => Promise<T | null>
  loading: boolean
  error: string | null
  reset: () => void
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (params: P): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiCall(params)
      setLoading(false)
      return result
    } catch (error) {
      const message = error instanceof ApiError 
        ? error.message 
        : 'An unexpected error occurred'
      setError(message)
      setLoading(false)
      return null
    }
  }, [apiCall])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
  }, [])

  return { mutate, loading, error, reset }
}

// Specific hooks for common operations
export function useExpenses() {
  return useApi(() => apiService.getExpenses())
}

export function useGroups() {
  return useApi(() => apiService.getGroups())
}

export function useBalanceData() {
  return useApi(() => apiService.getBalanceData())
}

export function useCreateExpense() {
  return useMutation(apiService.createExpense.bind(apiService))
}

export function useCreateGroup() {
  return useMutation(apiService.createGroup.bind(apiService))
}
