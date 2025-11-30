import React, { useState, useRef, useEffect } from 'react'
import { PlayerSequence } from './PlayerSequence'

interface PlayerProps {
  storyId: string
  configSequence: Array<{ wait?: number; speed?: number; repeat?: number }>
  onPlayError: (error: string | null) => void
  playError: string | null
  onGetAudioMetadata: (storyId: string, speed: number) => Promise<{ audio_text: string; audio_url: string }>
  onGetSentenceMetadata: (storyId: string, speed: number) => Promise<Array<{ audio_text: string; audio_url: string }>>
}

export function Player({ 
  storyId, 
  configSequence, 
  onPlayError, 
  playError, 
  onGetAudioMetadata, 
  onGetSentenceMetadata
}: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(0)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [currentSubElement, setCurrentSubElement] = useState<{ type: 'audio' | 'gap', index: number, progress?: { current: number; total: number } } | null>(null)
  const [sentenceChunks, setSentenceChunks] = useState<Array<{ audio_url: string }>>([])
  const [selectedSubElementDuration, setSelectedSubElementDuration] = useState<number | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [currentCycle, setCurrentCycle] = useState<{ chunkIndex: number; cycle: number; totalCycles: number } | null>(null)
  
  // Consolidated refs
  const playAbortRef = useRef<{ aborted: boolean; currentAudio?: HTMLAudioElement } | null>(null)
  const isPausedRef = useRef<boolean>(false)
  
  // Unified cache: stores both metadata and audio blob together
  // Key: `${storyId}-${speed}` for full audio
  // Value: { metadata: { audio_text, audio_url }, audioBlob: Blob }
  const audioCache = useRef<Map<string, { metadata: { audio_text: string; audio_url: string }; audioBlob: Blob }>>(new Map())
  
  // Sentence chunks cache: stores array of metadata + audio blobs
  // Key: `${storyId}-${speed}`
  // Value: Array<{ metadata: { audio_text, audio_url }, audioBlob: Blob }>
  const sentenceChunksCache = useRef<Map<string, Array<{ metadata: { audio_text: string; audio_url: string }; audioBlob: Blob }>>>(new Map())
  
  // Pending requests: tracks in-flight fetches to prevent duplicates
  const pendingAudioRequests = useRef<Map<string, Promise<{ metadata: { audio_text: string; audio_url: string }; audioBlob: Blob }>>>(new Map())
  const pendingSentenceRequests = useRef<Map<string, Promise<Array<{ metadata: { audio_text: string; audio_url: string }; audioBlob: Blob }>>>>(new Map())
  
  const currentStoryIdRef = useRef<string | null>(storyId)
  
  // Duration cache: selectionKey -> duration
  const durationCache = useRef<Map<string, number>>(new Map())
  
  // Track previous config to detect actual changes
  const prevConfigRef = useRef<Array<{ wait?: number; speed?: number }>>([])
  
  // Track if we're currently fetching to prevent race conditions
  const isFetchingRef = useRef<boolean>(false)

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
    setCurrentCycle(null)
  }

  // Unified duration fetching function
  const fetchElementDuration = async (index: number) => {
    if (!storyId || index === null) return
    if (index < 0 || index >= configSequence.length) return

    // Prevent concurrent fetches
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    try {
      const step = configSequence[index]
      const hasWait = Object.prototype.hasOwnProperty.call(step, 'wait')
      const hasSpeed = Object.prototype.hasOwnProperty.call(step, 'speed')
      
      // Create a unique key for this selection to avoid duplicate fetches
      const selectionKey = `${storyId}-${index}-${hasWait}-${hasSpeed}`
      
      // Check duration cache first
      if (durationCache.current.has(selectionKey)) {
        const cachedDuration = durationCache.current.get(selectionKey)!
        setSelectedSubElementDuration(cachedDuration)
        
        // For sentence-by-sentence, also restore sentenceChunks if cached
        if (hasWait && hasSpeed) {
          const speed = step.speed || 100
          const cacheKey = `${storyId}-${speed}`
          if (sentenceChunksCache.current.has(cacheKey)) {
            const chunks = sentenceChunksCache.current.get(cacheKey)!
            const list = chunks.map(chunk => ({ audio_url: chunk.metadata.audio_url }))
            setSentenceChunks(list)
            setCurrentSubElement({ type: 'audio', index: 0 })
          }
        }
        return
      }
      
      let duration: number | null = null
      
      if (hasWait && hasSpeed) {
        // Sentence-by-sentence element - set up default sub-element and fetch duration
        setCurrentSubElement({ type: 'audio', index: 0 })
        
        // Fetch sentence chunks from cache (or fetch if not cached)
        try {
          const speed = step.speed || 100
          const chunks = await getOrFetchSentenceChunks(speed)
          
          // Update sentenceChunks state with just metadata for display
          const list = chunks.map(chunk => ({ audio_url: chunk.metadata.audio_url }))
          setSentenceChunks(list)
          
          // Fetch duration for the first audio chunk (default selection)
          if (chunks.length > 0) {
            const defaultSubElementKey = `${storyId}-${index}-audio-0`
            
            // Check cache first
            if (durationCache.current.has(defaultSubElementKey)) {
              const cachedDuration = durationCache.current.get(defaultSubElementKey)!
              setSelectedSubElementDuration(cachedDuration)
            } else {
              // Get duration from cached blob
              const duration = await getAudioDurationFromBlob(chunks[0].audioBlob)
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
    } finally {
      isFetchingRef.current = false
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
    // Skip if currently fetching to avoid race conditions
    if (isFetchingRef.current) return
    
    const handleConfigChange = async () => {
      if (!storyId) return
      
      // Check if config actually changed (using current ref value)
      const configChanged = hasConfigChanged(configSequence)
      
      // Update ref after check to track the new state
      prevConfigRef.current = [...configSequence]
      
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
        // Fetch duration for the first element
        await fetchElementDuration(0)
      }
    }
    
    handleConfigChange()
  }, [configSequence, storyId])

  // Fetch duration for current element selection
  useEffect(() => {
    // Skip during playback - playSequence handles duration fetching internally
    if (isPlaying) return
    
    const fetchCurrentElementDuration = async () => {
      if (!storyId || activeIndex === null) return
      if (isFetchingRef.current) return // Prevent concurrent fetches
      
      // Only fetch if config hasn't changed (config change effect handles that case)
      const configChanged = hasConfigChanged(configSequence)
      if (!configChanged) {
        await fetchElementDuration(activeIndex)
      }
    }
    
    fetchCurrentElementDuration()
  }, [storyId, activeIndex, refreshTrigger, isPlaying])

  // Reset player state when storyId changes
  useEffect(() => {
    // Only reset if storyId actually changed to a different non-empty value
    // Don't reset if storyId is temporarily empty during fetches (both empty = no change)
    const prevStoryId = currentStoryIdRef.current
    if (prevStoryId === storyId) return
    if (!storyId && !prevStoryId) return // Both empty, no change
    
    // Only reset if changing from one valid storyId to another valid storyId
    // Don't reset when going from valid to empty (temporary state during fetches)
    const isChangingToNewStory = prevStoryId && storyId && prevStoryId !== storyId
    
    if (isChangingToNewStory) {
      // Clear caches when story actually changed
      audioCache.current.clear()
      sentenceChunksCache.current.clear()
      pendingAudioRequests.current.clear()
      pendingSentenceRequests.current.clear()
      durationCache.current.clear()
      
      // Reset player state only when changing to a new story
      resetPlayerState(true) // Reset to first element
      onPlayError(null)
    }
    
    // Always update the ref to track the current storyId
    currentStoryIdRef.current = storyId
  }, [storyId])


  // Unified cache helper: get or fetch full audio metadata + blob
  const getOrFetchAudio = async (speed: number): Promise<{ metadata: { audio_text: string; audio_url: string }; audioBlob: Blob }> => {
    const cacheKey = `${storyId}-${speed}`
    
    // Check cache first
    if (audioCache.current.has(cacheKey)) {
      return audioCache.current.get(cacheKey)!
    }
    
    // Check if there's already a pending request for this key
    if (pendingAudioRequests.current.has(cacheKey)) {
      return await pendingAudioRequests.current.get(cacheKey)!
    }
    
    // Start new fetch and store promise in pending requests
    const fetchPromise = (async () => {
      try {
        // Fetch metadata from backend
        const metadata = await onGetAudioMetadata(storyId, speed)
        
        // Fetch audio blob from S3
        const res = await fetch(metadata.audio_url)
        if (!res.ok) throw new Error('Failed to fetch audio from URL')
        const audioBlob = await res.blob()
        
        // Store in cache
        const cached = { metadata, audioBlob }
        audioCache.current.set(cacheKey, cached)
        
        return cached
      } finally {
        // Remove from pending requests when done (success or error)
        pendingAudioRequests.current.delete(cacheKey)
      }
    })()
    
    pendingAudioRequests.current.set(cacheKey, fetchPromise)
    return await fetchPromise
  }
  
  // Unified cache helper: get or fetch sentence chunks metadata + blobs
  const getOrFetchSentenceChunks = async (speed: number): Promise<Array<{ metadata: { audio_text: string; audio_url: string }; audioBlob: Blob }>> => {
    const cacheKey = `${storyId}-${speed}`
    
    // Check cache first
    if (sentenceChunksCache.current.has(cacheKey)) {
      return sentenceChunksCache.current.get(cacheKey)!
    }
    
    // Check if there's already a pending request for this key
    if (pendingSentenceRequests.current.has(cacheKey)) {
      return await pendingSentenceRequests.current.get(cacheKey)!
    }
    
    // Start new fetch and store promise in pending requests
    const fetchPromise = (async () => {
      try {
        // Fetch sentence metadata from backend
        const sentenceMetadata = await onGetSentenceMetadata(storyId, speed)
        
        // Fetch all audio blobs from S3 in parallel
        const chunks = await Promise.all(
          sentenceMetadata.map(async (meta) => {
            const res = await fetch(meta.audio_url)
            if (!res.ok) throw new Error('Failed to fetch audio from URL')
            const audioBlob = await res.blob()
            return { metadata: meta, audioBlob }
          })
        )
        
        // Store in cache
        sentenceChunksCache.current.set(cacheKey, chunks)
        
        return chunks
      } finally {
        // Remove from pending requests when done (success or error)
        pendingSentenceRequests.current.delete(cacheKey)
      }
    })()
    
    pendingSentenceRequests.current.set(cacheKey, fetchPromise)
    return await fetchPromise
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
  
  const getAudioDurationFromBlob = (audioBlob: Blob): Promise<number> => {
    return getAudioDuration(audioBlob)
  }
  
  const getMainAudioDuration = async (speed: number) => {
    try {
      const cached = await getOrFetchAudio(speed)
      return await getAudioDurationFromBlob(cached.audioBlob)
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
          const cached = await getOrFetchAudio(speed)
          if (playAbortRef.current?.aborted) break
          await playAudioBlob(cached.audioBlob)
          continue
        }
        if (hasWait && hasSpeed) {
          if (playAbortRef.current?.aborted) break
          const speed = step.speed || 100
          const gapMs = Math.max(0, Math.round((step.wait || 0) * 1000))
          const chunks = await getOrFetchSentenceChunks(speed)
          if (playAbortRef.current?.aborted) break
          
          // Update sentenceChunks state with just metadata for display
          const list = chunks.map(chunk => ({ audio_url: chunk.metadata.audio_url }))
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
            const repeats = step.repeat ?? 1
            
            // Repeat this chunk the specified number of times
            for (let rep = 0; rep < repeats; rep++) {
              if (playAbortRef.current?.aborted) break
              
              // Update cycle tracking
              setCurrentCycle({ chunkIndex, cycle: rep + 1, totalCycles: repeats })
              
              // Set current sub-element to audio chunk
              setCurrentSubElement({ type: 'audio', index: chunkIndex })
              
              // Use cached blob from chunks array
              const chunk = chunks[chunkIndex]
              if (playAbortRef.current?.aborted) break
              await playAudioBlob(chunk.audioBlob)
              if (playAbortRef.current?.aborted) break
              
              // Add gap after each repeat (except the last repeat of the last chunk)
              const isLastRepeat = rep === repeats - 1
              const isLastChunk = chunkIndex === list.length - 1
              const shouldAddGap = (!isLastRepeat || !isLastChunk) && gapMs > 0
              
              if (shouldAddGap) {
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
                
                // Check if aborted after gap completion BEFORE clearing sub-element
                if (playAbortRef.current?.aborted) break
                
                setCurrentSubElement(null)
              }
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
    setCurrentCycle(null)
    
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
    setCurrentCycle(null)
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
    
    if (type === 'audio' && activeIndex !== null) {
      const step = configSequence[activeIndex]
      const speed = step.speed || 100
      try {
        // Get cached chunks and use the blob for duration
        const chunks = await getOrFetchSentenceChunks(speed)
        if (chunks[index]) {
          duration = await getAudioDurationFromBlob(chunks[index].audioBlob)
        }
      } catch (e) {
        console.error('Failed to fetch audio duration:', e)
      }
    } else if (type === 'gap' && activeIndex !== null) {
      const step = configSequence[activeIndex]
      duration = getWaitDuration(step.wait || 0)
    }
    
    if (duration !== null) {
      setSelectedSubElementDuration(duration)
      durationCache.current.set(subElementKey, duration)
    }
  }

  const handlePlayPause = () => {
    if (!storyId || configSequence.length === 0) {
      onPlayError('No story loaded or no configuration')
      return
    }
    
    if (isPlaying) {
      if (isPaused) {
        // Resume playback
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
        // Pause playback
        setPaused(true)
        if (playAbortRef.current?.currentAudio) {
          try { playAbortRef.current.currentAudio.pause() } catch {}
        }
      }
    } else {
      // Start playing
      onPlayError(null)
      setIsPlaying(true)
      setPaused(false)
      playSequence()
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl p-3 md:p-4 bg-white">
      {playError && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-red-800 text-sm">{playError}</span>
        </div>
      )}
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
        onPlayPause={handlePlayPause}
        currentCycle={currentCycle}
      />
    </div>
  )
}
