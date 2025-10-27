import React, { useState } from 'react'
import { motion } from 'framer-motion'
import type { ActivityItem as ActivityItemType, Payment } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { apiService } from '../../services/api'

interface ActivityItemProps {
  activity: ActivityItemType
}

// Format relative time
const formatRelativeTime = (timestamp: string): string => {
  const now = new Date()
  const activityTime = new Date(timestamp)

  // Handle invalid timestamps
  if (isNaN(activityTime.getTime())) {
    return 'Unknown time'
  }

  const diffMs = now.getTime() - activityTime.getTime()

  // Handle future timestamps (clock skew)
  if (diffMs < 0) {
    return 'Just now'
  }

  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    // Show full date for older activities
    return activityTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: activityTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const { user } = useAuth()
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  // Handle payment confirmation
  const handleConfirmPayment = async () => {
    if (activity.type !== 'payment') return

    const payment = activity.originalData as Payment

    setIsConfirming(true)
    setConfirmError(null)

    try {
      await apiService.updatePaymentStatus(payment.id, 'completed')
      // Success - the polling mechanism will update the feed
      // Could also dispatch a custom event or update local state
    } catch (error) {
      setConfirmError(error instanceof Error ? error.message : 'Failed to confirm payment')
    } finally {
      setIsConfirming(false)
    }
  }

  // Determine if current user should see confirm button
  const shouldShowConfirmButton = (): boolean => {
    if (activity.type !== 'payment' || !user) return false

    const payment = activity.originalData as Payment
    return payment.status === 'pending' && user.id === payment.toUserId
  }

  // Build title based on activity type
  const getTitle = (): string => {
    if (activity.type === 'expense') {
      return activity.title
    }

    if (activity.type === 'group') {
      const group = activity.originalData as any
      const isCreator = user && group.createdBy === user.id
      return isCreator ? `Created ${activity.title}` : `Joined ${activity.title}`
    }

    if (activity.type === 'payment') {
      const payment = activity.originalData as Payment
      const isFrom = user && payment.fromUserId === user.id
      const otherUser = isFrom ? payment.toUserName : payment.fromUserName
      return isFrom ? `Payment to ${otherUser}` : `Payment from ${otherUser}`
    }

    return activity.title
  }

  // Build metadata context info
  const getContextInfo = (): string => {
    if (activity.type === 'expense') {
      const expense = activity.originalData as any
      if (expense.groupId) {
        const participantCount = expense.participants?.length || 0
        return ` • ${expense.groupName || 'Group'} • Split ${participantCount} ways`
      }
      return ' • Personal'
    }

    if (activity.type === 'group') {
      return ` • ${activity.metadata}`
    }

    if (activity.type === 'payment') {
      const payment = activity.originalData as Payment
      if (payment.status === 'completed') {
        return ' • ✓ Completed'
      } else if (payment.status === 'cancelled') {
        return ' • Cancelled'
      } else {
        return ' • Pending'
      }
    }

    return ''
  }

  // Determine amount color class
  const getAmountColorClass = (): string => {
    if (activity.type === 'payment') {
      const payment = activity.originalData as Payment
      const isReceiving = user && payment.toUserId === user.id
      return isReceiving ? 'incoming' : ''
    }
    return ''
  }

  return (
    <motion.div
      className="activity-item"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      role="article"
      tabIndex={0}
    >
      <div className="activity-icon">{activity.icon}</div>

      <div className="activity-content">
        <div className="activity-title">{getTitle()}</div>
        <div className="activity-category">{activity.category}</div>

        <div className="activity-metadata">
          {formatRelativeTime(activity.timestamp)}
          {getContextInfo()}
        </div>

        {shouldShowConfirmButton() && (
          <div className="activity-action">
            <button
              onClick={handleConfirmPayment}
              disabled={isConfirming}
              aria-label={`Confirm payment from ${(activity.originalData as Payment).fromUserName}`}
            >
              {isConfirming ? 'Confirming...' : 'Confirm Receipt'}
            </button>
            {confirmError && (
              <div className="activity-error-message">{confirmError}</div>
            )}
          </div>
        )}
      </div>

      {activity.amount !== undefined && (
        <div className={`activity-amount ${getAmountColorClass()}`}>
          {activity.currency}
          {activity.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      )}
    </motion.div>
  )
}
