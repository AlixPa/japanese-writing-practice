import React, { useState, useRef, useEffect } from 'react'

export interface DropdownItem {
  id: string
  label: string
}

interface Props {
  items: DropdownItem[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function Dropdown({ items, value, onChange, placeholder = 'Select...', disabled = false, className = '' }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedItem = items.find(item => item.id === value)

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
    <div className={`relative min-w-0 flex-1 md:flex-initial ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full min-w-0 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 cursor-pointer text-sm font-medium min-h-[44px] shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="min-w-0 flex-1 overflow-hidden">
          <span className="block truncate text-left">{selectedItem?.label || placeholder}</span>
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
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
          className="absolute top-full left-0 mt-1 min-w-full w-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto"
        >
          {items.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">No items</div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full text-left px-3 py-2 text-sm min-h-[44px] flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                  item.id === value
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-900'
                }`}
              >
                {item.id === value && (
                  <svg
                    className="w-4 h-4 text-blue-700 flex-shrink-0"
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
                <span className={`${item.id === value ? '' : 'ml-6'} whitespace-nowrap`}>{item.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

