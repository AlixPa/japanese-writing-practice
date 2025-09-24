import { useEffect, useState, useRef } from 'react'
import { api, type ApiConfig } from '@/api/client'

export function useConfigs() {
  const [configs, setConfigs] = useState<ApiConfig[]>([])
  const [loading, setLoading] = useState(true) // Start with true
  const [error, setError] = useState<string | null>(null)

  const reload = useRef(async (): Promise<ApiConfig[]> => {
    setLoading(true)
    setError(null)
    try {
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
  }, [])

  return { configs, loading, error, reload: reload.current, setConfigs }
}


