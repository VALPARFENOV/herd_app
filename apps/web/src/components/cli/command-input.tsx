'use client'

import { useRef, useEffect, useState } from 'react'
import { highlightToHtml } from '@/lib/cli/syntax-highlighter'
import { getAutocompleteEngine, type Suggestion } from '@/lib/cli/autocomplete'
import { AutocompleteDropdown } from './autocomplete-dropdown'

interface CommandInputProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onFocus?: () => void
  onBlur?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export function CommandInput({
  value,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  placeholder = '',
  autoFocus = false
}: CommandInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const autocomplete = useRef(getAutocompleteEngine())

  // Update highlight overlay when value changes
  useEffect(() => {
    if (highlightRef.current && value) {
      highlightRef.current.innerHTML = highlightToHtml(value)
    } else if (highlightRef.current) {
      highlightRef.current.innerHTML = ''
    }
  }, [value])

  // Update suggestions when value or cursor position changes
  useEffect(() => {
    if (value && inputRef.current) {
      const cursorPosition = inputRef.current.selectionStart || value.length
      const newSuggestions = autocomplete.current.getSuggestions(value, cursorPosition)
      setSuggestions(newSuggestions)
      setSelectedSuggestionIndex(0)
      setShowSuggestions(newSuggestions.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [value])

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Expose focus method
  useEffect(() => {
    if (inputRef.current) {
      // @ts-ignore - adding focus method to parent component
      inputRef.current.focusInput = () => inputRef.current?.focus()
    }
  }, [])

  /**
   * Handle autocomplete suggestion selection
   */
  const handleSelectSuggestion = (suggestion: Suggestion) => {
    if (!inputRef.current) return

    const cursorPosition = inputRef.current.selectionStart || value.length
    const completion = autocomplete.current.getCompletionText(value, cursorPosition, suggestion)

    onChange(completion.newText)
    setShowSuggestions(false)

    // Set cursor position after completion
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(
          completion.newCursorPosition,
          completion.newCursorPosition
        )
        inputRef.current.focus()
      }
    }, 0)
  }

  /**
   * Handle keyboard events for autocomplete
   */
  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Tab - Accept selected suggestion
    if (e.key === 'Tab' && showSuggestions && suggestions.length > 0) {
      e.preventDefault()
      handleSelectSuggestion(suggestions[selectedSuggestionIndex])
      return
    }

    // Arrow Up - Navigate suggestions up
    if (e.key === 'ArrowUp' && showSuggestions && suggestions.length > 0) {
      e.preventDefault()
      setSelectedSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      )
      return
    }

    // Arrow Down - Navigate suggestions down
    if (e.key === 'ArrowDown' && showSuggestions && suggestions.length > 0) {
      e.preventDefault()
      setSelectedSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      )
      return
    }

    // Escape - Close suggestions
    if (e.key === 'Escape' && showSuggestions) {
      e.preventDefault()
      setShowSuggestions(false)
      return
    }

    // Pass other keys to parent handler
    if (onKeyDown) {
      onKeyDown(e)
    }
  }

  return (
    <div className="relative flex-1">
      {/* Autocomplete dropdown */}
      {showSuggestions && (
        <AutocompleteDropdown
          suggestions={suggestions}
          selectedIndex={selectedSuggestionIndex}
          onSelect={handleSelectSuggestion}
          onClose={() => setShowSuggestions(false)}
        />
      )}

      {/* Highlighted overlay */}
      <div
        ref={highlightRef}
        className="pointer-events-none absolute inset-0 whitespace-pre font-mono text-base leading-7 text-transparent"
        aria-hidden="true"
      />

      {/* Actual input (transparent text) */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDownInternal}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        className="w-full bg-transparent font-mono text-base leading-7 text-gray-100 caret-green-400 placeholder-gray-500 outline-none"
        style={{
          // Make text transparent so only highlighted overlay shows
          color: value ? 'transparent' : undefined,
        }}
      />
    </div>
  )
}

// Export a function to get the input ref for external focus
export function useCommandInputRef() {
  return useRef<HTMLInputElement>(null)
}
