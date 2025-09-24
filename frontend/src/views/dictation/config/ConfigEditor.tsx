import React, { useCallback, useMemo, useState } from 'react'
import { ConfigBlockCard } from './ConfigBlockCard'
import type { DictationBlock, DictationBlockType } from './types'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

type DragData =
  | { kind: 'palette'; blockType: DictationBlockType }
  | { kind: 'block'; id: string }

interface Props {
  blocks: DictationBlock[]
  onBlocksChange: (blocks: DictationBlock[]) => void
}

export function ConfigEditor({ blocks, onBlocksChange }: Props) {
  const [activeDropIndex, setActiveDropIndex] = useState<number | null>(null)
  const [currentDrag, setCurrentDrag] = useState<DragData | null>(null)

  const handleRemove = useCallback((id: string) => {
    onBlocksChange(blocks.filter(b => b.id !== id))
  }, [blocks, onBlocksChange])

  const handleChange = useCallback((id: string, changes: Partial<DictationBlock>) => {
    onBlocksChange(blocks.map(b => b.id === id ? { ...b, ...changes } : b))
  }, [blocks, onBlocksChange])

  const insertAt = useCallback((arr: DictationBlock[], index: number, item: DictationBlock) => {
    const copy = arr.slice()
    const clampedIndex = Math.max(0, Math.min(index, copy.length))
    copy.splice(clampedIndex, 0, item)
    return copy
  }, [])

  const moveById = useCallback((arr: DictationBlock[], fromId: string, toIndex: number) => {
    const fromIndex = arr.findIndex(b => b.id === fromId)
    if (fromIndex === -1) return arr
    const copy = arr.slice()
    const [moved] = copy.splice(fromIndex, 1)
    const clampedIndex = Math.max(0, Math.min(toIndex, copy.length))
    copy.splice(clampedIndex, 0, moved)
    return copy
  }, [])

  const setDragData = (e: React.DragEvent, data: DragData) => {
    e.dataTransfer.setData('application/json', JSON.stringify(data))
    e.dataTransfer.effectAllowed = 'move'
    setCurrentDrag(data)
  }

  const readDragData = (e: React.DragEvent): DragData | null => {
    try {
      const raw = e.dataTransfer.getData('application/json')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (parsed && (parsed.kind === 'palette' || parsed.kind === 'block')) return parsed
      return null
    } catch {
      return null
    }
  }

  const getLabel = (type: DictationBlockType) => {
    switch (type) {
      case 'full': return 'Full dictation'
      case 'sentence': return 'Sentence-by-sentence'
      case 'wait': return 'Wait'
      default: return 'Unknown'
    }
  }

  const paletteButtonStyle = useMemo<React.CSSProperties>(() => ({
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    background: 'white',
    cursor: 'grab'
  }), [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, height: '100%' }}>
      <div style={{ borderRight: '1px solid #e5e7eb', paddingRight: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Blocks</div>
        <div style={{ display: 'grid', gap: 8 }}>
          <button
            style={paletteButtonStyle}
            draggable
            onDragStart={(e) => setDragData(e, { kind: 'palette', blockType: 'full' })}
            onDragEnd={() => { setCurrentDrag(null); setActiveDropIndex(null) }}
          >Full dictation</button>
          <button
            style={paletteButtonStyle}
            draggable
            onDragStart={(e) => setDragData(e, { kind: 'palette', blockType: 'sentence' })}
            onDragEnd={() => { setCurrentDrag(null); setActiveDropIndex(null) }}
          >Sentence per sentence</button>
          <button
            style={paletteButtonStyle}
            draggable
            onDragStart={(e) => setDragData(e, { kind: 'palette', blockType: 'wait' })}
            onDragEnd={() => { setCurrentDrag(null); setActiveDropIndex(null) }}
          >Wait</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Sequence</div>
        <div style={{
          flex: 1,
          border: '1px dashed #e5e7eb',
          borderRadius: 12,
          padding: 8,
          overflow: 'auto',
          background: '#fafafa'
        }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            // only set end index when hovering bare container (not over a child)
            if (e.currentTarget === e.target) {
              setActiveDropIndex(blocks.length === 0 ? 0 : blocks.length)
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            const data = readDragData(e)
            if (!data) return
            const targetIndex = activeDropIndex ?? blocks.length
            if (data.kind === 'palette') {
              const newBlock: DictationBlock = { id: generateId(), type: data.blockType }
              if (data.blockType === 'wait') newBlock.waitSeconds = 1
              if (data.blockType === 'full') newBlock.fullSpeed = 1
              if (data.blockType === 'sentence') { newBlock.sentenceGapSeconds = 1; newBlock.sentenceSpeed = 1 }
              onBlocksChange(insertAt(blocks, targetIndex, newBlock))
            } else if (data.kind === 'block') {
              onBlocksChange(moveById(blocks, data.id, targetIndex))
            }
            setActiveDropIndex(null)
            setCurrentDrag(null)
          }}
        >
          {blocks.length === 0 && !currentDrag && (
            <div style={{ color: '#6b7280' }}>Add blocks from the palette to build your dictation sequence.</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {blocks.map((block, index) => (
              <React.Fragment key={block.id}>
                {/* Preview before */}
                {activeDropIndex === index && currentDrag && (
                  (() => {
                    let previewType: DictationBlockType | null = null
                    if (currentDrag.kind === 'palette') {
                      previewType = currentDrag.blockType
                    } else if (currentDrag.kind === 'block') {
                      const b = blocks.find(x => x.id === currentDrag.id)
                      previewType = b ? b.type as DictationBlockType : null
                    }
                    if (!previewType) return null
                    return (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 10px',
                        border: '1px dashed #93c5fd',
                        borderRadius: 10,
                        background: '#eff6ff',
                        opacity: 0.7,
                        margin: '4px 0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#60a5fa' }}>⋮⋮</span>
                          <strong style={{ color: '#1d4ed8' }}>{getLabel(previewType)} (preview)</strong>
                        </div>
                        <div style={{ width: 64 }} />
                      </div>
                    )
                  })()
                )}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                    const y = e.clientY - rect.top
                    const midpoint = rect.height / 2
                    setActiveDropIndex(y < midpoint ? index : index + 1)
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation()
                    const data = readDragData(e)
                    const targetIndex = activeDropIndex ?? index
                    setActiveDropIndex(null)
                    if (!data) return
                    if (data.kind === 'palette') {
                      const newBlock: DictationBlock = { id: generateId(), type: data.blockType }
                      if (data.blockType === 'wait') newBlock.waitSeconds = 1
                      if (data.blockType === 'full') newBlock.fullSpeed = 1
                      if (data.blockType === 'sentence') { newBlock.sentenceGapSeconds = 1; newBlock.sentenceSpeed = 1 }
                      onBlocksChange(insertAt(blocks, targetIndex, newBlock))
                    } else if (data.kind === 'block') {
                      onBlocksChange(moveById(blocks, data.id, targetIndex))
                    }
                    setCurrentDrag(null)
                  }}
                  onDragLeave={() => { /* preview controlled by activeDropIndex */ }}
                >
                  <ConfigBlockCard
                    block={block}
                    onRemove={() => handleRemove(block.id)}
                    onChange={(changes) => handleChange(block.id, changes)}
                    onMoveUp={() => {
                      const idx = blocks.findIndex(b => b.id === block.id)
                      if (idx <= 0) return
                      const copy = blocks.slice()
                      const [m] = copy.splice(idx, 1)
                      copy.splice(idx - 1, 0, m)
                      onBlocksChange(copy)
                    }}
                    onMoveDown={() => {
                      const idx = blocks.findIndex(b => b.id === block.id)
                      if (idx === -1 || idx >= blocks.length - 1) return
                      const copy = blocks.slice()
                      const [m] = copy.splice(idx, 1)
                      copy.splice(idx + 1, 0, m)
                      onBlocksChange(copy)
                    }}
                  />
                </div>
              </React.Fragment>
            ))}
            {/* End preview (also used for empty state) */}
            {activeDropIndex === blocks.length && currentDrag && (
              (() => {
                let previewType: DictationBlockType | null = null
                if (currentDrag.kind === 'palette') {
                  previewType = currentDrag.blockType
                } else if (currentDrag.kind === 'block') {
                  const b = blocks.find(x => x.id === currentDrag.id)
                  previewType = b ? b.type as DictationBlockType : null
                }
                if (!previewType) return null
                return (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px',
                    border: '1px dashed #93c5fd',
                    borderRadius: 10,
                    background: '#eff6ff',
                    opacity: 0.7,
                    margin: '4px 0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#60a5fa' }}>⋮⋮</span>
                      <strong style={{ color: '#1d4ed8' }}>{getLabel(previewType)} (preview)</strong>
                    </div>
                    <div style={{ width: 64 }} />
                  </div>
                )
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


