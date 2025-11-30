import { useEffect, useState, useRef } from 'react'
import { useConfigs } from './useConfigs'
import type { ApiConfig } from '@/api/client'

export function useConfigById(configId: string) {
  const { configs, loading, error } = useConfigs()
  const [config, setConfig] = useState<ApiConfig | null>(null)
  const prevConfigIdRef = useRef<string>('')
  const prevConfigRef = useRef<ApiConfig | null>(null)

  useEffect(() => {
    if (configId && configs.length > 0) {
      const found = configs.find(c => c.id === configId)
      // Only update if configId changed or if we found a different config object
      if (configId !== prevConfigIdRef.current || found !== prevConfigRef.current) {
        prevConfigIdRef.current = configId
        prevConfigRef.current = found || null
        setConfig(found || null)
      }
    } else {
      // Only update if we had a config before
      if (prevConfigRef.current !== null) {
        prevConfigIdRef.current = configId
        prevConfigRef.current = null
        setConfig(null)
      }
    }
  }, [configId, configs])

  return { config, loading, error }
}
