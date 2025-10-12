import React from 'react'
import type { ApiConfig } from '@/api/client'

interface Props {
  configs: ApiConfig[]
  value: string
  onChange: (id: string) => void
}

export function ConfigSelector({ configs, value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}
    >
      {configs.map(c => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  )
}


