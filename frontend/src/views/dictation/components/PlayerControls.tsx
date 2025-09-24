import React from 'react'

interface PlayerControlsProps {
  isPlaying: boolean
  isPaused: boolean
  onPlay: () => void
  onStop: () => void
  onPauseResume: () => void
  playError: string | null
}

export function PlayerControls({ 
  isPlaying, 
  isPaused, 
  onPlay, 
  onStop, 
  onPauseResume, 
  playError 
}: PlayerControlsProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <button
        onClick={isPlaying ? onStop : onPlay}
        style={{ 
          padding: '8px 16px', 
          borderRadius: 8, 
          border: '1px solid #e5e7eb', 
          background: isPlaying ? '#fef2f2' : '#f0f9ff', 
          cursor: 'pointer',
          color: isPlaying ? '#991b1b' : '#1e40af',
          fontWeight: 500,
          transition: 'all 0.2s ease-in-out',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isPlaying ? '#fee2e2' : '#dbeafe'
          e.currentTarget.style.borderColor = isPlaying ? '#fca5a5' : '#93c5fd'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isPlaying ? '#fef2f2' : '#f0f9ff'
          e.currentTarget.style.borderColor = '#e5e7eb'
        }}
      >
        <span>{isPlaying ? '⏹' : '▶'}</span>
        <span>{isPlaying ? 'Stop' : 'Play'}</span>
      </button>
      
      <button
        onClick={isPlaying ? onPauseResume : undefined}
        disabled={!isPlaying}
        style={{ 
          padding: '6px 10px', 
          borderRadius: 8, 
          border: '1px solid #e5e7eb', 
          background: isPlaying ? (isPaused ? '#f0f9ff' : '#f9fafb') : '#f3f4f6',
          cursor: isPlaying ? 'pointer' : 'not-allowed',
          opacity: isPlaying ? 1 : 0.6,
          color: isPlaying ? '#111827' : '#9ca3af',
          transition: 'all 0.2s ease-in-out',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
        onMouseEnter={(e) => {
          if (!isPlaying) {
            e.currentTarget.style.background = '#f3f4f6'
            e.currentTarget.style.borderColor = '#d1d5db'
          }
        }}
        onMouseLeave={(e) => {
          if (!isPlaying) {
            e.currentTarget.style.background = '#f3f4f6'
            e.currentTarget.style.borderColor = '#e5e7eb'
          }
        }}
      >
        <span>{isPlaying ? (isPaused ? '▶' : '⏸') : '⏸'}</span>
        <span>{isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Pause'}</span>
      </button>
      
      {playError && (
        <span style={{ color: '#991b1b', fontSize: '14px' }}>
          {playError}
        </span>
      )}
    </div>
  )
}
