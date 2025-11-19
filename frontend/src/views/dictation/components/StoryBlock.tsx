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
    <div className="border border-gray-200 rounded-xl p-3 md:p-4 bg-white">
      <div className="flex items-center gap-2 justify-start mb-2">
        <div className="font-semibold text-sm md:text-base">Dictation text</div>
        <button
          onClick={onToggleRevealed}
          disabled={loading || !!error || !storyText}
          className="px-2 py-1 rounded-md border border-gray-200 bg-gray-50 cursor-pointer flex items-center gap-1 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-sm">
            {revealed ? '○' : '●'}
          </span>
          <span className="text-xs">{revealed ? 'Hide' : 'Show'}</span>
        </button>
      </div>
      {loading ? (
        <div className="text-gray-500 text-sm md:text-base">Loading…</div>
      ) : error ? (
        <div className="text-red-800 text-sm md:text-base">{error}</div>
      ) : (
        <div>
          <div className={`whitespace-pre-wrap text-sm md:text-base ${revealed || !storyText ? '' : 'blur-[6px]'}`}>
            {storyText || <span className="text-gray-500">No dictation text</span>}
          </div>
        </div>
      )}
    </div>
  )
}
