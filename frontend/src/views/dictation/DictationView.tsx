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
    <section className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-3 flex-wrap px-4 md:px-6 pt-2 md:pt-3">
        <div className="flex items-center gap-2">
          <ConfigSelector configs={configs} value={selectedConfigId} onChange={setSelectedConfigId} />
        </div>
      </div>
      <div className="flex-1 flex flex-col border-t border-gray-200 overflow-hidden bg-white">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setDictationMode('wanikani')}
            className={`px-4 py-3 border-none font-semibold cursor-pointer outline-none transition-colors min-h-[44px] ${
              dictationMode === 'wanikani'
                ? 'bg-blue-50 text-blue-700 border-r border-gray-200'
                : 'bg-gray-50 text-gray-900 border-r border-gray-200 hover:bg-gray-100'
            }`}
          >
            WaniKani
          </button>
          <button
            onClick={() => setDictationMode('custom')}
            className={`px-4 py-3 border-none font-semibold cursor-pointer outline-none transition-colors min-h-[44px] ${
              dictationMode === 'custom'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
            }`}
          >
            Custom
          </button>
        </div>
        <div className="border-t border-gray-200 flex-1 p-4 md:p-4 overflow-auto">
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


