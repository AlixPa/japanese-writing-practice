export type DictationBlockType = 'full' | 'sentence' | 'wait'

export interface DictationBlock {
  id: string
  type: DictationBlockType
  // Only used when type === 'wait'
  waitSeconds?: number
  // Only used when type === 'full'
  fullSpeed?: number // 0.7 for 70%, 1 for 100%
  // Only used when type === 'sentence'
  sentenceGapSeconds?: number
  sentenceSpeed?: number // 0.7 for 70%, 1 for 100%
}


