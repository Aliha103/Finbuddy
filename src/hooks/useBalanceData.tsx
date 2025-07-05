import { useEffect, useState } from 'react'
import type { BalanceData } from '../types'

interface RawBalanceData {
  month: string
  receivables: number
  payables: number
}

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

const fetchFinancialData = async (): Promise<RawBalanceData[]> => {
  // TODO: Replace with actual API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { month: '2024-01', receivables: 900, payables: 300 },
        { month: '2024-02', receivables: 500, payables: 400 },
        { month: '2024-03', receivables: 1200, payables: 250 },
        { month: '2024-04', receivables: 200, payables: 600 },
        { month: '2024-05', receivables: 1300, payables: 300 },
      ])
    }, 100)
  })
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
        
        const rawData = await fetchFinancialData()
        
        if (!mounted) return

        const enriched: BalanceData[] = rawData.map((item) => ({
          ...item,
          net: item.receivables - item.payables,
          label: new Date(item.month + '-01').toLocaleString('default', {
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
