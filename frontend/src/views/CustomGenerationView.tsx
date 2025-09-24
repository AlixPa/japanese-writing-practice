import React from 'react'

export function CustomGenerationView() {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>Custom Generation</h1>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
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
            Custom Generation will be available in the advanced version.
          </p>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: 14 }}>
            Create your own dictation exercises with custom text and settings.
          </p>
        </div>
      </div>
    </section>
  )
}
