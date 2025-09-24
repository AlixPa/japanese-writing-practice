import React from 'react'

interface StoryBlockProps {
  loading: boolean
  error: string | null
  storyText: string
  revealed: boolean
  onToggleRevealed: () => void
}

export function StoryBlock({ loading, error, storyText, revealed, onToggleRevealed }: StoryBlockProps) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Dictation text</div>
        <button
          onClick={onToggleRevealed}
          disabled={loading || !!error || !storyText}
          style={{ 
            padding: '4px 8px', 
            borderRadius: 6, 
            border: '1px solid #e5e7eb', 
            background: '#f9fafb', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span style={{ fontSize: '14px' }}>
            {revealed ? '○' : '●'}
          </span>
          {revealed ? 'Hide' : 'Show'}
        </button>
      </div>
      {loading ? (
        <div style={{ color: '#6b7280' }}>Loading…</div>
      ) : error ? (
        <div style={{ color: '#991b1b' }}>{error}</div>
      ) : (
        <div>
          <div style={{ whiteSpace: 'pre-wrap', filter: revealed ? 'none' : (storyText ? 'blur(6px)' : 'none') }}>
            {storyText || <span style={{ color: '#6b7280' }}>No dictation text</span>}
          </div>
        </div>
      )}
    </div>
  )
}
