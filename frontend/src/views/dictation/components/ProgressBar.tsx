import React, { useEffect } from 'react'

interface Props {
  current: number
  total: number
  isPaused?: boolean
}

export function ProgressBar({ current, total, isPaused }: Props) {
  const percentage = total > 0 ? (current / total) * 100 : 0
  const currentSeconds = Math.round(current / 1000)
  const totalSeconds = Math.round(total / 1000)
  
  // Add shimmer animation to document head
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2 p-1.5 md:p-2 bg-white/70 rounded-md border border-black/10 min-h-[44px]">
      <span className="text-[11px] text-gray-600 min-w-[30px] font-mono font-medium">
        {formatTime(currentSeconds)}
      </span>
      
      <div className="flex-1 h-1 md:h-1.5 bg-black/10 rounded-sm relative overflow-hidden">
        <div 
          className={`h-full rounded-sm transition-[width] duration-100 ease-out relative ${
            isPaused ? 'bg-amber-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        >
          {/* Animated shimmer effect when playing */}
          {!isPaused && (
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{
                animation: 'shimmer 2s infinite linear',
                transform: 'translateX(-100%)'
              }}
            />
          )}
        </div>
      </div>
      
      <span className="text-[11px] text-gray-600 min-w-[30px] font-mono font-medium">
        {formatTime(totalSeconds)}
      </span>
    </div>
  )
}
