import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from 'recharts'
import Widget from './Widget'
import './SpendingHistoryChart.css'

// --- Utility for insights ---
function analyzeTrend(data) {
  if (!data || data.length < 2) return null

  // Calculate trend slope
  const n = data.length
  const first = data[0].amount
  const last = data[n - 1].amount
  const min = Math.min(...data.map((d) => d.amount))
  const max = Math.max(...data.map((d) => d.amount))
  const avg = data.reduce((sum, d) => sum + d.amount, 0) / n

  // Simple auto-insights (expand with ML backend later)
  if (max - min > avg * 1.2) {
    return {
      type: 'warning',
      msg: 'Spending spike detected — review big purchases?',
      icon: '🚨',
    }
  }
  if (last < first && avg < first) {
    return {
      type: 'good',
      msg: 'Great! You are reducing your spending over time.',
      icon: '📉',
    }
  }
  if (last > first && avg > first) {
    return {
      type: 'alert',
      msg: 'Spending is rising — time to watch your budget!',
      icon: '🔺',
    }
  }
  return {
    type: 'neutral',
    msg: 'Your spending is stable. Keep it up!',
    icon: '🤖',
  }
}

function FuturisticTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(26,34,78,0.92)',
          color: '#fff',
          borderRadius: 12,
          padding: '11px 17px',
          boxShadow: '0 4px 24px #02e4e755',
          border: '1.5px solid #0fffd8',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 2 }}>
          <span role="img" aria-label="Calendar" style={{ marginRight: 5 }}>
            📅
          </span>
          {label}
        </div>
        <div style={{ fontWeight: 900, fontSize: 18 }}>
          €{payload[0].value.toLocaleString()}
        </div>
      </div>
    )
  }
  return null
}

function SpendingHistoryChart({ data }) {
  const insight = useMemo(() => analyzeTrend(data), [data])

  if (!data || data.length < 2)
    return (
      <Widget title="Spending History">
        <div className="widget-empty" style={{ padding: 16 }}>
          <span
            role="img"
            aria-label="No data"
            style={{ fontSize: 20, opacity: 0.4 }}
          >
            📊
          </span>
          <br />
          Not enough data
          <br />
          <span style={{ fontSize: 13, color: '#96b1c3' }}>
            Add a few expenses to see your progress!
          </span>
        </div>
      </Widget>
    )

  return (
    <Widget title="Spending History">
      <div style={{ marginBottom: 10 }}>
        <span
          style={{
            background:
              insight?.type === 'good'
                ? 'linear-gradient(97deg,#d5ffe3 60%,#e7f5ff 100%)'
                : insight?.type === 'alert'
                ? 'linear-gradient(98deg,#ffe9e9 60%,#f2f3ff 100%)'
                : insight?.type === 'warning'
                ? 'linear-gradient(95deg,#fff9e2 60%,#fff7e7 100%)'
                : 'linear-gradient(94deg,#e4effe 60%,#d9f4ff 100%)',
            color:
              insight?.type === 'good'
                ? '#118d5c'
                : insight?.type === 'alert'
                ? '#ce4545'
                : insight?.type === 'warning'
                ? '#a3881b'
                : '#2469b6',
            borderRadius: 11,
            fontWeight: 700,
            fontSize: 14.5,
            display: 'inline-block',
            padding: '6px 18px 5px 13px',
            margin: '0 0 7px 0',
            boxShadow: '0 1px 10px #1ee0b414',
            letterSpacing: '0.02em',
          }}
          tabIndex={0}
          aria-live="polite"
        >
          <span style={{ marginRight: 6 }}>{insight?.icon}</span>
          {insight?.msg}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={132}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 18, left: 4, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 2" stroke="#e5f7ff" />
          <XAxis
            dataKey="date"
            fontSize={12}
            axisLine={false}
            tickLine={false}
            style={{ fill: '#80a6cb' }}
          />
          <YAxis
            fontSize={12}
            axisLine={false}
            tickLine={false}
            style={{ fill: '#83d3ed' }}
            width={34}
          />
          <Tooltip content={<FuturisticTooltip />} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#00e5e5"
            strokeWidth={4}
            dot={{
              stroke: '#fff',
              strokeWidth: 2.1,
              fill: '#00ffd0',
              r: 3.8,
              style: { filter: 'drop-shadow(0 0 9px #00fbe7cc)' },
            }}
            activeDot={{
              r: 7.5,
              fill: '#fff',
              stroke: '#13f0d2',
              strokeWidth: 2.6,
              style: { filter: 'drop-shadow(0 0 12px #00fff6cc)' },
            }}
            animationDuration={1000}
            isAnimationActive
          />
          {/* Show max/min as reference points (self-improving UI) */}
          <ReferenceDot
            if={true}
            x={
              data.reduce(
                (max, d) => (d.amount > max.amount ? d : max),
                data[0],
              ).date
            }
            y={Math.max(...data.map((d) => d.amount))}
            r={6}
            fill="#ff1e56"
            stroke="#fff"
            label={{
              value: 'Max',
              position: 'top',
              fontSize: 12,
              fill: '#ff1e56',
            }}
          />
          <ReferenceDot
            if={true}
            x={
              data.reduce(
                (min, d) => (d.amount < min.amount ? d : min),
                data[0],
              ).date
            }
            y={Math.min(...data.map((d) => d.amount))}
            r={6}
            fill="#18d98b"
            stroke="#fff"
            label={{
              value: 'Min',
              position: 'bottom',
              fontSize: 12,
              fill: '#18d98b',
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div
        style={{
          fontSize: 12.5,
          color: '#6c8bbf',
          marginTop: 7,
          fontWeight: 500,
        }}
      >
        <span role="img" aria-label="ai brain">
          🧠
        </span>{' '}
        Chart improves insights as you track more data!
      </div>
    </Widget>
  )
}

export default SpendingHistoryChart
