import React, { useEffect, useMemo, useState } from 'react'
import { ConfigEditor } from './config/ConfigEditor'
import type { DictationBlock } from './config/types'
import { createApi, type ApiConfig } from '@/api/client'
import { ConfigSelector } from './components/ConfigSelector'
import { useConfigs } from '@/hooks/useConfigs'
import { useAuth } from '@/contexts/AuthContext'


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
  const { token } = useAuth()
  const { configs, loading: configsLoading, reload, setConfigs } = useConfigs()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState<string>('')
  const [blocks, setBlocks] = useState<DictationBlock[]>([])
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' } | null>(null)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const selectedConfig = useMemo(() => configs.find(c => c.id === selectedId) || null, [configs, selectedId])
  
  // Create authenticated API instance
  const api = createApi(token)

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
    } catch (error: any) {
      // Check if it's a 401 Unauthorized error
      // ApiError has status and detail properties
      const status = error?.status
      const isUnauthorized = status === 401
      
      if (isUnauthorized) {
        const backendMessage = error?.detail
        const message = backendMessage 
          ? `${backendMessage} Please sign in with Google to save your own configurations.`
          : 'Please sign in with Google to save your own configurations.'
        setToast({ message, kind: 'error' })
      } else {
        // For debugging - log the error to see its structure
        console.error('Save error:', error)
        setToast({ message: 'Save failed. Please try again.', kind: 'error' })
      }
      setTimeout(() => setToast(null), 4000)
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
    } catch (error: any) {
      // Check if it's a 401 Unauthorized error
      // ApiError has status and detail properties
      const status = error?.status
      const isUnauthorized = status === 401
      
      if (isUnauthorized) {
        const backendMessage = error?.detail
        const message = backendMessage
          ? `${backendMessage} Please sign in with Google to delete your configurations.`
          : 'Please sign in with Google to delete your configurations.'
        setToast({ message, kind: 'error' })
      } else {
        // For debugging - log the error to see its structure
        console.error('Delete error:', error)
        setToast({ message: 'Delete failed. Please try again.', kind: 'error' })
      }
      setTimeout(() => setToast(null), 4000)
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
      <section className="flex flex-col gap-3 h-full">
        <div className="flex items-center justify-end px-4 md:px-6 pt-2 md:pt-3">
          <div className="text-sm text-gray-500">Loading configurations...</div>
        </div>
        <div className="flex-1 flex flex-col border-t border-gray-200 overflow-hidden bg-white items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3 h-full">
      {toast && (
        <div className={`fixed top-4 right-4 px-3 py-2 rounded-lg text-sm shadow-md z-50 ${
          toast.kind === 'success'
            ? 'text-green-800 bg-green-50 border border-green-200'
            : 'text-red-800 bg-red-50 border border-red-200'
        }`}>
          {toast.message}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center gap-3 px-4 md:px-6 pt-2 md:pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <ConfigSelector configs={configs as any} value={selectedId || ''} onChange={handleSelect} />
          <button 
            onClick={() => {
              const name = prompt('Enter configuration name:')
              if (name && name.trim()) {
                setNewConfig()
                setNameDraft(name.trim())
              }
            }}
            className="px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 cursor-pointer text-base font-bold min-h-[44px] hover:bg-green-100 transition-colors"
            title="Create new configuration"
          >
            +
          </button>
          <input
            placeholder="Name"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg min-h-[44px] w-full md:w-auto md:min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button 
            onClick={handleSave} 
            className="px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 cursor-pointer min-h-[44px] hover:bg-green-100 transition-colors"
          >
            Save
          </button>
          {selectedId && (
            <button 
              onClick={handleDelete} 
              className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 cursor-pointer min-h-[44px] hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col border-t border-gray-200 overflow-hidden bg-white">
        <div className="p-4 h-full overflow-auto">
          <ConfigEditor blocks={blocks} onBlocksChange={setBlocks} />
        </div>
      </div>
    </section>
  )
}


