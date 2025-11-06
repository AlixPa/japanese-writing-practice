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
  sentenceChunks?: Array<{ audio_url: string }>
  onSubElementSelect?: (type: 'audio' | 'gap', index: number) => void
  selectedSubElementDuration?: number | null
  onPlayPause?: () => void
  currentCycle?: { chunkIndex: number; cycle: number; totalCycles: number } | null
}

export function PlayerSequence({ sequence, activeIndex, onElementSelect, isPlaying, isPaused, progress, currentSubElement, sentenceChunks, onSubElementSelect, selectedSubElementDuration, onPlayPause, currentCycle }: Props) {
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
          subtitle = `Speed ${step.speed}% • Gap ${step.wait}s • Repeat ${repeats}x`
        }
        else { title = 'Unknown'; subtitle = '' }
        
        const isActive = activeIndex === idx
        
        // Simplified styling: active vs inactive
        const elementStyles = isActive ? {
          border: isPlaying ? (isPaused ? '2px solid #f59e0b' : '2px solid #3b82f6') : '2px solid #93c5fd',
          background: isPlaying ? (isPaused ? '#fffbeb' : '#eff6ff') : '#f0f9ff',
          transform: 'scale(1.01)',
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
                {isActive ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onPlayPause?.()
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none'
                    }}
                  >
                    <span style={{ 
                      ...iconStyles,
                      fontSize: '16px',
                      transition: 'all 0.2s ease-in-out'
                    }}>
                      {isPlaying ? (isPaused ? '▶' : '⏸') : '▶'}
                    </span>
                  </button>
                ) : (
                  <span style={{ 
                    ...iconStyles,
                    transition: 'all 0.2s ease-in-out'
                  }}>
                    ▰
                  </span>
                )}
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
                    const isSubElementActive = isCurrentAudio || isCurrentGap
                    
                    return (
                      <div key={chunkIndex} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* Grouped sub-element container */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation()
                            onSubElementSelect?.('audio', chunkIndex) // Always start from audio
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 8px',
                            borderRadius: 6,
                            background: isSubElementActive ? (isSubElementPaused ? '#fffbeb' : '#eff6ff') : '#f9fafb',
                            border: isSubElementActive ? (isSubElementPaused ? '1px solid #f59e0b' : '1px solid #3b82f6') : '1px solid #e5e7eb',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          {/* Cycle counter - show for active chunk or when playing */}
                          {(isSubElementActive || (currentCycle && currentCycle.chunkIndex === chunkIndex)) && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '32px',
                              height: '20px',
                              background: isSubElementPaused ? '#f59e0b' : '#3b82f6',
                              color: 'white',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              {currentCycle && currentCycle.chunkIndex === chunkIndex 
                                ? `${currentCycle.cycle} / ${currentCycle.totalCycles}`
                                : `1 / ${step.repeat ?? 1}`
                              }
                            </div>
                          )}
                          
                          {/* Content container */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            flex: 1
                          }}>
                          {/* Audio chunk (visual only) */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '2px 4px',
                            borderRadius: 3,
                            background: isCurrentAudio ? (isSubElementPaused ? '#fef3c7' : '#dbeafe') : 'transparent',
                            transition: 'all 0.2s ease-in-out'
                          }}>
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
                          
                          {/* Gap (visual only) */}
                          <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '2px 4px',
                              borderRadius: 3,
                              background: isCurrentGap ? (isSubElementPaused ? '#fef3c7' : '#dbeafe') : 'transparent',
                              transition: 'all 0.2s ease-in-out'
                            }}>
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
                          </div>
                        </div>
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


