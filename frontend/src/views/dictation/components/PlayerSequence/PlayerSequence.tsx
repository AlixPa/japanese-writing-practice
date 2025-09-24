import React from 'react'
import { ConfigStep, SubElement, AudioChunk } from '@/types/player'
import { SequenceElement } from './SequenceElement'
import { SubElementList } from './SubElementList'
import { ProgressBar } from '../ProgressBar'

interface PlayerSequenceProps {
  sequence: ConfigStep[]
  activeIndex: number | null
  onElementSelect?: (index: number) => void
  isPlaying?: boolean
  isPaused?: boolean
  progress?: { current: number; total: number } | null
  currentSubElement?: SubElement | null
  sentenceChunks?: AudioChunk[]
  onSubElementSelect?: (type: 'audio' | 'gap', index: number) => void
  selectedSubElementDuration?: number | null
}

export function PlayerSequence({ 
  sequence, 
  activeIndex, 
  onElementSelect, 
  isPlaying = false, 
  isPaused = false, 
  progress, 
  currentSubElement, 
  sentenceChunks = [], 
  onSubElementSelect, 
  selectedSubElementDuration 
}: PlayerSequenceProps) {
  if (!sequence || sequence.length === 0) {
    return (
      <div style={{ 
        color: '#6b7280', 
        textAlign: 'center',
        padding: '20px',
        fontSize: '14px'
      }}>
        No configuration selected.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sequence.map((step, idx) => {
        const isActive = activeIndex === idx
        
        return (
          <div key={idx}>
            <SequenceElement
              step={step}
              index={idx}
              isActive={isActive}
              isPlaying={isPlaying}
              isPaused={isPaused}
              onSelect={onElementSelect || (() => {})}
            />
            
            {/* Show sub-elements for active sentence-by-sentence element */}
            {isActive && sentenceChunks.length > 0 && (
              <SubElementList
                sentenceChunks={sentenceChunks}
                currentSubElement={currentSubElement}
                selectedSubElementDuration={selectedSubElementDuration}
                onSubElementSelect={onSubElementSelect || (() => {})}
                isPlaying={isPlaying}
                isPaused={isPaused}
                progress={progress}
              />
            )}
            
            {/* Progress bar for active element */}
            {isActive && progress && (
              <div style={{ marginTop: 8 }}>
                <ProgressBar
                  current={progress.current}
                  total={progress.total}
                  isPaused={isPaused}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
