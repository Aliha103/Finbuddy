import { useEffect, useState, useCallback } from 'react'
import type { ActivityItem, Expense, Group, Payment } from '../types'
import { apiService } from '../services/api'

interface UseRecentActivityReturn {
  activities: ActivityItem[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
}

const ITEMS_PER_PAGE = 20
const POLLING_INTERVAL = 30000 // 30 seconds

// Transform functions
const transformExpenseToActivity = (expense: Expense): ActivityItem => ({
  id: expense.id,
  type: 'expense',
  timestamp: expense.createdAt,
  title: expense.description || 'Expense',
  category: expense.category || 'UNCATEGORIZED',
  amount: expense.amount,
  currency: expense.currency,
  metadata: expense.groupId ? 'group' : 'personal',
  icon: '💳',
  originalData: expense,
})

const transformGroupToActivity = (group: Group): ActivityItem => ({
  id: group.id,
  type: 'group',
  timestamp: group.createdAt,
  title: group.name,
  category: 'GROUP ACTIVITY',
  metadata: `${group.members.length} members`,
  icon: '👥',
  originalData: group,
})

const transformPaymentToActivity = (payment: Payment): ActivityItem => ({
  id: payment.id,
  type: 'payment',
  timestamp: payment.createdAt,
  title: payment.description,
  category: 'SETTLEMENT',
  amount: payment.amount,
  currency: payment.currency,
  metadata: payment.status,
  icon: '💰',
  originalData: payment,
})

export function useRecentActivity(): UseRecentActivityReturn {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [allActivities, setAllActivities] = useState<ActivityItem[]>([])

  // Fetch and transform all activities from all sources
  const fetchAllActivities = useCallback(async (): Promise<ActivityItem[]> => {
    try {
      const [expenses, groups, payments] = await Promise.all([
        apiService.getExpenses().catch(() => [] as Expense[]),
        apiService.getGroups().catch(() => [] as Group[]),
        apiService.getPayments().catch(() => [] as Payment[]),
      ])

      const expenseActivities = expenses.map(transformExpenseToActivity)
      const groupActivities = groups.map(transformGroupToActivity)
      const paymentActivities = payments.map(transformPaymentToActivity)

      const merged = [...expenseActivities, ...groupActivities, ...paymentActivities]

      // Sort by timestamp descending (newest first)
      merged.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime()
        const timeB = new Date(b.timestamp).getTime()
        return timeB - timeA
      })

      return merged
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to load activities')
    }
  }, [])

  // Refresh - reload from page 0
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPage(0)

    try {
      const allItems = await fetchAllActivities()
      setAllActivities(allItems)

      const firstPage = allItems.slice(0, ITEMS_PER_PAGE)
      setActivities(firstPage)
      setHasMore(allItems.length > ITEMS_PER_PAGE)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities')
      setActivities([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [fetchAllActivities])

  // Load more - increment page
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)

    const nextPage = page + 1
    const startIndex = nextPage * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const nextPageItems = allActivities.slice(startIndex, endIndex)

    if (nextPageItems.length > 0) {
      setActivities(prev => [...prev, ...nextPageItems])
      setPage(nextPage)
      setHasMore(endIndex < allActivities.length)
    } else {
      setHasMore(false)
    }

    setLoadingMore(false)
  }, [page, allActivities, loadingMore, hasMore])

  // Initial load
  useEffect(() => {
    let mounted = true

    const loadInitial = async () => {
      try {
        setLoading(true)
        setError(null)

        const allItems = await fetchAllActivities()

        if (!mounted) return

        setAllActivities(allItems)
        const firstPage = allItems.slice(0, ITEMS_PER_PAGE)
        setActivities(firstPage)
        setHasMore(allItems.length > ITEMS_PER_PAGE)
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load activities')
          setActivities([])
          setHasMore(false)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadInitial()

    return () => {
      mounted = false
    }
  }, [fetchAllActivities])

  // Polling effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Only poll if document is visible
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }, POLLING_INTERVAL)

    return () => clearInterval(interval)
  }, [refresh])

  // Visibility change effect - refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refresh])

  return {
    activities,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  }
}
