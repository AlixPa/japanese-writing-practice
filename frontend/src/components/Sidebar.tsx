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
  const { isAuthenticated, handleCredentialResponse, logout, token, userInfo } = useAuth()
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
    <aside className="hidden md:flex w-[200px] border-r border-gray-200 p-3 box-border bg-gray-50 flex-col h-screen">
      <div className="pb-4 border-b border-gray-200 flex flex-col gap-2 mb-4">
        {isAuthenticated ? (
          <>
            {userInfo?.email && (
              <div className="px-2.5 py-2 text-xs text-gray-900 text-center font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                {userInfo.email}
              </div>
            )}
            <div className="px-2.5 py-1 text-xs text-gray-500 text-center">
              Signed in
            </div>
            <button
              onClick={logout}
              className="px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 cursor-pointer text-sm hover:bg-gray-50 transition-colors min-h-[44px]"
            >
              Sign out
            </button>
          </>
        ) : (
          <div className="flex justify-center">
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

      <nav className="flex flex-col gap-2 flex-1">
        {menuItems.map(item => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`text-left px-2.5 py-2 rounded-lg border min-h-[44px] flex items-center transition-colors ${
                isActive
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}


