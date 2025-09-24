import React, { useEffect, useRef } from 'react'
import { PlayerProps, ConfigStep } from '@/types/player'
import { usePlayerState } from '@/hooks/usePlayerState'
import { useAudioPlayback } from '@/hooks/useAudioPlayback'
import { usePlayerCache } from '@/hooks/usePlayerCache'
import { usePlayerControls } from '@/hooks/usePlayerControls'
import { createAudioService } from '@/services/AudioService'
import { createDurationService } from '@/services/DurationService'
import { createConfigService } from '@/services/ConfigService'
import { hasConfigChanged } from '@/utils/playerUtils'
import { PlayerControls } from './PlayerControls'
import { PlayerSequence } from './PlayerSequence/PlayerSequence'

export function Player({ 
  storyId, 
  configSequence, 
  onPlayError, 
  playError, 
  onGetAudioMetadata, 
  onGetSentenceMetadata,
  onGetAudioBlob
}: PlayerProps) {
  // Initialize hooks
  const { state, setters, helpers, refs } = usePlayerState()
  const { createAudioWithBlob, playAudio, abortPlayback } = useAudioPlayback()
  const { audio, duration } = usePlayerCache()
  
  // Track previous config to detect changes
  const prevConfigRef = useRef<ConfigStep[]>([])
  
  // Initialize services
  const audioService = createAudioService(onGetAudioMetadata, onGetSentenceMetadata, onGetAudioBlob)
  const durationService = createDurationService(
    async (speed: number) => {
      const metadata = await audioService.getAudioMetadata(storyId, speed)
      const blob = await audioService.getAudioBlob(metadata.audio_id)
      const audio = createAudioWithBlob(blob)
      return new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          resolve(audio.duration * 1000) // convert to ms
        })
      })
    },
    async (audioId: string) => {
      const blob = await audioService.getAudioBlob(audioId)
      const audio = createAudioWithBlob(blob)
      return new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          resolve(audio.duration * 1000) // convert to ms
        })
      })
    }
  )
  const configService = createConfigService()

  // Initialize controls
  const controls = usePlayerControls({
    state,
    onPlayError,
    onGetAudioMetadata: audioService.getAudioMetadata,
    onGetSentenceMetadata: audioService.getSentenceMetadata,
    onGetAudioBlob: audioService.getAudioBlob,
    onGetAudioDurationFromId: durationService.getAudioDurationFromId,
    onGetMainAudioDuration: durationService.getMainAudioDuration,
    onSetCurrentSubElement: setters.setCurrentSubElement,
    onSetSentenceChunks: setters.setSentenceChunks,
    onSetSelectedSubElementDuration: setters.setSelectedSubElementDuration,
    onSetProgress: setters.setProgress,
    onSetIsPlaying: setters.setIsPlaying,
    onSetPaused: setters.setPaused,
    onSetActiveIndex: setters.setActiveIndex,
    onClearProgress: helpers.clearProgress,
    onTriggerRefresh: helpers.triggerRefresh,
    onAbortPlayback: abortPlayback,
    onPlayAudio: playAudio,
    onCreateAudioWithBlob: createAudioWithBlob,
    onGetAudioFromCache: audio.get,
    onSetAudioInCache: audio.set,
    onGetDurationFromCache: duration.get,
    onSetDurationInCache: duration.set
  })

  // Handle config changes
  useEffect(() => {
    if (hasConfigChanged(configSequence, prevConfigRef.current)) {
      if (state.isPlaying) {
        abortPlayback()
        helpers.resetState(true)
      } else {
        helpers.resetState(true)
      }
      prevConfigRef.current = [...configSequence]
    }
  }, [configSequence, state.isPlaying, abortPlayback, helpers])

  // Handle story changes
  useEffect(() => {
    if (storyId !== refs.currentStoryIdRef.current) {
      helpers.resetState(true)
      helpers.updateStoryId(storyId)
    }
  }, [storyId, helpers, refs.currentStoryIdRef])

  // Fetch duration for current element
  useEffect(() => {
    if (storyId && state.activeIndex !== null) {
      controls.fetchElementDuration(storyId, state.activeIndex, configSequence)
    }
  }, [storyId, state.activeIndex, state.refreshTrigger, configSequence, controls])

  // Handle element selection
  const handleElementSelect = async (index: number) => {
    await controls.handleElementSelect(index, storyId, configSequence)
  }

  // Handle sub-element selection
  const handleSubElementSelect = async (type: 'audio' | 'gap', index: number) => {
    await controls.handleSubElementSelect(type, index, storyId, state.activeIndex)
  }

  // Handle play
  const handlePlay = async () => {
    if (state.activeIndex !== null) {
      await controls.playSequence(storyId, configSequence, state.activeIndex)
    }
  }

  // Handle stop
  const handleStop = () => {
    controls.stopPlayback()
  }

  // Handle pause/resume
  const handlePauseResume = () => {
    controls.handlePauseResume()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PlayerControls
        isPlaying={state.isPlaying}
        isPaused={state.isPaused}
        onPlay={handlePlay}
        onStop={handleStop}
        onPauseResume={handlePauseResume}
        playError={playError}
      />
      
      <PlayerSequence 
        sequence={configSequence} 
        activeIndex={state.activeIndex}
        onElementSelect={handleElementSelect}
        isPlaying={state.isPlaying}
        isPaused={state.isPaused}
        progress={state.progress}
        currentSubElement={state.currentSubElement}
        sentenceChunks={state.sentenceChunks}
        onSubElementSelect={handleSubElementSelect}
        selectedSubElementDuration={state.selectedSubElementDuration}
      />
    </div>
  )
}