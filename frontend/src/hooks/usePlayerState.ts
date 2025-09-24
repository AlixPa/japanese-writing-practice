import { useState, useRef } from 'react'
import { PlayerState, SubElement, AudioChunk } from '@/types/player'

export function usePlayerState() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(0)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [currentSubElement, setCurrentSubElement] = useState<SubElement | null>(null)
  const [sentenceChunks, setSentenceChunks] = useState<AudioChunk[]>([])
  const [selectedSubElementDuration, setSelectedSubElementDuration] = useState<number | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

  // Refs for tracking state
  const isPausedRef = useRef<boolean>(false)
  const currentStoryIdRef = useRef<string | null>(null)

  // Helper function for pause state
  const setPaused = (paused: boolean) => {
    setIsPaused(paused)
    isPausedRef.current = paused
  }

  // Reset all state
  const resetState = (resetToFirst = false) => {
    setIsPlaying(false)
    setPaused(false)
    if (resetToFirst) {
      setActiveIndex(0)
    }
    setCurrentSubElement(null)
    setSentenceChunks([])
    setSelectedSubElementDuration(null)
    setProgress(null)
  }

  // Clear progress
  const clearProgress = () => {
    setProgress(null)
  }

  // Force refresh
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Update story ID
  const updateStoryId = (storyId: string) => {
    currentStoryIdRef.current = storyId
  }

  const state: PlayerState = {
    isPlaying,
    isPaused,
    activeIndex,
    progress,
    currentSubElement,
    sentenceChunks,
    selectedSubElementDuration,
    refreshTrigger
  }

  return {
    state,
    setters: {
      setIsPlaying,
      setPaused,
      setActiveIndex,
      setProgress,
      setCurrentSubElement,
      setSentenceChunks,
      setSelectedSubElementDuration,
      setRefreshTrigger
    },
    helpers: {
      resetState,
      clearProgress,
      triggerRefresh,
      updateStoryId
    },
    refs: {
      isPausedRef,
      currentStoryIdRef
    }
  }
}
