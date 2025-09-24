import { ConfigStep, ElementType, ElementTypeName } from '@/types/player'

// Time utilities
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const formatTimeFromMs = (ms: number): string => {
  return formatTime(Math.round(ms / 1000))
}

// Element type detection
export const getElementType = (step: ConfigStep): ElementType => {
  const hasWait = Object.prototype.hasOwnProperty.call(step, 'wait')
  const hasSpeed = Object.prototype.hasOwnProperty.call(step, 'speed')
  return { hasWait, hasSpeed, step }
}

export const getElementTypeName = (elementType: ElementType): ElementTypeName => {
  const { hasWait, hasSpeed } = elementType
  if (hasWait && !hasSpeed) return 'wait'
  if (!hasWait && hasSpeed) return 'full-dictation'
  if (hasWait && hasSpeed) return 'sentence-by-sentence'
  return 'wait' // fallback
}

// Config comparison
export const hasConfigChanged = (current: ConfigStep[], previous: ConfigStep[]): boolean => {
  if (previous.length !== current.length) return true
  
  return previous.some((prevStep, index) => {
    const currentStep = current[index]
    return prevStep.wait !== currentStep.wait || prevStep.speed !== currentStep.speed
  })
}

// Cache key generation
export const generateSelectionKey = (storyId: string, index: number, hasWait: boolean, hasSpeed: boolean): string => {
  return `${storyId}-${index}-${hasWait}-${hasSpeed}`
}

export const generateSubElementKey = (storyId: string, index: number, type: string, subIndex: number): string => {
  return `${storyId}-${index}-${type}-${subIndex}`
}

// Duration calculations
export const getWaitDuration = (wait: number): number => {
  return wait * 1000 // convert seconds to milliseconds
}

// Progress calculations
export const calculateProgressPercentage = (current: number, total: number): number => {
  return total > 0 ? (current / total) * 100 : 0
}

// Audio utilities
export const createAudioElement = (): HTMLAudioElement => {
  return new Audio()
}

export const createObjectURL = (blob: Blob): string => {
  return URL.createObjectURL(blob)
}

export const revokeObjectURL = (url: string): void => {
  URL.revokeObjectURL(url)
}
