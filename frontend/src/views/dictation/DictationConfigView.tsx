import React, { useEffect, useMemo, useState } from 'react'
import { ConfigEditor } from './config/ConfigEditor'
import type { DictationBlock } from './config/types'
import { api, type ApiConfig } from '@/api/client'
import { ConfigSelector } from './components/ConfigSelector'
import { useConfigs } from '@/hooks/useConfigs'


function toBlocks(api: ApiConfig['sequence']): DictationBlock[] {
  return api.map((item) => {
    const hasWait = Object.prototype.hasOwnProperty.call(item, 'wait')
    const hasSpeed = Object.prototype.hasOwnProperty.call(item, 'speed')
    if (hasWait && !hasSpeed) {
      return { id: Math.random().toString(36).slice(2, 10), type: 'wait', waitSeconds: (item as any).wait }
    }
    if (hasWait && hasSpeed) {
      return {
        id: Math.random().toString(36).slice(2, 10),
        type: 'sentence',
        sentenceGapSeconds: (item as any).wait,
        sentenceSpeed: ((item as any).speed ?? 100) / 100,
        repeat: (item as any).repeat ?? 1,
      }
    }
    // only speed → full dictation
    return {
      id: Math.random().toString(36).slice(2, 10),
      type: 'full',
      fullSpeed: ((item as any).speed ?? 100) / 100,
    }
  })
}

function toApiSequence(blocks: DictationBlock[]): ApiConfig['sequence'] {
  return blocks.map((b) => {
    if (b.type === 'wait') return { wait: Math.max(0, Math.round((b.waitSeconds ?? 0) * 100) / 100) }
    if (b.type === 'sentence') return {
      wait: Math.max(0, Math.round((b.sentenceGapSeconds ?? 0) * 100) / 100),
      speed: Math.round(((b.sentenceSpeed ?? 1) * 100)),
      repeat: b.repeat ?? 1,
    }
    return {
      speed: Math.round(((b.fullSpeed ?? 1) * 100)),
    }
  })
}

export function DictationConfigView() {
  const { configs, loading: configsLoading, reload, setConfigs } = useConfigs()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState<string>('')
  const [blocks, setBlocks] = useState<DictationBlock[]>([])
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' } | null>(null)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const selectedConfig = useMemo(() => configs.find(c => c.id === selectedId) || null, [configs, selectedId])

  const loadConfigs = React.useCallback(async (): Promise<ApiConfig[]> => {
    return await reload()
  }, [reload])

  // Initialize with first config when configs are loaded for the first time
  useEffect(() => {
    if (!configsLoading && !hasInitiallyLoaded) {
      if (configs.length > 0) {
        setSelectedId(configs[0].id)
        setNameDraft(configs[0].name)
        setBlocks(toBlocks(configs[0].sequence))
      } else {
        setSelectedId(null)
        setNameDraft('')
        setBlocks([])
      }
      setHasInitiallyLoaded(true)
    }
  }, [configs, configsLoading, hasInitiallyLoaded])

  const setNewConfig = () => {
    setSelectedId(null)
    setNameDraft('')
    setBlocks([])
  }

  const handleSelect = (id: string) => {
    if (!id) {
      setNewConfig()
      return
    }
    setSelectedId(id)
    const cfg = configs.find(c => c.id === id)
    if (cfg) {
      setNameDraft(cfg.name)
      setBlocks(toBlocks(cfg.sequence))
    }
  }

  const handleSave = async () => {
    const payload = {
      id: selectedId || (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
      name: nameDraft || 'Untitled',
      sequence: toApiSequence(blocks),
    }
    try {
      await api.saveConfig(payload as any)
    } catch {
      setToast({ message: 'Save failed', kind: 'error' })
      setTimeout(() => setToast(null), 2000)
      return
    }
    const refreshed = await loadConfigs()
    // Select the saved config by id if present
    setSelectedId(payload.id)
    const latest = refreshed.find(c => c.id === payload.id)
    if (latest) {
      setNameDraft(latest.name)
      setBlocks(toBlocks(latest.sequence))
    }
    setToast({ message: 'Saved successfully', kind: 'success' })
    setTimeout(() => setToast(null), 2000)
  }

  const handleDelete = async () => {
    if (!selectedId) return
    try {
      await api.deleteConfig(selectedId)
    } catch {
      setToast({ message: 'Delete failed', kind: 'error' })
      setTimeout(() => setToast(null), 2000)
      return
    }
    const refreshed = await loadConfigs()
    // fall back to first or empty
    if (refreshed.length > 0) {
      setSelectedId(refreshed[0].id)
      setNameDraft(refreshed[0].name)
      setBlocks(toBlocks(refreshed[0].sequence))
    } else {
      setSelectedId(null)
      setNameDraft('')
      setBlocks([])
    }
    setToast({ message: 'Deleted successfully', kind: 'success' })
    setTimeout(() => setToast(null), 2000)
  }

  if (configsLoading || !hasInitiallyLoaded) {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>Dictation Configuration</h1>
          <div style={{ color: '#6b7280' }}>Loading configurations...</div>
        </div>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'white',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ color: '#6b7280' }}>Loading...</div>
        </div>
      </section>
    )
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, padding: '8px 12px', borderRadius: 8, color: toast.kind === 'success' ? '#065f46' : '#991b1b', background: toast.kind === 'success' ? '#ecfdf5' : '#fee2e2', border: `1px solid ${toast.kind === 'success' ? '#d1fae5' : '#fecaca'}`, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
          {toast.message}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Dictation Configuration</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ConfigSelector configs={configs as any} value={selectedId || ''} onChange={handleSelect} />
          <input
            placeholder="Name"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            style={{ padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 8, minWidth: 200 }}
          />
          <button onClick={handleSave} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1fae5', background: '#ecfdf5', color: '#065f46', cursor: 'pointer' }}>Save</button>
          {selectedId && (
            <button onClick={handleDelete} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fee2e2', color: '#991b1b', cursor: 'pointer' }}>Delete</button>
          )}
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
        <div style={{ padding: 16, height: '100%' }}>
          <ConfigEditor blocks={blocks} onBlocksChange={setBlocks} />
        </div>
      </div>
    </section>
  )
}


