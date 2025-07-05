import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  TooltipProps,
} from 'recharts'
import type { BalanceData } from '../../types'

interface BalanceChartProps {
  data: BalanceData[]
  height?: number
  title?: string
  currency?: string
  showGrid?: boolean
  animated?: boolean
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  currency?: string
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ 
  active, 
  payload, 
  label, 
  currency = '€' 
}) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="balance-chart-tooltip" style={{
      backgroundColor: '#fff',
      padding: '12px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      <p style={{ fontWeight: 600, marginBottom: '8px', color: '#333' }}>
        {label}
      </p>
      {payload.map((entry, index) => (
        <p key={index} style={{ 
          margin: '4px 0', 
          color: entry.color,
          fontSize: '14px'
        }}>
          <span style={{ fontWeight: 500 }}>{entry.name}:</span>{' '}
          <span style={{ fontWeight: 600 }}>
            {currency}{Number(entry.value).toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  )
}

const BalanceChart: React.FC<BalanceChartProps> = ({ 
  data, 
  height = 320, 
  title = 'Monthly Trend',
  currency = '€',
  showGrid = true,
  animated = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        color: '#666'
      }}>
        <p>No data available</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: height + 80 }}>
      <h4 className="balance-chart-title" style={{
        marginBottom: '16px',
        fontSize: '18px',
        fontWeight: 600,
        color: '#333',
        textAlign: 'center'
      }}>
        {title}
      </h4>
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e0e0e0" 
              opacity={0.7}
            />
          )}
          
          <XAxis 
            dataKey="label" 
            stroke="#666" 
            fontSize={12}
            tickLine={false}
          />
          
          <YAxis 
            stroke="#666" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `${currency}${value.toLocaleString()}`}
          />
          
          <Tooltip 
            content={<CustomTooltip currency={currency} />}
          />
          
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="line"
          />
          
          <Line
            type="monotone"
            dataKey="receivables"
            stroke="#4caf50"
            strokeWidth={2}
            name="Receivables"
            dot={{ r: 4, fill: '#4caf50' }}
            activeDot={{ r: 6, fill: '#4caf50' }}
            animationDuration={animated ? 800 : 0}
          />
          
          <Line
            type="monotone"
            dataKey="payables"
            stroke="#f44336"
            strokeWidth={2}
            name="Payables"
            dot={{ r: 4, fill: '#f44336' }}
            activeDot={{ r: 6, fill: '#f44336' }}
            animationDuration={animated ? 800 : 0}
          />
          
          <Line
            type="monotone"
            dataKey="net"
            stroke="#2196f3"
            strokeWidth={3}
            name="Net Balance"
            dot={{ r: 5, fill: '#2196f3' }}
            activeDot={{ r: 7, fill: '#2196f3' }}
            animationDuration={animated ? 800 : 0}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default BalanceChart
