import React from 'react'

export function DictationCustom({ selectedConfigId }: { selectedConfigId: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      textAlign: 'center',
      padding: '40px 20px'
    }}>
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 32,
        background: 'white',
        maxWidth: 400,
        width: '100%'
      }}>
        <h2 style={{ margin: 0, fontSize: 20, marginBottom: 8, color: '#111827' }}>Coming Soon</h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 16, marginBottom: 8 }}>
          Custom dictation will be available in the advanced version.
        </p>
        <p style={{ margin: 0, color: '#9ca3af', fontSize: 14 }}>
          Play the custom dictation exercises you created with your own text and settings.
        </p>
      </div>
    </div>
  )
}


