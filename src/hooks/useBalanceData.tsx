import { useEffect, useState } from 'react'
import type { BalanceData } from '../types'
import { apiService } from '../services/api'

interface BalanceTotals {
  receivables: number
  payables: number
  net: number
}

interface UseBalanceDataReturn {
  data: BalanceData[]
  totals: BalanceTotals
  loading: boolean
  error: string | null
}

export function useBalanceData(): UseBalanceDataReturn {
  const [data, setData] = useState<BalanceData[]>([])
  const [totals, setTotals] = useState<BalanceTotals>({ receivables: 0, payables: 0, net: 0 })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch data from API
        const rawData = await apiService.getBalanceData()
        
        if (!mounted) return

        // Process data: ensure net and label exist if the API doesn't provide them fully
        // or if we want to ensure client-side formatting consistency.
        const enriched: BalanceData[] = rawData.map((item) => ({
          ...item,
          net: (item.net !== undefined) ? item.net : (item.receivables - item.payables),
          label: (item.label !== undefined) ? item.label : new Date(item.month + '-01').toLocaleString('default', {
            month: 'short',
            year: '2-digit',
          }),
        }))

        const receivables = enriched.reduce((sum, d) => sum + d.receivables, 0)
        const payables = enriched.reduce((sum, d) => sum + d.payables, 0)
        const net = receivables - payables

        setData(enriched)
        setTotals({ receivables, payables, net })
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load balance data')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [])

  return { data, totals, loading, error }
}
