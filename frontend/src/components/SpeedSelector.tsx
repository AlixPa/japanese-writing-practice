import React from 'react'
import { SPEED_OPTIONS } from '@/constants/speedOptions'

interface SpeedSelectorProps {
  value: number
  onChange: (value: number) => void
  label?: string
  style?: React.CSSProperties
  disabled?: boolean
}

export function SpeedSelector({ 
  value, 
  onChange, 
  label = "Speed",
  style,
  disabled = false
}: SpeedSelectorProps) {
  return (
    <label className="inline-flex items-center gap-1.5 text-base" style={style}>
      <span className="text-gray-500 text-base">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-20 px-1.5 py-1 border border-gray-200 rounded-md bg-white cursor-pointer text-base leading-normal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
