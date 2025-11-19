import React, { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/contexts/AuthContext'

const menuItems: { path: string; label: string }[] = [
  { path: '/', label: 'Home' },
  { path: '/dictation', label: 'Dictation' },
  { path: '/configuration', label: 'Configuration' },
  { path: '/generation', label: 'Generation' },
]

export function MobileNav() {
  const { isAuthenticated, handleCredentialResponse, logout, token, userInfo } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const prevTokenRef = React.useRef<string | null>(null)

  // Redirect to root when user logs in or logs out (only on actual auth state change)
  React.useEffect(() => {
    const prevToken = prevTokenRef.current
    
    // Only redirect if there's an actual authentication state change:
    // - Login: prevToken was null, now has a value
    // - Logout: prevToken had a value, now is null
    const wasLoggedIn = prevToken !== null
    const isLoggedIn = token !== null
    const authStateChanged = wasLoggedIn !== isLoggedIn
    
    // Update ref for next comparison
    prevTokenRef.current = token
    
    // Only redirect on actual login/logout, not on token updates
    if (authStateChanged && location.pathname !== '/') {
      // Small delay to ensure data has time to refetch
      const timer = setTimeout(() => {
        navigate('/')
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [token, navigate, location.pathname])

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Header Bar - Always visible on mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-[100] flex items-center px-4 shadow-sm">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="flex-1 text-base font-semibold text-gray-900 text-center pr-8">
          Japanese Writing Practice
        </h1>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-in Menu */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-gray-50 border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Auth Section */}
          <div className="p-3 border-b border-gray-200 flex flex-col gap-2">
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
                  onClick={() => {
                    logout()
                    setIsOpen(false)
                  }}
                  className="px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 cursor-pointer text-sm hover:bg-gray-50 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    handleCredentialResponse(credentialResponse)
                    setIsOpen(false)
                  }}
                  onError={() => {
                    console.error('Login Failed')
                  }}
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2 flex-1 p-3 overflow-y-auto">
            {menuItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleLinkClick}
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
        </div>
      </aside>
    </>
  )
}

