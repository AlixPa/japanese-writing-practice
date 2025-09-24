import { useCallback } from 'react'
import { PlayerState, ConfigStep, AudioChunk } from '@/types/player'
import { getElementType, generateSelectionKey, getWaitDuration } from '@/utils/playerUtils'

interface UsePlayerControlsProps {
  state: PlayerState
  onPlayError: (error: string | null) => void
  onGetAudioMetadata: (storyId: string, speed: number) => Promise<{ audio_id: string }>
  onGetSentenceMetadata: (storyId: string, speed: number) => Promise<AudioChunk[]>
  onGetAudioBlob: (audioId: string) => Promise<Blob>
  onGetAudioDurationFromId: (audioId: string) => Promise<number>
  onGetMainAudioDuration: (speed: number) => Promise<number>
  onSetCurrentSubElement: (element: { type: 'audio' | 'gap', index: number } | null) => void
  onSetSentenceChunks: (chunks: AudioChunk[]) => void
  onSetSelectedSubElementDuration: (duration: number | null) => void
  onSetProgress: (progress: { current: number; total: number } | null) => void
  onSetIsPlaying: (playing: boolean) => void
  onSetPaused: (paused: boolean) => void
  onSetActiveIndex: (index: number | null) => void
  onClearProgress: () => void
  onTriggerRefresh: () => void
  onAbortPlayback: () => void
  onPlayAudio: (audio: HTMLAudioElement, onTimeUpdate: (currentTime: number) => void, onEnded: () => void) => Promise<void>
  onCreateAudioWithBlob: (blob: Blob) => HTMLAudioElement
  onGetAudioFromCache: (audioId: string) => Blob | undefined
  onSetAudioInCache: (audioId: string, blob: Blob) => void
  onGetDurationFromCache: (key: string) => number | undefined
  onSetDurationInCache: (key: string, duration: number) => void
}

