import React from 'react'

export function WelcomeView() {
  return (
    <div style={{ 
      padding: 24, 
      maxWidth: 800, 
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1 style={{ 
          fontSize: 32, 
          fontWeight: 700, 
          color: '#1f2937', 
          margin: '0 0 8px 0' 
        }}>
          Japanese Writing Practice
        </h1>
        <p style={{ 
          fontSize: 18, 
          color: '#6b7280', 
          margin: 0 
        }}>
          Master Japanese through interactive dictation exercises
        </p>
      </div>

      {/* Features Stack */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 20 
      }}>
        {/* Dictation Card */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 20,
          background: 'white',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              📝
            </div>
            <h3 style={{ margin: 0, fontSize: 20, color: '#1f2937' }}>Dictation</h3>
          </div>
          <p style={{ 
            color: '#6b7280', 
            lineHeight: 1.6, 
            margin: '0 0 16px 0' 
          }}>
            Practice listening and writing Japanese with audio dictation exercises. 
            Choose from WaniKani vocabulary or created custom content.
          </p>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>
            <strong>Features:</strong> Audio playback, speed control, sentence-by-sentence mode
          </div>
        </div>

        {/* Configuration Card */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 20,
          background: 'white',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              ⚙️
            </div>
            <h3 style={{ margin: 0, fontSize: 20, color: '#1f2937' }}>Configuration</h3>
          </div>
          <p style={{ 
            color: '#6b7280', 
            lineHeight: 1.6, 
            margin: '0 0 16px 0' 
          }}>
            Customize your dictation experience with personalized settings. 
            Create different configurations for various practice scenarios.
          </p>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>
            <strong>Features:</strong> Speed settings, wait times, repetition controls
          </div>
        </div>

        {/* Generation Card */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 20,
          background: 'white',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🎯
            </div>
            <h3 style={{ margin: 0, fontSize: 20, color: '#1f2937' }}>Generation (Coming Soon)</h3>
          </div>
          <p style={{ 
            color: '#6b7280', 
            lineHeight: 1.6, 
            margin: '0 0 16px 0' 
          }}>
            Generate custom Japanese content for your practice sessions. 
            Create tailored exercises based on your learning needs.
          </p>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>
            <strong>Features:</strong> Custom text input, audio generation
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        padding: '20px 0', 
        borderTop: '1px solid #e5e7eb',
        color: '#9ca3af',
        fontSize: 14
      }}>
        Select any tab from the sidebar to begin your Japanese learning journey!
      </div>
    </div>
  )
}
