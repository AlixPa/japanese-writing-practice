import React, { useEffect, useState } from 'react'
import { DictationWaniKani } from './WaniKani'
import { DictationCustom } from './Custom'
import { useConfigs } from '@/hooks/useConfigs'
import { ConfigSelector } from './components/ConfigSelector'

type DictationMode = 'wanikani' | 'custom'

export function DictationView() {
  const [dictationMode, setDictationMode] = useState<DictationMode>('wanikani')
  const { configs } = useConfigs()
  const [selectedConfigId, setSelectedConfigId] = useState<string>('')
  useEffect(() => { if (configs.length && !selectedConfigId) setSelectedConfigId(configs[0].id) }, [configs, selectedConfigId])

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Dictation</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ color: '#6b7280' }}>Configuration</label>
          <ConfigSelector configs={configs} value={selectedConfigId} onChange={setSelectedConfigId} includeNew={false} />
        </div>
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'white',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <button
            onClick={() => setDictationMode('wanikani')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: dictationMode === 'wanikani' ? '#eef2ff' : '#f9fafb',
              color: dictationMode === 'wanikani' ? '#1d4ed8' : '#111827',
              fontWeight: 600,
              cursor: 'pointer',
              borderRight: '1px solid #e5e7eb',
              outline: 'none'
            }}
          >
            WaniKani
          </button>
          <button
            onClick={() => setDictationMode('custom')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: dictationMode === 'custom' ? '#eef2ff' : '#f9fafb',
              color: dictationMode === 'custom' ? '#1d4ed8' : '#111827',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            Custom
          </button>
        </div>
        <div style={{ borderTop: '1px solid #e5e7eb', flex: 1, padding: 16, overflow: 'auto' }}>
          {dictationMode === 'wanikani' ? (
            <DictationWaniKani selectedConfigId={selectedConfigId} />
          ) : (
            <DictationCustom selectedConfigId={selectedConfigId} />
          )}
        </div>
      </div>
    </section>
  )
}


