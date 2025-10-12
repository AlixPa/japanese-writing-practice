import React from 'react'
import type { DictationBlock } from './types'
import { SpeedSelector } from '@/components/SpeedSelector'

interface Props {
  block: DictationBlock
  onRemove: () => void
  onChange: (changes: Partial<DictationBlock>) => void
  onMoveUp: () => void
  onMoveDown: () => void
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

export function ConfigBlockCard({ block, onRemove, onChange, onMoveUp, onMoveDown }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 8px',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        background: 'white',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            title="Move up"
            onClick={onMoveUp}
            style={{
              width: 16,
              height: 16,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              color: '#6b7280',
              cursor: 'pointer',
              userSelect: 'none',
              fontSize: 10,
              lineHeight: '10px'
            }}
          >▲</span>
          <span
            title="Move down"
            onClick={onMoveDown}
            style={{
              width: 16,
              height: 16,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              color: '#6b7280',
              cursor: 'pointer',
              userSelect: 'none',
              fontSize: 10,
              lineHeight: '10px'
            }}
          >▼</span>
        </div>
        <strong>{getLabel(block.type)}</strong>
        {block.type === 'full' && (
          <SpeedSelector
            value={block.fullSpeed ?? 1}
            onChange={(value) => onChange({ fullSpeed: value })}
          />
        )}
        {block.type === 'wait' && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
            <span style={{ color: '#6b7280' }}>(seconds)</span>
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
              style={{
                width: 80,
                padding: '4px 6px',
                border: '1px solid #e5e7eb',
                borderRadius: 6
              }}
            />
          </label>
        )}
        {block.type === 'sentence' && (
          <>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
              <span style={{ color: '#6b7280' }}>Gap</span>
              <span style={{ color: '#6b7280' }}>(seconds)</span>
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
                style={{
                  width: 80,
                  padding: '4px 6px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6
                }}
              />
            </label>
            <SpeedSelector
              value={block.sentenceSpeed ?? 1}
              onChange={(value) => onChange({ sentenceSpeed: value })}
            />
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
              <span style={{ color: '#6b7280' }}>Repeat</span>
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
                style={{
                  width: 60,
                  padding: '4px 6px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6
                }}
              />
            </label>
          </>
        )}
      </div>
      <button onClick={onRemove} style={{
        padding: '6px 8px',
        borderRadius: 8,
        border: '1px solid #fecaca',
        background: '#fee2e2',
        color: '#991b1b',
        cursor: 'pointer'
      }}>Remove</button>
    </div>
  )
}


