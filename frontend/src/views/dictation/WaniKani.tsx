import React, { useEffect, useState } from 'react'
import { api, StoryResponse } from '@/api/client'
import { RangeSlider } from '@/components/RangeSlider'
import { Player } from './components/Player'
import { StoryBlock } from './components/StoryBlock'
import { useConfigById } from '@/hooks/useConfigById'

export function DictationWaniKani({ selectedConfigId }: { selectedConfigId: string }) {
  const [level, setLevel] = useState<number>(1)
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



  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ color: '#6b7280', minWidth: 40 }}>Level</label>
        <RangeSlider
          min={1}
          max={60}
          step={1}
          value={level}
          onChange={(e) => { setLevel(Number(e.target.value)); setRevealed(false) }}
          style={{ flex: 1 }}
        />
        <input
          type="number"
          min={1}
          max={60}
          value={level}
          onChange={(e) => {
            const newLevel = Math.max(1, Math.min(60, Number(e.target.value) || 1))
            setLevel(newLevel)
            setRevealed(false)
          }}
          style={{
            width: 60,
            padding: '4px 8px',
            borderRadius: 8,
            border: '1px solid #c7d2fe',
            background: '#eef2ff',
            color: '#1d4ed8',
            textAlign: 'center',
            fontSize: '14px'
          }}
        />
      </div>

      {stories.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ color: '#6b7280', minWidth: 60 }}>Story</label>
          <select
            value={selectedStory?.story_id || ''}
            onChange={(e) => {
              const story = stories.find(s => s.story_id === e.target.value)
              setSelectedStory(story || null)
              setRevealed(false)
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: 'white',
              fontSize: '14px',
              cursor: 'pointer'
            }}
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
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: 12, 
          padding: 24, 
          background: 'white',
          textAlign: 'center',
          color: '#6b7280'
        }}>
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
            onGetAudioBlob={api.getAudioBlob}
          />
        </>
      )}
    </div>
  )
}


