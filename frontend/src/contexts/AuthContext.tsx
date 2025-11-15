import { createContext, useContext, useState, ReactNode, useMemo, useEffect, useRef } from 'react'
import { useGoogleOneTapLogin } from '@react-oauth/google'

interface UserInfo {
  email?: string
  name?: string
  picture?: string
}

interface DecodedToken {
  email?: string
  name?: string
  picture?: string
  exp?: number
  iat?: number
}

interface AuthContextType {
  token: string | null
  isAuthenticated: boolean
  userInfo: UserInfo | null
  handleCredentialResponse: (response: { credential?: string }) => void
  logout: () => void
}

// Decode JWT token to extract user info and expiration (without verification, since backend already verified it)
function decodeJWT(token: string): DecodedToken | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    // Decode the payload (second part)
    const payload = parts[1]
    // Add padding if needed for base64url decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4)
    const decoded = JSON.parse(atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/')))
    
    return {
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      exp: decoded.exp, // Expiration time (Unix timestamp)
      iat: decoded.iat, // Issued at time
    }
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

// Check if token is expired or will expire soon (within 5 minutes)
function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token)
  if (!decoded || !decoded.exp) return true
  
  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = decoded.exp * 1000
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000 // 5 minutes in milliseconds
  
  // Token is expired or will expire within 5 minutes
  return now >= (expirationTime - fiveMinutes)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize from localStorage
    const storedToken = localStorage.getItem('google_id_token')
    // Check if stored token is expired
    if (storedToken && isTokenExpired(storedToken)) {
      localStorage.removeItem('google_id_token')
      return null
    }
    return storedToken
  })

  const refreshCheckIntervalRef = useRef<number | null>(null)

  // Decode user info from token
  const userInfo = useMemo(() => {
    if (!token) return null
    const decoded = decodeJWT(token)
    if (!decoded) return null
    return {
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    }
  }, [token])

  // Check token expiration periodically and clear if expired
  useEffect(() => {
    if (!token) {
      // Clear any existing interval if token is null
      if (refreshCheckIntervalRef.current) {
        clearInterval(refreshCheckIntervalRef.current)
        refreshCheckIntervalRef.current = null
      }
      return
    }

    // Check expiration immediately
    if (isTokenExpired(token)) {
      setToken(null)
      localStorage.removeItem('google_id_token')
      return
    }

    // Set up periodic check (every minute)
    refreshCheckIntervalRef.current = setInterval(() => {
      const currentToken = localStorage.getItem('google_id_token')
      if (!currentToken || isTokenExpired(currentToken)) {
        setToken(null)
        localStorage.removeItem('google_id_token')
      }
    }, 60000) // Check every minute

    return () => {
      if (refreshCheckIntervalRef.current) {
        clearInterval(refreshCheckIntervalRef.current)
        refreshCheckIntervalRef.current = null
      }
    }
  }, [token])

  const handleCredentialResponse = (response: { credential?: string }) => {
    if (!response.credential) return
    const idToken = response.credential
    setToken(idToken)
    localStorage.setItem('google_id_token', idToken)
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('google_id_token')
  }

  // Try one-tap login on mount (only if not already authenticated)
  useGoogleOneTapLogin({
    onSuccess: handleCredentialResponse,
    onError: () => {
      // One-tap failed or dismissed, user can use button instead
    },
    disabled: !!token, // Disable one-tap if already authenticated
  })

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        userInfo,
        handleCredentialResponse,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

