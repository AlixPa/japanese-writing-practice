import React from 'react'
import type { DictationBlock } from './types'

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
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
            <span style={{ color: '#6b7280' }}>Speed</span>
            <select
              value={block.fullSpeed ?? 1}
              onChange={(e) => onChange({ fullSpeed: Number(e.target.value) })}
              style={{
                padding: '4px 6px',
                border: '1px solid #e5e7eb',
                borderRadius: 6
              }}
            >
              <option value={0.7}>70%</option>
              <option value={1}>100%</option>
            </select>
          </label>
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
                const num = val === '' ? undefined : Math.max(0, Number(val))
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
                  const num = val === '' ? undefined : Math.max(0, Number(val))
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
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
              <span style={{ color: '#6b7280' }}>Speed</span>
              <select
                value={block.sentenceSpeed ?? 1}
                onChange={(e) => onChange({ sentenceSpeed: Number(e.target.value) })}
                style={{
                  padding: '4px 6px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6
                }}
              >
                <option value={0.7}>70%</option>
                <option value={1}>100%</option>
              </select>
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


