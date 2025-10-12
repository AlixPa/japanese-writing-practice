import React from 'react'
import { SPEED_OPTIONS } from '@/constants/speedOptions'

interface SpeedSelectorProps {
  value: number
  onChange: (value: number) => void
  label?: string
  style?: React.CSSProperties
}

export function SpeedSelector({ 
  value, 
  onChange, 
  label = "Speed",
  style 
}: SpeedSelectorProps) {
  return (
    <label style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: 6, 
      marginLeft: 8,
      ...style 
    }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          padding: '4px 6px',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          background: 'white',
          cursor: 'pointer'
        }}
      >
        {SPEED_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
