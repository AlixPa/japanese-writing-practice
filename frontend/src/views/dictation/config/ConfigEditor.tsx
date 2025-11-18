import React, { useCallback, useState, useRef, useEffect } from 'react'
import { ConfigBlockCard } from './ConfigBlockCard'
import type { DictationBlock, DictationBlockType } from './types'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

interface Props {
  blocks: DictationBlock[]
  onBlocksChange: (blocks: DictationBlock[]) => void
  isEditMode?: boolean
}

const blockTypes: { type: DictationBlockType; label: string }[] = [
  { type: 'full', label: 'Full dictation' },
  { type: 'sentence', label: 'Sentence-by-sentence' },
  { type: 'wait', label: 'Wait' },
]

export function ConfigEditor({ blocks, onBlocksChange, isEditMode = false }: Props) {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null)
  const menuRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const handleRemove = useCallback((id: string) => {
    onBlocksChange(blocks.filter(b => b.id !== id))
  }, [blocks, onBlocksChange])

  const handleChange = useCallback((id: string, changes: Partial<DictationBlock>) => {
    onBlocksChange(blocks.map(b => b.id === id ? { ...b, ...changes } : b))
  }, [blocks, onBlocksChange])

  const handleAddBlock = useCallback((index: number, blockType: DictationBlockType) => {
    const newBlock: DictationBlock = { id: generateId(), type: blockType }
    if (blockType === 'wait') {
      newBlock.waitSeconds = 1
    } else if (blockType === 'full') {
      newBlock.fullSpeed = 1
    } else if (blockType === 'sentence') {
      newBlock.sentenceGapSeconds = 1
      newBlock.sentenceSpeed = 1
      newBlock.repeat = 1
    }
    
    const copy = blocks.slice()
    copy.splice(index, 0, newBlock)
    onBlocksChange(copy)
    setOpenMenuIndex(null)
  }, [blocks, onBlocksChange])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuIndex !== null) {
        const menuElement = menuRefs.current.get(openMenuIndex)
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuIndex(null)
        }
      }
    }

    if (openMenuIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuIndex])

  const AddButton = ({ index }: { index: number }) => {
    const isOpen = openMenuIndex === index
    
    return (
      <div className="relative">
        <button
          onClick={() => setOpenMenuIndex(isOpen ? null : index)}
          className="w-full py-0.5 rounded border border-dashed border-gray-300 bg-white text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center h-6"
          aria-label="Add block"
        >
          <span className="text-xs font-medium">+ Add block</span>
        </button>
        
        {isOpen && (
          <div
            ref={(el) => {
              if (el) menuRefs.current.set(index, el)
              else menuRefs.current.delete(index)
            }}
            className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          >
            {blockTypes.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => handleAddBlock(index, type)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors min-h-[44px] border-b border-gray-100 last:border-b-0"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="font-semibold text-gray-900 mb-3 text-sm">Sequence</div>
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-2">
          {/* Add button at the start - only in edit mode */}
          {isEditMode && <AddButton index={0} />}
          
          {blocks.map((block, index) => (
            <React.Fragment key={block.id}>
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
                isEditMode={isEditMode}
              />
              {/* Add button after each block - only in edit mode */}
              {isEditMode && <AddButton index={index + 1} />}
            </React.Fragment>
          ))}
          
          {blocks.length === 0 && isEditMode && (
            <div className="text-center text-gray-400 text-sm py-8">
              Click the + button above to add your first block
            </div>
          )}
          {blocks.length === 0 && !isEditMode && (
            <div className="text-center text-gray-400 text-sm py-8">
              No blocks in this configuration
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


