import React from 'react'
import { FaWallet, FaArrowUp, FaArrowDown } from 'react-icons/fa'
import { useBalanceData } from '../../hooks/useBalanceData'
import BalanceChart from '../balanceChart/balanceChart'
import './Balance.css'

interface BalanceCardProps {
  title: string
  amount: number
  className?: string
  icon?: React.ReactNode
  currency?: string
}

const BalanceCard: React.FC<BalanceCardProps> = ({ 
  title, 
  amount, 
  className = '', 
  icon, 
  currency = '€' 
}) => (
  <div className="balance-card">
    <h4>{title}</h4>
    <p className={`amount ${className}`.trim()}>
      {icon && <span className="balance-icon">{icon}</span>}
      {currency}{amount.toLocaleString()}
    </p>
  </div>
)

const Balance: React.FC = () => {
  const { data, totals, loading, error } = useBalanceData()

  if (loading) {
    return (
      <div className="balance-container">
        <div className="balance-header">
          <h2>
            <FaWallet /> Balance Overview
          </h2>
        </div>
        <div className="balance-loading">
          <div className="loading-spinner" />
          <p>Loading balance data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="balance-container">
        <div className="balance-header">
          <h2>
            <FaWallet /> Balance Overview
          </h2>
        </div>
        <div className="balance-error">
          <p className="error-message">Error loading balance data: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const netPositionClass = totals.net >= 0 ? 'positive' : 'negative'

  return (
    <div className="balance-container">
      <div className="balance-header">
        <h2>
          <FaWallet /> Balance Overview
        </h2>
      </div>

      <div className="balance-summary">
        <BalanceCard
          title="Net Position"
          amount={totals.net}
          className={netPositionClass}
        />
        
        <BalanceCard
          title="Receivables"
          amount={totals.receivables}
          className="owed"
          icon={<FaArrowUp className="receivable_arrow" />}
        />
        
        <BalanceCard
          title="Payables"
          amount={totals.payables}
          className="own"
          icon={<FaArrowDown className="payables_arrow" />}
        />
      </div>

      <BalanceChart 
        data={data} 
        title="Monthly Trend" 
        height={400}
      />
    </div>
  )
}

export default Balance
