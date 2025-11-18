import React from 'react'
import type { ApiConfig } from '@/api/client'
import { Dropdown, type DropdownItem } from '@/components/Dropdown'

interface Props {
  configs: ApiConfig[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
}

export function ConfigSelector({ configs, value, onChange, disabled = false }: Props) {
  const items: DropdownItem[] = configs.map(config => ({
    id: config.id,
    label: config.name
  }))

  return (
    <Dropdown
      items={items}
      value={value}
      onChange={onChange}
      placeholder="Select configuration"
      disabled={disabled}
    />
  )
}


