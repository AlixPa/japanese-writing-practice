import { useEffect, useState, useRef } from 'react'
import { createApi, type ApiConfig } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'

export function useConfigs() {
  const { token } = useAuth()
  const [configs, setConfigs] = useState<ApiConfig[]>([])
  const [loading, setLoading] = useState(true) // Start with true
  const [error, setError] = useState<string | null>(null)

  const reload = useRef(async (): Promise<ApiConfig[]> => {
    setLoading(true)
    setError(null)
    try {
      // Use authenticated API with token
      const api = createApi(token)
      const res = await api.getConfigs()
      const sorted = [...res].sort((a, b) => a.name.localeCompare(b.name))
      setConfigs(sorted)
      return sorted // Return the fresh data
    } catch (e) {
      setError('Failed to load configurations')
      setConfigs([])
      return []
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    reload.current()
  }, [token]) // Reload when token changes

  return { configs, loading, error, reload: reload.current, setConfigs }
}


