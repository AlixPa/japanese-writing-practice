import { useRef, useCallback } from 'react'
import { AudioPlaybackRef, AudioChunk } from '@/types/player'
import { createAudioElement, createObjectURL, revokeObjectURL } from '@/utils/playerUtils'

export function useAudioPlayback() {
  const playAbortRef = useRef<AudioPlaybackRef | null>(null)

  // Create audio element with blob
  const createAudioWithBlob = useCallback((blob: Blob): HTMLAudioElement => {
    const audio = createAudioElement()
    const url = createObjectURL(blob)
    audio.src = url
    
    // Clean up URL when audio is done
    audio.addEventListener('ended', () => {
      revokeObjectURL(url)
    })
    
    return audio
  }, [])

  // Play audio with abort control
  const playAudio = useCallback(async (
    audio: HTMLAudioElement,
    onTimeUpdate: (currentTime: number) => void,
    onEnded: () => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Set up abort control
      const abortController = { aborted: false, currentAudio: audio }
      playAbortRef.current = abortController

      // Set up event listeners
      const handleTimeUpdate = () => {
        if (abortController.aborted) return
        onTimeUpdate(audio.currentTime * 1000) // convert to ms
      }

      const handleEnded = () => {
        if (abortController.aborted) return
        onEnded()
        resolve()
      }

      const handleError = () => {
        if (abortController.aborted) return
        reject(new Error('Audio playback failed'))
      }

      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('error', handleError)

      // Start playback
      audio.play().catch(reject)

      // Cleanup function
      const cleanup = () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('error', handleError)
        if (playAbortRef.current === abortController) {
          playAbortRef.current = null
        }
      }

      // Store cleanup function for external use
      ;(abortController as any).cleanup = cleanup
    })
  }, [])

  // Abort current playback
  const abortPlayback = useCallback(() => {
    if (playAbortRef.current) {
      playAbortRef.current.aborted = true
      try {
        playAbortRef.current.currentAudio?.pause()
        playAbortRef.current.currentAudio = undefined
        // Call cleanup if available
        if ((playAbortRef.current as any).cleanup) {
          (playAbortRef.current as any).cleanup()
        }
      } catch (error) {
        console.warn('Error aborting playback:', error)
      }
      playAbortRef.current = null
    }
  }, [])

  // Check if currently playing
  const isCurrentlyPlaying = useCallback((): boolean => {
    return playAbortRef.current !== null && !playAbortRef.current.aborted
  }, [])

  // Get current audio element
  const getCurrentAudio = useCallback((): HTMLAudioElement | undefined => {
    return playAbortRef.current?.currentAudio
  }, [])

  return {
    createAudioWithBlob,
    playAudio,
    abortPlayback,
    isCurrentlyPlaying,
    getCurrentAudio,
    playAbortRef
  }
}
