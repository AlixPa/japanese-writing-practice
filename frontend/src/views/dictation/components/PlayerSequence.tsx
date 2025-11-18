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
    return <div className="text-gray-500 text-sm">No configuration selected.</div>
  }
  return (
    <div className="flex flex-col gap-2">
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
        
        // Build className strings for conditional styling
        const getElementClasses = () => {
          if (!isActive) {
            return `flex flex-col px-2.5 py-2 rounded-lg border border-gray-200 transition-all duration-200 cursor-pointer ${
              isPlaying ? 'bg-slate-50' : 'bg-gray-50'
            }`
          }
          // Active element
          if (isPlaying) {
            if (isPaused) {
              return 'flex flex-col px-2.5 py-2 rounded-lg border-2 border-amber-500 bg-amber-50 scale-[1.01] transition-all duration-200 cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.15)]'
            }
            return 'flex flex-col px-2.5 py-2 rounded-lg border-2 border-blue-500 bg-blue-50 scale-[1.01] transition-all duration-200 cursor-pointer shadow-[0_4px_12px_rgba(59,130,246,0.15)]'
          }
          return 'flex flex-col px-2.5 py-2 rounded-lg border-2 border-blue-300 bg-blue-50 scale-[1.01] transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(147,197,253,0.1)]'
        }

        const getIconClasses = () => {
          if (!isActive) {
            return 'text-gray-500 text-sm transition-all duration-200'
          }
          if (isPlaying) {
            if (isPaused) {
              return 'text-amber-500 text-base transition-all duration-200'
            }
            return 'text-blue-700 text-base transition-all duration-200'
          }
          return 'text-blue-400 text-sm transition-all duration-200'
        }

        const getTitleClasses = () => {
          if (!isActive) {
            return 'text-gray-900 transition-colors duration-200'
          }
          if (isPlaying) {
            if (isPaused) {
              return 'text-amber-800 transition-colors duration-200'
            }
            return 'text-blue-800 transition-colors duration-200'
          }
          return 'text-blue-800 transition-colors duration-200'
        }

        const getSubtitleClasses = () => {
          if (!isActive) {
            return 'text-gray-500 transition-colors duration-200'
          }
          if (isPlaying) {
            if (isPaused) {
              return 'text-amber-500 transition-colors duration-200'
            }
            return 'text-blue-500 transition-colors duration-200'
          }
          return 'text-blue-300 transition-colors duration-200'
        }
        
        return (
          <div 
            key={idx} 
            onClick={() => onElementSelect?.(idx)}
            className={getElementClasses()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onPlayPause?.()
                    }}
                    className="bg-transparent border-none cursor-pointer p-1 rounded transition-all duration-200 hover:bg-black/10 min-h-[44px] flex items-center justify-center"
                  >
                    <span className={`${getIconClasses()} text-base`}>
                      {isPlaying ? (isPaused ? '▶' : '⏸') : '▶'}
                    </span>
                  </button>
                ) : (
                  <span className={getIconClasses()}>
                    ▰
                  </span>
                )}
                <div className="flex items-baseline gap-2">
                  <strong className={getTitleClasses()}>{title}</strong>
                  {subtitle && <span className={`${getSubtitleClasses()} text-xs md:text-sm`}>{subtitle}</span>}
                </div>
              </div>
              <div className="w-6" />
            </div>
            
            {/* Progress bar for main elements when active */}
            {isActive && !(hasWait && hasSpeed) && (
              <div className="mt-2">
                <ProgressBar 
                  current={progress ? progress.current : 0} 
                  total={progress ? progress.total : (selectedSubElementDuration || 1000)} 
                  isPaused={isPaused} 
                />
              </div>
            )}
            
            {/* Sub-elements for sentence-by-sentence blocks */}
            {isActive && hasWait && hasSpeed && (
              <div className="mt-2 p-2 bg-black/5 rounded-md">
                <div className="flex flex-col gap-1">
                  {sentenceChunks && sentenceChunks.length > 0 ? sentenceChunks.map((_, chunkIndex) => {
                    const isCurrentAudio = currentSubElement?.type === 'audio' && currentSubElement.index === chunkIndex
                    const isCurrentGap = currentSubElement?.type === 'gap' && currentSubElement.index === chunkIndex
                    const isSubElementPaused = isPlaying && isPaused
                    const isSubElementActive = isCurrentAudio || isCurrentGap
                    
                    return (
                      <div key={chunkIndex} className="flex flex-col gap-1">
                        {/* Grouped sub-element container */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation()
                            onSubElementSelect?.('audio', chunkIndex) // Always start from audio
                          }}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] cursor-pointer transition-all duration-200 ${
                            isSubElementActive 
                              ? (isSubElementPaused 
                                  ? 'bg-amber-50 border border-amber-500' 
                                  : 'bg-blue-50 border border-blue-500')
                              : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          {/* Cycle counter - show for active chunk or when playing */}
                          {(isSubElementActive || (currentCycle && currentCycle.chunkIndex === chunkIndex)) && (
                            <div className={`flex items-center justify-center min-w-[32px] h-5 rounded-full text-[10px] font-bold text-white ${
                              isSubElementPaused ? 'bg-amber-500' : 'bg-blue-500'
                            }`}>
                              {currentCycle && currentCycle.chunkIndex === chunkIndex 
                                ? `${currentCycle.cycle} / ${currentCycle.totalCycles}`
                                : `1 / ${step.repeat ?? 1}`
                              }
                            </div>
                          )}
                          
                          {/* Content container */}
                          <div className="flex flex-col gap-0.5 flex-1">
                            {/* Audio chunk (visual only) */}
                            <div className={`flex items-center gap-1.5 px-1 py-0.5 rounded-sm transition-all duration-200 ${
                              isCurrentAudio 
                                ? (isSubElementPaused ? 'bg-amber-100' : 'bg-blue-100')
                                : 'bg-transparent'
                            }`}>
                              <span className={
                                isCurrentAudio 
                                  ? (isSubElementPaused ? 'text-amber-500' : 'text-blue-700')
                                  : 'text-gray-500'
                              }>
                                ▰
                              </span>
                              <span className={
                                isCurrentAudio 
                                  ? (isSubElementPaused ? 'text-amber-800' : 'text-blue-800')
                                  : 'text-gray-700'
                              }>
                                Audio chunk {chunkIndex + 1}
                              </span>
                              {isCurrentAudio && (
                                <div className="flex-1 ml-2">
                                  <ProgressBar 
                                    current={isPlaying && progress ? progress.current : 0} 
                                    total={isPlaying && progress ? progress.total : (selectedSubElementDuration || 1000)} 
                                    isPaused={isPaused} 
                                  />
                                </div>
                              )}
                            </div>
                            
                            {/* Gap (visual only) */}
                            <div className={`flex items-center gap-1.5 px-1 py-0.5 rounded-sm transition-all duration-200 ${
                              isCurrentGap 
                                ? (isSubElementPaused ? 'bg-amber-100' : 'bg-blue-100')
                                : 'bg-transparent'
                            }`}>
                              <span className={
                                isCurrentGap 
                                  ? (isSubElementPaused ? 'text-amber-500' : 'text-blue-700')
                                  : 'text-gray-500'
                              }>
                                ▰
                              </span>
                              <span className={
                                isCurrentGap 
                                  ? (isSubElementPaused ? 'text-amber-800' : 'text-blue-800')
                                  : 'text-gray-700'
                              }>
                                Gap {step.wait}s
                              </span>
                              {isCurrentGap && (
                                <div className="flex-1 ml-2">
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
                    <div className="p-2 text-center text-gray-500 text-xs italic">
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
