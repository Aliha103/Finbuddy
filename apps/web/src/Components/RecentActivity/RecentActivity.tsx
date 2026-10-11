import React, { useEffect, useRef } from 'react'
import { useRecoilState } from 'recoil'
import { useRecentActivity } from '../../hooks/useRecentActivity'
import { ActivityItem } from './ActivityItem'
import { recentExpenseState } from '../../state/dashboardAtoms'
import './RecentActivity.scss'

const LoadingSpinner: React.FC<{ small?: boolean }> = ({ small = false }) => (
  <div className={`activity-loading ${small ? 'activity-loading-small' : ''}`}>
    <span role="img" aria-label="Loading" style={{ marginRight: 8 }}>
      🚀
    </span>
    {small ? 'Loading more...' : 'Loading...'}
  </div>
)

const RecentActivity: React.FC = () => {
  const { activities, loading, loadingMore, error, hasMore, loadMore, refresh } =
    useRecentActivity()
  const [recentExpense] = useRecoilState(recentExpenseState)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Watch for new expenses added and trigger refresh
  useEffect(() => {
    if (recentExpense) {
      refresh()
    }
  }, [recentExpense, refresh])

  // Setup IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    )

    observer.observe(sentinel)

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel)
      }
    }
  }, [hasMore, loadingMore, loadMore])

  return (
    <div className="dashboard-card dashboard-recent-activity">
      <div className="activity-header">
        <h2>Recent Activity</h2>
        <button
          onClick={refresh}
          aria-label="Refresh activities"
          className="activity-refresh-btn"
        >
          🔄
        </button>
      </div>

      {loading && activities.length === 0 && <LoadingSpinner />}

      {error && (
        <div className="activity-error">
          {error}
          <button onClick={refresh}>Retry</button>
        </div>
      )}

      {!loading && !error && activities.length === 0 && (
        <div className="dashboard-placeholder" style={{ color: '#ea2626' }}>
          No recent activity
        </div>
      )}

      {activities.length > 0 && (
        <div className="activity-list">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
          <div ref={sentinelRef} className="activity-sentinel" />
          {loadingMore && <LoadingSpinner small />}
          {!hasMore && activities.length >= 20 && (
            <div className="activity-end-message">No more activities</div>
          )}
        </div>
      )}
    </div>
  )
}

export default RecentActivity
