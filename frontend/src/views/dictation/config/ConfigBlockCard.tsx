import React from 'react'
import type { DictationBlock } from './types'
import { SpeedSelector } from '@/components/SpeedSelector'
import { getSpeedLabel } from '@/constants/speedOptions'

interface Props {
  block: DictationBlock
  onRemove: () => void
  onChange: (changes: Partial<DictationBlock>) => void
  onMoveUp: () => void
  onMoveDown: () => void
  isEditMode?: boolean
}

function getLabel(type: DictationBlock['type']) {
  switch (type) {
    case 'full':
      return 'Full dictation'
    case 'sentence':
      return 'Sentence-by-sentence'
    case 'wait':
      return 'Wait'
    default:
      return 'Unknown'
  }
}

export function ConfigBlockCard({ block, onRemove, onChange, onMoveUp, onMoveDown, isEditMode = false }: Props) {
  return (
    <div className="flex flex-col gap-2 p-2 md:p-1.5 border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* First row: Move buttons + Type label + Remove button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-shrink-0">
          {isEditMode && (
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                title="Move up"
                onClick={onMoveUp}
                className="w-4 h-4 flex items-center justify-center rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer text-[10px] leading-[10px] select-none"
              >▲</button>
              <button
                type="button"
                title="Move down"
                onClick={onMoveDown}
                className="w-4 h-4 flex items-center justify-center rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer text-[10px] leading-[10px] select-none"
              >▼</button>
            </div>
          )}
          <strong className="text-sm md:text-base">{getLabel(block.type)}</strong>
        </div>
        {isEditMode && (
          <button 
            onClick={onRemove}
            className="px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700 cursor-pointer text-sm font-medium hover:bg-red-100 transition-colors min-h-[32px] flex-shrink-0"
          >
            Remove
          </button>
        )}
      </div>

      {/* Second row: Controls - stacked on mobile, horizontal on desktop */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-1.5">
        {block.type === 'full' && (
          isEditMode ? (
            <SpeedSelector
              value={block.fullSpeed ?? 1}
              onChange={(value) => onChange({ fullSpeed: value })}
            />
          ) : (
            <div className="inline-flex items-center gap-1.5 text-sm">
              <span className="text-gray-500 text-xs md:text-sm">Speed</span>
              <span className="text-gray-900 font-medium">{getSpeedLabel(block.fullSpeed ?? 1)}</span>
            </div>
          )
        )}
        {block.type === 'wait' && (
          isEditMode ? (
            <label className="inline-flex items-center gap-1.5 text-sm">
              <span className="text-gray-500 text-xs md:text-sm">(seconds)</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={block.waitSeconds ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  const num = val === '' ? undefined : Math.max(1, Number(val))
                  onChange({ waitSeconds: num })
                }}
                className="w-20 px-1.5 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </label>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-sm">
              <span className="text-gray-500 text-xs md:text-sm">(seconds)</span>
              <span className="text-gray-900 font-medium">{block.waitSeconds ?? 0}</span>
            </div>
          )
        )}
        {block.type === 'sentence' && (
          <>
            {isEditMode ? (
              <label className="inline-flex items-center gap-1.5 text-sm">
                <span className="text-gray-500 text-xs md:text-sm">Gap</span>
                <span className="text-gray-500 text-xs md:text-sm">(seconds)</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={block.sentenceGapSeconds ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    const num = val === '' ? undefined : Math.max(1, Number(val))
                    onChange({ sentenceGapSeconds: num })
                  }}
                  className="w-20 px-1.5 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </label>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-sm">
                <span className="text-gray-500 text-xs md:text-sm">Gap</span>
                <span className="text-gray-500 text-xs md:text-sm">(seconds)</span>
                <span className="text-gray-900 font-medium">{block.sentenceGapSeconds ?? 0}</span>
              </div>
            )}
            {isEditMode ? (
              <SpeedSelector
                value={block.sentenceSpeed ?? 1}
                onChange={(value) => onChange({ sentenceSpeed: value })}
              />
            ) : (
              <div className="inline-flex items-center gap-1.5 text-sm">
                <span className="text-gray-500 text-xs md:text-sm">Speed</span>
                <span className="text-gray-900 font-medium">{getSpeedLabel(block.sentenceSpeed ?? 1)}</span>
              </div>
            )}
            {isEditMode ? (
              <label className="inline-flex items-center gap-1.5 text-sm">
                <span className="text-gray-500 text-xs md:text-sm">Repeat</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={block.repeat ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    const num = val === '' ? undefined : Math.max(1, Number(val))
                    onChange({ repeat: num })
                  }}
                  className="w-16 px-1.5 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </label>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-sm">
                <span className="text-gray-500 text-xs md:text-sm">Repeat</span>
                <span className="text-gray-900 font-medium">{block.repeat ?? 1}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


