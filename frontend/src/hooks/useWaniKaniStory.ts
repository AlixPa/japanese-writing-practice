import { useEffect, useState } from 'react'
import { api, type StoryResponse } from '@/api/client'

export function useWaniKaniStory(level: number) {
  const [data, setData] = useState<StoryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const story = await api.getStory(level)
        if (cancelled) return
        setData(story)
      } catch (e) {
        if (!cancelled) {
          setError('Failed to load story')
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => { cancelled = true; ctrl.abort(); clearTimeout(t) }
  }, [level])

  return { data, loading, error }
}


