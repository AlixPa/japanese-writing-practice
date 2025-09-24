import { useRef, useCallback } from 'react'
import { Blob } from '@/types/player'

export function usePlayerCache() {
  // Audio cache: audio_id -> Blob
  const audioCache = useRef<Map<string, Blob>>(new Map())
  
  // Duration cache: selectionKey -> duration
  const durationCache = useRef<Map<string, number>>(new Map())

  // Audio cache methods
  const getAudioFromCache = useCallback((audioId: string): Blob | undefined => {
    return audioCache.current.get(audioId)
  }, [])

  const setAudioInCache = useCallback((audioId: string, blob: Blob): void => {
    audioCache.current.set(audioId, blob)
  }, [])

  const hasAudioInCache = useCallback((audioId: string): boolean => {
    return audioCache.current.has(audioId)
  }, [])

  const clearAudioCache = useCallback((): void => {
    audioCache.current.clear()
  }, [])

  // Duration cache methods
  const getDurationFromCache = useCallback((key: string): number | undefined => {
    return durationCache.current.get(key)
  }, [])

  const setDurationInCache = useCallback((key: string, duration: number): void => {
    durationCache.current.set(key, duration)
  }, [])

  const hasDurationInCache = useCallback((key: string): boolean => {
    return durationCache.current.has(key)
  }, [])

  const clearDurationCache = useCallback((): void => {
    durationCache.current.clear()
  }, [])

  // Clear all caches
  const clearAllCaches = useCallback((): void => {
    clearAudioCache()
    clearDurationCache()
  }, [clearAudioCache, clearDurationCache])

  // Cache statistics
  const getCacheStats = useCallback(() => {
    return {
      audioCacheSize: audioCache.current.size,
      durationCacheSize: durationCache.current.size,
      totalSize: audioCache.current.size + durationCache.current.size
    }
  }, [])

  return {
    audio: {
      get: getAudioFromCache,
      set: setAudioInCache,
      has: hasAudioInCache,
      clear: clearAudioCache
    },
    duration: {
      get: getDurationFromCache,
      set: setDurationInCache,
      has: hasDurationInCache,
      clear: clearDurationCache
    },
    clearAll: clearAllCaches,
    getStats: getCacheStats
  }
}
