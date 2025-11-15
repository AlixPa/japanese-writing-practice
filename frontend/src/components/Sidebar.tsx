import React from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/contexts/AuthContext'

type TabKey = 'home' | 'sample1' | 'sample2' | 'sample3'

interface SidebarProps {
  activeTab: TabKey
  onChange: (tab: TabKey) => void
}

const menuItems: { key: TabKey; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'sample1', label: 'Dictation' },
  { key: 'sample2', label: 'Configuration' },
  { key: 'sample3', label: 'Generation' },
]

export function Sidebar({ activeTab, onChange }: SidebarProps) {
  const { isAuthenticated, handleCredentialResponse, logout } = useAuth()

  return (
    <aside style={{
      width: 200,
      borderRight: '1px solid #e5e7eb',
      padding: 12,
      boxSizing: 'border-box',
      background: '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
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

      <div style={{
        paddingTop: 16,
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
        {isAuthenticated ? (
          <>
            <div style={{
              padding: '8px 10px',
              fontSize: 12,
              color: '#6b7280',
              textAlign: 'center'
            }}>
              Signed in
            </div>
            <button
              onClick={logout}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: 'white',
                color: '#111827',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  handleCredentialResponse(credentialResponse)
                }
              }}
              onError={() => {
                console.error('Login Failed')
              }}
            />
          </div>
        )}
      </div>
    </aside>
  )
}