export function usePlayerControls({
  state,
  onPlayError,
  onGetAudioMetadata,
  onGetSentenceMetadata,
  onGetAudioBlob,
  onGetAudioDurationFromId,
  onGetMainAudioDuration,
  onSetCurrentSubElement,
  onSetSentenceChunks,
  onSetSelectedSubElementDuration,
  onSetProgress,
  onSetIsPlaying,
  onSetPaused,
  onSetActiveIndex,
  onClearProgress,
  onTriggerRefresh,
  onAbortPlayback,
  onPlayAudio,
  onCreateAudioWithBlob,
  onGetAudioFromCache,
  onSetAudioInCache,
  onGetDurationFromCache,
  onSetDurationInCache
}: UsePlayerControlsProps) {
  
  // Fetch duration for a specific element
  const fetchElementDuration = useCallback(async (
    storyId: string,
    index: number,
    configSequence: ConfigStep[]
  ): Promise<void> => {
    if (!storyId || index === null) return

    const step = configSequence[index]
    const elementType = getElementType(step)
    const { hasWait, hasSpeed } = elementType

    const selectionKey = generateSelectionKey(storyId, index, hasWait, hasSpeed)

    // Check cache first
    if (onGetDurationFromCache(selectionKey)) {
      const cachedDuration = onGetDurationFromCache(selectionKey)!
      onSetSelectedSubElementDuration(cachedDuration)
      return
    }

    let duration: number | null = null

    if (hasWait && hasSpeed) {
      // Sentence-by-sentence element
      onSetCurrentSubElement({ type: 'audio', index: 0 })
      try {
        const speed = step.speed || 100
        const payload = await onGetSentenceMetadata(storyId, speed)
        const list = payload || []
        onSetSentenceChunks(list)
        
        if (list.length > 0) {
          const defaultSubElementKey = `${storyId}-${index}-audio-0`
          if (onGetDurationFromCache(defaultSubElementKey)) {
            const cachedDuration = onGetDurationFromCache(defaultSubElementKey)!
            onSetSelectedSubElementDuration(cachedDuration)
          } else {
            const duration = await onGetAudioDurationFromId(list[0].audio_id)
            onSetSelectedSubElementDuration(duration)
            onSetDurationInCache(defaultSubElementKey, duration)
          }
        }
      } catch (e) {
        console.error('Failed to fetch sentence metadata:', e)
        onSetSentenceChunks([])
      }
      return
    } else if (hasSpeed) {
      // Full dictation element
      duration = await onGetMainAudioDuration(step.speed || 100)
    } else if (hasWait) {
      // Wait element
      duration = getWaitDuration(step.wait || 0)
    }

    if (duration !== null) {
      onSetSelectedSubElementDuration(duration)
      onSetDurationInCache(selectionKey, duration)
    }
  }, [
    onGetDurationFromCache,
    onSetSelectedSubElementDuration,
    onSetCurrentSubElement,
    onSetSentenceChunks,
    onGetSentenceMetadata,
    onGetAudioDurationFromId,
    onGetMainAudioDuration,
    onSetDurationInCache
  ])

  // Handle element selection
  const handleElementSelect = useCallback(async (
    index: number,
    storyId: string,
    configSequence: ConfigStep[]
  ): Promise<void> => {
    onSetActiveIndex(index)
    await fetchElementDuration(storyId, index, configSequence)
  }, [onSetActiveIndex, fetchElementDuration])

  // Handle sub-element selection
  const handleSubElementSelect = useCallback(async (
    type: 'audio' | 'gap',
    index: number,
    storyId: string,
    activeIndex: number | null
  ): Promise<void> => {
    if (activeIndex === null) return

    onSetCurrentSubElement({ type, index })
    
    if (type === 'audio') {
      const key = `${storyId}-${activeIndex}-audio-${index}`
      if (onGetDurationFromCache(key)) {
        const cachedDuration = onGetDurationFromCache(key)!
        onSetSelectedSubElementDuration(cachedDuration)
      } else {
        // This would need to be implemented based on your audio chunk structure
        console.warn('Sub-element duration fetching not implemented yet')
      }
    } else {
      // Gap element - use wait duration
      const step = configSequence[activeIndex]
      const waitDuration = getWaitDuration(step.wait || 0)
      onSetSelectedSubElementDuration(waitDuration)
    }
  }, [onSetCurrentSubElement, onSetSelectedSubElementDuration, onGetDurationFromCache])

  // Play sequence
  const playSequence = useCallback(async (
    storyId: string,
    configSequence: ConfigStep[],
    startIndex: number = 0
  ): Promise<void> => {
    onSetIsPlaying(true)
    onSetPaused(false)

    try {
      for (let i = startIndex; i < configSequence.length; i++) {
        const step = configSequence[i]
        const elementType = getElementType(step)
        const { hasWait, hasSpeed } = elementType

        onSetActiveIndex(i)
        await fetchElementDuration(storyId, i, configSequence)

        if (hasWait && hasSpeed) {
          // Sentence-by-sentence playback
          const chunks = state.sentenceChunks
          for (let j = 0; j < chunks.length; j++) {
            const chunk = chunks[j]
            onSetCurrentSubElement({ type: 'audio', index: j })
            
            // Get or fetch audio blob
            let blob = onGetAudioFromCache(chunk.audio_id)
            if (!blob) {
              blob = await onGetAudioBlob(chunk.audio_id)
              onSetAudioInCache(chunk.audio_id, blob)
            }

            const audio = onCreateAudioWithBlob(blob)
            const duration = await onGetAudioDurationFromId(chunk.audio_id)
            
            onSetProgress({ current: 0, total: duration })
            
            await onPlayAudio(audio, (currentTime) => {
              onSetProgress({ current: currentTime, total: duration })
            }, () => {
              onSetProgress({ current: duration, total: duration })
            })

            // Add gap between sentences
            if (j < chunks.length - 1) {
              onSetCurrentSubElement({ type: 'gap', index: j })
              const waitDuration = getWaitDuration(step.wait || 0)
              onSetProgress({ current: 0, total: waitDuration })
              
              await new Promise(resolve => setTimeout(resolve, waitDuration))
            }
          }
        } else if (hasSpeed) {
          // Full dictation playback
          const metadata = await onGetAudioMetadata(storyId, step.speed || 100)
          let blob = onGetAudioFromCache(metadata.audio_id)
          if (!blob) {
            blob = await onGetAudioBlob(metadata.audio_id)
            onSetAudioInCache(metadata.audio_id, blob)
          }

          const audio = onCreateAudioWithBlob(blob)
          const duration = await onGetMainAudioDuration(step.speed || 100)
          
          onSetProgress({ current: 0, total: duration })
          
          await onPlayAudio(audio, (currentTime) => {
            onSetProgress({ current: currentTime, total: duration })
          }, () => {
            onSetProgress({ current: duration, total: duration })
          })
        } else if (hasWait) {
          // Wait element
          const waitDuration = getWaitDuration(step.wait || 0)
          onSetProgress({ current: 0, total: waitDuration })
          
          await new Promise(resolve => setTimeout(resolve, waitDuration))
        }
      }
    } catch (error) {
      console.error('Playback error:', error)
      onPlayError(error instanceof Error ? error.message : 'Playback failed')
    } finally {
      onSetIsPlaying(false)
      onSetPaused(false)
      onClearProgress()
    }
  }, [
    state.sentenceChunks,
    onSetIsPlaying,
    onSetPaused,
    onSetActiveIndex,
    onSetCurrentSubElement,
    onSetProgress,
    onSetAudioInCache,
    onGetAudioFromCache,
    onCreateAudioWithBlob,
    onPlayAudio,
    onGetAudioDurationFromId,
    onGetMainAudioDuration,
    onGetAudioMetadata,
    onGetAudioBlob,
    onClearProgress,
    onPlayError,
    fetchElementDuration
  ])

  // Stop playback
  const stopPlayback = useCallback(() => {
    onAbortPlayback()
    onSetIsPlaying(false)
    onSetPaused(false)
    onClearProgress()
    onTriggerRefresh()
  }, [onAbortPlayback, onSetIsPlaying, onSetPaused, onClearProgress, onTriggerRefresh])

  // Pause/Resume
  const handlePauseResume = useCallback(() => {
    if (state.isPaused) {
      onSetPaused(false)
      // Resume logic would go here
    } else {
      onSetPaused(true)
      // Pause logic would go here
    }
  }, [state.isPaused, onSetPaused])

  return {
    fetchElementDuration,
    handleElementSelect,
    handleSubElementSelect,
    playSequence,
    stopPlayback,
    handlePauseResume
  }
}
