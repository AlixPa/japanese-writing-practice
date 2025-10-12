import React from 'react'
import { ProgressBar } from './ProgressBar'

interface Props {
  sequence: Array<{ wait?: number; speed?: number; repeat?: number }>
  activeIndex: number | null
  onElementSelect?: (index: number) => void
  isPlaying?: boolean
  isPaused?: boolean
  progress?: { current: number; total: number } | null
  currentSubElement?: { type: 'audio' | 'gap', index: number, progress?: { current: number; total: number } } | null
  sentenceChunks?: Array<{ audio_id: string }>
  onSubElementSelect?: (type: 'audio' | 'gap', index: number) => void
  selectedSubElementDuration?: number | null
}

export function PlayerSequence({ sequence, activeIndex, onElementSelect, isPlaying, isPaused, progress, currentSubElement, sentenceChunks, onSubElementSelect, selectedSubElementDuration }: Props) {
  if (!sequence || sequence.length === 0) {
    return <div style={{ color: '#6b7280' }}>No configuration selected.</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sequence.map((step, idx) => {
        const hasWait = Object.prototype.hasOwnProperty.call(step, 'wait')
        const hasSpeed = Object.prototype.hasOwnProperty.call(step, 'speed')
        let title = ''
        let subtitle = ''
        if (hasWait && !hasSpeed) { title = 'Wait'; subtitle = `${step.wait}s` }
        else if (!hasWait && hasSpeed) { title = 'Full dictation'; subtitle = `Speed ${step.speed}%` }
        else if (hasWait && hasSpeed) { 
          title = 'Sentence-by-sentence'
          const repeats = step.repeat ?? 1
          subtitle = `Speed ${step.speed}% • Gap ${step.wait}s${repeats > 1 ? ` • Repeat ${repeats}x` : ''}`
        }
        else { title = 'Unknown'; subtitle = '' }
        
        const isActive = activeIndex === idx
        
        // Simplified styling: active vs inactive
        const elementStyles = isActive ? {
          border: isPlaying ? (isPaused ? '2px solid #f59e0b' : '2px solid #3b82f6') : '2px solid #93c5fd',
          background: isPlaying ? (isPaused ? '#fffbeb' : '#eff6ff') : '#f0f9ff',
          transform: isPlaying ? 'scale(1.02)' : 'scale(1.01)',
          boxShadow: isPlaying ? (isPaused ? '0 4px 12px rgba(245, 158, 11, 0.15)' : '0 4px 12px rgba(59, 130, 246, 0.15)') : '0 2px 8px rgba(147, 197, 253, 0.1)',
          cursor: 'pointer'
        } : {
          border: '1px solid #e5e7eb',
          background: isPlaying ? '#f8fafc' : '#fafafa',
          transform: 'scale(1)',
          boxShadow: 'none',
          cursor: 'pointer'
        }

        const iconStyles = isActive ? {
          color: isPlaying ? (isPaused ? '#f59e0b' : '#1d4ed8') : '#60a5fa',
          fontSize: isPlaying ? '16px' : '14px'
        } : {
          color: '#6b7280',
          fontSize: '14px'
        }

        const textStyles = isActive ? {
          titleColor: isPlaying ? (isPaused ? '#92400e' : '#1e40af') : '#1e40af',
          subtitleColor: isPlaying ? (isPaused ? '#f59e0b' : '#3b82f6') : '#93c5fd'
        } : {
          titleColor: '#111827',
          subtitleColor: '#6b7280'
        }
        
        return (
          <div 
            key={idx} 
            onClick={() => onElementSelect?.(idx)}
            style={{
              display: 'flex', 
              flexDirection: 'column',
              padding: '8px 10px', 
              borderRadius: 10,
              transition: 'all 0.2s ease-in-out',
              ...elementStyles
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ 
                  ...iconStyles,
                  transition: 'all 0.2s ease-in-out'
                }}>
                  ▰
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <strong style={{ 
                    color: textStyles.titleColor,
                    transition: 'color 0.2s ease-in-out'
                  }}>{title}</strong>
                  {subtitle && <span style={{ 
                    color: textStyles.subtitleColor,
                    transition: 'color 0.2s ease-in-out'
                  }}>{subtitle}</span>}
                </div>
              </div>
              <div style={{ width: 24 }} />
            </div>
            
            {/* Progress bar for main elements when active */}
            {isActive && !(hasWait && hasSpeed) && (
              <div style={{ marginTop: 8 }}>
                <ProgressBar 
                  current={progress ? progress.current : 0} 
                  total={progress ? progress.total : (selectedSubElementDuration || 1000)} 
                  isPaused={isPaused} 
                />
              </div>
            )}
            
            {/* Sub-elements for sentence-by-sentence blocks */}
            {isActive && hasWait && hasSpeed && (
              <div style={{ marginTop: 8, padding: '8px', background: 'rgba(0, 0, 0, 0.02)', borderRadius: 6 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {sentenceChunks && sentenceChunks.length > 0 ? sentenceChunks.map((_, chunkIndex) => {
                    const isCurrentAudio = currentSubElement?.type === 'audio' && currentSubElement.index === chunkIndex
                    const isCurrentGap = currentSubElement?.type === 'gap' && currentSubElement.index === chunkIndex
                    const isSubElementPaused = isPlaying && isPaused
                    
                    return (
                      <div key={chunkIndex} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* Audio chunk */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation()
                            onSubElementSelect?.('audio', chunkIndex)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 6px',
                            borderRadius: 4,
                            background: isCurrentAudio ? (isSubElementPaused ? '#fffbeb' : '#eff6ff') : '#f9fafb',
                            border: isCurrentAudio ? (isSubElementPaused ? '1px solid #f59e0b' : '1px solid #3b82f6') : '1px solid #e5e7eb',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          <span style={{ color: isCurrentAudio ? (isSubElementPaused ? '#f59e0b' : '#1d4ed8') : '#6b7280' }}>
                            ▰
                          </span>
                          <span style={{ color: isCurrentAudio ? (isSubElementPaused ? '#92400e' : '#1e40af') : '#374151' }}>
                            Audio chunk {chunkIndex + 1}
                          </span>
                          {isCurrentAudio && (
                            <div style={{ flex: 1, marginLeft: 8 }}>
                              <ProgressBar 
                                current={isPlaying && progress ? progress.current : 0} 
                                total={isPlaying && progress ? progress.total : (selectedSubElementDuration || 1000)} 
                                isPaused={isPaused} 
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Gap (if not last chunk) */}
                        {chunkIndex < sentenceChunks.length - 1 && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation()
                              onSubElementSelect?.('gap', chunkIndex)
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 6px',
                              borderRadius: 4,
                            background: isCurrentGap ? (isSubElementPaused ? '#fffbeb' : '#eff6ff') : '#f9fafb',
                            border: isCurrentGap ? (isSubElementPaused ? '1px solid #f59e0b' : '1px solid #3b82f6') : '1px solid #e5e7eb',
                              fontSize: '11px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease-in-out'
                            }}
                          >
                            <span style={{ color: isCurrentGap ? (isSubElementPaused ? '#f59e0b' : '#1d4ed8') : '#6b7280' }}>
                              ▰
                            </span>
                            <span style={{ color: isCurrentGap ? (isSubElementPaused ? '#92400e' : '#1e40af') : '#374151' }}>
                              Gap {step.wait}s
                            </span>
                            {isCurrentGap && (
                              <div style={{ flex: 1, marginLeft: 8 }}>
                                <ProgressBar 
                                  current={isPlaying && currentSubElement?.progress ? currentSubElement.progress.current : 0} 
                                  total={isPlaying && currentSubElement?.progress ? currentSubElement.progress.total : (selectedSubElementDuration || 1000)} 
                                  isPaused={isPaused} 
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  }) : (
                    <div style={{ 
                      padding: '8px', 
                      textAlign: 'center', 
                      color: '#6b7280', 
                      fontSize: '12px',
                      fontStyle: 'italic'
                    }}>
                      Loading sub-elements...
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </div>
        )
      })}
    </div>
  )
}


