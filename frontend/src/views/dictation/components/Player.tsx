import React, { useState, useRef, useEffect } from 'react'
import { PlayerSequence } from './PlayerSequence'

interface PlayerProps {
  storyId: string
  configSequence: Array<{ wait?: number; speed?: number }>
  onPlayError: (error: string | null) => void
  playError: string | null
  onGetAudioMetadata: (storyId: string, speed: number) => Promise<{ audio_id: string }>
  onGetSentenceMetadata: (storyId: string, speed: number) => Promise<Array<{ audio_id: string }>>
  onGetAudioBlob: (audioId: string) => Promise<Blob>
}

export function Player({ 
  storyId, 
  configSequence, 
  onPlayError, 
  playError, 
  onGetAudioMetadata, 
  onGetSentenceMetadata,
  onGetAudioBlob
}: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(0)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [currentSubElement, setCurrentSubElement] = useState<{ type: 'audio' | 'gap', index: number, progress?: { current: number; total: number } } | null>(null)
  const [sentenceChunks, setSentenceChunks] = useState<Array<{ audio_id: string }>>([])
  const [selectedSubElementDuration, setSelectedSubElementDuration] = useState<number | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  
  // Consolidated refs
  const playAbortRef = useRef<{ aborted: boolean; currentAudio?: HTMLAudioElement } | null>(null)
  const isPausedRef = useRef<boolean>(false)
  
  // Audio cache: audio_id -> Blob
  const audioCache = useRef<Map<string, Blob>>(new Map())
  const currentStoryIdRef = useRef<string | null>(storyId)
  
  // Duration cache: selectionKey -> duration
  const durationCache = useRef<Map<string, number>>(new Map())
  
  // Track previous config to detect actual changes
  const prevConfigRef = useRef<Array<{ wait?: number; speed?: number }>>([])

  // Helper function to detect config changes
  const hasConfigChanged = (currentConfig: Array<{ wait?: number; speed?: number }>) => {
    const prev = prevConfigRef.current
    if (prev.length !== currentConfig.length) return true
    
    return prev.some((prevStep, index) => {
      const currentStep = currentConfig[index]
      return prevStep.wait !== currentStep.wait || prevStep.speed !== currentStep.speed
    })
  }


  // Helper functions for pause state
  const setPaused = (paused: boolean) => {
    setIsPaused(paused)
    isPausedRef.current = paused
  }

  // Unified state reset function
  const resetPlayerState = (resetToFirst = false) => {
    // Stop any ongoing playback
    if (playAbortRef.current) {
      playAbortRef.current.aborted = true
      try { 
        playAbortRef.current.currentAudio?.pause()
        playAbortRef.current.currentAudio = undefined
      } catch {}
    }
    
    // Clear progress and playing state
    clearProgress()
    setIsPlaying(false)
    setPaused(false)
    
    // Reset selection state
    if (resetToFirst) {
      setActiveIndex(0)
    }
    setCurrentSubElement(null)
    setSentenceChunks([])
    setSelectedSubElementDuration(null)
  }

  // Unified duration fetching function
  const fetchElementDuration = async (index: number) => {
    if (!storyId || index === null) return

    const step = configSequence[index]
    const hasWait = Object.prototype.hasOwnProperty.call(step, 'wait')
    const hasSpeed = Object.prototype.hasOwnProperty.call(step, 'speed')
    
    // Create a unique key for this selection to avoid duplicate fetches
    const selectionKey = `${storyId}-${index}-${hasWait}-${hasSpeed}`
    
    // Check duration cache first
    if (durationCache.current.has(selectionKey)) {
      const cachedDuration = durationCache.current.get(selectionKey)!
      setSelectedSubElementDuration(cachedDuration)
      return
    }
    
    let duration: number | null = null
    
    if (hasWait && hasSpeed) {
      // Sentence-by-sentence element - set up default sub-element and fetch duration
      setCurrentSubElement({ type: 'audio', index: 0 })
      
      // Fetch sentence metadata to show sub-elements
      try {
        const speed = step.speed || 100
        const payload = await onGetSentenceMetadata(storyId, speed)
        const list = payload || []
        setSentenceChunks(list)
        
        // Fetch duration for the first audio chunk (default selection)
        if (list.length > 0) {
          const defaultSubElementKey = `${storyId}-${index}-audio-0`
          
          // Check cache first
          if (durationCache.current.has(defaultSubElementKey)) {
            const cachedDuration = durationCache.current.get(defaultSubElementKey)!
            setSelectedSubElementDuration(cachedDuration)
          } else {
            // Fetch from API if not in cache
            const duration = await getAudioDurationFromId(list[0].audio_id)
            setSelectedSubElementDuration(duration)
            
            // Cache the duration for the default sub-element selection
            durationCache.current.set(defaultSubElementKey, duration)
          }
        }
      } catch (e) {
        console.error('Failed to fetch sentence metadata:', e)
        setSentenceChunks([])
      }
      return
    } else if (hasSpeed) {
      // Full dictation element - fetch duration
      duration = await getMainAudioDuration(step.speed || 100)
    } else if (hasWait) {
      // Wait element - calculate duration
      duration = getWaitDuration(step.wait || 0)
    }
    
    if (duration !== null) {
      setSelectedSubElementDuration(duration)
      durationCache.current.set(selectionKey, duration)
    }
  }

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (playAbortRef.current) {
        playAbortRef.current.aborted = true
        try { 
          playAbortRef.current.currentAudio?.pause()
          playAbortRef.current.currentAudio = undefined
        } catch {}
      }
    }
  }, [])

  // Handle config changes - stop playback and reset to first element
  useEffect(() => {
    const handleConfigChange = async () => {
      if (!storyId) return
      
      // Check if config actually changed
      const configChanged = hasConfigChanged(configSequence)
      
      if (configChanged) {
        // Stop playback and reset to first element if config changed
        if (isPlaying) {
          resetPlayerState(true) // Reset to first element and stop playback
        } else {
          // Just reset to first element if not playing
          setActiveIndex(0)
          setCurrentSubElement(null)
          setSentenceChunks([])
          setSelectedSubElementDuration(null)
        }
        // Update the previous config reference
        prevConfigRef.current = [...configSequence]
        // Fetch duration for the first element
        await fetchElementDuration(0)
      }
    }
    
    handleConfigChange()
  }, [configSequence, storyId, isPlaying])

  // Fetch duration for current element selection
  useEffect(() => {
    const fetchCurrentElementDuration = async () => {
      if (!storyId || activeIndex === null) return
      
      // Only fetch if config hasn't changed (config change effect handles that case)
      const configChanged = hasConfigChanged(configSequence)
      if (!configChanged) {
        await fetchElementDuration(activeIndex)
      }
    }
    
    fetchCurrentElementDuration()
  }, [storyId, activeIndex, refreshTrigger])

  // Reset player state when storyId changes
  useEffect(() => {
    // Clear caches if story changed
    if (currentStoryIdRef.current !== storyId) {
      audioCache.current.clear()
      durationCache.current.clear()
      currentStoryIdRef.current = storyId
    }
    
    // Reset all player state
    resetPlayerState(true) // Reset to first element
    onPlayError(null)
    
    // Let the first useEffect handle duration fetching to avoid duplicates
    // The first useEffect will run after this one and handle the duration fetching
    // for the reset activeIndex (0) with the new storyId
  }, [storyId])


  // Playback helpers
  const fetchAudioBlob = async (audioId: string): Promise<Blob> => {
    // Check cache first
    if (audioCache.current.has(audioId)) {
      return audioCache.current.get(audioId)!
    }
    
    // Fetch from API if not in cache
    const blob = await onGetAudioBlob(audioId)
    
    // Store in cache
    audioCache.current.set(audioId, blob)
    
    return blob
  }
  
  // Helper function to handle pause-aware waiting
  // Unified timing system - handles all wait/gap scenarios
  const waitWithPause = async (durationMs: number, onProgress?: (current: number, total: number) => void) => {
    let elapsed = 0
    let lastUpdateTime = Date.now()
    
    while (elapsed < durationMs) {
      if (playAbortRef.current?.aborted) break
      
      const now = Date.now()
      
      if (!isPausedRef.current) {
        elapsed += now - lastUpdateTime
        const current = Math.min(elapsed, durationMs)
        onProgress?.(current, durationMs)
      }
      
      lastUpdateTime = now
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }
  
  
  // Simplified duration fetching
  const getWaitDuration = (waitTime: number) => waitTime * 1000
  
  const getAudioDurationFromId = async (audioId: string) => {
    try {
      const audioBlob = await fetchAudioBlob(audioId)
      return await getAudioDuration(audioBlob)
    } catch (e) {
      console.error('Failed to fetch audio duration:', e)
      return null
    }
  }
  
  const getMainAudioDuration = async (speed: number) => {
    try {
      const meta = await onGetAudioMetadata(storyId, speed)
      return await getAudioDurationFromId(meta.audio_id)
    } catch (e) {
      console.error('Failed to fetch main audio duration:', e)
      return null
    }
  }
  
  // Helper to get audio duration from blob
  const getAudioDuration = (audioBlob: Blob): Promise<number> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(audioBlob)
      const tempAudio = new Audio(url)
      
      tempAudio.onloadedmetadata = () => {
        const duration = tempAudio.duration * 1000
        URL.revokeObjectURL(url)
        resolve(duration)
      }
      
      tempAudio.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load audio'))
      }
    })
  }
  
  // Simplified progress tracking
  const clearProgress = () => setProgress(null)
  
  const playAudioBlob = (blob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      
      // Clean up previous audio if exists
      if (playAbortRef.current?.currentAudio) {
        try {
          playAbortRef.current.currentAudio.pause()
          playAbortRef.current.currentAudio = undefined
        } catch {}
      }
      
      audio.onloadedmetadata = () => {
        if (playAbortRef.current?.aborted) return
        const durationMs = audio.duration * 1000
        setProgress({ current: 0, total: durationMs })
      }
      
      audio.ontimeupdate = () => {
        if (playAbortRef.current?.aborted) return
        if (audio.duration) {
          const current = audio.currentTime * 1000
          const total = audio.duration * 1000
          setProgress({ current, total })
        }
      }
      
      audio.onended = () => { 
        if (playAbortRef.current?.aborted) return
        setProgress(null)
        URL.revokeObjectURL(url)
        resolve() 
      }
      audio.onerror = () => { 
        setProgress(null)
        URL.revokeObjectURL(url)
        reject(new Error('Audio playback error')) 
      }
      playAbortRef.current = { aborted: false, currentAudio: audio }
      audio.play().catch(err => { 
        setProgress(null)
        URL.revokeObjectURL(url)
        reject(err) 
      })
    })
  }
  
  const stopPlayback = () => {
    resetPlayerState(true) // Reset to first element
    
    // Force refresh by incrementing the trigger to re-fetch duration
    setRefreshTrigger(prev => prev + 1)
  }
  
  const playSequence = async () => {
    if (!storyId) { onPlayError('No story loaded'); return }
    if (isPlaying) return
    onPlayError(null)
    setIsPlaying(true)
    setPaused(false)
    playAbortRef.current = { aborted: false }
    try {
      const startIndex = activeIndex !== null ? activeIndex : 0
      for (let idx = startIndex; idx < configSequence.length; idx++) {
        const step = configSequence[idx]
        if (playAbortRef.current?.aborted) break
        
        // Set active index
        setActiveIndex(idx)
        
        // Check if aborted before proceeding
        if (playAbortRef.current?.aborted) break
        
        const hasWait = Object.prototype.hasOwnProperty.call(step, 'wait')
        const hasSpeed = Object.prototype.hasOwnProperty.call(step, 'speed')
        if (hasWait && !hasSpeed) {
          const ms = Math.max(0, Math.round((step.wait || 0) * 1000))
          setProgress({ current: 0, total: ms })
          
          await waitWithPause(ms, (current, total) => {
            setProgress({ current, total })
          })
          
          clearProgress()
          continue
        }
        if (!hasWait && hasSpeed) {
          const speed = step.speed || 100
          const meta = await onGetAudioMetadata(storyId, speed)
          if (playAbortRef.current?.aborted) break
          const blob = await fetchAudioBlob(meta.audio_id)
          if (playAbortRef.current?.aborted) break
          await playAudioBlob(blob)
          continue
        }
        if (hasWait && hasSpeed) {
          if (playAbortRef.current?.aborted) break
          const speed = step.speed || 100
          const gapMs = Math.max(0, Math.round((step.wait || 0) * 1000))
          const payload = await onGetSentenceMetadata(storyId, speed)
          if (playAbortRef.current?.aborted) break
          const list = payload || []
          setSentenceChunks(list)
          
          // Determine starting point based on current sub-element
          let startChunkIndex = 0
          let startFromGap = false
          
          if (currentSubElement && currentSubElement.type === 'audio') {
            startChunkIndex = currentSubElement.index
          } else if (currentSubElement && currentSubElement.type === 'gap') {
            startChunkIndex = currentSubElement.index
            startFromGap = true
          }
          
          // Handle starting from a gap
          if (startFromGap && startChunkIndex < list.length - 1) {
            // Calculate remaining time if we were paused mid-gap
            const remainingTime = currentSubElement?.progress 
              ? Math.max(0, gapMs - (currentSubElement.progress.current || 0))
              : gapMs
            
            setCurrentSubElement({ type: 'gap', index: startChunkIndex, progress: { current: gapMs - remainingTime, total: gapMs } })
            
            // Clear any previous audio since we're now in a gap
            if (playAbortRef.current) {
              playAbortRef.current.currentAudio = undefined
            }
            
            await waitWithPause(remainingTime, (current, total) => {
              if (!playAbortRef.current?.aborted) {
                setCurrentSubElement(prev => prev ? { ...prev, progress: { current: gapMs - remainingTime + current, total: gapMs } } : null)
              }
            })
            
            // Check if aborted after gap completion BEFORE clearing sub-element
            if (playAbortRef.current?.aborted) break
            
            setCurrentSubElement(null)
            
            // After playing the gap, start from the next audio chunk
            startChunkIndex = startChunkIndex + 1
          }
          
          // Check if aborted before starting the audio chunks loop
          if (playAbortRef.current?.aborted) break
          
          for (let chunkIndex = startChunkIndex; chunkIndex < list.length; chunkIndex++) {
            const item = list[chunkIndex]
            if (playAbortRef.current?.aborted) break
            
            // Set current sub-element to audio chunk
            setCurrentSubElement({ type: 'audio', index: chunkIndex })
            
            const blob = await fetchAudioBlob(item.audio_id)
            if (playAbortRef.current?.aborted) break
            await playAudioBlob(blob)
            if (playAbortRef.current?.aborted) break
            
            // Only add gap if not the last chunk
            if (chunkIndex < list.length - 1 && gapMs > 0) {
            // Set current sub-element to gap
            setCurrentSubElement({ type: 'gap', index: chunkIndex, progress: { current: 0, total: gapMs } })
            
            // Clear any previous audio since we're now in a gap
            if (playAbortRef.current) {
              playAbortRef.current.currentAudio = undefined
            }
            
            await waitWithPause(gapMs, (current, total) => {
              if (!playAbortRef.current?.aborted) {
                setCurrentSubElement(prev => prev ? { ...prev, progress: { current, total } } : null)
              }
            })
            }
          }
          
          // Check if aborted after sentence completion BEFORE clearing sub-element
          if (playAbortRef.current?.aborted) break
          
          // Clear sub-element when done
          setCurrentSubElement(null)
          
          continue
        }
      }
    } catch (e) {
      if (!playAbortRef.current?.aborted) onPlayError((e as any)?.message || 'Playback failed')
    } finally {
      clearProgress()
      setIsPlaying(false)
      setPaused(false)
      // Only reset activeIndex if sequence completed normally (not aborted)
      if (!playAbortRef.current?.aborted) {
        setActiveIndex(0)
        setCurrentSubElement(null)
        setSentenceChunks([])
      }
      playAbortRef.current = null
    }
  }

  const handleElementSelect = async (index: number) => {
    // Always clear progress and stop playing first, regardless of playing state
    setProgress(null)
    
    if (isPlaying) {
      // If currently playing, stop playback completely
      if (playAbortRef.current) {
        playAbortRef.current.aborted = true
        try { 
          playAbortRef.current.currentAudio?.pause()
          playAbortRef.current.currentAudio = undefined
        } catch {}
      }
      setIsPlaying(false)
      setPaused(false)
    }
    
    // Select the new element and reset everything
    setActiveIndex(index)
    setCurrentSubElement(null)
    
    // Only clear duration if selecting a different element to avoid 1000ms flash
    if (activeIndex !== index) {
      setSelectedSubElementDuration(null)
    }
    
    setSentenceChunks([])
    // Duration caching is now handled by durationCache Map
    
    // Force clear progress again to ensure it's definitely null
    setProgress(null)
    
    // Use unified duration fetching function
    await fetchElementDuration(index)
  }

  const handleSubElementSelect = async (type: 'audio' | 'gap', index: number) => {
    if (isPlaying) {
      // If currently playing, stop playback but keep the current main element active
      if (playAbortRef.current) {
        playAbortRef.current.aborted = true
        try { 
          playAbortRef.current.currentAudio?.pause()
          playAbortRef.current.currentAudio = undefined
        } catch {}
      }
      clearProgress()
      setIsPlaying(false)
      setPaused(false)
    }
    // Always reset progress when selecting a sub-element
    setProgress(null)
    setCurrentSubElement({ type, index })
    // Duration caching is now handled by durationCache Map
    
    // Create a unique key for this sub-element selection
    const subElementKey = `${storyId}-${activeIndex}-${type}-${index}`
    
    // Check duration cache first
    if (durationCache.current.has(subElementKey)) {
      const cachedDuration = durationCache.current.get(subElementKey)!
      setSelectedSubElementDuration(cachedDuration)
      return
    }
    
    // Fetch duration for progress bar display
    let duration: number | null = null
    
    if (type === 'audio' && sentenceChunks && sentenceChunks[index]) {
      duration = await getAudioDurationFromId(sentenceChunks[index].audio_id)
    } else if (type === 'gap' && activeIndex !== null) {
      const step = configSequence[activeIndex]
      duration = getWaitDuration(step.wait || 0)
    }
    
    if (duration !== null) {
      setSelectedSubElementDuration(duration)
      durationCache.current.set(subElementKey, duration)
    }
  }

  const handlePauseResume = () => {
    if (isPaused) {
      // Resume
      setPaused(false)
      if (playAbortRef.current?.currentAudio) {
        try { 
          playAbortRef.current.currentAudio.play().catch(err => {
            console.error('Failed to resume audio:', err)
          })
        } catch {}
      }
      // Note: For gaps and wait elements, the pause state is handled by the wait loops
      // No need to restart the sequence - it will continue from where it left off
    } else {
      // Pause
      setPaused(true)
      if (playAbortRef.current?.currentAudio) {
        try { playAbortRef.current.currentAudio.pause() } catch {}
      }
    }
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Player</div>
        <button
          onClick={isPlaying ? stopPlayback : playSequence}
          disabled={!storyId || configSequence.length === 0}
          style={{ 
            padding: '6px 10px', 
            borderRadius: 8, 
            border: '1px solid #e5e7eb', 
            background: '#f9fafb', 
            cursor: (!storyId || configSequence.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (!storyId || configSequence.length === 0) ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>{isPlaying ? '⏹' : '▶'}</span>
          <span>{isPlaying ? 'Stop' : 'Play'}</span>
        </button>
        <button
          onClick={isPlaying ? handlePauseResume : undefined}
          disabled={!isPlaying}
          style={{ 
            padding: '6px 10px', 
            borderRadius: 8, 
            border: '1px solid #e5e7eb', 
            background: isPlaying ? (isPaused ? '#f0f9ff' : '#f9fafb') : '#f3f4f6',
            cursor: isPlaying ? 'pointer' : 'not-allowed',
            opacity: isPlaying ? 1 : 0.6,
            color: isPlaying ? '#111827' : '#9ca3af',
            transition: 'all 0.2s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => {
            if (!isPlaying) {
              e.currentTarget.style.background = '#f3f4f6'
              e.currentTarget.style.borderColor = '#d1d5db'
            }
          }}
          onMouseLeave={(e) => {
            if (!isPlaying) {
              e.currentTarget.style.background = '#f3f4f6'
              e.currentTarget.style.borderColor = '#e5e7eb'
            }
          }}
        >
          <span>{isPlaying ? (isPaused ? '▶' : '⏸') : '⏸'}</span>
          <span>{isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Pause'}</span>
        </button>
        {playError && <span style={{ color: '#991b1b' }}>{playError}</span>}
      </div>
      <PlayerSequence 
        sequence={configSequence} 
        activeIndex={activeIndex}
        onElementSelect={handleElementSelect}
        isPlaying={isPlaying}
        isPaused={isPaused}
        progress={progress}
        currentSubElement={currentSubElement}
        sentenceChunks={sentenceChunks}
        onSubElementSelect={handleSubElementSelect}
        selectedSubElementDuration={selectedSubElementDuration}
      />
    </div>
  )
}
