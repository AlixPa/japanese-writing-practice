import React, { useState, useRef, useEffect } from 'react'
import type { ApiConfig } from '@/api/client'

interface Props {
  configs: ApiConfig[]
  value: string
  onChange: (id: string) => void
}

export function ConfigSelector({ configs, value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedConfig = configs.find(c => c.id === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (id: string) => {
    onChange(id)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 cursor-pointer text-sm font-medium min-h-[44px] shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center gap-2"
      >
        <span>{selectedConfig?.name || 'Select configuration'}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto"
        >
          {configs.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No configurations</div>
          ) : (
            configs.map((config) => (
              <button
                key={config.id}
                onClick={() => handleSelect(config.id)}
                className={`w-full text-left px-3 py-2 text-sm min-h-[44px] flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                  config.id === value
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-900'
                }`}
              >
                {config.id === value && (
                  <svg
                    className="w-4 h-4 text-blue-700"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className={config.id === value ? '' : 'ml-6'}>{config.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}


