import { createContext, useContext, useState, ReactNode, useMemo } from 'react'
import { useGoogleOneTapLogin } from '@react-oauth/google'

interface UserInfo {
  email?: string
  name?: string
  picture?: string
}

interface AuthContextType {
  token: string | null
  isAuthenticated: boolean
  userInfo: UserInfo | null
  handleCredentialResponse: (response: { credential?: string }) => void
  logout: () => void
}

// Decode JWT token to extract user info (without verification, since backend already verified it)
function decodeJWT(token: string): UserInfo | null {
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
    }
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize from localStorage
    return localStorage.getItem('google_id_token')
  })

  // Decode user info from token
  const userInfo = useMemo(() => {
    if (!token) return null
    return decodeJWT(token)
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

  // Try one-tap login on mount
  useGoogleOneTapLogin({
    onSuccess: handleCredentialResponse,
    onError: () => {
      // One-tap failed or dismissed, user can use button instead
    },
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

