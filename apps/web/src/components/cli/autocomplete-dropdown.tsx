'use client'

import { useEffect, useRef } from 'react'
import { Suggestion } from '@/lib/cli/autocomplete'

interface AutocompleteDropdownProps {
  suggestions: Suggestion[]
  selectedIndex: number
  onSelect: (suggestion: Suggestion) => void
  onClose: () => void
}

export function AutocompleteDropdown({
  suggestions,
  selectedIndex,
  onSelect,
  onClose
}: AutocompleteDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Scroll selected item into view
  useEffect(() => {
    if (dropdownRef.current && selectedIndex >= 0) {
      const selectedEl = dropdownRef.current.children[selectedIndex] as HTMLElement
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute bottom-full left-0 mb-2 max-h-80 w-full overflow-y-auto rounded-md border border-gray-700 bg-gray-800 shadow-xl"
      style={{ maxWidth: '600px' }}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={`${suggestion.type}-${suggestion.value}-${index}`}
          className={`cursor-pointer border-b border-gray-700 px-4 py-2 last:border-b-0 ${
            index === selectedIndex ? 'bg-blue-600' : 'hover:bg-gray-700'
          }`}
          onClick={() => onSelect(suggestion)}
          onMouseEnter={() => {
            // Update selected index on hover (optional)
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-gray-100">
                  {suggestion.label}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium ${getTypeBadgeClass(
                    suggestion.type
                  )}`}
                >
                  {suggestion.type}
                </span>
              </div>
              {suggestion.description && (
                <div className="mt-0.5 text-xs text-gray-400">
                  {suggestion.description}
                </div>
              )}
            </div>
            {index === selectedIndex && (
              <div className="ml-2 text-xs text-gray-400">
                <kbd className="rounded bg-gray-700 px-1">Tab</kbd>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Get badge color based on suggestion type
 */
function getTypeBadgeClass(type: Suggestion['type']): string {
  switch (type) {
    case 'command':
      return 'bg-blue-600 text-blue-100'
    case 'item':
      return 'bg-yellow-600 text-yellow-100'
    case 'operator':
      return 'bg-green-600 text-green-100'
    case 'value':
      return 'bg-cyan-600 text-cyan-100'
    case 'template':
      return 'bg-purple-600 text-purple-100'
    default:
      return 'bg-gray-600 text-gray-100'
  }
}
