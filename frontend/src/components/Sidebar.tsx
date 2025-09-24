import React from 'react'

type TabKey = 'sample1' | 'sample2' | 'sample3'

interface SidebarProps {
  activeTab: TabKey
  onChange: (tab: TabKey) => void
}

const menuItems: { key: TabKey; label: string }[] = [
  { key: 'sample1', label: 'Dictation' },
  { key: 'sample2', label: 'Dictation Configuration' },
  { key: 'sample3', label: 'Custom Generation' },
]

export function Sidebar({ activeTab, onChange }: SidebarProps) {
  return (
    <aside style={{
      width: 200,
      borderRight: '1px solid #e5e7eb',
      padding: 12,
      boxSizing: 'border-box',
      background: '#f9fafb'
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {menuItems.map(item => {
          const isActive = activeTab === item.key
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid ' + (isActive ? '#3b82f6' : '#e5e7eb'),
                background: isActive ? '#eff6ff' : 'white',
                color: isActive ? '#1d4ed8' : '#111827',
                cursor: 'pointer'
              }}
            >
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}


