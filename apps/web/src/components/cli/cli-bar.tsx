'use client'

import { useState, useEffect, useRef } from 'react'
import { CommandInput } from './command-input'
import { parseListCommand } from '@/lib/cli/parser-simple'
import { executeCommand, type ExecutionResult } from '@/lib/cli/executor'

interface CliBarProps {
  onExecute?: (command: string, result: ExecutionResult) => void
  onError?: (error: string) => void
}

export function CliBar({ onExecute, onError }: CliBarProps) {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isExecuting, setIsExecuting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcuts: / or Ctrl+L to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus CLI on / or Ctrl+L
      if (e.key === '/' && !isFocused) {
        e.preventDefault()
        // Focus the input inside CommandInput
        const input = containerRef.current?.querySelector('input')
        input?.focus()
      } else if (e.key === 'l' && e.ctrlKey && !isFocused) {
        e.preventDefault()
        // Focus the input inside CommandInput
        const input = containerRef.current?.querySelector('input')
        input?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFocused])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Execute command on Enter
    if (e.key === 'Enter' && input.trim() && !isExecuting) {
      executeCommandHandler(input.trim())
    }

    // Navigate history with arrow keys
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = historyIndex === -1
          ? history.length - 1
          : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
      }
    }
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1
        if (newIndex >= history.length) {
          setHistoryIndex(-1)
          setInput('')
        } else {
          setHistoryIndex(newIndex)
          setInput(history[newIndex])
        }
      }
    }

    // Clear on ESC
    else if (e.key === 'Escape') {
      if (input) {
        setInput('')
      } else {
        // Blur the input
        const inputEl = containerRef.current?.querySelector('input')
        inputEl?.blur()
      }
    }
  }

  const executeCommandHandler = async (command: string) => {
    // Add to history
    if (command !== history[history.length - 1]) {
      setHistory([...history, command])
    }
    setHistoryIndex(-1)
    setIsExecuting(true)

    try {
      // Parse command
      const parsed = parseListCommand(command)

      if ('message' in parsed) {
        // Parse error
        if (onError) {
          onError(parsed.message)
        }
        return
      }

      // Execute command
      const result = await executeCommand(parsed)

      if (!result.success && result.error) {
        if (onError) {
          onError(result.error)
        }
        return
      }

      // Success - call callback with result
      if (onExecute) {
        onExecute(command, result)
      }

    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error.message : 'Unknown error')
      }
    } finally {
      setIsExecuting(false)
      // Clear input
      setInput('')
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-green-500/30 bg-gradient-to-t from-gray-900 to-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="mx-auto max-w-7xl px-6">
        <div ref={containerRef} className="flex items-center gap-3 py-4">
          {/* Prompt */}
          <span className="font-mono text-lg font-bold text-green-400">&gt;</span>

          {/* Input with syntax highlighting */}
          <CommandInput
            value={input}
            onChange={setInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type DairyComp command... (Press / to focus)"
          />

          {/* Hints */}
          {!isFocused && (
            <div className="hidden text-sm text-gray-400 sm:flex sm:items-center sm:gap-4">
              <span>
                <kbd className="rounded bg-gray-800 px-2 py-1 font-mono text-xs">/</kbd> or{' '}
                <kbd className="rounded bg-gray-800 px-2 py-1 font-mono text-xs">Ctrl+L</kbd> to focus
              </span>
            </div>
          )}

          {isFocused && (
            <div className="hidden text-sm text-gray-400 sm:flex sm:items-center sm:gap-4">
              <span>
                <kbd className="rounded bg-gray-800 px-2 py-1 font-mono text-xs">↑↓</kbd> history
              </span>
              <span>
                <kbd className="rounded bg-gray-800 px-2 py-1 font-mono text-xs">Enter</kbd> execute
              </span>
              <span>
                <kbd className="rounded bg-gray-800 px-2 py-1 font-mono text-xs">ESC</kbd> clear
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
