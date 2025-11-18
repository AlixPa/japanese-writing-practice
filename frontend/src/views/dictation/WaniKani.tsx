import React, { useEffect, useState } from 'react'
import { api, StoryResponse } from '@/api/client'
import { Player } from './components/Player'
import { StoryBlock } from './components/StoryBlock'
import { useConfigById } from '@/hooks/useConfigById'

export function DictationWaniKani({ selectedConfigId }: { selectedConfigId: string }) {
  const [level, setLevel] = useState<number>(1)
  const [levelInput, setLevelInput] = useState<string>('1')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [stories, setStories] = useState<StoryResponse[]>([])
  const [selectedStory, setSelectedStory] = useState<StoryResponse | null>(null)
  const [revealed, setRevealed] = useState<boolean>(false)
  const [playError, setPlayError] = useState<string | null>(null)
  
  const { config: selectedConfig } = useConfigById(selectedConfigId)
  const configSequence = selectedConfig?.sequence || []

  useEffect(() => {
    let cancelled = false
    const ctrl = new AbortController()
    const timeout = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await api.getStory(level)
        if (cancelled) return
        setStories(data)
        // Auto-select first story if available
        if (data.length > 0) {
          setSelectedStory(data[0])
        } else {
          setSelectedStory(null)
        }
      } catch (e) {
        if (!cancelled && (e as any)?.name !== 'AbortError') {
          setError('Failed to load stories')
          setStories([])
          setSelectedStory(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => { cancelled = true; ctrl.abort(); clearTimeout(timeout) }
  }, [level])

  // Sync levelInput with level when level changes externally (e.g., from buttons)
  useEffect(() => {
    setLevelInput(level.toString())
  }, [level])



  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
        <label className="text-gray-500 text-sm md:min-w-[40px]">Level</label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const newLevel = Math.max(1, level - 1)
              setLevel(newLevel)
              setRevealed(false)
            }}
            disabled={level <= 1}
            className="w-10 h-10 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold text-lg flex items-center justify-center hover:bg-indigo-100 active:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            aria-label="Decrease level"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={60}
            value={levelInput}
            onChange={(e) => {
              const value = e.target.value
              setLevelInput(value) // Allow empty for typing
              if (value !== '' && !isNaN(Number(value))) {
                const num = Number(value)
                const newLevel = Math.max(1, Math.min(60, num))
                setLevel(newLevel)
                setRevealed(false)
              }
            }}
            onBlur={() => {
              // Validate on blur - if empty or invalid, reset to current level
              const num = Number(levelInput)
              if (levelInput === '' || isNaN(num)) {
                setLevelInput(level.toString())
              } else {
                const newLevel = Math.max(1, Math.min(60, num))
                setLevel(newLevel)
                setLevelInput(newLevel.toString())
                setRevealed(false)
              }
            }}
            className="w-20 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={() => {
              const newLevel = Math.min(60, level + 1)
              setLevel(newLevel)
              setRevealed(false)
            }}
            disabled={level >= 60}
            className="w-10 h-10 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold text-lg flex items-center justify-center hover:bg-indigo-100 active:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            aria-label="Increase level"
          >
            +
          </button>
        </div>
      </div>

      {stories.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          <label className="text-gray-500 text-sm md:min-w-[60px]">Story</label>
          <select
            value={selectedStory?.story_id || ''}
            onChange={(e) => {
              const story = stories.find(s => s.story_id === e.target.value)
              setSelectedStory(story || null)
              setRevealed(false)
            }}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {stories.map((story) => (
              <option key={story.story_id} value={story.story_id}>
                {story.story_title || `Story ${story.story_id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {stories.length === 0 && !loading && !error ? (
        <div className="border border-gray-200 rounded-xl p-6 bg-white text-center text-gray-500">
          No story available for this level
        </div>
      ) : (
        <>
          <StoryBlock
            loading={loading}
            error={error}
            storyText={selectedStory?.story_text || ''}
            revealed={revealed}
            onToggleRevealed={() => setRevealed(r => !r)}
          />

          <Player
            storyId={selectedStory?.story_id || ''}
            configSequence={configSequence}
            onPlayError={setPlayError}
            playError={playError}
            onGetAudioMetadata={api.getAudioMetadata}
            onGetSentenceMetadata={api.getSentenceMetadata}
          />
        </>
      )}
    </div>
  )
}


