import React from 'react'
import { ConfigStep, ElementTypeName } from '@/types/player'
import { getElementType, getElementTypeName } from '@/utils/playerUtils'

interface SequenceElementProps {
  step: ConfigStep
  index: number
  isActive: boolean
  isPlaying: boolean
  isPaused: boolean
  onSelect: (index: number) => void
}

export function SequenceElement({ 
  step, 
  index, 
  isActive, 
  isPlaying, 
  isPaused, 
  onSelect 
}: SequenceElementProps) {
  const elementType = getElementType(step)
  const typeName = getElementTypeName(elementType)
  
  const getTitleAndSubtitle = (typeName: ElementTypeName, step: ConfigStep) => {
    switch (typeName) {
      case 'wait':
        return { title: 'Wait', subtitle: `${step.wait}s` }
      case 'full-dictation':
        return { title: 'Full dictation', subtitle: `${step.speed}%` }
      case 'sentence-by-sentence':
        return { title: 'Sentence-by-sentence', subtitle: `${step.speed}% • gap ${step.wait}s` }
      default:
        return { title: 'Unknown', subtitle: '' }
    }
  }

  const { title, subtitle } = getTitleAndSubtitle(typeName, step)

  // Styling based on state
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
    color: isPlaying ? (isPaused ? '#f59e0b' : '#3b82f6') : '#93c5fd',
    fontSize: '16px'
  } : {
    color: '#9ca3af',
    fontSize: '14px'
  }

  return (
    <div
      onClick={() => onSelect(index)}
      style={{
        padding: '12px 16px',
        borderRadius: 12,
        transition: 'all 0.2s ease-in-out',
        ...elementStyles
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={iconStyles}>
          {typeName === 'wait' && '⏱️'}
          {typeName === 'full-dictation' && '🎵'}
          {typeName === 'sentence-by-sentence' && '📝'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: isActive ? 600 : 500, 
            color: isActive ? '#111827' : '#6b7280',
            fontSize: '14px'
          }}>
            {title}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: isActive ? '#4b5563' : '#9ca3af',
            marginTop: 2
          }}>
            {subtitle}
          </div>
        </div>
      </div>
    </div>
  )
}
