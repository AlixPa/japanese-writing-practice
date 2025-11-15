import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { App } from './App'
import { AuthProvider } from './contexts/AuthContext'

// Get Google Client ID from environment variable
const googleClientId = import.meta.env.GOOGLE_CLIENT_ID

if (!googleClientId) {
  console.warn('GOOGLE_CLIENT_ID is not set. Google OAuth will not work.')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId || ''}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)


