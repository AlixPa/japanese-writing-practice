import { useEffect, useState } from 'react'
import { useConfigs } from './useConfigs'
import type { ApiConfig } from '@/api/client'

export function useConfigById(configId: string) {
  const { configs, loading, error } = useConfigs()
  const [config, setConfig] = useState<ApiConfig | null>(null)

  useEffect(() => {
    if (configId && configs.length > 0) {
      const found = configs.find(c => c.id === configId)
      setConfig(found || null)
    } else {
      setConfig(null)
    }
  }, [configId, configs])

  return { config, loading, error }
}
