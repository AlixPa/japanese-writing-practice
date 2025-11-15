import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/contexts/AuthContext'

const menuItems: { path: string; label: string }[] = [
  { path: '/', label: 'Home' },
  { path: '/dictation', label: 'Dictation' },
  { path: '/configuration', label: 'Configuration' },
  { path: '/generation', label: 'Generation' },
]

export function Sidebar() {
  const { isAuthenticated, handleCredentialResponse, logout, token } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const prevTokenRef = React.useRef<string | null>(null)

  // Redirect to root when user logs in or logs out (token changes)
  React.useEffect(() => {
    const prevToken = prevTokenRef.current
    prevTokenRef.current = token
    
    // Redirect if token changed (login: null -> value, or logout: value -> null)
    if (token !== prevToken && location.pathname !== '/') {
      // Small delay to ensure data has time to refetch
      const timer = setTimeout(() => {
        navigate('/')
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [token, navigate, location.pathname])

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
      <div style={{
        paddingBottom: 16,
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginBottom: 16
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
                handleCredentialResponse(credentialResponse)
                // Navigation will happen via useEffect when token changes
              }}
              onError={() => {
                console.error('Login Failed')
              }}
            />
          </div>
        )}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {menuItems.map(item => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid ' + (isActive ? '#3b82f6' : '#e5e7eb'),
                background: isActive ? '#eff6ff' : 'white',
                color: isActive ? '#1d4ed8' : '#111827',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'block'
              }}
            >
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}


