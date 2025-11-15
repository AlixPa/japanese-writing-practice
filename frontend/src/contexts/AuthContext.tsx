import { createContext, useContext, useState, ReactNode } from 'react'
import { useGoogleOneTapLogin } from '@react-oauth/google'

interface AuthContextType {
  token: string | null
  isAuthenticated: boolean
  handleCredentialResponse: (response: { credential: string }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize from localStorage
    return localStorage.getItem('google_id_token')
  })

  const handleCredentialResponse = (response: { credential: string }) => {
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

