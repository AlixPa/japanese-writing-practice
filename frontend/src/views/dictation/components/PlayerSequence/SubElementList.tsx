import React from 'react'
import { AudioChunk, SubElement } from '@/types/player'
import { ProgressBar } from '../ProgressBar'

interface SubElementListProps {
  sentenceChunks: AudioChunk[]
  currentSubElement: SubElement | null
  selectedSubElementDuration: number | null
  onSubElementSelect: (type: 'audio' | 'gap', index: number) => void
  isPlaying: boolean
  isPaused: boolean
  progress: { current: number; total: number } | null
}

export function SubElementList({
  sentenceChunks,
  currentSubElement,
  selectedSubElementDuration,
  onSubElementSelect,
  isPlaying,
  isPaused,
  progress
}: SubElementListProps) {
  if (!sentenceChunks || sentenceChunks.length === 0) {
    return null
  }

  return (
    <div style={{ marginTop: 8, paddingLeft: 16 }}>
      <div style={{ 
        fontSize: '12px', 
        color: '#6b7280', 
        marginBottom: 8,
        fontWeight: 500
      }}>
        Sub-elements:
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sentenceChunks.map((chunk, index) => {
          const isActive = currentSubElement?.type === 'audio' && currentSubElement?.index === index
          
          return (
            <div key={index}>
              <div
                onClick={() => onSubElementSelect('audio', index)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: isActive ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                  background: isActive ? '#eff6ff' : '#f9fafb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <div style={{ 
                  color: isActive ? '#3b82f6' : '#9ca3af',
                  fontSize: '12px'
                }}>
                  🎵
                </div>
                <div style={{ 
                  flex: 1,
                  fontSize: '12px',
                  color: isActive ? '#111827' : '#6b7280'
                }}>
                  Audio {index + 1}
                </div>
                {isActive && selectedSubElementDuration && (
                  <div style={{ 
                    fontSize: '11px',
                    color: '#6b7280'
                  }}>
                    {Math.round(selectedSubElementDuration / 1000)}s
                  </div>
                )}
              </div>
              
              {/* Progress bar for active sub-element */}
              {isActive && progress && (
                <div style={{ marginTop: 4 }}>
                  <ProgressBar
                    current={progress.current}
                    total={progress.total}
                    isPaused={isPaused}
                  />
                </div>
              )}
              
              {/* Gap between sentences */}
              {index < sentenceChunks.length - 1 && (
                <div
                  onClick={() => onSubElementSelect('gap', index)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: '#f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 4
                  }}
                >
                  <div style={{ 
                    color: '#9ca3af',
                    fontSize: '12px'
                  }}>
                    ⏱️
                  </div>
                  <div style={{ 
                    fontSize: '11px',
                    color: '#6b7280'
                  }}>
                    Gap
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
