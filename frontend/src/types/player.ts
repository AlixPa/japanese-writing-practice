// Player Types
export interface PlayerState {
  isPlaying: boolean
  isPaused: boolean
  activeIndex: number | null
  progress: { current: number; total: number } | null
  currentSubElement: SubElement | null
  sentenceChunks: AudioChunk[]
  selectedSubElementDuration: number | null
  refreshTrigger: number
}

export interface SubElement {
  type: 'audio' | 'gap'
  index: number
  progress?: { current: number; total: number }
}

export interface AudioChunk {
  audio_id: string
}

export interface ConfigStep {
  wait?: number
  speed?: number
}

export interface PlayerProps {
  storyId: string
  configSequence: ConfigStep[]
  onPlayError: (error: string | null) => void
  playError: string | null
  onGetAudioMetadata: (storyId: string, speed: number) => Promise<{ audio_id: string }>
  onGetSentenceMetadata: (storyId: string, speed: number) => Promise<AudioChunk[]>
  onGetAudioBlob: (audioId: string) => Promise<Blob>
}

// Audio Types
export interface AudioMetadata {
  audio_id: string
}

export interface AudioPlaybackRef {
  aborted: boolean
  currentAudio?: HTMLAudioElement
}

// Cache Types
export interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
}

// Element Types
export interface ElementType {
  hasWait: boolean
  hasSpeed: boolean
  step: ConfigStep
}

export type ElementTypeName = 'wait' | 'full-dictation' | 'sentence-by-sentence'

// Service Types
export interface AudioService {
  getAudioMetadata: (storyId: string, speed: number) => Promise<AudioMetadata>
  getSentenceMetadata: (storyId: string, speed: number) => Promise<AudioChunk[]>
  getAudioBlob: (audioId: string) => Promise<Blob>
}

export interface DurationService {
  getMainAudioDuration: (speed: number) => Promise<number>
  getWaitDuration: (wait: number) => number
  getAudioDurationFromId: (audioId: string) => Promise<number>
}

export interface ConfigService {
  hasConfigChanged: (current: ConfigStep[], previous: ConfigStep[]) => boolean
  getElementType: (step: ConfigStep) => ElementType
  getElementTypeName: (elementType: ElementType) => ElementTypeName
}
