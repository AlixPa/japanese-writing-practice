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
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 8,
      padding: '6px 8px',
      background: 'rgba(255, 255, 255, 0.7)',
      borderRadius: 6,
      border: '1px solid rgba(0, 0, 0, 0.1)'
    }}>
      <span style={{ 
        fontSize: '11px', 
        color: '#4b5563', 
        minWidth: '30px',
        fontFamily: 'monospace',
        fontWeight: 500
      }}>
        {formatTime(currentSeconds)}
      </span>
      
      <div style={{ 
        flex: 1, 
        height: 4, 
        background: 'rgba(0, 0, 0, 0.1)', 
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: isPaused ? '#f59e0b' : '#3b82f6',
          borderRadius: 2,
          transition: 'width 0.1s ease-out',
          position: 'relative'
        }}>
          {/* Animated shimmer effect when playing */}
          {!isPaused && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              animation: 'shimmer 2s infinite',
              transform: 'translateX(-100%)',
              animationName: 'shimmer',
              animationDuration: '2s',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'linear'
            }} />
          )}
        </div>
      </div>
      
      <span style={{ 
        fontSize: '11px', 
        color: '#4b5563', 
        minWidth: '30px',
        fontFamily: 'monospace',
        fontWeight: 500
      }}>
        {formatTime(totalSeconds)}
      </span>
      
    </div>
  )
}
